import { useState } from "react";
import { Loader2 } from "lucide-react";
import { 
  CheckCircle2, MapPin, Phone, Car, Compass, Calendar, Clock, 
  MessageCircle, ShieldCheck, BadgeCheck, Navigation, Search 
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { api, computeFare, inr, usePublicConfig, waLink } from "@/lib/api";
import { BRAND, routePath, siteUrl } from "@/lib/seo";
import { routeFaqs } from "@/lib/content";
import { Breadcrumbs, JsonLd } from "@/components/Seo";

const terms = [
  { n: "1", t: "Fare & KM", d: "Fare is calculated based on pickup to drop distance only." },
  { n: "2", t: "Base Coverage", d: "Base fare includes 130 km coverage only. Extra km charges apply after the included limit." },
  { n: "3", t: "Extra Charges", d: "Toll, parking, permit, hill and waiting charges are extra if applicable." },
  { n: "4", t: "Waiting Time", d: "Vehicle waiting time is 15 minutes only. After that, Rs.120 per hour waiting charges apply." },
  { n: "5", t: "Trip Changes", d: "Route diversion, extra stop, additional pickup/drop or plan changes must be informed before booking. Trip plans cannot be changed during travel without office approval." },
  { n: "6", t: "Hill Stations", d: "Hill station trips may require Rs.300 to Rs.500 additional hill charges, and A/C will not be operated in hill areas as per rules." },
  { n: "7", t: "Luggage", d: "In Sedan vehicles, heavy luggage inside the vehicle, and in SUV vehicles, luggage carried on top carrier will attract Rs.300 additional luggage charges." },
  { n: "8", t: "Pets", d: "If bringing pets, please inform during booking. Pet charges of Rs.300 apply. Customers are responsible for pet safety, cleanliness and any vehicle damage charges." },
  { n: "9", t: "Driver Safety", d: "Driver will follow traffic rules and company safety regulations only." },
  { n: "10", t: "Support", d: "For booking changes, support or complaints, please contact the office directly. Avoid direct booking discussions with drivers." },
];

export function RouteTemplate({ 
  from, 
  to, 
  distance, 
  time, 
  sedanFare, 
  suvFare,
  calculatedKm,
  initialTrip,
}: { 
  from: string; 
  to: string; 
  distance: string; 
  time: string; 
  sedanFare: string; 
  suvFare: string; 
  calculatedKm?: number;
  initialTrip?: "one" | "round" | "package";
}) {
  const [tripType, setTripType] = useState<"one" | "round" | "package">(initialTrip || "one");
  const [selectedCab, setSelectedCab] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmed, setConfirmed] = useState<{ ref: string; estimatedFare: number } | null>(null);

  const { settings, vehicles, routes } = usePublicConfig();
  // Prefer the admin-managed distance for known routes, then the calculated one.
  const knownRoute = routes.find((r) => r.from.toLowerCase() === from.toLowerCase() && r.to.toLowerCase() === to.toLowerCase());
  const calcDist = knownRoute?.km || (calculatedKm && calculatedKm > 0 ? calculatedKm : settings.minKm);
  if (knownRoute) {
    distance = `${knownRoute.km} km`;
    if (knownRoute.hrs) time = knownRoute.hrs;
  }

  const cabs = vehicles
    .map((c) => {
      const fare = computeFare(c, tripType, calcDist, settings.minKm);
      const displayRate =
        tripType === "round" ? `₹${c.round}/km (Round Trip)` : tripType === "package" ? `₹${c.pkg} (10km / 1hr)` : `₹${c.oneway}/km (One Way)`;
      return {
        ...c,
        pass: `${c.passengers} passengers`,
        bag: `${c.bags} bags`,
        mostBooked: c.popular,
        rateStr: fare > 0 ? inr(fare) : "Contact Us",
        ratePerKm: displayRate,
        isAvailable: tripType !== "package" || c.pkg > 0,
      };
    })
    .filter((c) => c.isAvailable);
  const cab = cabs[selectedCab] ?? cabs[0];

  // ---- SEO data ----
  const pagePath = routePath(from, to);
  const oneWayFares = vehicles.map((v) => computeFare(v, "one", calcDist, settings.minKm)).filter((f) => f > 0);
  const lowestFare = oneWayFares.length ? inr(Math.min(...oneWayFares)) : "";
  const related = routes
    .filter((r) => !(r.from === from && r.to === to))
    .sort((a, b) => Number(b.from === from || b.to === to || b.from === to) - Number(a.from === from || a.to === to || a.from === to))
    .slice(0, 6);
  const faqItems = routeFaqs(from, to, calcDist, time, lowestFare);
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "One way drop taxi",
    name: `${from} to ${to} One Way Drop Taxi`,
    url: siteUrl() + pagePath,
    provider: { "@id": siteUrl() + "/#business", name: BRAND },
    areaServed: [{ "@type": "City", name: from }, { "@type": "City", name: to }],
    offers: oneWayFares.length
      ? { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: Math.min(...oneWayFares), highPrice: Math.max(...oneWayFares), offerCount: oneWayFares.length }
      : undefined,
  };

  const waMessage = `Hi, I'd like to book a drop taxi.
From: ${from}
To: ${to}
Vehicle: ${cab?.name}
Date: ${pickupDate || "Not mentioned"}
Time: ${pickupTime || "Not mentioned"}`;
  const waHref = waLink(settings.whatsapp, waMessage);

  const submitBooking = async () => {
    setFormError("");
    if (!name.trim()) return setFormError("Please enter your name.");
    if (phone.replace(/\D/g, "").length < 10) return setFormError("Please enter a valid 10-digit phone number.");
    if (settings.requireEmailOtp && !email.trim()) return setFormError("Please enter your email to verify the booking.");
    if (!pickupDate) return setFormError("Please choose a pickup date.");
    setSubmitting(true);
    try {
      const r = await api<{ otpRequired?: boolean; token?: string; booking?: { ref: string; estimatedFare: number } }>("/api/bookings", {
        body: { name, phone, email, from, to, tripType, date: pickupDate, time: pickupTime, vehicleId: cab?.id, distanceKm: calcDist },
      });
      if (r.otpRequired && r.token) setOtpToken(r.token);
      else if (r.booking) setConfirmed(r.booking);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    setFormError("");
    setSubmitting(true);
    try {
      const r = await api<{ booking: { ref: string; estimatedFare: number } }>("/api/bookings/verify", { body: { token: otpToken, code: otp.trim() } });
      setConfirmed(r.booking);
      setOtpToken(null);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const resendOtp = async () => {
    try {
      await api("/api/bookings/resend", { body: { token: otpToken } });
      setFormError("A new code has been sent to your email.");
    } catch (e) {
      setFormError((e as Error).message);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* HERO */}
      <section className="relative pt-24 pb-16 sm:pb-24 overflow-hidden bg-slate-900">
        <div className="absolute inset-x-0 bottom-0 top-0 opacity-40">
           {/* Fallback pattern in case hero image is missing */}
           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-10" />
           <img src="https://images.unsplash.com/photo-1596706788591-bb2fb0172e25?q=80&w=2670&auto=format&fit=crop" alt="" aria-hidden="true" fetchPriority="high" className="w-full h-full object-cover" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 z-20">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-8 lg:gap-16 items-start">
            
            {/* Left Hero */}
            <div className="min-w-0 pt-6 sm:pt-8">
              <div className="mb-4">
                <Breadcrumbs dark items={[["Home", "/"], ["Routes", "/routes"], [`${from} to ${to} Taxi`, pagePath]]} />
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3 leading-tight">
                {from} <span className="text-slate-400 font-normal">to</span> {to} <span className="block text-xl sm:text-2xl font-bold text-amber-400 mt-1">One Way Drop Taxi</span>
              </h1>
              <p className="mb-6 max-w-xl text-sm sm:text-base text-slate-300">
                {from} to {to} cab from <b className="text-white">{lowestFare}</b> · {distance} · {time}. Pay only one way, driver bata included, 24/7 support.
              </p>

              {/* Glass Route Card */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 flex flex-col md:flex-row items-center justify-between text-white shadow-2xl mb-12">
                <div className="text-center md:text-left flex-1 relative z-10">
                  <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase mb-1">From</p>
                  <p className="text-lg font-bold">{from}</p>
                </div>
                <div className="flex-1 text-center py-4 md:py-0 relative">
                  <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/20 -z-10 hidden md:block"></div>
                  <span className="inline-block bg-slate-800/80 rounded-full px-4 py-1 text-xs font-semibold">{distance} • {time}</span>
                </div>
                <div className="text-center md:text-right flex-1 relative z-10">
                  <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase mb-1">To</p>
                  <p className="text-lg font-bold">{to}</p>
                </div>
              </div>

              {/* Hero Vehicle Prices — click a vehicle to book it */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-extrabold text-slate-900">Choose a vehicle to book</p>
                  <div className="flex rounded-lg bg-slate-100 p-1 text-[11px] font-bold">
                    {([["one", "One Way"], ["round", "Round Trip"]] as const).map(([k, label]) => (
                      <button
                        key={k}
                        onClick={() => setTripType(k)}
                        className={`rounded-md px-3 py-1.5 transition-colors ${tripType === k ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
                  {cabs.map((c, idx) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCab(idx);
                        document.getElementById("book-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        setTimeout(() => document.getElementById("book-name")?.focus({ preventScroll: true }), 600);
                      }}
                      className={`group flex flex-col items-center rounded-xl border-2 p-3 text-center transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg ${
                        selectedCab === idx ? "border-blue-600 bg-blue-50/50" : "border-slate-200"
                      }`}
                    >
                      <img src={c.img} alt={`${c.name} taxi for ${from} to ${to}`} width={112} height={56} className="h-14 w-full object-contain transition-transform group-hover:scale-105" />
                      <p className="mt-2 text-sm font-extrabold leading-tight text-slate-900">{c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.pass} · {c.ratePerKm.replace(/ \(.*\)/, "")}</p>
                      <p className="mt-1 text-xl font-black text-blue-600">{c.rateStr}</p>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">incl. driver bata</p>
                      <span className="mt-2 w-full rounded-lg bg-slate-900 py-1.5 text-xs font-bold text-white group-hover:bg-blue-600">Book Now</span>
                    </button>
                  ))}
                </div>
                <p className="px-4 pb-3 text-[11px] text-slate-500">
                  {calcDist} km {tripType === "round" ? "each way" : ""} · Toll, parking & permit extra ·{" "}
                  <a href={waHref} target="_blank" rel="noreferrer" className="font-semibold text-green-600 hover:underline">Ask on WhatsApp</a>
                </p>
              </div>
            </div>

            {/* Right Hero Info */}
            <div className="hidden lg:block pt-8">
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">Route Information</p>
                <h3 className="text-xl font-extrabold text-navy mb-6">{from} to {to}</h3>
                
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Distance</p>
                    <p className="text-sm text-slate-600">The distance from {from} to {to} is {distance} approx.</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Alternative Route</p>
                    <p className="text-sm text-slate-600">Alternative routes may vary by traffic and road conditions. Your driver will choose the best available road in real-time.</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Travel Time</p>
                    <p className="text-sm text-slate-600">The average travel time by car from {from} to {to} is about {time} without heavy traffic.</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
                  <strong className="text-slate-700">Terms:</strong> Free cancellation before vehicle assignment; ₹300 after driver dispatch/arrival; toll/parking/night charges extra.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MAIN TWO COLUMN LAYOUT */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-10 sm:mt-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
        
        {/* LEFT COLUMN */}
        <div className="min-w-0 space-y-12">
          
          {/* Vehicles */}
          <section>
            <h2 className="text-[11px] font-bold tracking-widest text-blue-600 uppercase mb-3 flex items-center gap-2"><span className="text-slate-400">STEP 1</span> Choose Your Vehicle</h2>
            <div className="space-y-4">
              {cabs.map((cab, idx) => (
                <label key={idx} className={`block relative rounded-2xl border-2 p-5 cursor-pointer bg-white transition-all shadow-sm hover:border-blue-300 ${selectedCab === idx ? "border-blue-600 ring-4 ring-blue-50" : "border-slate-200"}`}>
                  <input type="radio" name="vehicle" className="absolute opacity-0" checked={selectedCab === idx} onChange={() => setSelectedCab(idx)} />
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <img src={cab.img} alt={`${cab.name} – ${from} to ${to} cab`} width={128} height={80} loading="lazy" className="w-32 object-contain" />
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                        <span className="font-extrabold text-lg text-slate-900">{cab.name}</span>
                        {cab.mostBooked && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Most Booked</span>}
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{cab.sub}</p>
                      <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 text-xs font-semibold text-slate-600">
                        <span>{cab.pass}</span>
                        <span>•</span>
                        <span>{cab.bag}</span>
                        <span>•</span>
                        <span>{cab.ratePerKm}</span>
                      </div>
                    </div>
                    <div className="text-center sm:text-right mt-4 sm:mt-0">
                      <p className="text-2xl font-black text-slate-900">{cab.rateStr}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Includes driver bata</p>
                    </div>
                    <div className={`hidden sm:flex size-6 rounded-full border-2 items-center justify-center ${selectedCab === idx ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"}`}>
                      {selectedCab === idx && <div className="size-2.5 bg-white rounded-full"></div>}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {/* PRICING BREAKDOWN ACCORDION - Optional placeholder */}
            <div className="mt-4 border rounded-2xl bg-white p-4">
               <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                 <span className="text-blue-600 uppercase text-[11px] tracking-wider">PRICING</span>
                 <span>Fare Breakdown - {cab?.name}</span>
               </div>
            </div>
          </section>

          {/* Booking Policy */}
          <section>
            <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 -m-8 opacity-10"><ShieldCheck className="size-48" /></div>
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-white/10 pb-6">
                 <div>
                   <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-2">Booking Policy</p>
                   <h2 className="text-2xl font-extrabold text-white">{from} to {to} Taxi – Terms & Conditions</h2>
                   <p className="text-sm text-slate-400 mt-2">Please review these points before confirming your ride so fare, route and travel details stay clear.</p>
                 </div>
                 <span className="bg-white/10 border border-white/20 text-white py-1.5 px-4 rounded-full text-xs font-bold whitespace-nowrap">
                   10 Key Points
                 </span>
               </div>
               
               <div className="relative z-10 grid sm:grid-cols-2 gap-4">
                 {terms.map((t, i) => (
                   <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 flex gap-4 items-start">
                     <span className="shrink-0 size-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center pt-px">{t.n}</span>
                     <div>
                       <p className="font-bold text-sm text-white mb-1.5">{t.t}</p>
                       <p className="text-[12px] text-slate-400 leading-relaxed">{t.d}</p>
                     </div>
                   </div>
                 ))}
                 
                 <div className="sm:col-span-2 bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 md:p-6 mt-2">
                   <p className="font-bold text-blue-300 mb-3">Important Note</p>
                   <p className="text-sm text-slate-300 mb-4 max-w-2xl">Please share complete travel details before booking to avoid last-minute issues and ensure smooth service.</p>
                   <div className="flex flex-wrap gap-4 text-xs font-bold text-white">
                     <span className="flex items-center gap-1.5"><div className="size-1.5 bg-blue-500 rounded-full"></div> Route, stops and luggage</span>
                     <span className="flex items-center gap-1.5"><div className="size-1.5 bg-blue-500 rounded-full"></div> Pets and hill station plans</span>
                     <span className="flex items-center gap-1.5"><div className="size-1.5 bg-blue-500 rounded-full"></div> Pickup date and time</span>
                   </div>
                 </div>
               </div>
            </div>
          </section>

          {/* Related Routes */}
          {related.length > 0 && (
            <section>
              <p className="text-[11px] font-bold tracking-widest text-blue-600 uppercase mb-2">Related Routes</p>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Other one-way taxi routes from {from} and {to}</h2>
              <p className="text-sm text-slate-500 mb-6">Popular drop taxi routes starting or ending near your trip.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to={routePath(r.from, r.to)}
                    className="group border border-slate-200 bg-white rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  >
                    <p className="font-bold text-sm text-slate-900 mb-3 group-hover:text-blue-600">
                      {r.from} → {r.to} Taxi
                    </p>
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                      <span>{r.km} km · {r.hrs}</span>
                      <span className="text-blue-600">{vehicles[0] ? inr(computeFare(vehicles[0], "one", r.km, settings.minKm)) : ""}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Route Guide */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200">
            <p className="text-[10px] font-bold tracking-widest text-blue-600 uppercase mb-2">Route Guide</p>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-4">{from} to {to} One-Way Drop Taxi</h2>
            <p className="text-sm text-slate-600 mb-8 leading-relaxed">
              Reliable {from} to {to} Drop Taxi for Airport, Corporate and Family Travel. Droptaxii.com provides affordable and comfortable drop taxi service with professional drivers, transparent pricing, and 24/7 booking support for airport drops, corporate travel, hospital visits, college travel, and overnight highway trips.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Approx Distance</p>
                <p className="font-black text-slate-900">{distance}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Estimated Travel Time</p>
                <p className="font-black text-slate-900">{time}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Fastest Route</p>
                <p className="font-black text-slate-900 mt-0.5 text-sm leading-tight">{from} &rarr; {to}</p>
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-4">{from} to {to} Taxi Fare</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-5 py-4 font-bold rounded-tl-xl text-left">Vehicle Type</th>
                    <th className="px-5 py-4 font-bold text-left">Seats</th>
                    <th className="px-5 py-4 font-bold text-left">Rate</th>
                    <th className="px-5 py-4 font-bold rounded-tr-xl text-left">One-Way Fare</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-900">{c.name}</td>
                      <td className="px-5 py-4 text-slate-600">{c.passengers}</td>
                      <td className="px-5 py-4 text-slate-600">₹{c.oneway}/km + ₹{c.bata} bata</td>
                      <td className="px-5 py-4 font-bold text-blue-600">{inr(computeFare(c, "one", calcDist, settings.minKm))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Route FAQs */}
          <section>
            <p className="text-[11px] font-bold tracking-widest text-blue-600 uppercase mb-2">FAQs</p>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-4">{from} to {to} Taxi – Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqItems.map((f) => (
                <details key={f.q} className="group rounded-xl border border-slate-200 bg-white p-4 open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-bold text-slate-900">
                    <h3 className="text-sm sm:text-base">{f.q}</h3>
                    <span className="text-blue-600 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>
            <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
            <JsonLd data={serviceLd} />
          </section>

        </div>

        {/* RIGHT COLUMN (STICKY) */}
        <div id="book-form" className="lg:sticky lg:top-24 scroll-mt-24">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-8 text-white relative">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">STEP 2</p>
              <h3 className="text-2xl font-extrabold mb-1">Book Your Ride</h3>
              <p className="text-sm text-slate-300">{from} &rarr; {to} · {cab?.name}</p>
              <span className="absolute bottom-[-14px] left-6 bg-blue-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded text-white shadow-sm">One Way</span>
            </div>
            
            {/* Form */}
            <div className="p-6 pt-10">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">Full Name</label>
                  <input id="book-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">Phone Number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">Email {settings.requireEmailOtp ? "(we'll send a verification code)" : "(optional)"}</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                   <div>
                     <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">From</label>
                     <input type="text" readOnly value={from} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 bg-slate-50" />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">To</label>
                     <input type="text" readOnly value={to} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 bg-slate-50" />
                   </div>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">Trip Type</label>
                  <div className="flex gap-2">
                    <button onClick={() => setTripType("one")} className={`flex-1 rounded-xl py-2.5 text-[11px] font-bold border transition-colors ${tripType === "one" ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-600"}`}>One Way</button>
                    <button onClick={() => setTripType("round")} className={`flex-1 rounded-xl py-2.5 text-[11px] font-bold border transition-colors ${tripType === "round" ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-600"}`}>Round Trip</button>
                    <button onClick={() => setTripType("package")} className={`flex-1 rounded-xl py-2.5 text-[11px] font-bold border transition-colors ${tripType === "package" ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-600"}`}>Packages</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                   <div>
                     <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">Pickup Date</label>
                     <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-900" />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">Pickup Time</label>
                     <input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-900" />
                   </div>
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="mt-8 border border-blue-200 border-dashed rounded-xl p-4 bg-blue-50/50 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">Estimated Total</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Excl. toll & night charges</p>
                </div>
                <p className="text-2xl font-black text-slate-900">{cab?.rateStr}</p>
              </div>

              {/* Actions */}
              <div className="space-y-3 mt-6">
                {confirmed ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                    <CheckCircle2 className="mx-auto mb-2 size-10 text-green-600" />
                    <p className="text-lg font-extrabold text-slate-900">Booking received!</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Booking ID <b>{confirmed.ref}</b>. Our team will call you shortly to confirm.
                      {email && " A confirmation has been sent to your email."}
                    </p>
                  </div>
                ) : otpToken ? (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                    <p className="text-sm font-bold text-slate-900">Enter the 6-digit code sent to {email}</p>
                    <input
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••••"
                      className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-blue-500"
                    />
                    <button onClick={verifyOtp} disabled={submitting || otp.length !== 6} className="mt-3 w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60">
                      {submitting && <Loader2 className="size-4 animate-spin" />} Verify & Confirm Booking
                    </button>
                    <div className="mt-2 flex justify-between text-xs font-semibold">
                      <button onClick={resendOtp} className="text-blue-600 hover:underline">Resend code</button>
                      <button onClick={() => { setOtpToken(null); setOtp(""); }} className="text-slate-500 hover:underline">Change details</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={submitBooking} disabled={submitting || !settings.acceptingBookings} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 shadow-md disabled:opacity-60">
                    {submitting ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />} {settings.acceptingBookings ? "Confirm Booking" : "Online booking paused — please call"}
                  </button>
                )}
                {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{formError}</p>}
                <a href={waHref} target="_blank" rel="noreferrer" className="w-full bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 shadow-md shadow-green-600/20">
                  <span className="size-5"><MessageCircle /></span> Book on WhatsApp
                </a>
                <a href={`tel:${settings.phone}`} className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 hover:text-slate-900">
                  <span className="size-4"><Phone /></span> Call {settings.phone.replace(/^\+91/, "")}
                </a>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500">
                <ShieldCheck className="size-3" /> Your details are safe and secure
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
