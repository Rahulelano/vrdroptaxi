import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

dotenv.config();
const rootEnv = path.resolve(import.meta.dirname, "..", ".env");
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
}
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db, loadDb, save, list, findById, insert, update, remove, now } from "./db.js";
import { sendMail, sendMailSafe, templates, mailConfigured } from "./mailer.js";
import { initPush, addSseClient, broadcast, pushToAdmins } from "./notify.js";

await loadDb();
const VAPID_PUBLIC = initPush();

const PORT = Number(process.env.PORT) || 5439;
const JWT_SECRET = process.env.JWT_SECRET || ensureSecret();
const SITE_URL = (process.env.SITE_URL || "http://localhost:8080").replace(/\/$/, "");

function ensureSecret() {
  const meta = db().meta;
  if (!meta.jwtSecret) {
    meta.jwtSecret = crypto.randomBytes(32).toString("hex");
    save();
  }
  return meta.jwtSecret;
}

// Ensure super admin exists and password matches .env
const adminEmail = (process.env.ADMIN_EMAIL || "admin@droptaxii.com").toLowerCase();
const adminPass = process.env.ADMIN_PASSWORD || "admin123";
let superAdmin = list("admins").find((a) => a.email === adminEmail);
if (!superAdmin) {
  insert("admins", { name: "Owner", email: adminEmail, passwordHash: bcrypt.hashSync(adminPass, 10), role: "admin", active: true });
  console.log(`[setup] Created admin ${adminEmail} (password: ${adminPass})`);
} else if (!bcrypt.compareSync(adminPass, superAdmin.passwordHash)) {
  update("admins", superAdmin.id, { passwordHash: bcrypt.hashSync(adminPass, 10) });
  console.log(`[setup] Synced admin password with .env for ${adminEmail}`);
}

const app = express();
app.set("trust proxy", 1);
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || true }));
app.use(express.json({ limit: "200kb" }));

// ---------------- helpers ----------------
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const bad = (msg) => new HttpError(400, msg);
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);
const bool = (v) => v === true || v === "true";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneKey = (p) => String(p || "").replace(/\D/g, "").slice(-10);

// Tiny in-memory rate limiter
const hits = new Map();
function rateLimit(key, max, windowMs) {
  return (req, _res, next) => {
    const k = `${key}:${req.ip}`;
    const t = Date.now();
    const arr = (hits.get(k) || []).filter((x) => t - x < windowMs);
    arr.push(t);
    hits.set(k, arr);
    if (arr.length > max) return next(new HttpError(429, "Too many requests. Please try again in a few minutes."));
    next();
  };
}

const BOOKING_STATUSES = ["pending", "confirmed", "assigned", "ongoing", "completed", "cancelled"];
const TRIP_TYPES = ["one", "round", "package"];

export function computeFare(vehicle, tripType, km, minKm) {
  if (!vehicle) return 0;
  if (tripType === "package") return vehicle.pkg > 0 ? vehicle.pkg : 0;
  if (tripType === "round") return Math.round(vehicle.round * Math.max(km * 2, minKm) + vehicle.bata);
  return Math.round(vehicle.oneway * Math.max(km, minKm) + vehicle.bata);
}

function publicSettings() {
  const s = db().settings;
  return {
    businessName: s.businessName,
    logo: s.logo || "/logo.png",
    phone: s.phone,
    whatsapp: s.whatsapp,
    homeOrigin: s.homeOrigin,
    minKm: s.minKm,
    requireEmailOtp: s.requireEmailOtp,
    acceptingBookings: s.acceptingBookings,
    announcement: s.announcement,
  };
}

const bySort = (a, b) => (a.sort ?? 0) - (b.sort ?? 0);
const stripAdmin = ({ passwordHash, resetTokenHash, resetExpires, ...a }) => a;

function withDriver(b) {
  return { ...b, driver: b.driverId ? findById("drivers", b.driverId) || null : null };
}

function upsertCustomer({ name, phone, email }) {
  const key = phoneKey(phone);
  let c = list("customers").find((x) => x.phoneKey === key);
  if (c) {
    update("customers", c.id, { name: name || c.name, email: email || c.email, lastBookingAt: now() });
  } else {
    c = insert("customers", { name, phone, phoneKey: key, email, blocked: false, notes: "", lastBookingAt: now() });
  }
  return c;
}

