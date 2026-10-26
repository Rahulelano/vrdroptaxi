import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Phone, MessageCircle } from "lucide-react";
import { usePublicConfig, waLink } from "@/lib/api";
import { PHONE_DISPLAY } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Seo";

// Shared layout for content pages (About, FAQs, policies, all routes).
export function InfoPage({ title, intro, children, wide = false }: { title: string; intro?: string; children: ReactNode; wide?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { settings } = usePublicConfig();
  return (
    <div className="bg-slate-50 pb-20">
      <section className="bg-slate-900 pb-12 pt-28 sm:pb-16 sm:pt-32">
        <div className={`mx-auto px-4 sm:px-6 ${wide ? "max-w-7xl" : "max-w-4xl"}`}>
          <Breadcrumbs dark items={[["Home", "/"], [title, pathname]]} />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{title}</h1>
          {intro && <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">{intro}</p>}
        </div>
      </section>
      <div className={`mx-auto px-4 pt-10 sm:px-6 sm:pt-12 ${wide ? "max-w-7xl" : "max-w-4xl"}`}>
        {children}
        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl bg-slate-900 p-6 text-center text-white sm:flex-row sm:justify-between sm:p-8 sm:text-left">
          <div>
            <p className="text-xl font-extrabold">Need a taxi? We're available 24/7.</p>
            <p className="mt-1 text-sm text-slate-400">Call or WhatsApp for an instant fare quote.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <a href={`tel:${settings.phone}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-bold text-slate-900">
              <Phone className="size-4" /> {PHONE_DISPLAY}
            </a>
            <a
              href={waLink(settings.whatsapp, "Hi, I'd like to book a drop taxi.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-5 text-[15px] leading-relaxed text-slate-600 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-slate-900 sm:[&_h2]:text-2xl [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2 [&_b]:text-slate-800">
      {children}
    </div>
  );
}
