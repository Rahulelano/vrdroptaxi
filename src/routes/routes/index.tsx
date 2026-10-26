import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { InfoPage } from "@/components/InfoPage";
import { computeFare, inr, usePublicConfig } from "@/lib/api";
import { hubs } from "@/lib/content";
import { BRAND, routePath, seo } from "@/lib/seo";

export const Route = createFileRoute("/routes/")({
  head: () =>
    seo({
      title: `All Drop Taxi Routes & Fares – Tamil Nadu & South India | ${BRAND}`,
      description: "Distance, travel time and one way taxi fare for every route we serve — Chennai, Coimbatore, Madurai, Trichy, Salem, Bangalore, Pondicherry and more.",
      path: "/routes",
    }),
  component: RoutesPage,
});

function RoutesPage() {
  const { routes, vehicles, settings } = usePublicConfig();
  const [q, setQ] = useState("");
  const [v1, v2] = vehicles;
  const items = routes.filter((r) => `${r.from} ${r.to}`.toLowerCase().includes(q.toLowerCase()));
  const byFrom = items.reduce<Record<string, typeof items>>((acc, r) => {
    (acc[r.from] ??= []).push(r);
    return acc;
  }, {});

  return (
    <InfoPage wide title="Drop Taxi Routes & Fares" intro="One way fares for every route, including driver bata. Tap a route to compare vehicles and book.">
      <div className="relative mb-8">
        <Search className="absolute left-4 top-3.5 size-5 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a city, e.g. Madurai"
          aria-label="Search routes"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-base shadow-sm outline-none focus:border-amber-500"
        />
      </div>

      {Object.entries(byFrom).map(([from, list]) => (
        <section key={from} className="mb-10">
          <h2 className="mb-4 text-xl font-extrabold text-slate-900 sm:text-2xl">Drop Taxi from {from}</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {list.map((r) => (
                <li key={r.id}>
                  <Link to={routePath(r.from, r.to)} className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-4 hover:bg-amber-50/60 sm:px-5">
                    <span className="min-w-0">
                      <span className="block font-bold text-slate-900 group-hover:text-amber-700">
                        {r.from} to {r.to} Taxi
                      </span>
                      <span className="text-xs text-slate-500">
                        {r.km} km · {r.hrs}
                      </span>
                    </span>
                    <span className="flex items-center gap-4 text-sm">
                      {v1 && (
                        <span className="text-right">
                          <span className="block text-[11px] text-slate-500">{v1.name}</span>
                          <b className="text-slate-900">{inr(computeFare(v1, "one", r.km, settings.minKm))}</b>
                        </span>
                      )}
                      {v2 && (
                        <span className="hidden text-right sm:block">
                          <span className="block text-[11px] text-slate-500">{v2.name}</span>
                          <b className="text-slate-900">{inr(computeFare(v2, "one", r.km, settings.minKm))}</b>
                        </span>
                      )}
                      <ArrowRight className="size-4 text-amber-600 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
      {items.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-slate-500">
          No listed route matches "{q}". Call us — we go to any city in South India.
        </p>
      )}

      <section>
        <h2 className="mb-4 text-xl font-extrabold text-slate-900 sm:text-2xl">Drop Taxi by City</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {hubs.map((h) => (
            <Link
              key={h}
              to={`/routes/${h.toLowerCase()}-one-way-drop-taxi`}
              className="rounded-xl border border-slate-200 bg-white p-4 font-bold text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-400"
            >
              Drop Taxi {h} →
            </Link>
          ))}
        </div>
      </section>
    </InfoPage>
  );
}