// Validate & normalise a booking payload (shared by public form and admin "add booking").
function parseBooking(body, { admin = false } = {}) {
  const s = db().settings;
  const b = {
    name: str(body.name, 80),
    phone: str(body.phone, 20),
    email: str(body.email, 120).toLowerCase(),
    from: str(body.from, 120),
    to: str(body.to, 120),
    tripType: TRIP_TYPES.includes(body.tripType) ? body.tripType : "one",
    date: str(body.date, 10),
    time: str(body.time, 5),
    vehicleId: str(body.vehicleId, 60),
    distanceKm: Math.max(0, Math.round(num(body.distanceKm))),
    notes: str(body.notes, 500),
  };
  if (!b.name) throw bad("Please enter your name.");
  if (phoneKey(b.phone).length < 10) throw bad("Please enter a valid 10-digit phone number.");
  if (b.email && !EMAIL_RE.test(b.email)) throw bad("Please enter a valid email address.");
  if (!admin && s.requireEmailOtp && !b.email) throw bad("Email is required to verify your booking.");
  if (!b.from || !b.to) throw bad("Pickup and drop locations are required.");
  if (b.date && !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) throw bad("Invalid pickup date.");
  if (!admin && b.date && b.date < new Date(Date.now() - 86400000).toISOString().slice(0, 10)) throw bad("Pickup date cannot be in the past.");
  const vehicle = findById("vehicles", b.vehicleId) || list("vehicles").filter((v) => v.active).sort(bySort)[0];
  if (!vehicle) throw bad("Please choose a vehicle.");
  b.vehicleId = vehicle.id;
  b.vehicleName = vehicle.name;
  // If this is a known route, trust our own distance over the browser's estimate.
  const known = list("routes").find(
    (r) => r.active && r.from.toLowerCase() === b.from.toLowerCase() && r.to.toLowerCase() === b.to.toLowerCase(),
  );
  if (known && !admin) b.distanceKm = known.km;
  b.estimatedFare = computeFare(vehicle, b.tripType, b.distanceKm, s.minKm);
  return b;
}

function createBooking(data, { source, emailVerified, adminName }) {
  const meta = db().meta;
  meta.bookingSeq = (meta.bookingSeq || 1000) + 1;
  const customer = upsertCustomer(data);
  const booking = insert("bookings", {
    ...data,
    ref: `DT${meta.bookingSeq}`,
    customerId: customer.id,
    status: "pending",
    finalFare: null,
    driverId: null,
    adminNotes: "",
    source,
    emailVerified,
    history: [{ at: now(), status: "pending", by: adminName || "customer", note: source === "admin" ? "Created by admin" : "Booked on website" }],
  });

  // Notify: customer email, admin email, live panels, push notifications.
  if (booking.email) sendMailSafe({ to: booking.email, ...templates.bookingReceived(booking) });
  const adminEmails = db().settings.adminNotifyEmails || process.env.ADMIN_NOTIFY_EMAIL || "";
  if (adminEmails && source !== "admin") sendMailSafe({ to: adminEmails, ...templates.adminNewBooking(booking) });
  broadcast("booking:new", withDriver(booking));
  if (source !== "admin") {
    pushToAdmins({
      title: `🚕 New booking ${booking.ref}`,
      body: `${booking.name} • ${booking.from} → ${booking.to} • ${booking.date || "date TBD"} ${booking.time || ""}\n${booking.phone}`,
      url: `/admin/bookings?id=${booking.id}`,
    }).catch((e) => console.error("[push]", e.message));
  }
  return booking;
}

// ---------------- auth ----------------
function auth(roles) {
  return (req, _res, next) => {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : req.query.token;
    try {
      const payload = jwt.verify(String(token || ""), JWT_SECRET);
      const admin = findById("admins", payload.sub);
      if (!admin || !admin.active) throw new Error("inactive");
      if (roles && !roles.includes(admin.role)) return next(new HttpError(403, "You don't have permission for this."));
      req.admin = admin;
      next();
    } catch {
      next(new HttpError(401, "Please log in again."));
    }
  };
}
const anyAdmin = auth();
const fullAdmin = auth(["admin"]);

// ================= PUBLIC API =================
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/public/config", (_req, res) => {
  res.json({
    settings: publicSettings(),
    vehicles: list("vehicles").filter((v) => v.active).sort(bySort),
    routes: list("routes").filter((r) => r.active).sort(bySort),
    popups: livePopups(),
  });
});

function livePopups() {
  const t = new Date().toISOString();
  return list("popups")
    .filter((p) => p.active && (!p.startAt || p.startAt <= t) && (!p.endAt || p.endAt >= t))
    .sort(bySort)
    .map(({ createdAt, updatedAt, ...p }) => p);
}

// Pending email-OTP verifications: token -> { booking, codeHash, expires, attempts }
const pendingOtps = new Map();
const hashCode = (c) => crypto.createHash("sha256").update(String(c)).digest("hex");

