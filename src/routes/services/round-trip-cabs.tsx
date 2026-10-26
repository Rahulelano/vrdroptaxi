import { createFileRoute } from '@tanstack/react-router';
import { ServiceTemplate } from '@/components/ServiceTemplate';
import { BRAND, seo } from "@/lib/seo";

export const Route = createFileRoute('/services/round-trip-cabs')({
  head: () => seo({ title: "Round Trip Cabs – Outstation Return Taxi | " + BRAND, description: "Book round trip outstation cabs with driver at low per-km rates. Sedan, SUV, Innova & Tempo Traveller for family trips, temple tours and weekend getaways.", path: "/services/round-trip-cabs" }),
  component: Page,
});

function Page() {
  return (
    <ServiceTemplate 
      title="Round Trip Cabs"
      subtitle="Hassle-free outstation round trips with your own private driver."
      contentPara1="Planning a family vacation, a business trip spanning several days, or a weekend getaway? Let Droptaxii be your perfect travel partner with our affordable round trip cab service. Get complete flexibility on your travel dates, times, and routing without the stress of public transportation or hidden rental car fees."
      contentPara2="When you book a round trip with us, you are booking a dedicated vehicle and driver strictly at your disposal. This means you can add multiple stops along the way, travel at your own pace, and rest assured knowing a reliable driver will be waiting for you. Return to your home comfortably without navigating unknown roads."
      features={[
        "Dedicated private vehicle",
        "Multiple stops allowed",
        "Wait-time included options",
        "Inter-state permit assistance",
        "Expert long-distance chauffeurs",
        "Cost-effective per-km rates"
      ]}
      routesTitle="Popular Round-Trip Getaways"
      routes={[
        { name: "Coimbatore ⇌ Ooty", dist: "172 km total", time: "6 hrs drive" },
        { name: "Coimbatore ⇌ Kodaikanal", dist: "340 km total", time: "10 hrs drive" },
        { name: "Chennai ⇌ Pondicherry", dist: "320 km total", time: "7 hrs drive" },
        { name: "Madurai ⇌ Rameshwaram", dist: "350 km total", time: "8 hrs drive" }
      ]}
    />
  );
}
