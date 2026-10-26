import { createFileRoute } from "@tanstack/react-router";
import { ServiceTemplate } from "@/components/ServiceTemplate";
import { hubHead } from "@/lib/seo";

export const Route = createFileRoute("/routes/salem-one-way-drop-taxi")({
  head: () => hubHead("Salem"),
  component: Page,
});

function Page() {
  return (
    <ServiceTemplate 
      title="Drop Taxi Salem"
      subtitle="Reliable outstation drop taxi services operating directly from Salem."
      contentPara1="Droptaxii provides top-tier outstation taxi services starting directly from Salem. We pride ourselves on transparent billing, zero hidden fees, and perfectly maintained vehicles. If you need a reliable taxi to travel from Salem to any other major city in South India, you have found the right provider."
      contentPara2="Every vehicle dispatched from our Salem hub undergoes rigorous safety checks. Depending on your needs, you can choose from economic Sedan ACs, spacious SUV / Ertiga ACs, or premium Innova ACs. We cater to hospital trips, airport transfers, corporate rides, and family vacations out of Salem."
      features={[
        "Pickup from anywhere in Salem",
        "On-time guarantee",
        "Clean & hygienic vehicles",
        "Toll-free route updates",
        "Fixed-tariff per km",
        "Multilingual driver support"
      ]}
      routesTitle="Top Hub Connections"
      routes={[
        { name: "Salem to Chennai", dist: "Varies", time: "Outstation Route" },
        { name: "Salem to Bangalore", dist: "Varies", time: "Outstation Route" },
        { name: "Salem to Madurai", dist: "Varies", time: "Outstation Route" },
      ]}
    />
  );
}