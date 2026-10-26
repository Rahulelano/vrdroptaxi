import { createFileRoute } from "@tanstack/react-router";
import { ServiceTemplate } from "@/components/ServiceTemplate";
import { hubHead } from "@/lib/seo";

export const Route = createFileRoute("/routes/chennai-one-way-drop-taxi")({
  head: () => hubHead("Chennai"),
  component: Page,
});

function Page() {
  return (
    <ServiceTemplate 
      title="Drop Taxi Chennai"
      subtitle="Reliable outstation drop taxi services operating directly from Chennai."
      contentPara1="Droptaxii provides top-tier outstation taxi services starting directly from Chennai. We pride ourselves on transparent billing, zero hidden fees, and perfectly maintained vehicles. If you need a reliable taxi to travel from Chennai to any other major city in South India, you have found the right provider."
      contentPara2="Every vehicle dispatched from our Chennai hub undergoes rigorous safety checks. Depending on your needs, you can choose from economic Sedan ACs, spacious SUV / Ertiga ACs, or premium Innova ACs. We cater to hospital trips, airport transfers, corporate rides, and family vacations out of Chennai."
      features={[
        "Pickup from anywhere in Chennai",
        "On-time guarantee",
        "Clean & hygienic vehicles",
        "Toll-free route updates",
        "Fixed-tariff per km",
        "Multilingual driver support"
      ]}
      routesTitle="Top Hub Connections"
      routes={[
        { name: "Chennai to Bangalore", dist: "Varies", time: "Outstation Route" },
        { name: "Chennai to Madurai", dist: "Varies", time: "Outstation Route" },
        { name: "Chennai to Salem", dist: "Varies", time: "Outstation Route" }
      ]}
    />
  );
}