app.post(
  "/api/bookings",
  rateLimit("book", 8, 10 * 60 * 1000),
  wrap(async (req, res) => {
    const s = db().settings;
    if (!s.acceptingBookings) throw bad(`Online booking is paused. Please call ${s.phone}.`);
    const data = parseBooking(req.body);
    const cust = list("customers").find((c) => c.phoneKey === phoneKey(data.phone));
    if (cust?.blocked) throw new HttpError(403, `We could not take this booking online. Please call ${s.phone}.`);

    if (s.requireEmailOtp) {
      const code = String(crypto.randomInt(100000, 1000000));
      const token = crypto.randomBytes(16).toString("hex");
      pendingOtps.set(token, { booking: data, codeHash: hashCode(code), expires: Date.now() + 10 * 60 * 1000, attempts: 0 });
      try {
        await sendMail({ to: data.email, ...templates.otp(code) });
      } catch (err) {
        console.error("[mail] OTP failed:", err.message);
        throw new HttpError(502, "Could not send verification email. Please check the address or call us.");
      }
      return res.json({ otpRequired: true, token, email: data.email });
    }
    const booking = createBooking(data, { source: "website", emailVerified: false });
    res.status(201).json({ booking: { ref: booking.ref, estimatedFare: booking.estimatedFare } });
  }),
);

app.post(
  "/api/bookings/verify",
  rateLimit("verify", 15, 10 * 60 * 1000),
  wrap(async (req, res) => {
    const token = str(req.body.token, 64);
    const entry = pendingOtps.get(token);
    if (!entry || entry.expires < Date.now()) {
      pendingOtps.delete(token);
      throw bad("Code expired. Please submit the booking again.");
    }
    if (entry.codeHash !== hashCode(str(req.body.code, 6))) {
      entry.attempts += 1;
      if (entry.attempts >= 5) pendingOtps.delete(token);
      throw bad("Incorrect code. Please check your email.");
    }
    pendingOtps.delete(token);
    const booking = createBooking(entry.booking, { source: "website", emailVerified: true });
    res.status(201).json({ booking: { ref: booking.ref, estimatedFare: booking.estimatedFare } });
  }),
);

app.post(
  "/api/bookings/resend",
  rateLimit("resend", 3, 10 * 60 * 1000),
  wrap(async (req, res) => {
    const entry = pendingOtps.get(str(req.body.token, 64));
    if (!entry) throw bad("Session expired. Please submit the booking again.");
    const code = String(crypto.randomInt(100000, 1000000));
    entry.codeHash = hashCode(code);
    entry.expires = Date.now() + 10 * 60 * 1000;
    entry.attempts = 0;
    await sendMail({ to: entry.booking.email, ...templates.otp(code) });
    res.json({ ok: true });
  }),
);

setInterval(() => {
  const t = Date.now();
  for (const [k, v] of pendingOtps) if (v.expires < t) pendingOtps.delete(k);
}, 60000).unref();

// ================= ADMIN AUTH =================
app.post(
  "/api/admin/login",
  rateLimit("login", 10, 15 * 60 * 1000),
  wrap(async (req, res) => {
    const email = str(req.body.email, 120).toLowerCase();
    const admin = list("admins").find((a) => a.email === email);
    if (!admin || !admin.active || !(await bcrypt.compare(str(req.body.password, 200), admin.passwordHash)))
      throw new HttpError(401, "Wrong email or password.");
    update("admins", admin.id, { lastLoginAt: now() });
    const token = jwt.sign({ sub: admin.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, admin: stripAdmin(admin) });
  }),
);

app.get("/api/admin/me", anyAdmin, (req, res) => res.json({ admin: stripAdmin(req.admin) }));

app.post(
  "/api/admin/forgot-password",
  rateLimit("forgot", 5, 15 * 60 * 1000),
  wrap(async (req, res) => {
    const admin = list("admins").find((a) => a.email === str(req.body.email, 120).toLowerCase() && a.active);
    if (admin) {
      const token = crypto.randomBytes(24).toString("hex");
      update("admins", admin.id, { resetTokenHash: hashCode(token), resetExpires: Date.now() + 30 * 60 * 1000 });
      await sendMail({ to: admin.email, ...templates.passwordReset(`${SITE_URL}/admin/login?reset=${token}`) });
    }
    // Same answer either way so emails can't be enumerated.
    res.json({ ok: true });
  }),
);

app.post(
  "/api/admin/reset-password",
  rateLimit("reset", 10, 15 * 60 * 1000),
  wrap(async (req, res) => {
    const h = hashCode(str(req.body.token, 100));
    const admin = list("admins").find((a) => a.resetTokenHash === h && a.resetExpires > Date.now());
    if (!admin) throw bad("Reset link is invalid or expired.");
    const password = str(req.body.password, 200);
    if (password.length < 8) throw bad("Password must be at least 8 characters.");
    update("admins", admin.id, { passwordHash: await bcrypt.hash(password, 10), resetTokenHash: null, resetExpires: null });
    res.json({ ok: true });
  }),
);

