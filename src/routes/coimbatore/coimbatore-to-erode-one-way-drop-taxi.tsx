import { createFileRoute } from "@tanstack/react-router";
import { RouteTemplate } from "@/components/RouteTemplate";
import { routeHead } from "@/lib/seo";

export const Route = createFileRoute("/coimbatore/coimbatore-to-erode-one-way-drop-taxi")({
  head: () => routeHead("Coimbatore", "Erode"),
  component: Page,
});

function Page() {
  return (
    <RouteTemplate 
      from="Coimbatore" 
      to="Erode" 
      distance="100 km" 
      time="2 hours" 
      sedanFare="Starting at ₹15/km" 
      suvFare="Starting at ₹20/km" 
    />
  );
}