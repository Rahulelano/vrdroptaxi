import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, HeadContent, createRootRouteWithContext, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, MessageCircle, Menu, X, MapPin } from "lucide-react";
import { usePublicConfig, waLink } from "@/lib/api";
import { BRAND, PHONE_DISPLAY, ADDRESS, localBusinessLd, routePath } from "@/lib/seo";
import { hubs } from "@/lib/content";
import { JsonLd } from "@/components/Seo";
import { SitePopup } from "@/components/SitePopup";

const NAV: Array<[string, string]> = [
  ["Home", "/"],
  ["Services", "/services/one-way-drop-taxi"],
  ["Routes & Fares", "/routes"],
  ["About Us", "/about-us"],
  ["FAQs", "/faqs"],
  ["Contact", "/about-us#contact"],
];

function GlobalHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { settings } = usePublicConfig();
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0] ?? href));

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/95 px-4 py-3 shadow-sm backdrop-blur sm:rounded-b-xl sm:px-6 sm:py-4">
        <Link to="/" className="flex shrink-0 items-center transition-transform hover:scale-[1.02]" aria-label={`${settings.businessName || BRAND} home`}>
          <img src={settings.logo || "/logo.png"} alt={`${settings.businessName || BRAND} logo`} width={160} height={48} className="h-10 w-auto object-contain drop-shadow sm:h-12" />
        </Link>
        <nav aria-label="Main" className="hidden gap-7 text-sm font-semibold text-slate-200 lg:flex">
          {NAV.map(([label, href]) => (
            <Link key={label} to={href} className={`transition-colors hover:text-amber-400 ${isActive(href) ? "text-amber-400" : ""}`}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={`tel:${settings.phone}`}
            className="hidden items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-amber-500 sm:inline-flex"
          >
            <Phone className="size-4" /> Call Now
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 p-2 text-white shadow-md transition-colors hover:bg-slate-700 lg:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="absolute left-0 right-0 top-full z-50 mx-3 mt-2 rounded-xl border border-slate-800 bg-slate-900/98 p-4 shadow-2xl backdrop-blur lg:hidden">
          <ul className="flex flex-col">
            {NAV.map(([label, href]) => (
              <li key={label}>
                <Link
                  to={href}
                  className={`block border-b border-slate-800/60 py-3 text-base font-semibold ${isActive(href) ? "text-amber-400" : "text-slate-200"}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <a href={`tel:${settings.phone}`} className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-amber-600 py-3 font-bold text-white">
            <Phone className="size-4" /> Call {PHONE_DISPLAY}
          </a>
        </nav>
      )}
    </header>
  );
}

function AnnouncementBar() {
  const { settings } = usePublicConfig();
  if (!settings.announcement) return null;
  return (
    <div className="fixed inset-x-0 bottom-[76px] z-40 mx-auto w-fit max-w-[92vw] rounded-full bg-amber-500 px-4 py-2 text-center text-xs font-bold text-slate-900 shadow-lg sm:bottom-4">
      {settings.announcement}
    </div>
  );
}

function GlobalFooter() {
  const { settings, routes } = usePublicConfig();
  const popular = routes.filter((r) => r.featured).slice(0, 8);
  const wa = (t: string) => waLink(settings.whatsapp, t);
  const linkCls = "transition-colors hover:text-amber-400";

  return (
    <>
      <footer className="bg-slate-900 pb-24 pt-14 text-white sm:pb-10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <img src={settings.logo || "/logo.png"} alt={`${settings.businessName || BRAND} logo`} width={160} height={64} loading="lazy" className="mb-4 h-14 w-auto object-contain" />
            <p className="mb-5 text-sm leading-relaxed text-slate-400">
              One-way drop taxi and outstation cab service across Tamil Nadu and South India. Pay only for the distance you travel — verified drivers, clean AC cars and 24/7 support.
            </p>
            <address className="space-y-3 text-sm not-italic text-slate-300" id="footer-contact">
              <a href={`tel:${settings.phone}`} className={`flex items-center gap-3 ${linkCls}`}>
                <Phone className="size-4 shrink-0 text-amber-500" /> {PHONE_DISPLAY}
              </a>
              <a href={wa("Hi, I'd like to book a drop taxi.")} target="_blank" rel="noreferrer" className={`flex items-center gap-3 ${linkCls}`}>
                <MessageCircle className="size-4 shrink-0 text-amber-500" /> WhatsApp {PHONE_DISPLAY}
              </a>
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <span>
                  {ADDRESS.streetAddress}, {ADDRESS.addressLocality} – {ADDRESS.postalCode}
                  <br />
                  24/7 booking support
                </span>
              </p>
            </address>
          </div>

          <div>
            <p className="mb-4 text-lg font-bold">Popular Routes</p>
            <ul className="space-y-2.5 text-sm text-slate-300">
              {popular.map((r) => (
                <li key={r.id}>
                  <Link to={routePath(r.from, r.to)} className={linkCls}>
                    {r.from} to {r.to} Taxi
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link to="/routes" className="font-semibold text-amber-500 hover:text-amber-400">
                  View all routes →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-lg font-bold">Drop Taxi by City</p>
            <ul className="space-y-2.5 text-sm text-slate-300">
              {hubs.map((h) => (
                <li key={h}>
                  <Link to={`/routes/${h.toLowerCase()}-one-way-drop-taxi`} className={linkCls}>
                    Drop Taxi {h}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-lg font-bold">Services & Info</p>
            <ul className="space-y-2.5 text-sm text-slate-300">
              {([
                ["One-Way Drop Taxi", "/services/one-way-drop-taxi"],
                ["Round Trip Cabs", "/services/round-trip-cabs"],
                ["Outstation Taxi", "/services/outstation-taxi-service"],
                ["24/7 Taxi Booking", "/services/24-7-taxi-booking"],
                ["About Us", "/about-us"],
                ["FAQs", "/faqs"],
                ["Terms & Conditions", "/terms"],
                ["Cancellation Policy", "/cancellation-policy"],
                ["Privacy Policy", "/privacy-policy"],
              ] as [string, string][]).map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className={linkCls}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-slate-800 px-4 pt-8 sm:px-6">
          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} {BRAND} · All rights reserved.
          </p>
        </div>
      </footer>
      {/* Sticky mobile call / WhatsApp bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex gap-2 border-t border-border bg-background/95 p-3 backdrop-blur sm:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <a href={`tel:${settings.phone}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-bold text-white">
          <Phone className="size-4" /> Call Now
        </a>
        <a href={wa("Hi, I'd like to book a drop taxi.")} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-sm font-bold text-white">
          <MessageCircle className="size-4" /> WhatsApp
        </a>
      </div>
    </>
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 pt-28 text-center">
      <p className="text-6xl font-black text-amber-500">404</p>
      <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you are looking for doesn't exist. Find your route or call us to book.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white">
          Go to Home
        </Link>
        <Link to="/routes" className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-bold text-slate-800">
          All Routes
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [{ name: "theme-color", content: "#0f172a" }, { name: "format-detection", content: "telephone=yes" }],
  }),
  component: RootComponent,
  notFoundComponent: () => (
    <>
      <title>{`Page not found | ${BRAND}`}</title>
      <meta name="robots" content="noindex" />
      <NotFound />
    </>
  ),
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const isAdmin = useRouterState({ select: (s) => s.location.pathname.startsWith("/admin") });
  if (isAdmin)
    return (
      <QueryClientProvider client={queryClient}>
        <HeadContent />
        <Outlet />
      </QueryClientProvider>
    );
  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <JsonLd data={localBusinessLd()} />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <AnnouncementBar />
      <GlobalHeader />
      <main id="main" className="min-h-screen w-full overflow-x-hidden">
        <Outlet />
      </main>
      <GlobalFooter />
      <SitePopup />
    </QueryClientProvider>
  );
}

