import { createFileRoute } from "@tanstack/react-router";
import { ServiceTemplate } from "@/components/ServiceTemplate";
import { hubHead } from "@/lib/seo";

export const Route = createFileRoute("/routes/coimbatore-one-way-drop-taxi")({
  head: () => hubHead("Coimbatore"),
  component: Page,
});

function Page() {
  return (
    <ServiceTemplate 
      title="Drop Taxi Coimbatore"
      subtitle="Reliable outstation drop taxi services operating directly from Coimbatore."
      contentPara1="Droptaxii provides top-tier outstation taxi services starting directly from Coimbatore. We pride ourselves on transparent billing, zero hidden fees, and perfectly maintained vehicles. If you need a reliable taxi to travel from Coimbatore to any other major city in South India, you have found the right provider."
      contentPara2="Every vehicle dispatched from our Coimbatore hub undergoes rigorous safety checks. Depending on your needs, you can choose from economic Sedan ACs, spacious SUV / Ertiga ACs, or premium Innova ACs. We cater to hospital trips, airport transfers, corporate rides, and family vacations out of Coimbatore."
      features={[
        "Pickup from anywhere in Coimbatore",
        "On-time guarantee",
        "Clean & hygienic vehicles",
        "Toll-free route updates",
        "Fixed-tariff per km",
        "Multilingual driver support"
      ]}
      routesTitle="Top Hub Connections"
      routes={[
        { name: "Coimbatore to Chennai", dist: "Varies", time: "Outstation Route" },
        { name: "Coimbatore to Bangalore", dist: "Varies", time: "Outstation Route" },
        { name: "Coimbatore to Madurai", dist: "Varies", time: "Outstation Route" },
        { name: "Coimbatore to Salem", dist: "Varies", time: "Outstation Route" }
      ]}
    />
  );
}