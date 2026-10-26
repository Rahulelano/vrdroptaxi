import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Clock, IndianRupee, Headphones, Phone, MessageCircle, MapPin } from "lucide-react";
import { InfoPage, Prose } from "@/components/InfoPage";
import { usePublicConfig, waLink } from "@/lib/api";
import { ADDRESS, BRAND, PHONE_DISPLAY, seo } from "@/lib/seo";

export const Route = createFileRoute("/about-us")({
  head: () =>
    seo({
      title: `About Us – Trusted One Way Drop Taxi Since 2015 | ${BRAND}`,
      description: `${BRAND} has run one way drop taxi and outstation cab services across Tamil Nadu since 2015. 50,000+ trips, verified drivers, transparent per-km fares, 24/7 support.`,
      path: "/about-us",
    }),
  component: Page,
});

function Page() {
  const { settings } = usePublicConfig();
  return (
    <InfoPage title="About Us" intro="Affordable, safe and on-time one-way drop taxi service across Tamil Nadu and South India since 2015.">
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["2015", "Serving since"],
          ["50,000+", "Trips completed"],
          ["4.6★", "Google rating"],
          ["40+", "Cities covered"],
        ].map(([n, t]) => (
          <div key={t} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-amber-600">{n}</p>
            <p className="text-xs font-semibold text-slate-500">{t}</p>
          </div>
        ))}
      </div>
      <Prose>
        <p>
          <b>{BRAND}</b> is a one-way drop taxi and outstation cab service based in Tamil Nadu. We started in 2015 with a simple idea: travellers going one
          way should not pay for an empty return trip. Today we connect Chennai, Coimbatore, Madurai, Trichy, Salem, Erode, Bangalore, Pondicherry and
          more than 40 cities with clean AC cars and experienced drivers.
        </p>
        <h2>What makes us different</h2>
        <div className="not-prose grid gap-3 sm:grid-cols-2">
          {[
            [IndianRupee, "Pay only one way", "Fares are calculated on pickup-to-drop distance with the driver bata shown upfront."],
            [ShieldCheck, "Verified drivers", "Every driver is background-checked, licensed and trained for long-distance highway travel."],
            [Clock, "On-time pickups", "We plan routes around traffic and toll timings so you reach on time, day or night."],
            [Headphones, "24/7 support", "Our team is reachable by phone and WhatsApp around the clock for bookings and changes."],
          ].map(([Icon, t, d]) => {
            const I = Icon as React.ElementType;
            return (
              <div key={t as string} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <I className="size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold text-slate-900">{t as string}</p>
                  <p className="text-sm text-slate-600">{d as string}</p>
                </div>
              </div>
            );
          })}
        </div>
        <h2>Our fleet</h2>
        <p>
          Choose from Sedan AC (Swift Dzire, Etios, Amaze), SUV / Ertiga AC, Toyota Innova and 12–14 seater Tempo Travellers. See current rates on the{" "}
          <Link to="/routes" className="font-semibold text-amber-700 underline">
            routes & fares
          </Link>{" "}
          page.
        </p>
      </Prose>

      <section id="contact" className="mt-10 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900">Contact Us</h2>
        <address className="mt-4 grid gap-4 not-italic sm:grid-cols-3">
          <a href={`tel:${settings.phone}`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 font-semibold text-slate-800 hover:bg-slate-100">
            <Phone className="size-5 text-amber-600" /> {PHONE_DISPLAY}
          </a>
          <a
            href={waLink(settings.whatsapp, "Hi, I'd like to book a drop taxi.")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 font-semibold text-slate-800 hover:bg-slate-100"
          >
            <MessageCircle className="size-5 text-green-600" /> WhatsApp us
          </a>
          <p className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <MapPin className="size-5 shrink-0 text-amber-600" />
            {ADDRESS.streetAddress}, {ADDRESS.addressLocality}, {ADDRESS.addressRegion} {ADDRESS.postalCode}
          </p>
        </address>
      </section>
    </InfoPage>
  );
}
