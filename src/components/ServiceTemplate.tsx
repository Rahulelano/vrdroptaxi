import { Link, useRouterState } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck, MapPin, Clock, Navigation, Phone, MessageCircle, ArrowRight, Users } from "lucide-react";
import { computeFare, inr, usePublicConfig, waLink } from "@/lib/api";
import { PHONE_DISPLAY, routePath } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Seo";

interface ServiceRoute {
  name: string;
  dist: string;
  time: string;
}

export function ServiceTemplate({
  title,
  subtitle,
  contentPara1,
  contentPara2,
  features,
  routesTitle,
  routes,
}: {
  title: string;
  subtitle: string;
  contentPara1: string;
  contentPara2: string;
  features: string[];
  routesTitle: string;
  routes: ServiceRoute[];
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cfg = usePublicConfig();
  const { settings, vehicles } = cfg;
  const isHub = pathname.startsWith("/routes/");

  // Merge the page's own route list with admin-managed routes from the same city.
  const city = routes[0]?.name.split(" to ")[0] ?? settings.homeOrigin;
  const known = cfg.routes.filter((r) => r.from.toLowerCase() === city.toLowerCase());
  const merged = [
    ...known.map((r) => ({ from: r.from, to: r.to, dist: `${r.km} km`, time: r.hrs, km: r.km })),
    ...routes
      .map((r) => {
        const [from = city, to = ""] = r.name.split(" to ");
        return { from, to, dist: r.dist, time: r.time, km: parseInt(r.dist, 10) || 0 };
      })
      .filter((r) => r.to && r.from !== r.to && !known.some((k) => k.to.toLowerCase() === r.to.toLowerCase())),
  ].slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* HERO */}
      <section className="relative overflow-hidden border-b-4 border-amber-500 bg-slate-900 pb-16 pt-28 sm:pb-24 sm:pt-32">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
          <img
            src="https://images.unsplash.com/photo-1596706788591-bb2fb0172e25?q=80&w=1600&auto=format&fit=crop"
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className="h-full w-full object-cover grayscale"
          />
        </div>
        <div className="relative z-20 mx-auto max-w-7xl px-4 text-center sm:px-6">
          <div className="mb-5 flex justify-center">
            <Breadcrumbs dark items={[["Home", "/"], [isHub ? "Routes" : "Services", isHub ? "/routes" : "/services/one-way-drop-taxi"], [title, pathname]]} />
          </div>
          <h1 className="mb-5 text-3xl font-extrabold tracking-tight text-white sm:text-6xl">{title}</h1>
          <p className="mx-auto max-w-3xl text-base text-slate-300 sm:text-xl">{subtitle}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#routes" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 font-bold text-slate-900 shadow-lg hover:bg-amber-400">
              See Routes & Fares <ArrowRight className="size-4" />
            </a>
            <a href={`tel:${settings.phone}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 font-bold text-white hover:bg-white/20">
              <Phone className="size-4" /> {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-12 grid max-w-7xl grid-cols-1 items-start gap-10 px-4 sm:mt-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div className="min-w-0 space-y-12">
          {/* ARTICLE */}
          <article>
            <h2 className="mb-5 border-b pb-4 text-2xl font-extrabold text-navy sm:text-3xl">Why Choose Our {title}?</h2>
            <p className="mb-6 leading-relaxed text-slate-600">{contentPara1}</p>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-navy">
                <ShieldCheck className="text-amber-500" /> Safe, Clean & On Time
              </h3>
              <p className="leading-relaxed text-slate-600">{contentPara2}</p>
            </div>
          </article>

          {/* FEATURES */}
          <section>
            <h2 className="mb-5 text-xl font-extrabold text-navy sm:text-2xl">Service Features</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-500" />
                  <span className="text-sm font-semibold text-slate-700">{f}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* VEHICLES & PRICES */}
          <section>
            <h2 className="mb-2 text-xl font-extrabold text-navy sm:text-2xl">Vehicles & Per-km Fares</h2>
            <p className="mb-5 text-sm text-slate-500">Driver bata extra as shown · Minimum {settings.minKm} km per trip · Toll & parking at actuals.</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {vehicles.map((v) => (
                <div key={v.id} className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <img src={v.img} alt={`${v.name} taxi`} width={120} height={64} loading="lazy" className="h-16 w-full object-contain" />
                  <h3 className="mt-2 text-sm font-extrabold text-slate-900">{v.name}</h3>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <Users className="size-3" /> {v.passengers} seats
                  </p>
                  <p className="mt-2 text-xl font-black text-amber-600">₹{v.oneway}/km</p>
                  <p className="text-[11px] text-slate-500">Round trip ₹{v.round}/km · Bata ₹{v.bata}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ROUTES */}
          {merged.length > 0 && (
            <section id="routes" className="relative scroll-mt-24 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-10">
              <div className="absolute -right-8 -top-8 opacity-10">
                <Navigation className="size-64" />
              </div>
              <div className="relative z-10">
                <h2 className="mb-2 text-2xl font-black sm:text-3xl">{routesTitle}</h2>
                <p className="mb-6 max-w-lg text-slate-400">Tap a route to see the fare for every vehicle and book online.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {merged.map((r) => (
                    <Link
                      key={`${r.from}-${r.to}`}
                      to={routePath(r.from, r.to)}
                      className="group rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-amber-500/50 hover:bg-white/10"
                    >
                      <p className="mb-2 flex items-center justify-between font-bold text-white">
                        {r.from} to {r.to} Taxi <ArrowRight className="size-4 text-amber-500 transition-transform group-hover:translate-x-1" />
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 text-amber-500" /> {r.dist}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 text-amber-500" /> {r.time}
                        </span>
                        {r.km > 0 && vehicles[0] && <span className="text-amber-400">from {inr(computeFare(vehicles[0], "one", r.km, settings.minKm))}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
                <Link to="/routes" className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-amber-400 hover:text-amber-300">
                  View all routes <ArrowRight className="size-4" />
                </Link>
              </div>
            </section>
          )}
        </div>

        {/* SIDEBAR CTA */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 p-1 text-center shadow-2xl">
            <div className="relative h-full overflow-hidden rounded-[22px] bg-slate-900 p-7 text-white">
              <h2 className="mb-3 text-2xl font-black">Ready to Book?</h2>
              <p className="mb-6 text-sm leading-relaxed text-slate-300">Call or WhatsApp us for an instant fixed fare, or pick a route above to book online.</p>
              <div className="space-y-3">
                <a href={`tel:${settings.phone}`} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-extrabold text-slate-900 shadow-lg">
                  <Phone className="size-4" /> Call {PHONE_DISPLAY}
                </a>
                <a
                  href={waLink(settings.whatsapp, `Hi, I'd like to book: ${title}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-4 font-extrabold text-white shadow-lg hover:bg-green-400"
                >
                  <MessageCircle className="size-4" /> Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Why Book With Us</h2>
            <ul className="space-y-3 text-sm font-semibold text-slate-700">
              {["No hidden fares", "Experienced, verified drivers", "Clean AC vehicles", "24/7 phone support"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-500" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
