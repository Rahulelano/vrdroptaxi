// Shared copy used on several pages (home, FAQs, terms, route pages).
export const faqs = [
  {
    q: "What is a one-way drop taxi and how is it different from a regular taxi?",
    a: "A one-way drop taxi takes you from your pickup point to your destination without charging for the return journey. With a traditional round-trip taxi, you pay for both directions even if the cab returns empty. Our one-way service lets you pay only for the distance you actually travel - saving you up to 50% compared to conventional outstation cabs.",
  },
  {
    q: "Are there any hidden charges I should know about?",
    a: "No. The fare is the per-km rate for your vehicle multiplied by the trip distance, plus a fixed driver bata. Toll fees, parking charges and inter-state permits are charged at actuals. A night travel surcharge (10 PM - 6 AM) may apply. You see the full estimate before you book.",
  },
  {
    q: "How do I book a cab? Can I book in advance?",
    a: "Choose your route on our website, pick a vehicle and confirm with your name, phone and email - or call / WhatsApp us on +91 98436 00457. Advance bookings are recommended for early morning departures, airport transfers and long-distance trips. Instant bookings are also supported based on availability.",
  },
  {
    q: "What is your cancellation policy?",
    a: "Cancellations made before a vehicle is assigned are free of charge. If the driver has already been dispatched or reached your location, a one-time cancellation fee of ₹300 applies. Changes must be requested at least 8 hours before pickup time.",
  },
  {
    q: "Do you offer airport pickup and drop?",
    a: "Yes. We provide airport pickup and drop to and from Chennai, Coimbatore, Madurai, Trichy and Bangalore airports. Drivers track flight timings for pickups. Book at least 2-4 hours in advance for guaranteed availability.",
  },
  {
    q: "Which cities and destinations do you cover?",
    a: "We cover 40+ cities and towns across Tamil Nadu, Karnataka, Andhra Pradesh, Kerala and Puducherry, including Chennai, Coimbatore, Madurai, Trichy, Salem, Erode, Tirunelveli, Bangalore, Pondicherry, Ooty, Kodaikanal, Rameswaram, Kanyakumari, Tirupati, Cochin and Trivandrum.",
  },
  {
    q: "What is the minimum distance charged for a trip?",
    a: "One-way trips are charged for a minimum of 130 km. If your trip is shorter, the 130 km minimum fare applies. Round trips are charged for the distance both ways.",
  },
  {
    q: "Is the driver bata included in the fare shown?",
    a: "Yes. The estimated total shown on our website already includes the driver bata. Only toll, parking, permit and hill charges are added separately at actuals.",
  },
];

export const terms: [string, string][] = [
  ["Fare & KM", "Fare is calculated based on pickup to drop distance only."],
  ["Base Coverage", "Base fare includes 130 km coverage only. Extra km charges apply after the included limit."],
  ["Extra Charges", "Toll, parking, permit, hill and waiting charges are extra if applicable."],
  ["Waiting Time", "Vehicle waiting time is 15 minutes only. After that, Rs.150 per hour waiting charges apply for Sedan & SUV vehicles."],
  ["Trip Changes", "Route diversion, extra stop, additional pickup/drop or plan changes must be informed before booking. Trip plans cannot be changed during travel without office approval."],
  ["Hill Stations", "Hill station trips may require Rs.300 to Rs.500 additional hill charges, and A/C will not be operated in hill areas as per rules."],
  ["Luggage", "In Sedan vehicles, heavy luggage inside the vehicle, and in SUV vehicles, luggage carried on top carrier will attract Rs.300 additional luggage charges."],
  ["Pets", "If bringing pets, please inform during booking. Pet charges of Rs.300 apply. Customers are responsible for pet safety, cleanliness and any vehicle damage charges."],
  ["Driver Safety", "Driver will follow traffic rules and company safety regulations only."],
  ["Support", "For booking changes, support or complaints, please contact the office directly. Avoid direct booking discussions with drivers."],
];

export const hubs = ["Chennai", "Coimbatore", "Madurai", "Bangalore", "Trichy", "Salem", "Erode"];

// Route-specific FAQ copy for a "From → To" page.
export const routeFaqs = (from: string, to: string, km: number, hrs: string, fromFare: string) => [
  {
    q: `How much is the one-way taxi fare from ${from} to ${to}?`,
    a: `The one-way drop taxi fare from ${from} to ${to} starts from ${fromFare} for a Sedan AC, including driver bata. Toll, parking and permit charges are extra at actuals.`,
  },
  {
    q: `What is the distance from ${from} to ${to} by road?`,
    a: `The road distance from ${from} to ${to} is about ${km} km, and the journey takes ${hrs} depending on traffic and stops.`,
  },
  {
    q: `Do I have to pay return fare for a ${from} to ${to} drop taxi?`,
    a: `No. With our one-way drop taxi you pay only for the ${from} to ${to} distance. There is no return fare.`,
  },
  {
    q: `Which vehicles are available from ${from} to ${to}?`,
    a: `You can book a Sedan AC (4 seats), SUV / Ertiga AC (7 seats), Toyota Innova (7 seats) or a Tempo Traveller (12-14 seats) for ${from} to ${to}.`,
  },
];
