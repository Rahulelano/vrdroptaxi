import { createFileRoute } from "@tanstack/react-router";
import { RouteTemplate } from "@/components/RouteTemplate";
import { routeHead } from "@/lib/seo";

type RouteSearch = {
  distance?: number;
  trip?: "one" | "round" | "package";
};

export const Route = createFileRoute("/$fromCity/$seoRoute")({
  head: ({ params }) => {
    const { from, to } = parseCities(params.fromCity, params.seoRoute);
    return routeHead(from, to);
  },
  validateSearch: (search: Record<string, unknown>): RouteSearch => {
    // Only keep params that are actually set, so plain URLs stay clean.
    const out: RouteSearch = {};
    const d = Number(search["distance"]);
    if (d > 0) out.distance = d;
    const t = search["trip"];
    if (t === "one" || t === "round" || t === "package") out.trip = t;
    return out;
  },
  component: RoutePage,
});

function TitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase().replace(/-/g, ' ');
}

function parseCities(hub: string, seoRoute: string) {
  const parts = seoRoute.split("-to-");
  let toPart = parts[1] || "";
  const toCity = toPart.split("-one-way")[0] || "Destination";
  
  return {
    from: TitleCase(hub),
    to: TitleCase(toCity),
  };
}

function RoutePage() {
  const { fromCity, seoRoute } = Route.useParams();
  const search = Route.useSearch();
  const { from, to } = parseCities(fromCity, seoRoute);

  return (
    <RouteTemplate 
      from={from} 
      to={to} 
      distance={search.distance ? `${search.distance} km` : "Calculated at booking"} 
      time="Variable" 
      sedanFare="Starting at ₹15/km" 
      suvFare="Starting at ₹20/km" 
      calculatedKm={search.distance || 0}
      initialTrip={search.trip || "one"}
    />
  );
}
