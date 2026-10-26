import { createFileRoute } from "@tanstack/react-router";
import { RouteTemplate } from "@/components/RouteTemplate";
import { routeHead } from "@/lib/seo";

export const Route = createFileRoute("/coimbatore/coimbatore-to-bangalore-one-way-drop-taxi")({
  head: () => routeHead("Coimbatore", "Bangalore"),
  component: Page,
});

function Page() {
  return (
    <RouteTemplate 
      from="Coimbatore" 
      to="Bangalore" 
      distance="347 km" 
      time="7.5 hours" 
      sedanFare="Starting at ₹15/km" 
      suvFare="Starting at ₹20/km" 
    />
  );
}