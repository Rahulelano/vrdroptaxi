// Initial data, taken from what used to be hardcoded in the website.
import crypto from "node:crypto";

const id = () => crypto.randomUUID();
const ts = () => new Date().toISOString();

export function seedData() {
  const vehicles = [
    {
      name: "Sedan AC",
      sub: "Swift Dzire / Etios / Amaze or Similar",
      img: "/swift.jpg",
      oneway: 15, round: 14, bata: 400, pkg: 300,
      passengers: 4, bags: 2,
      features: ["Up to 4 Passengers", "Air-Conditioned Vehicle", "Medium Luggage Space", "Comfortable Budget Travel"],
    },
    {
      name: "SUV / Ertiga AC",
      sub: "Ertiga / Xylo / Kia Carens or Similar",
      img: "/ertica.jpg",
      oneway: 20, round: 19, bata: 500, pkg: 400,
      passengers: 7, bags: 4,
      features: ["Up to 6 – 7 Passengers", "Spacious Air-Conditioned Cabin", "Large Luggage Space", "Best for Family Travel"],
    },
    {
      name: "Innova AC",
      sub: "Toyota Innova",
      img: "/innova.jpg",
      oneway: 21, round: 19, bata: 500, pkg: 0,
      passengers: 7, bags: 5,
      features: ["Up to 7 Passengers", "Premium Comfortable Ride", "Extra Spacious Cabin", "Ideal for Long-Distance Trips"],
    },
    {
      name: "Tempo Traveller",
      sub: "12 to 14 Seater",
      img: "/tempo.jpg",
      oneway: 26, round: 26, bata: 800, pkg: 0,
      passengers: 14, bags: 8,
      features: ["12 to 14 Passengers", "Air-Conditioned Vehicle", "Spacious Luggage Space", "Ideal for Group Travel"],
    },
  ].map((v, i) => ({ id: id(), ...v, active: true, popular: false, sort: i, createdAt: ts(), updatedAt: ts() }));

  const routes = [
    ["Madurai", "~8 hrs", 460, "/destinations/madurai.png"],
    ["Thirunelveli", "~10.5 hrs", 625, "/destinations/thirunelveli.png"],
    ["Coimbatore", "~9 hrs", 510, "/destinations/coimbatore.png"],
    ["Trichy", "~6 hrs", 330, "/destinations/trichy.png"],
    ["Salem", "~6.5 hrs", 345, "/destinations/salem.png"],
    ["Bangalore", "~6.5 hrs", 350, "/destinations/bangalore.png"],
    ["Cochin", "~12 hrs", 690, "/destinations/cochin.png"],
    ["Thiruvananthapuram", "~13 hrs", 770, "/destinations/thiruvananthapuram.png"],
    ["Tirupathi", "~3 hrs", 135, "/destinations/tirupathi.png"],
    ["Pondicherry", "~3.5 hrs", 165, "/destinations/pondicherry.png"],
    ["Vellore", "~3 hrs", 140, "/destinations/vellore.png"],
    ["Ooty", "~10.5 hrs", 550, "/destinations/ooty.png"],
    ["Erode", "~7.5 hrs", 400, "/destinations/erode.png"],
    ["Kodaikanal", "~10 hrs", 530, "https://images.unsplash.com/photo-1594957976865-c335e40e0be2?q=80&w=600&auto=format&fit=crop"],
  ].map(([to, hrs, km, img], i) => ({
    id: id(), from: "Chennai", to, hrs, km, img, note: "",
    active: true, featured: i < 10, sort: i, createdAt: ts(), updatedAt: ts(),
  }));

  return {
    settings: {
      businessName: "Droptaxii",
      logo: "/logo.png",
      phone: "+919843600457",
      whatsapp: "919843600457",
      adminNotifyEmails: "",
      homeOrigin: "Chennai",
      minKm: 130,
      requireEmailOtp: true,
      emailCustomerOnStatusChange: true,
      acceptingBookings: true,
      announcement: "",
    },
    vehicles,
    routes,
    bookings: [],
    customers: [],
    drivers: [],
    admins: [],
    pushSubscriptions: [],
    popups: [],
    uploads: [],
    meta: { bookingSeq: 1000 },
  };
}
