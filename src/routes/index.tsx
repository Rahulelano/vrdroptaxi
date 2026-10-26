import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { computeFare, inr, usePublicConfig, waLink, type PublicConfig } from "@/lib/api";
import { BRAND, faqLd, seo } from "@/lib/seo";
import { faqs, terms } from "@/lib/content";
import { JsonLd } from "@/components/Seo";
import { useState, useRef } from "react";
import {
  Phone,
  MessageCircle,
  ArrowLeftRight,
  IndianRupee,
  Clock,
  MapPin,
  Calendar,
  Search,
  ShieldCheck,
  BadgeCheck,
  Headphones,
  Navigation,
  Star,
  Menu,
  X,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroCar from "@/assets/hero-car.jpg";
import step1Img from "@/assets/step1_lock_route.png";
import step2Img from "@/assets/step2_confirm_agent.png";
import step3Img from "@/assets/step3_enjoy_journey.png";

const PHONE = "+919843600457";
const WA = "919843600457";
const wa = (text: string) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

export const Route = createFileRoute("/")({
  head: () =>
    seo({
      title: `One Way Drop Taxi in Tamil Nadu from ₹15/km – 24x7 Booking | ${BRAND}`,
      description:
        "One way drop taxi from Chennai, Coimbatore, Madurai & more to anywhere in South India. Sedan ₹15/km, SUV & Innova ₹20/km. Pay only one way, 24/7.",
      path: "/",
    }),
  component: Index,
});

// Vehicles, prices and routes are managed in the admin panel (/admin).
function buildCabs(cfg: PublicConfig) {
  return cfg.vehicles.map((v) => ({
    id: v.id,
    name: v.name,
    sub: `(${v.sub})`,
    img: v.img,
    rate: `₹${v.oneway}/km`,
    oneway: v.oneway,
    round: v.round,
    bata: v.bata,
    pkg: v.pkg,
    features: v.features,
    cta: `Book ${v.name} on WhatsApp`,
    popular: v.popular,
  }));
}

function buildRoutes(cfg: PublicConfig) {
  const [v1, v2] = cfg.vehicles;
  return cfg.routes.map((r) => ({
    from: r.from,
    to: r.to,
    hrs: r.hrs,
    km: `${r.km} km`,
    kmNum: r.km,
    featured: r.featured,
    sedanLabel: v1 ? `${v1.name.split(" ")[0]} · ₹${v1.oneway}/km` : "",
    suvLabel: v2 ? `${v2.name.split(" ")[0]} · ₹${v2.oneway}/km` : "",
    sedan: v1 ? inr(computeFare(v1, "one", r.km, cfg.settings.minKm)) : "",
    suv: v2 ? inr(computeFare(v2, "one", r.km, cfg.settings.minKm)) : "",
    note: r.note,
    img: r.img || "/destinations/coimbatore.png",
  }));
}

const whyUs = [
  {
    icon: BadgeCheck,
    title: "No Hidden Charges",
    body: "The price you see is what you pay. We itemize every component - base fare, driver allowance, toll - so there are zero surprises at the end of your journey.",
  },
  {
    icon: Clock,
    title: "Always On Time",
    body: "Our drivers plan routes meticulously, accounting for traffic and toll timings. Whether it is a 5 AM airport pickup or a late-night drop, we arrive when we promise.",
  },
  {
    icon: Navigation,
    title: "GPS-Enabled Fleet",
    body: "Every vehicle in our fleet is GPS-tracked in real time. Loved ones can monitor your journey, and our dispatch team can coordinate instantly if you need support.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    body: "Our customer support team is available around the clock via phone and WhatsApp. Booking changes, live tracking, or simply a question - we are always a call away.",
  },
];

const reviews = [
  {
    text: "Very good service. Traveled yesterday from Madurai to Chennai. Driver is polite and courteous. Due to flooding diversions from Ulundurpet via Tiruvannamalai, the driver Mr. Senthil was able to manage the situation and safely reached the destination. The fare is affordable. Safe for even women passengers traveling alone.",
    name: "Venkatakrishnan Swaminathan",
    meta: "4 reviews · a year ago",
  },
  {
    text: "We contacted Tamilselvan, he arranged us driver Senthil and then we travelled Madurai to Coimbatore and Coimbatore to Chennai. Senthil drove good and calm, we enjoyed our journey. Thank you 👍",
    name: "Vijay M",
    meta: "2 reviews · 10 months ago",
  },
  {
    text: "Good service. Drivers were very polite, decent with punctuality. I used more than 8 times. Economical too. Best wishes to Drop Taxi, Coimbatore.",
    name: "jsk ganesh",
    meta: "Local Guide · 14 reviews · a year ago",
  },
  {
    text: "Strongly recommend Drop Taxi. I would like to thank Drop Taxi for their wonderful service. We had our drop recently from Madurai to Chennai. What a peace of mind! Booked directly and the driver was professional and courteous.",
    name: "Anand Velusamy",
    meta: "8 reviews · 2 years ago",
  },
  {
    text: "Great service. Highly recommended. Professional drivers and well-maintained vehicles.",
    name: "Tarun Pareek",
    meta: "Local Guide · 22 reviews · 6 months ago",
  },
  {
    text: "Good experience this time as well as like most of the previous times. Driver Antony was kind and great to understand the instructions given by us to drive cautious and slowly as we had a 1 year baby along with parents and grandparents. Thanks for the service.",
    name: "vigneshwar R",
    meta: "9 reviews · 2 years ago",
  },
];

function Header() {
  const [open, setOpen] = useState(false);
  const { settings } = usePublicConfig();
  const links = [
    ["Routes", "#routes"],
    ["Fares", "#fares"],
    ["Why Us", "#why-us"],
    ["FAQ", "#faq"],
    ["Terms", "#terms"],
  ];
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="#top" className="flex items-center transition-transform hover:scale-[1.02]">
          <img src={settings.logo || "/logo.png"} alt={settings.businessName || "Droptaxi"} className="h-12 sm:h-16 w-auto object-contain drop-shadow" />
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-sm font-medium text-navy-foreground/85 transition-colors hover:text-gold"
            >
              {label}
            </a>
          ))}

        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${PHONE}`}
            className="hidden items-center gap-2 rounded-lg bg-background px-4 py-2.5 text-sm font-semibold text-navy shadow-card transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            <Phone className="size-4" /> Call Now
          </a>
          <a
            href={wa(
              "Hi, I'd like to book a drop taxi from Chennai. Can you help me?",
            )}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-whatsapp px-4 py-2.5 text-sm font-semibold text-whatsapp-foreground transition-transform hover:-translate-y-0.5"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="rounded-lg border border-navy-foreground/20 p-2 text-navy-foreground lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="mx-4 rounded-xl bg-navy-deep/95 p-4 backdrop-blur lg:hidden">
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-navy-foreground/85"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

function BookingForm() {
  const cfg = usePublicConfig();
  const cabs = buildCabs(cfg);
  const routes = buildRoutes(cfg);
  const wa = (text: string) => waLink(cfg.settings.whatsapp, text);
  const [trip, setTrip] = useState<"one" | "round" | "package">("one");
  const [from, setFrom] = useState(cfg.settings.homeOrigin || "Chennai");
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const fromTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFrom(val);
    setShowFares(false);
    
    if (val.trim().length < 2) {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
      return;
    }

    if (fromTimerRef.current) clearTimeout(fromTimerRef.current);
    
    fromTimerRef.current = setTimeout(async () => {
      try {
        const apiKey = "BfDEtwIRzQhFseQu7SGE";
        const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(val)}.json?key=${apiKey}&bbox=76.15,8.08,80.35,13.56&limit=5`);
        const data = await res.json();
        if (data && data.features) {
          const places = data.features.map((f: any) => f.place_name || f.text).filter(Boolean);
          setFromSuggestions(places);
          setShowFromSuggestions(true);
        }
      } catch (e) {}
    }, 400);
  };

  const [showFares, setShowFares] = useState(false);
  const [calculatedKm, setCalculatedKm] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTo(val);
    setShowFares(false);
    
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (timer) clearTimeout(timer);
    
    setTimer(setTimeout(async () => {
      try {
        const apiKey = "BfDEtwIRzQhFseQu7SGE";
        const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(val)}.json?key=${apiKey}&bbox=76.15,8.08,80.35,13.56&limit=5`);
        const data = await res.json();
        if (data && data.features) {
          const places = data.features.map((f: any) => f.place_name || f.text).filter(Boolean);
          setSuggestions(places);
          setShowSuggestions(true);
        }
      } catch (e) {}
    }, 400));
  };

  const message = `Hi, I'd like to book a ${trip === "one" ? "one-way" : trip === "round" ? "round trip" : "package"} drop taxi.
From: ${from || "Chennai"}
${trip === "package" ? `Package/Destination: ${to || "-"}` : `To: ${to || "-"}`}
Trip type: ${trip === "one" ? "One Way" : trip === "round" ? "Round Trip" : "Package"}
Pickup date: ${date || "-"}
Pickup time: ${time || "-"}`;

  const navigate = useNavigate();

  const finalizeBooking = (calculatedDist: number) => {
    
    setIsCalculating(false);
    setShowFares(false);
    
    const fromSlug = (from || "chennai").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const toSlug = (to || "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    navigate({
      to: `/${fromSlug}/${fromSlug}-to-${toSlug}-one-way-drop-taxi`,
      search: { distance: calculatedDist, trip: trip }
    });
  };

  const handleBookTaxi = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!to || !from) {
      alert("Please enter both pickup and destination locations.");
      return;
    }
    
    setIsCalculating(true);
    
    const fromName = from.trim() || cfg.settings.homeOrigin;
    const foundRoute = routes.find(r => r.from.toLowerCase() === fromName.toLowerCase() && r.to.toLowerCase() === to.toLowerCase().trim());
    let km = 130;
    
    if (foundRoute) {
      km = foundRoute.kmNum || cfg.settings.minKm;
      finalizeBooking(km);
    } else {
      try {
        const apiKey = "BfDEtwIRzQhFseQu7SGE";
        
        // 1. Get Origin & Destination Coordinates via MapTiler Geocoding
        const [originRes, destRes] = await Promise.all([
           fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(from)}.json?key=${apiKey}`),
           fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(to)}.json?key=${apiKey}`)
        ]);
        const originData = await originRes.json();
        const destData = await destRes.json();
        
        if (originData?.features?.length > 0 && destData?.features?.length > 0) {
          const [originLon, originLat] = originData.features[0].geometry.coordinates;
          const [destLon, destLat] = destData.features[0].geometry.coordinates;
          
          // 2. Get Driving Distance via OSRM Public Routing
          const routeRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=false`);
          const routeData = await routeRes.json();
          
          if (routeData?.routes?.length > 0) {
            km = Math.ceil(routeData.routes[0].distance / 1000);
          } else {
            km = 100 + (to.length * 13);
          }
        } else {
          km = 100 + (to.length * 13);
        }
      } catch (err) {
        console.error("Distance Calculation Error:", err);
        km = 100 + (to.length * 13);
      }
      finalizeBooking(km);
    }
  };

  return (
    <div className="relative rounded-3xl bg-background shadow-card transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
      <div className="flex relative">
        {(
          [
            ["one", "One Way"],
            ["round", "Round Trip"],
            ["package", "Packages"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTrip(key);
              setShowFares(false);
            }}
            className={`flex-1 px-2 sm:px-6 py-3 sm:py-4 text-[12px] sm:text-sm font-bold transition-all duration-300 rounded-t-2xl sm:rounded-t-3xl ${
              trip === key
                ? "bg-primary text-primary-foreground shadow-md z-10"
                : "bg-secondary text-muted-foreground hover:bg-slate-100 hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
        <Field icon={MapPin} label="From">
          <div className="relative w-full">
            <input
              value={from}
              onChange={handleFromChange}
              onFocus={() => { if (fromSuggestions.length > 0) setShowFromSuggestions(true); }}
              onBlur={() => setShowFromSuggestions(false)}
              placeholder="Enter Pickup Location"
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground"
            />
            {showFromSuggestions && fromSuggestions.length > 0 && (
              <ul className="absolute left-0 top-full mt-3 min-w-[200px] w-full max-h-48 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-2xl z-[9999] divide-y divide-slate-100">
                {fromSuggestions.map((s, idx) => (
                  <li 
                    key={idx} 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setFrom(s.split(',')[0] || "");
                      setFromSuggestions([]);
                      setShowFromSuggestions(false);
                    }}
                    className="px-4 py-2 text-[13px] text-slate-700 hover:bg-gold/10 hover:text-navy cursor-pointer transition-colors block leading-tight"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>
        <Field icon={MapPin} label={trip === "package" ? "Package / Destination" : "To"}>
          <div className="relative w-full">
            <input
              value={to}
              onChange={handleToChange}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              onBlur={() => setShowSuggestions(false)}
              placeholder={trip === "package" ? "Enter Package (e.g. Tirupati)" : "Enter Destination"}
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute left-0 top-full mt-3 min-w-[200px] w-full max-h-48 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-2xl z-[9999] divide-y divide-slate-100">
                {suggestions.map((s, idx) => (
                  <li 
                    key={idx} 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setTo(s.split(',')[0] || "");
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    className="px-4 py-2 text-[13px] text-slate-700 hover:bg-gold/10 hover:text-navy cursor-pointer transition-colors block leading-tight"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>
        <Field icon={Calendar} label="Pickup Date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold outline-none"
          />
        </Field>
        <Field icon={Clock} label="Pickup Time">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold outline-none"
          />
        </Field>
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-5 py-5 sm:flex-row">
        <button
          onClick={handleBookTaxi}
          disabled={isCalculating}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy px-6 py-4 text-sm font-bold text-navy-foreground transition-all duration-300 ${!isCalculating ? 'hover:-translate-y-1 hover:shadow-lg hover:bg-navy-deep active:scale-95' : 'opacity-75 cursor-not-allowed'}`}
        >
          <Search className="size-5" /> {isCalculating ? "Calculating Distance..." : "Book Taxi"}
        </button>
        <a
          href={wa(message)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-whatsapp px-6 py-4 text-sm font-bold text-whatsapp-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:brightness-110 active:scale-95"
        >
          <MessageCircle className="size-5" /> Chat on WhatsApp
        </a>
      </div>

      {showFares && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 border-t border-border px-5 py-6 bg-slate-50/50">
          <div className="flex flex-col items-center mb-6">
            <h4 className="font-extrabold text-2xl text-navy text-center mb-1">Available Vehicles</h4>
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
               <span>Chennai</span>
               <span className="text-primary">→</span>
               <span>{to}</span>
               <span className="mx-2">•</span>
               <span className="text-navy">{calculatedKm} km</span>
            </div>
            {!routes.find(r => r.to.toLowerCase() === to.toLowerCase().trim()) && (
              <p className="text-[11px] text-amber-600 mt-2 font-medium bg-amber-50 px-3 py-1 rounded-md border border-amber-100">
                * Distance is estimated. Final fare may vary.
              </p>
            )}
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cabs.map(cab => {
               let rateNum = cab.oneway;
               let bata = cab.bata;
               let displayRate = `₹${cab.oneway}/km (One Way)`;
               let estimatedPrice = 0;
               let pkgFound = true;
               
               if (trip === "round") {
                 rateNum = cab.round;
                 displayRate = `₹${cab.round}/km (Round Trip)`;
                 estimatedPrice = (rateNum * calculatedKm) + bata;
               } else if (trip === "package") {
                 if (cab.pkg > 0) {
                   displayRate = `₹${cab.pkg} (10km/1hr)`;
                   estimatedPrice = cab.pkg;
                   bata = 0;
                 } else {
                   pkgFound = false;
                 }
               } else { 
                 estimatedPrice = (rateNum * calculatedKm) + bata;
               }
               
               if (!pkgFound) return null;
               
               const estimatedPriceTxt = estimatedPrice > 0 ? `₹${estimatedPrice.toLocaleString()}` : "Contact Us";
               const bataInfo = bata > 0 ? ` (incl. bata)` : '';
               const vehicleMessage = message + `\n\nVehicle Selected: ${cab.name}\nEstimated Fare: ${estimatedPriceTxt}${bataInfo}`;
               
               return (
                 <div key={cab.name} className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-gold/40 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                       {cab.features[0] && <span className="bg-primary/10 text-primary text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">{cab.features[0]}</span>}
                    </div>
                    <img src={cab.img} alt={cab.name} className="h-20 object-contain mb-3 mt-4 transition-transform duration-500 group-hover:scale-110" />
                    <p className="font-extrabold text-navy">{cab.name}</p>
                    <p className="text-xs text-muted-foreground mb-3">{displayRate}{bata > 0 ? ` + ₹${bata} Bata` : ''}</p>
                    <div className="mt-auto pt-3 border-t border-slate-100 w-full">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Estimated Total</p>
                      <p className="text-2xl font-black text-primary mb-3">{estimatedPriceTxt}</p>
                      <a href={wa(vehicleMessage)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full text-sm bg-navy text-white py-2.5 rounded-xl font-bold hover:bg-navy-deep transition-colors">
                        Book Now
                      </a>
                    </div>
                 </div>
               )
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="group flex items-center gap-3 rounded-xl border border-border px-3 py-3 transition-all duration-300 hover:border-gold/40 hover:shadow-md focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/30">
      <Icon className="size-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium text-muted-foreground">{label}</span>
        {children}
      </span>
    </label>
  );
}

function Index() {
  const cfg = usePublicConfig();
  const cabs = buildCabs(cfg);
  const routes = buildRoutes(cfg);
  const wa = (text: string) => waLink(cfg.settings.whatsapp, text);
  const navigate = useNavigate();
  const featured = routes.filter((r) => r.featured);
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  const displayedRoutes = showAllRoutes ? routes : (featured.length ? featured : routes).slice(0, 10);

  return (
    <div id="top" className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative isolate bg-hero-gradient pt-28 pb-40 sm:pt-32">
        <img
          src={heroCar}
          alt="Drop taxi sedan on a Tamil Nadu highway at dusk"
          width={1400}
          height={1000}
          className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover opacity-35 lg:w-3/5 lg:opacity-60 lg:[mask-image:linear-gradient(to_right,transparent,black_45%)]"
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs font-bold tracking-[0.3em] text-gold uppercase">Since 2015</p>
          <h1 className="mt-4 max-w-2xl text-[2.1rem] sm:text-4xl font-extrabold leading-[1.05] tracking-tight text-navy-foreground sm:text-6xl">
            Why Pay two-way fare for a One-way Trip?
          </h1>
          <p className="mt-5 max-w-xl text-lg font-medium text-gold">
            Affordable one-way taxi services from Chennai to anywhere in Tamil Nadu and South
            India.
          </p>
        </div>
      </section>

      {/* BOOKING FORM */}
      <div className="relative z-10 mx-auto -mt-32 max-w-7xl px-4 sm:px-6">
        <BookingForm />
      </div>

      {/* PRICING */}
      <section id="fares" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
            Transparent Pricing
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-5xl">
            One-Way Taxi Pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pay only for the distance you travel. No return fare.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-semibold text-navy">
            {[
              [ShieldCheck, "No Hidden Charges"],
              [Clock, "On-Time Pickup"],
              [BadgeCheck, "Professional Drivers"],
              [Headphones, "24/7 Customer Support"],
            ].map(([Icon, label], i) => {
              const I = Icon as React.ElementType;
              return (
                <span key={i} className="inline-flex items-center gap-2">
                  <I className="size-4 text-primary" /> {label as string}
                </span>
              );
            })}
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cabs.map((cab) => (
              <div
                key={cab.name}
                className={`group relative flex flex-col rounded-3xl border bg-card p-6 text-left shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                  cab.popular ? "border-gold ring-2 ring-gold/40" : "border-border hover:border-gold/30"
                }`}
              >
                {cab.popular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-1 text-[11px] font-bold text-accent-foreground z-10">
                    ★ Most Popular
                  </span>
                )}
                <h3 className="text-xl font-extrabold text-navy">{cab.name}</h3>
                <p className="text-xs text-muted-foreground">{cab.sub}</p>
                <div className="overflow-hidden">
                  <img
                    src={cab.img}
                    alt={cab.name}
                    loading="lazy"
                    width={900}
                    height={600}
                    className="my-4 h-40 w-full object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground mt-auto">Starting From</p>
                <p className="text-4xl font-extrabold text-primary">{cab.rate}</p>
                <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                  {cab.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-whatsapp" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground">
                  Driver Bata: ₹{cab.bata} Extra · Min. 130 km/day
                </div>
                <a
                  href={wa(
                    `Hi, I'd like to book a ${cab.name} taxi from Chennai.\n\nVehicle: ${cab.name} ${cab.sub}\nRate: ${cab.rate}\n\nPlease share fare and availability.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-whatsapp px-5 py-3 text-sm font-bold text-whatsapp-foreground transition-transform hover:-translate-y-0.5"
                >
                  <MessageCircle className="size-4" /> {cab.cta}
                </a>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            Toll, parking, and state permit charges are extra &amp; paid at actuals
          </p>
        </div>
      </section>

      {/* MASSIVE ABOUT & PREMIUM FLEET SHOWCASE */}
      <section className="bg-white py-24 sm:py-32 overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-2 items-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500 rounded-3xl transform rotate-3 scale-105 opacity-20 group-hover:rotate-6 group-hover:scale-110 transition-all duration-700"></div>
            <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop" alt="Droptaxii premium outstation taxi" loading="lazy" className="relative rounded-3xl shadow-2xl object-cover w-full h-[300px] sm:h-[500px] transition-transform duration-700 group-hover:-translate-y-4 group-hover:scale-[1.02]" />
            <div className="absolute -bottom-6 -right-6 bg-amber-500 text-white p-6 rounded-2xl shadow-xl animate-[bounce_3s_infinite]">
               <p className="text-4xl font-extrabold">8+</p>
               <p className="font-semibold text-sm">Years of Trust</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-blue-600 uppercase mb-3">
              Premium South Indian Drop Taxi
            </p>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
              More than just a ride. An experience in <span className="text-amber-500">perfection.</span>
            </h2>
            <div className="mt-8 space-y-6 text-lg text-slate-600 leading-relaxed">
              <p>
                At Droptaxii, we guarantee exceptional reliability for your inter-city travel needs. Since 2015, we have connected Chennai with Coimbatore, Bangalore, Madurai, Salem, and beyond using only the highest qualities of safety and comfort.
              </p>
              <p>
                Whether you need a late-night airport transfer, a comfortable SUV for your family vacation, or a dependable ride for corporate travel to a neighboring city—our impeccably maintained vehicles and strictly vetted drivers ensure you get there seamlessly. You only pay for the distance traveled.
              </p>
            </div>
            
            <div className="mt-10 grid grid-cols-2 gap-6">
              {[
                { n: "50,000+", t: "Trips Completed", d: "Serving 40+ Cities safely by car" },
                { n: "4.8/5", t: "Customer Rating", d: "Consistently highly reviewed" },
                { n: "100%", t: "Fixed Fares", d: "No hidden charges whatsoever" },
                { n: "24/7", t: "Support Line", d: "Instantly chat with real humans" },
              ].map(({n, t, d}) => (
                <div key={t} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default">
                  <p className="text-3xl font-extrabold text-blue-600 mb-1">{n}</p>
                  <p className="font-bold text-slate-900">{t}</p>
                  <p className="text-xs text-slate-500 mt-1">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HOW IT WORKS / IMAGE GRID WITH ANIMATIONS */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-32">
          <div className="text-center md:max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 transform transition hover:scale-105 duration-300">Booking Your Ride is Seamless</h2>
            <p className="text-lg text-slate-600">Enjoy absolute convenience right from your phone. Our seamless process is optimized to make scheduling your journey completely stress-free with zero upfront commitments.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { img: step1Img, step: "1. Lock in the Route", desc: "Select your pickup city, drop off destination, and choose one of our transparently-priced premium Cars that fits your party and luggage." },
              { img: step2Img, step: "2. Confirm via Agent", desc: "Connect instantly with our dispatch team on WhatsApp. Receive your final comprehensive itinerary and a completely fixed price. No surprises." },
              { img: step3Img, step: "3. Enjoy the Journey", desc: "Your experienced driver arrives flawlessly on time. Sit back in air-conditioned comfort, track your live journey, and relax all the way." }
            ].map((col, idx) => (
              <div key={col.step} className="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-slate-900/10 transition-all duration-500 z-10" />
                <img src={col.img} alt={col.step} loading="lazy" className="w-full h-80 object-cover transform transition-transform duration-[2000ms] group-hover:scale-110 group-hover:-rotate-1" />
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-white text-2xl font-black mb-3">{col.step}</h3>
                  <p className="text-amber-200 text-sm font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">{col.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROUTES */}
      <section id="routes" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
              Popular Routes
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-5xl">
              Popular One Way Drop Taxi Routes
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Trusted by thousands of travelers across Tamil Nadu and South India - door-to-door, no
              detours.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedRoutes.map((r) => (
              <div
                key={`${r.from}-${r.to}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-gold/30"
              >
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-all duration-500 z-10" />
                  <img src={r.img} alt={`${r.from} to ${r.to} drop taxi`} loading="lazy" width={600} height={192} className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-110 group-hover:-rotate-1" />
                </div>
                <div className="flex flex-col p-5 flex-grow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{r.from} to</p>
                      <h3 className="text-2xl font-extrabold text-navy">{r.to}</h3>
                    </div>
                    <div className="text-right text-xs font-semibold text-muted-foreground">
                      <p>{r.hrs}</p>
                      <p>{r.km}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-secondary p-3">
                      <p className="text-xs font-semibold text-muted-foreground">{r.sedanLabel}</p>
                      <p className="text-lg font-extrabold text-navy">{r.sedan}</p>
                    </div>
                    <div className="rounded-xl bg-secondary p-3">
                      <p className="text-xs font-semibold text-muted-foreground">{r.suvLabel}</p>
                      <p className="text-lg font-extrabold text-navy">{r.suv}</p>
                    </div>
                  </div>
                  <p className="mt-3 flex-grow text-[11px] text-muted-foreground">
                    Incl. driver bata · Toll &amp; night charges extra
                    {r.note ? ` · ${r.note}` : ""}
                  </p>
                  <button
                    onClick={() => {
                      const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                      void navigate({
                        to: `/${slug(r.from)}/${slug(r.from)}-to-${slug(r.to)}-one-way-drop-taxi`,
                        search: { distance: r.kmNum, trip: "one" },
                      });
                    }}
                    className="mt-4 inline-flex items-center justify-center rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-navy-foreground transition-transform hover:-translate-y-0.5"
                  >
                    Book Now →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!showAllRoutes && routes.length > displayedRoutes.length && (
            <div className="mt-12 text-center">
              <button 
                onClick={() => setShowAllRoutes(true)}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5"
              >
                View All Destinations
              </button>
            </div>
          )}
          {showAllRoutes && (
            <div className="mt-12 text-center">
              <button 
                onClick={() => setShowAllRoutes(false)}
                className="inline-flex items-center justify-center rounded-lg bg-secondary border border-border px-8 py-3.5 text-sm font-bold text-navy shadow-sm transition-transform hover:-translate-y-0.5"
              >
                Hide Destinations
              </button>
            </div>
          )}
        </div>
      </section>

      {/* WHY US */}
      <section id="why-us" className="bg-secondary py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              Why Choose Droptaxii?
            </h2>
            <p className="mt-3 text-muted-foreground">
              We make your one-way travel safe, simple and affordable.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["4.6", "Customer Satisfaction"],
              ["100% Verified", "Safety Rating"],
              ["5,000+", "Happy Customers"],
              ["500+", "Destinations"],
            ].map(([n, t]) => (
              <div key={t} className="rounded-3xl bg-card p-5 text-center shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border border-transparent hover:border-gold/30 cursor-default">
                <p className="text-2xl font-extrabold text-primary">{n}</p>
                <p className="mt-1 text-sm font-semibold text-navy">{t}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {whyUs.map((w) => (
              <div key={w.title} className="group rounded-3xl bg-card p-6 shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-xl border border-transparent hover:border-primary/20">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform duration-500 group-hover:scale-110 group-hover:bg-primary/20 group-hover:-rotate-3">
                  <w.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-extrabold text-navy">{w.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>





      {/* FAQ */}
      <section id="faq" className="bg-secondary py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
              Frequently Asked Questions
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              Got Questions?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to know before booking your drop taxi from Chennai.
            </p>
          </div>
          <JsonLd data={faqLd(faqs)} />
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map((f) => (
              <AccordionItem
                key={f.q}
                value={f.q}
                className="mb-3 rounded-xl border border-border bg-card px-5"
              >
                <AccordionTrigger className="text-left font-bold text-navy">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              Read reviews, ride with confidence.
            </h2>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="text-2xl font-extrabold text-navy">4.6/5</span>
              <span className="flex text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </span>
              <span className="text-muted-foreground">Google · Based on 419 reviews</span>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.name} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <span className="flex text-gold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </span>
                <blockquote className="mt-3 text-sm text-foreground/80">{r.text}</blockquote>
                <figcaption className="mt-4">
                  <span className="block font-bold text-navy">{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.meta}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* TERMS */}
      <section id="terms" className="bg-secondary py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            Terms &amp; Conditions
          </h2>
          <ol className="mt-8 space-y-3">
            {terms.map(([t, d], i) => (
              <li key={t} className="flex gap-4 rounded-xl bg-card p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <p className="text-sm">
                  <span className="font-bold text-navy">{t}</span>{" "}
                  <span className="text-muted-foreground">{d}</span>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

    </div>
  );
}
