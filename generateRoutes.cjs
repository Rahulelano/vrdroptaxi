const fs = require("fs");
const path = require("path");

const routes = [
  { name: "coimbatore-to-chennai", path: "coimbatore/coimbatore-to-chennai-one-way-drop-taxi", distance: "499 km", time: "11 hours" },
  { name: "coimbatore-to-bangalore", path: "coimbatore/coimbatore-to-bangalore-one-way-drop-taxi", distance: "347 km", time: "7.5 hours" },
  { name: "coimbatore-to-madurai", path: "coimbatore/coimbatore-to-madurai-one-way-drop-taxi", distance: "204 km", time: "4.5 hours" },
  { name: "coimbatore-to-trichy", path: "coimbatore/coimbatore-to-trichy-one-way-drop-taxi", distance: "217 km", time: "4.5 hours" },
  { name: "coimbatore-to-salem", path: "coimbatore/coimbatore-to-salem-one-way-drop-taxi", distance: "167 km", time: "3.5 hours" },
  { name: "coimbatore-to-ooty", path: "coimbatore/coimbatore-to-ooty-one-way-drop-taxi", distance: "86 km", time: "3 hours" },
  { name: "coimbatore-to-pondicherry", path: "coimbatore/coimbatore-to-pondicherry-one-way-drop-taxi", distance: "380 km", time: "7 hours" },
  { name: "coimbatore-to-erode", path: "coimbatore/coimbatore-to-erode-one-way-drop-taxi", distance: "100 km", time: "2 hours" },
  
  // Hubs
  { name: "coimbatore-hub", path: "routes/coimbatore-one-way-drop-taxi", distance: "Local", time: "-" },
  { name: "bangalore-hub", path: "routes/bangalore-one-way-drop-taxi", distance: "Local", time: "-" },
  { name: "chennai-hub", path: "routes/chennai-one-way-drop-taxi", distance: "Local", time: "-" },
  { name: "madurai-hub", path: "routes/madurai-one-way-drop-taxi", distance: "Local", time: "-" },
  { name: "salem-hub", path: "routes/salem-one-way-drop-taxi", distance: "Local", time: "-" },
  { name: "trichy-hub", path: "routes/trichy-one-way-drop-taxi", distance: "Local", time: "-" },
  { name: "erode-hub", path: "routes/erode-one-way-drop-taxi", distance: "Local", time: "-" },
];

routes.forEach((route) => {
  const fullPath = path.join(__dirname, "src/routes", route.path + ".tsx");
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fromCity = route.path.includes("-to-") ? route.path.split("/")[1].split("-to-")[0] : route.path.split("/")[1]?.split("-")[0] || "Coimbatore";
  const toCity = route.path.includes("-to-") ? route.path.split("/")[1].split("-to-")[1].replace("-one-way-drop-taxi", "") : "Destination";
  
  let TitleCase = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  let from = TitleCase(fromCity);
  let to = TitleCase(toCity);

  let content = ``;
  
  if (route.name.includes("-hub")) {
    content = `
import { createFileRoute } from "@tanstack/react-router";
import { ServiceTemplate } from "@/components/ServiceTemplate";

export const Route = createFileRoute("/${route.path}")({
  component: Page,
});

function Page() {
  return (
    <ServiceTemplate 
      title="Drop Taxi ${from}"
      subtitle="Reliable outstation drop taxi services operating directly from ${from}."
      contentPara1="Droptaxii provides top-tier outstation taxi services starting directly from ${from}. We pride ourselves on transparent billing, zero hidden fees, and perfectly maintained vehicles. If you need a reliable taxi to travel from ${from} to any other major city in South India, you have found the right provider."
      contentPara2="Every vehicle dispatched from our ${from} hub undergoes rigorous safety checks. Depending on your needs, you can choose from economic Sedan ACs, spacious SUV / Ertiga ACs, or premium Innova ACs. We cater to hospital trips, airport transfers, corporate rides, and family vacations out of ${from}."
      features={[
        "Pickup from anywhere in ${from}",
        "On-time guarantee",
        "Clean & hygienic vehicles",
        "Toll-free route updates",
        "Fixed-tariff per km",
        "Multilingual driver support"
      ]}
      routesTitle="Top Hub Connections"
      routes={[
        { name: "${from} to Chennai", dist: "Varies", time: "Outstation Route" },
        { name: "${from} to Bangalore", dist: "Varies", time: "Outstation Route" },
        { name: "${from} to Madurai", dist: "Varies", time: "Outstation Route" },
        { name: "${from} to Salem", dist: "Varies", time: "Outstation Route" }
      ]}
    />
  );
}
    `.trim();
  } else {
    content = `
import { createFileRoute } from "@tanstack/react-router";
import { RouteTemplate } from "@/components/RouteTemplate";

export const Route = createFileRoute("/${route.path}")({
  component: Page,
});

function Page() {
  return (
    <RouteTemplate 
      from="${from}" 
      to="${to}" 
      distance="${route.distance || "N/A"}" 
      time="${route.time || "N/A"}" 
      sedanFare="Starting at ₹15/km" 
      suvFare="Starting at ₹20/km" 
    />
  );
}
    `.trim();
  }

  // Only rewrite if changed so vite doesn't go crazy
  if (fs.existsSync(fullPath)) {
    const existing = fs.readFileSync(fullPath, "utf-8");
    if (existing !== content) {
       fs.writeFileSync(fullPath, content);
    }
  } else {
    fs.writeFileSync(fullPath, content);
  }
  
});
console.log("Routes generated successfully!");