app.post(
  "/api/admin/change-password",
  anyAdmin,
  wrap(async (req, res) => {
    if (!(await bcrypt.compare(str(req.body.currentPassword, 200), req.admin.passwordHash))) throw bad("Current password is wrong.");
    const password = str(req.body.newPassword, 200);
    if (password.length < 8) throw bad("New password must be at least 8 characters.");
    update("admins", req.admin.id, { passwordHash: await bcrypt.hash(password, 10) });
    res.json({ ok: true });
  }),
);

// Live events stream (token passed as ?token= because EventSource can't set headers)
app.get("/api/admin/events", anyAdmin, (req, res) => {
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Accel-Buffering": "no" });
  res.flushHeaders();
  res.write("event: ready\ndata: {}\n\n");
  addSseClient(res);
});

// ================= DASHBOARD =================
app.get("/api/admin/stats", anyAdmin, (_req, res) => {
  const bookings = list("bookings");
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7);
  const fare = (b) => b.finalFare ?? b.estimatedFare ?? 0;
  const count = (fn) => bookings.filter(fn).length;
  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    last14.push({ date: d, count: count((b) => b.createdAt.slice(0, 10) === d) });
  }
  const routeCounts = {};
  for (const b of bookings) {
    const k = `${b.from} → ${b.to}`;
    routeCounts[k] = (routeCounts[k] || 0) + 1;
  }
  res.json({
    total: bookings.length,
    today: count((b) => b.createdAt.slice(0, 10) === today),
    pickupsToday: count((b) => b.date === today && b.status !== "cancelled"),
    byStatus: Object.fromEntries(BOOKING_STATUSES.map((s) => [s, count((b) => b.status === s)])),
    monthRevenue: bookings
      .filter((b) => b.status === "completed" && b.createdAt.startsWith(monthStart))
      .reduce((sum, b) => sum + fare(b), 0),
    customers: list("customers").length,
    drivers: list("drivers").filter((d) => d.active).length,
    last14,
    topRoutes: Object.entries(routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([route, count]) => ({ route, count })),
    recent: [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8).map(withDriver),
  });
});

