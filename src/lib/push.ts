import { api } from "./api";

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function getPushState(): Promise<"unsupported" | "denied" | "on" | "off"> {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration("/admin-sw.js");
  const sub = await reg?.pushManager.getSubscription();
  return sub ? "on" : "off";
}

export async function enablePush() {
  if (!pushSupported()) throw new Error("This browser does not support notifications. On iPhone, add the site to Home Screen first.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted.");
  const reg = await navigator.serviceWorker.register("/admin-sw.js");
  await navigator.serviceWorker.ready;
  const { publicKey } = await api<{ publicKey: string }>("/api/admin/push/public-key");
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
  await api("/api/admin/push/subscribe", { body: { subscription: sub.toJSON(), device: navigator.userAgent } });
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration("/admin-sw.js");
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await api("/api/admin/push/unsubscribe", { body: { endpoint: sub.endpoint } });
    await sub.unsubscribe();
  }
}

// Short "ding-ding" alert sound using Web Audio (no audio file needed).
let ctx: AudioContext | null = null;
export function playAlertSound() {
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime;
    [0, 0.25, 0.5].forEach((offset, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.frequency.value = i === 2 ? 1320 : 880;
      gain.gain.setValueAtTime(0.0001, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.4, t + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.22);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.25);
    });
    navigator.vibrate?.([300, 100, 300]);
  } catch {
    /* audio blocked until user interacts with page */
  }
}
