import { createFileRoute } from '@tanstack/react-router';
import { ServiceTemplate } from '@/components/ServiceTemplate';
import { BRAND, seo } from "@/lib/seo";

export const Route = createFileRoute('/services/24-7-taxi-booking')({
  head: () => seo({ title: "24/7 Taxi Booking – Call or WhatsApp Anytime | " + BRAND, description: "Book a drop taxi any time, day or night. 24/7 booking by phone, WhatsApp or online with instant confirmation for airport, hospital and outstation trips.", path: "/services/24-7-taxi-booking" }),
  component: Page,
});

function Page() {
  return (
    <ServiceTemplate 
      title="24/7 Taxi Booking"
      subtitle="Round-the-clock taxi services when you need them most."
      contentPara1="Travel plans can be unpredictable. Whether you have a late-night flight, a sudden medical emergency, or simply prefer traveling during cooler nighttime hours, Droptaxii’s 24/7 booking service ensures you are never left without a ride. Our operations center and customer support lines are active day and night."
      contentPara2="Night-time driving requires extensive experience, which is why we strictly allocate our most veteran drivers for overnight trips. Our vehicles are equipped with clear headlights and GPS tracking for ultimate peace of mind. Simply call or WhatsApp us anytime."
      features={[
        "24/7 Phone bookings",
        "Night-time expert drivers",
        "Airport midnight transfers",
        "Hospital & emergency rides",
        "Real-time GPS ride sharing",
        "Safe for solo travelers"
      ]}
      routesTitle="Popular Night Travel Routes"
      routes={[
        { name: "Coimbatore to Chennai Air", dist: "505 km", time: "11 hrs" },
        { name: "Coimbatore to B'lore Air", dist: "360 km", time: "8 hrs" },
        { name: "Madurai to Trichy", dist: "135 km", time: "2.5 hrs" },
        { name: "Salem to Erode", dist: "65 km", time: "1.5 hrs" }
      ]}
    />
  );
}