// ================= BOOKINGS =================
function filterBookings(q) {
  let items = [...list("bookings")];
  const search = str(q.q, 100).toLowerCase();
  if (q.status && q.status !== "all") items = items.filter((b) => b.status === q.status);
  if (q.from) items = items.filter((b) => (b.date || b.createdAt.slice(0, 10)) >= q.from);
  if (q.to) items = items.filter((b) => (b.date || b.createdAt.slice(0, 10)) <= q.to);
  if (q.customerId) items = items.filter((b) => b.customerId === q.customerId);
  if (search)
    items = items.filter((b) =>
      [b.ref, b.name, b.phone, b.email, b.from, b.to, b.vehicleName].some((v) => String(v || "").toLowerCase().includes(search)),
    );
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

app.get("/api/admin/bookings", anyAdmin, (req, res) => {
  const items = filterBookings(req.query);
  const page = Math.max(1, num(req.query.page, 1));
  const size = Math.min(200, Math.max(1, num(req.query.size, 25)));
  res.json({ total: items.length, page, size, items: items.slice((page - 1) * size, page * size).map(withDriver) });
});

app.get("/api/admin/bookings.csv", anyAdmin, (req, res) => {
  const cols = ["ref", "createdAt", "status", "name", "phone", "email", "from", "to", "tripType", "date", "time", "vehicleName", "distanceKm", "estimatedFare", "finalFare", "driver", "adminNotes"];
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = filterBookings(req.query).map((b) => {
    const d = withDriver(b);
    return cols.map((c) => cell(c === "driver" ? d.driver?.name : b[c])).join(",");
  });
  res.set({ "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="bookings-${new Date().toISOString().slice(0, 10)}.csv"` });
  res.send([cols.join(","), ...rows].join("\n"));
});

app.get("/api/admin/bookings/:id", anyAdmin, (req, res) => {
  const b = findById("bookings", req.params.id);
  if (!b) throw new HttpError(404, "Booking not found");
  res.json(withDriver(b));
});

app.post(
  "/api/admin/bookings",
  anyAdmin,
  wrap(async (req, res) => {
    const data = parseBooking(req.body, { admin: true });
    const booking = createBooking(data, { source: "admin", emailVerified: false, adminName: req.admin.name });
    res.status(201).json(withDriver(booking));
  }),
);

app.patch(
  "/api/admin/bookings/:id",
  anyAdmin,
  wrap(async (req, res) => {
    const b = findById("bookings", req.params.id);
    if (!b) throw new HttpError(404, "Booking not found");
    const body = req.body;
    const patch = {};
    for (const k of ["name", "phone", "from", "to", "date", "time", "adminNotes", "notes"]) if (k in body) patch[k] = str(body[k], 500);
    if ("email" in body) {
      const e = str(body.email, 120).toLowerCase();
      if (e && !EMAIL_RE.test(e)) throw bad("Invalid email");
      patch.email = e;
    }
    if ("tripType" in body && TRIP_TYPES.includes(body.tripType)) patch.tripType = body.tripType;
    if ("distanceKm" in body) patch.distanceKm = Math.max(0, Math.round(num(body.distanceKm)));
    if ("finalFare" in body) patch.finalFare = body.finalFare === null || body.finalFare === "" ? null : Math.max(0, num(body.finalFare));
    if ("vehicleId" in body) {
      const v = findById("vehicles", body.vehicleId);
      if (!v) throw bad("Unknown vehicle");
      patch.vehicleId = v.id;
      patch.vehicleName = v.name;
    }
    if ("driverId" in body) {
      if (body.driverId && !findById("drivers", body.driverId)) throw bad("Unknown driver");
      patch.driverId = body.driverId || null;
    }
    // Recalculate estimate when the trip changed
    if (["tripType", "distanceKm", "vehicleId"].some((k) => k in patch)) {
      const merged = { ...b, ...patch };
      patch.estimatedFare = computeFare(findById("vehicles", merged.vehicleId), merged.tripType, merged.distanceKm, db().settings.minKm);
    }
    let statusChanged = false;
    if ("status" in body && body.status !== b.status) {
      if (!BOOKING_STATUSES.includes(body.status)) throw bad("Invalid status");
      patch.status = body.status;
      if (patch.status === "confirmed" && (patch.driverId ?? b.driverId)) patch.status = "assigned";
      statusChanged = true;
    } else if (patch.driverId && b.status === "confirmed") {
      patch.status = "assigned";
      statusChanged = true;
    }
    if (statusChanged || "driverId" in patch) {
      patch.history = [...(b.history || []), { at: now(), status: patch.status || b.status, by: req.admin.name, note: str(body.historyNote, 200) }];
    }
    const updated = withDriver(update("bookings", b.id, patch));
    const notify = body.notifyCustomer ?? db().settings.emailCustomerOnStatusChange;
    if (statusChanged && updated.email && notify) sendMailSafe({ to: updated.email, ...templates.bookingStatus(updated) });
    broadcast("booking:update", updated);
    res.json(updated);
  }),
);

app.post(
  "/api/admin/bookings/:id/email",
  anyAdmin,
  wrap(async (req, res) => {
    const b = findById("bookings", req.params.id);
    if (!b) throw new HttpError(404, "Booking not found");
    if (!b.email) throw bad("This booking has no email address.");
    await sendMail({ to: b.email, ...templates.bookingStatus(withDriver(b)) });
    res.json({ ok: true });
  }),
);

app.delete("/api/admin/bookings/:id", fullAdmin, (req, res) => {
  if (!remove("bookings", req.params.id)) throw new HttpError(404, "Booking not found");
  broadcast("booking:delete", { id: req.params.id });
  res.json({ ok: true });
});

// ================= CUSTOMERS =================
app.get("/api/admin/customers", anyAdmin, (req, res) => {
  const search = str(req.query.q, 100).toLowerCase();
  const bookings = list("bookings");
  let items = list("customers").map((c) => {
    const mine = bookings.filter((b) => b.customerId === c.id);
    return {
      ...c,
      bookingCount: mine.length,
      completedCount: mine.filter((b) => b.status === "completed").length,
      totalSpent: mine.filter((b) => b.status === "completed").reduce((s, b) => s + (b.finalFare ?? b.estimatedFare ?? 0), 0),
    };
  });
  if (search) items = items.filter((c) => [c.name, c.phone, c.email].some((v) => String(v || "").toLowerCase().includes(search)));
  res.json(items.sort((a, b) => (b.lastBookingAt || "").localeCompare(a.lastBookingAt || "")));
});

app.patch("/api/admin/customers/:id", anyAdmin, (req, res) => {
  const patch = {};
  for (const k of ["name", "email", "notes"]) if (k in req.body) patch[k] = str(req.body[k], 500);
  if ("phone" in req.body) {
    patch.phone = str(req.body.phone, 20);
    patch.phoneKey = phoneKey(patch.phone);
  }
  if ("blocked" in req.body) patch.blocked = bool(req.body.blocked);
  const c = update("customers", req.params.id, patch);
  if (!c) throw new HttpError(404, "Customer not found");
  res.json(c);
});

app.delete("/api/admin/customers/:id", fullAdmin, (req, res) => {
  if (!remove("customers", req.params.id)) throw new HttpError(404, "Customer not found");
  if (bool(req.query.withBookings)) db().bookings = list("bookings").filter((b) => b.customerId !== req.params.id);
  save();
  res.json({ ok: true });
});

// ================= VEHICLES (PRICING) =================
function parseVehicle(body) {
  const v = {};
  for (const k of ["name", "sub", "img"]) if (k in body) v[k] = str(body[k], 300);
  for (const k of ["oneway", "round", "bata", "pkg", "passengers", "bags", "sort"]) if (k in body) v[k] = Math.max(0, num(body[k]));
  for (const k of ["active", "popular"]) if (k in body) v[k] = bool(body[k]);
  if ("features" in body)
    v.features = (Array.isArray(body.features) ? body.features : String(body.features).split("\n")).map((f) => str(f, 100)).filter(Boolean);
  if ("name" in v && !v.name) throw bad("Vehicle name is required");
  return v;
}

app.get("/api/admin/vehicles", anyAdmin, (_req, res) => res.json([...list("vehicles")].sort(bySort)));
app.post("/api/admin/vehicles", fullAdmin, (req, res) => {
  const v = parseVehicle({ active: true, popular: false, features: [], sort: list("vehicles").length, ...req.body });
  if (!v.name) throw bad("Vehicle name is required");
  res.status(201).json(insert("vehicles", v));
});
app.patch("/api/admin/vehicles/:id", fullAdmin, (req, res) => {
  const v = update("vehicles", req.params.id, parseVehicle(req.body));
  if (!v) throw new HttpError(404, "Vehicle not found");
  res.json(v);
});
app.delete("/api/admin/vehicles/:id", fullAdmin, (req, res) => {
  if (!remove("vehicles", req.params.id)) throw new HttpError(404, "Vehicle not found");
  res.json({ ok: true });
});

// ================= ROUTES / DESTINATIONS =================
function parseRoute(body) {
  const r = {};
  for (const k of ["from", "to", "hrs", "img", "note"]) if (k in body) r[k] = str(body[k], 300);
  for (const k of ["km", "sort"]) if (k in body) r[k] = Math.max(0, Math.round(num(body[k])));
  for (const k of ["active", "featured"]) if (k in body) r[k] = bool(body[k]);
  if (("from" in r && !r.from) || ("to" in r && !r.to)) throw bad("From and To are required");
  if ("km" in r && r.km <= 0) throw bad("Distance (km) must be more than 0");
  return r;
}

app.get("/api/admin/routes", anyAdmin, (_req, res) => res.json([...list("routes")].sort(bySort)));
app.post("/api/admin/routes", fullAdmin, (req, res) => {
  const r = parseRoute({ from: db().settings.homeOrigin, active: true, featured: true, note: "", img: "", sort: list("routes").length, ...req.body });
  if (!r.to || !r.km) throw bad("Destination and distance are required");
  const dup = list("routes").find((x) => x.from.toLowerCase() === r.from.toLowerCase() && x.to.toLowerCase() === r.to.toLowerCase());
  if (dup) throw bad("This route already exists");
  res.status(201).json(insert("routes", r));
});
app.patch("/api/admin/routes/:id", fullAdmin, (req, res) => {
  const r = update("routes", req.params.id, parseRoute(req.body));
  if (!r) throw new HttpError(404, "Route not found");
  res.json(r);
});
app.delete("/api/admin/routes/:id", fullAdmin, (req, res) => {
  if (!remove("routes", req.params.id)) throw new HttpError(404, "Route not found");
  res.json({ ok: true });
});

// ================= DRIVERS =================
function parseDriver(body) {
  const d = {};
  for (const k of ["name", "phone", "vehicleNo", "vehicleType", "licenseNo", "notes"]) if (k in body) d[k] = str(body[k], 200);
  if ("active" in body) d.active = bool(body.active);
  if ("name" in d && !d.name) throw bad("Driver name is required");
  return d;
}
app.get("/api/admin/drivers", anyAdmin, (_req, res) => {
  const bookings = list("bookings");
  res.json(
    list("drivers").map((d) => ({
      ...d,
      tripCount: bookings.filter((b) => b.driverId === d.id && b.status === "completed").length,
      activeTrips: bookings.filter((b) => b.driverId === d.id && ["assigned", "ongoing"].includes(b.status)).length,
    })),
  );
});
app.post("/api/admin/drivers", fullAdmin, (req, res) => {
  const d = parseDriver({ active: true, ...req.body });
  if (!d.name || !d.phone) throw bad("Driver name and phone are required");
  res.status(201).json(insert("drivers", d));
});
app.patch("/api/admin/drivers/:id", fullAdmin, (req, res) => {
  const d = update("drivers", req.params.id, parseDriver(req.body));
  if (!d) throw new HttpError(404, "Driver not found");
  res.json(d);
});
app.delete("/api/admin/drivers/:id", fullAdmin, (req, res) => {
  if (!remove("drivers", req.params.id)) throw new HttpError(404, "Driver not found");
  for (const b of list("bookings")) if (b.driverId === req.params.id) b.driverId = null;
  save();
  res.json({ ok: true });
});

// ================= ADMIN USERS =================
app.get("/api/admin/admins", fullAdmin, (_req, res) => res.json(list("admins").map(stripAdmin)));
app.post(
  "/api/admin/admins",
  fullAdmin,
  wrap(async (req, res) => {
    const email = str(req.body.email, 120).toLowerCase();
    const password = str(req.body.password, 200);
    if (!EMAIL_RE.test(email)) throw bad("Valid email is required");
    if (password.length < 8) throw bad("Password must be at least 8 characters");
    if (list("admins").some((a) => a.email === email)) throw bad("An admin with this email already exists");
    const a = insert("admins", {
      name: str(req.body.name, 80) || email,
      email,
      role: req.body.role === "admin" ? "admin" : "staff",
      active: true,
      passwordHash: await bcrypt.hash(password, 10),
    });
    res.status(201).json(stripAdmin(a));
  }),
);
app.patch(
  "/api/admin/admins/:id",
  fullAdmin,
  wrap(async (req, res) => {
    const target = findById("admins", req.params.id);
    if (!target) throw new HttpError(404, "Admin not found");
    const patch = {};
    if ("name" in req.body) patch.name = str(req.body.name, 80);
    if ("role" in req.body) patch.role = req.body.role === "admin" ? "admin" : "staff";
    if ("active" in req.body) patch.active = bool(req.body.active);
    if (req.body.password) {
      if (str(req.body.password, 200).length < 8) throw bad("Password must be at least 8 characters");
      patch.passwordHash = await bcrypt.hash(str(req.body.password, 200), 10);
    }
    const remainingAdmins = list("admins").filter((a) => a.id !== target.id && a.role === "admin" && a.active).length;
    if ((patch.role === "staff" || patch.active === false) && target.role === "admin" && remainingAdmins === 0)
      throw bad("At least one active full admin is required");
    res.json(stripAdmin(update("admins", target.id, patch)));
  }),
);
app.delete("/api/admin/admins/:id", fullAdmin, (req, res) => {
  if (req.params.id === req.admin.id) throw bad("You can't delete your own account");
  if (!remove("admins", req.params.id)) throw new HttpError(404, "Admin not found");
  res.json({ ok: true });
});

// ================= SETTINGS =================
app.get("/api/admin/settings", anyAdmin, (_req, res) => res.json({ ...db().settings, mailConfigured: mailConfigured() }));
app.put("/api/admin/settings", fullAdmin, (req, res) => {
  const s = db().settings;
  for (const k of ["businessName", "logo", "phone", "whatsapp", "adminNotifyEmails", "homeOrigin", "announcement"]) if (k in req.body) s[k] = str(req.body[k], 500);
  if ("minKm" in req.body) s.minKm = Math.max(0, Math.round(num(req.body.minKm, 130)));
  for (const k of ["requireEmailOtp", "emailCustomerOnStatusChange", "acceptingBookings"]) if (k in req.body) s[k] = bool(req.body[k]);
  save();
  res.json({ ...s, mailConfigured: mailConfigured() });
});

app.post(
  "/api/admin/test-email",
  fullAdmin,
  wrap(async (req, res) => {
    const to = str(req.body.to, 120) || req.admin.email;
    const info = await sendMail({ to, ...templates.test() });
    res.json({ ok: true, dev: Boolean(info.dev) });
  }),
);

// ================= PUSH =================
app.get("/api/admin/push/public-key", anyAdmin, (_req, res) => res.json({ publicKey: VAPID_PUBLIC }));
app.post("/api/admin/push/subscribe", anyAdmin, (req, res) => {
  const sub = req.body.subscription;
  if (!sub?.endpoint || !sub?.keys) throw bad("Invalid subscription");
  const subs = db().pushSubscriptions;
  const existing = subs.find((s) => s.subscription.endpoint === sub.endpoint);
  if (existing) Object.assign(existing, { subscription: sub, adminId: req.admin.id });
  else subs.push({ id: crypto.randomUUID(), adminId: req.admin.id, device: str(req.body.device, 200), subscription: sub, createdAt: now() });
  save();
  res.json({ ok: true });
});
app.post("/api/admin/push/unsubscribe", anyAdmin, (req, res) => {
  db().pushSubscriptions = db().pushSubscriptions.filter((s) => s.subscription.endpoint !== req.body.endpoint);
  save();
  res.json({ ok: true });
});
app.post(
  "/api/admin/push/test",
  anyAdmin,
  wrap(async (_req, res) => {
    await pushToAdmins({ title: "🔔 Test alert", body: "Booking alerts are working on this device.", url: "/admin" });
    broadcast("test", { message: "Test alert" });
    res.json({ ok: true, devices: db().pushSubscriptions.length });
  }),
);

// ================= POPUPS (image / video / offer shown to visitors) =================
const POPUP_TYPES = ["image", "video", "offer"];
function parsePopup(body) {
  const p = {};
  if ("type" in body) p.type = POPUP_TYPES.includes(body.type) ? body.type : "offer";
  for (const k of ["title", "message", "mediaUrl", "ctaText", "ctaLink", "couponCode", "bgColor"]) if (k in body) p[k] = str(body[k], k === "message" ? 1000 : 500);
  for (const k of ["startAt", "endAt"]) if (k in body) p[k] = str(body[k], 30) || "";
  if ("pages" in body) p.pages = ["all", "home", "routes"].includes(body.pages) ? body.pages : "all";
  if ("frequency" in body) p.frequency = ["session", "day", "always", "once"].includes(body.frequency) ? body.frequency : "session";
  if ("delaySec" in body) p.delaySec = Math.min(120, Math.max(0, num(body.delaySec, 2)));
  if ("sort" in body) p.sort = num(body.sort);
  if ("active" in body) p.active = bool(body.active);
  if ((p.type === "image" || p.type === "video") && "mediaUrl" in p && !p.mediaUrl) throw bad("Please upload an image/video or paste a URL");
  return p;
}
app.get("/api/admin/popups", anyAdmin, (_req, res) => res.json([...list("popups")].sort(bySort)));
app.post("/api/admin/popups", fullAdmin, (req, res) => {
  const p = parsePopup({ type: "offer", pages: "all", frequency: "session", delaySec: 2, active: true, sort: 0, ...req.body });
  if (!p.title && !p.mediaUrl) throw bad("Add a title or an image/video");
  res.status(201).json(insert("popups", p));
});
app.patch("/api/admin/popups/:id", fullAdmin, (req, res) => {
  const p = update("popups", req.params.id, parsePopup(req.body));
  if (!p) throw new HttpError(404, "Popup not found");
  res.json(p);
});
app.delete("/api/admin/popups/:id", fullAdmin, (req, res) => {
  if (!remove("popups", req.params.id)) throw new HttpError(404, "Popup not found");
  res.json({ ok: true });
});

// Media upload: raw file body, max 25 MB. Files go to the uploads folder (served at /uploads);
// each file's details are recorded in the "uploads" collection in MongoDB.
const UPLOAD_DIR = path.resolve(import.meta.dirname, "..", process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const MEDIA_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};
app.post("/api/admin/uploads", fullAdmin, express.raw({ type: Object.keys(MEDIA_EXT), limit: "25mb" }), (req, res) => {
  const ext = MEDIA_EXT[req.headers["content-type"]];
  if (!ext || !Buffer.isBuffer(req.body) || !req.body.length) throw bad("Only JPG, PNG, WEBP, GIF, MP4 or WEBM files are allowed");
  const name = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), req.body);
  const url = `/uploads/${name}`;
  insert("uploads", {
    url,
    fileName: name,
    originalName: str(req.headers["x-file-name"], 200),
    contentType: req.headers["content-type"],
    kind: ext === "mp4" || ext === "webm" ? "video" : "image",
    size: req.body.length,
    uploadedBy: req.admin.email,
  });
  res.status(201).json({ url });
});
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "30d", immutable: true }));

