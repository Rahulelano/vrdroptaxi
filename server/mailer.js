// Nodemailer wrapper + email templates.
// If SMTP_* env vars are missing, emails are printed to the console instead
// (handy for local development).
import nodemailer from "nodemailer";
import { db } from "./db.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT) || 465;
  const user = SMTP_USER.trim();
  const pass = SMTP_PASS.replace(/^["']|["']$/g, "").trim();
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export const mailConfigured = () => Boolean(getTransporter());

export async function sendMail({ to, subject, html }) {
  if (!to) return { skipped: true };
  const t = getTransporter();
  const from = process.env.MAIL_FROM || `"${db().settings.businessName}" <${process.env.SMTP_USER}>`;
  if (!t) {
    console.log(`\n[mail:dev] To: ${to}\n[mail:dev] Subject: ${subject}\n[mail:dev] ${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n`);
    return { dev: true };
  }
  return t.sendMail({ from, to, subject, html });
}

// Fire-and-forget variant: email failures must never break a booking.
export function sendMailSafe(opts) {
  sendMail(opts).catch((err) => console.error("[mail] failed:", err.message));
}

// ---- Templates ----
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function layout(title, body) {
  const s = db().settings;
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
  <div style="background:#0f172a;color:#fff;padding:18px 24px;font-size:18px;font-weight:bold">${esc(s.businessName)}</div>
  <div style="padding:24px;color:#0f172a">
    <h2 style="margin:0 0 16px;font-size:20px">${esc(title)}</h2>
    ${body}
    <p style="margin-top:24px;font-size:13px;color:#64748b">Need help? Call <a href="tel:${esc(s.phone)}">${esc(s.phone)}</a> or WhatsApp us.</p>
  </div></div>`;
}

const tripLabel = { one: "One Way", round: "Round Trip", package: "Package" };

function bookingTable(b) {
  const rows = [
    ["Booking ID", b.ref],
    ["Name", b.name],
    ["Phone", b.phone],
    ["Email", b.email || "-"],
    ["From", b.from],
    ["To", b.to],
    ["Trip", tripLabel[b.tripType] || b.tripType],
    ["Pickup", `${b.date || "-"} ${b.time || ""}`],
    ["Vehicle", b.vehicleName],
    ["Distance", b.distanceKm ? `${b.distanceKm} km` : "-"],
    ["Estimated Fare", b.finalFare ? `₹${b.finalFare.toLocaleString("en-IN")}` : b.estimatedFare ? `₹${b.estimatedFare.toLocaleString("en-IN")}` : "On call"],
    ["Status", b.status],
  ];
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#64748b;width:40%">${esc(k)}</td><td style="padding:6px 0;font-weight:bold">${esc(v)}</td></tr>`)
    .join("")}</table>`;
}

export const templates = {
  otp: (code) => ({
    subject: `${code} is your booking verification code`,
    html: layout("Verify your email", `<p>Use this code to confirm your taxi booking:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;background:#f1f5f9;padding:12px;text-align:center;border-radius:8px">${esc(code)}</p>
      <p style="font-size:13px;color:#64748b">The code expires in 10 minutes. If you did not request this, ignore this email.</p>`),
  }),
  bookingReceived: (b) => ({
    subject: `Booking received – ${b.ref}`,
    html: layout("We received your booking", `<p>Hi ${esc(b.name)}, thank you for booking with us. Our team will call you shortly to confirm.</p>${bookingTable(b)}`),
  }),
  bookingStatus: (b) => ({
    subject: `Booking ${b.ref} is now ${b.status}`,
    html: layout(`Booking ${b.status}`, `<p>Hi ${esc(b.name)}, your booking status has been updated.</p>
      ${b.driver ? `<p><b>Driver:</b> ${esc(b.driver.name)} (${esc(b.driver.phone)})<br/><b>Vehicle No:</b> ${esc(b.driver.vehicleNo)}</p>` : ""}
      ${bookingTable(b)}`),
  }),
  adminNewBooking: (b) => ({
    subject: `🚕 New booking ${b.ref}: ${b.from} → ${b.to}`,
    html: layout("New booking received", bookingTable(b)),
  }),
  passwordReset: (link) => ({
    subject: "Reset your admin password",
    html: layout("Password reset", `<p>Click the button below to set a new admin password. The link expires in 30 minutes.</p>
      <p><a href="${esc(link)}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Reset password</a></p>`),
  }),
  test: () => ({ subject: "Test email from admin panel", html: layout("It works!", "<p>Your SMTP settings are correct.</p>") }),
};
