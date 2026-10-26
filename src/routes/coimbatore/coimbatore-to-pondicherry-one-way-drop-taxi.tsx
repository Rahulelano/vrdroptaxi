import { createFileRoute } from "@tanstack/react-router";
import { RouteTemplate } from "@/components/RouteTemplate";
import { routeHead } from "@/lib/seo";

export const Route = createFileRoute("/coimbatore/coimbatore-to-pondicherry-one-way-drop-taxi")({
  head: () => routeHead("Coimbatore", "Pondicherry"),
  component: Page,
});

function Page() {
  return (
    <RouteTemplate 
      from="Coimbatore" 
      to="Pondicherry" 
      distance="380 km" 
      time="7 hours" 
      sedanFare="Starting at ₹15/km" 
      suvFare="Starting at ₹20/km" 
    />
  );
}