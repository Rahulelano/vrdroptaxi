import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { X, Copy, Check, Tag } from "lucide-react";
import { API_URL, usePublicConfig, type Popup } from "@/lib/api";

const KEY = (id: string) => `dtx_popup_${id}`;

function alreadySeen(p: Popup): boolean {
  try {
    if (p.frequency === "always") return false;
    if (p.frequency === "session") return sessionStorage.getItem(KEY(p.id)) === "1";
    const v = localStorage.getItem(KEY(p.id));
    if (!v) return false;
    if (p.frequency === "once") return true;
    return Date.now() - Number(v) < 24 * 60 * 60 * 1000; // "day"
  } catch {
    return false;
  }
}

function markSeen(p: Popup) {
  try {
    if (p.frequency === "session") sessionStorage.setItem(KEY(p.id), "1");
    else if (p.frequency !== "always") localStorage.setItem(KEY(p.id), String(Date.now()));
  } catch {
    /* storage blocked */
  }
}

function matchesPage(p: Popup, pathname: string) {
  if (p.pages === "home") return pathname === "/";
  if (p.pages === "routes") return /^\/[^/]+\/[^/]+-to-[^/]+-one-way-drop-taxi/.test(pathname) || pathname.startsWith("/routes");
  return true;
}

export const mediaSrc = (url: string) => (url.startsWith("/uploads/") ? API_URL + url : url);

function youtubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

// Shown on the public website. Picks the first live popup for this page that the visitor hasn't dismissed.
export function SitePopup() {
  const { popups = [] } = usePublicConfig();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [active, setActive] = useState<Popup | null>(null);

  useEffect(() => {
    if (active) return;
    const p = popups.find((x) => matchesPage(x, pathname) && !alreadySeen(x));
    if (!p) return;
    const t = setTimeout(() => {
      setActive(p);
      markSeen(p);
    }, (p.delaySec ?? 2) * 1000);
    return () => clearTimeout(t);
  }, [popups, pathname, active]);

  if (!active) return null;
  return <PopupView popup={active} onClose={() => setActive(null)} />;
}

export function PopupView({ popup: p, onClose }: { popup: Popup; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const external = /^https?:/.test(p.ctaLink);
  const cta =
    p.ctaText && p.ctaLink ? (
      <a
        href={p.ctaLink}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        onClick={() => !external && onClose()}
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-5 py-3.5 text-base font-extrabold text-slate-900 shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-amber-400"
      >
        {p.ctaText}
      </a>
    ) : null;

  const yt = p.type === "video" ? youtubeId(p.mediaUrl) : null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-300"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={p.title || "Offer"}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300 sm:max-w-lg"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-slate-900/70 text-white backdrop-blur hover:bg-slate-900"
        >
          <X className="size-5" />
        </button>

        {p.type === "image" && p.mediaUrl && (
          <a href={p.ctaLink || undefined} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} onClick={() => p.ctaLink && !external && onClose()}>
            <img src={mediaSrc(p.mediaUrl)} alt={p.title || "Offer"} className="block max-h-[65vh] w-full object-contain bg-slate-100" />
          </a>
        )}

        {p.type === "video" && p.mediaUrl && (
          <div className="aspect-video w-full bg-black">
            {yt ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&mute=1&playsinline=1&rel=0`}
                title={p.title || "Video"}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            ) : (
              <video src={mediaSrc(p.mediaUrl)} autoPlay muted playsInline controls loop className="h-full w-full object-contain" />
            )}
          </div>
        )}

        {p.type === "offer" ? (
          <div className="p-7 text-center text-white sm:p-9" style={{ background: p.bgColor || "linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#b45309 140%)" }}>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              <Tag className="size-3.5" /> Special Offer
            </span>
            {p.title && <p className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{p.title}</p>}
            {p.message && <p className="mt-3 whitespace-pre-line text-base text-white/85">{p.message}</p>}
            {p.couponCode && (
              <button
                onClick={() => {
                  void navigator.clipboard?.writeText(p.couponCode);
                  setCopied(true);
                }}
                className="mx-auto mt-5 flex items-center gap-2 rounded-xl border-2 border-dashed border-amber-400 bg-white/10 px-5 py-3 font-mono text-xl font-black tracking-widest text-amber-300"
              >
                {p.couponCode} {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
              </button>
            )}
            {p.couponCode && <p className="mt-1 text-xs text-white/60">{copied ? "Copied! Mention it while booking." : "Tap to copy the code"}</p>}
            {cta}
          </div>
        ) : (
          (p.title || p.message || cta) && (
            <div className="p-5 text-center sm:p-6">
              {p.title && <p className="text-xl font-extrabold text-slate-900">{p.title}</p>}
              {p.message && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{p.message}</p>}
              {cta}
            </div>
          )
        )}
      </div>
    </div>
  );
}
