import { createFileRoute } from "@tanstack/react-router";
import { RouteTemplate } from "@/components/RouteTemplate";
import { routeHead } from "@/lib/seo";

export const Route = createFileRoute("/coimbatore/coimbatore-to-trichy-one-way-drop-taxi")({
  head: () => routeHead("Coimbatore", "Trichy"),
  component: Page,
});

function Page() {
  return (
    <RouteTemplate 
      from="Coimbatore" 
      to="Trichy" 
      distance="217 km" 
      time="4.5 hours" 
      sedanFare="Starting at ₹15/km" 
      suvFare="Starting at ₹20/km" 
    />
  );
}