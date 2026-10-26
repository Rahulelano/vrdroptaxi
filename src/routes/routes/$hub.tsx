import { createFileRoute } from "@tanstack/react-router";
import { RouteTemplate } from "@/components/RouteTemplate";
import { hubHead } from "@/lib/seo";

export const Route = createFileRoute("/routes/$hub")({
  head: ({ params }) => hubHead(params.hub.split("-")[0]!.replace(/^./, (c) => c.toUpperCase())),
  component: HubPage,
});

function TitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function HubPage() {
  const { hub } = Route.useParams();
  
  // Example hub param: "coimbatore-one-way-drop-taxi"
  const cityName = hub.split("-")[0] || "City";
  const formattedCity = TitleCase(cityName);

  return (
    <RouteTemplate 
      from={formattedCity} 
      to="Anywhere in South India" 
      distance="Available" 
      time="24/7" 
      sedanFare="Starting at ₹15/km" 
      suvFare="Starting at ₹20/km" 
    />
  );
}
