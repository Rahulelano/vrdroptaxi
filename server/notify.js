// Real-time admin alerts:
//  1. Server-Sent Events -> open admin panels get an instant toast + sound.
//  2. Web Push           -> phone/desktop notification even when the panel is closed.
import webpush from "web-push";
import { db, save } from "./db.js";

const clients = new Set();

export function initPush() {
  const meta = db().meta;
  let publicKey = process.env.VAPID_PUBLIC_KEY;
  let privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    // Generate once and persist so existing subscriptions keep working.
    if (!meta.vapid) {
      meta.vapid = webpush.generateVAPIDKeys();
      save();
    }
    ({ publicKey, privateKey } = meta.vapid);
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", publicKey, privateKey);
  return publicKey;
}

export function addSseClient(res) {
  clients.add(res);
  res.on("close", () => clients.delete(res));
}

export function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(payload);
}

// Keep proxies from closing idle SSE connections.
setInterval(() => {
  for (const res of clients) res.write(": ping\n\n");
}, 25000).unref();

export async function pushToAdmins({ title, body, url = "/admin/bookings" }) {
  const subs = db().pushSubscriptions;
  const payload = JSON.stringify({ title, body, url });
  const dead = [];
  await Promise.all(
    subs.map((s) =>
      webpush.sendNotification(s.subscription, payload).catch((err) => {
        if (err.statusCode === 404 || err.statusCode === 410) dead.push(s.id);
        else console.error("[push] failed:", err.statusCode || err.message);
      }),
    ),
  );
  if (dead.length) {
    db().pushSubscriptions = subs.filter((s) => !dead.includes(s.id));
    save();
  }
}