// ================= SEO: sitemap + robots =================
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
app.get("/sitemap.xml", (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const staticPages = [
    ["/", "1.0"],
    ["/routes", "0.9"],
    ["/services/one-way-drop-taxi", "0.8"],
    ["/services/round-trip-cabs", "0.8"],
    ["/services/outstation-taxi-service", "0.8"],
    ["/services/24-7-taxi-booking", "0.8"],
    ...["chennai", "coimbatore", "madurai", "bangalore", "trichy", "salem", "erode"].map((h) => [`/routes/${h}-one-way-drop-taxi`, "0.8"]),
    ["/about-us", "0.5"],
    ["/faqs", "0.6"],
    ["/terms", "0.3"],
    ["/cancellation-policy", "0.3"],
    ["/privacy-policy", "0.3"],
  ];
  const routePages = list("routes")
    .filter((r) => r.active)
    .map((r) => [`/${slug(r.from)}/${slug(r.from)}-to-${slug(r.to)}-one-way-drop-taxi`, "0.9"]);
  const urls = [...new Map([...staticPages, ...routePages].map((p) => [p[0], p])).values()];
  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map(([p, pr]) => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`)
      .join("\n")}\n</urlset>\n`,
  );
});
app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

// ================= STATIC (production) =================
const DIST = path.join(import.meta.dirname, "..", "dist");
if (process.env.SERVE_STATIC !== "false" && fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: false }));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(DIST, "index.html")));
}

app.use("/api", (_req, _res, next) => next(new HttpError(404, "Not found")));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || (err.type === "entity.parse.failed" ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? "Something went wrong. Please try again." : err.message });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  if (!mailConfigured()) console.log("[mail] SMTP not configured — emails will be printed here instead of sent.");
});
