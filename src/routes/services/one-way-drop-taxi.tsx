import { createFileRoute } from '@tanstack/react-router';
import { ServiceTemplate } from '@/components/ServiceTemplate';
import { BRAND, seo } from "@/lib/seo";

export const Route = createFileRoute('/services/one-way-drop-taxi')({
  head: () => seo({ title: "One Way Drop Taxi – Pay Only One Side Fare | " + BRAND, description: "Book one way drop taxi across Tamil Nadu & South India. No return fare, Sedan from ₹15/km, SUV & Innova available. Door-to-door pickup, verified drivers, 24/7.", path: "/services/one-way-drop-taxi" }),
  component: Page,
});

function Page() {
  return (
    <ServiceTemplate 
      title="One-Way Drop Taxi"
      subtitle="Pay only for the distance you travel. No return fare required."
      contentPara1="At Droptaxii, we revolutionize outstation travel by charging you strictly for your one-way journey. Many traditional taxi services charge for a round trip even if you are just being dropped off. By choosing our one-way drop taxi service, you instantly save up to 40% on your travel costs while still enjoying premium, air-conditioned vehicles and professional chauffeurs."
      contentPara2="Our fleet includes comfortable Sedans, spacious SUVs like Ertiga, and premium Toyota Innovas to accommodate groups of any size. Whether you're heading to the airport, moving to a new city, or returning home, our drivers prioritize your safety and comfort above all else."
      features={[
        "No return fare charges",
        "Door-to-door pickup & drop",
        "GPS-enabled safe routing",
        "Experienced & verified drivers",
        "Transparent fare estimation",
        "Last-minute booking available"
      ]}
      routesTitle="Popular One-Way Routes"
      routes={[
        { name: "Coimbatore to Chennai", dist: "499 km", time: "11 hrs" },
        { name: "Coimbatore to Bangalore", dist: "347 km", time: "8 hrs" },
        { name: "Coimbatore to Madurai", dist: "204 km", time: "4.5 hrs" },
        { name: "Coimbatore to Salem", dist: "167 km", time: "3.5 hrs" }
      ]}
    />
  );
}
