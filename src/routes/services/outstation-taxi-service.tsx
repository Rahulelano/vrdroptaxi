import { createFileRoute } from '@tanstack/react-router';
import { ServiceTemplate } from '@/components/ServiceTemplate';
import { BRAND, seo } from "@/lib/seo";

export const Route = createFileRoute('/services/outstation-taxi-service')({
  head: () => seo({ title: "Outstation Taxi Service – Intercity Cabs | " + BRAND, description: "Reliable outstation taxi service between Chennai, Coimbatore, Madurai, Bangalore, Trichy, Salem and 40+ cities. Transparent fares, clean AC cars, 24/7 booking.", path: "/services/outstation-taxi-service" }),
  component: Page,
});

function Page() {
  return (
    <ServiceTemplate 
      title="Outstation Taxi Service"
      subtitle="Comfortable out-of-town rides designed for safety and reliability."
      contentPara1="Traveling across cities requires extra care, proper planning, and a vehicle built for long-distance durability. Droptaxii provides specialized outstation taxi services giving you exactly that. From corporate inter-city travels to emergency hospital visits in neighboring districts, our cars are fully serviced, legally permitted, and fitted with the best amenities."
      contentPara2="Our chauffeurs are experts at highway driving and familiar with multiple city routes across Tamil Nadu, Karnataka, Kerala, and Pondicherry. We maintain strict hygiene protocols and punctuality, so you arrive at your destination entirely refreshed and precisely on time."
      features={[
        "Well-maintained luxury fleet",
        "Expert highway drivers",
        "Toll & permit assistance",
        "Inter-state travel enabled",
        "Emergency local support",
        "Real-time GPS tracking"
      ]}
      routesTitle="Top Outstation Corridors"
      routes={[
        { name: "Tamil Nadu to Karnataka", dist: "Various", time: "State Route" },
        { name: "Kerala to Tamil Nadu", dist: "Various", time: "State Route" },
        { name: "Coimbatore to Pondicherry", dist: "380 km", time: "7 hrs" },
        { name: "Chennai to Bangalore", dist: "345 km", time: "7 hrs" }
      ]}
    />
  );
}
