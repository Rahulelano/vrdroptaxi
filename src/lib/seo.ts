// On-page SEO helpers used by route `head()` functions.
export const BRAND = "Droptaxii";
export const PHONE = "+919843600457";
export const PHONE_DISPLAY = "+91 98436 00457";
export const WHATSAPP = "919843600457";
export const ADDRESS = {
  streetAddress: "No 11-C, Pannuvarpatty, Natham",
  addressLocality: "Dindigul",
  addressRegion: "Tamil Nadu",
  postalCode: "624401",
  addressCountry: "IN",
};
const OG_IMAGE = "/logo.png";

// Canonical URLs follow whatever domain the site is served from.
export const siteUrl = () =>
  ((import.meta.env["VITE_SITE_URL"] as string | undefined) ?? (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");

export const titleCase = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const routePath = (from: string, to: string) => `/${slugify(from)}/${slugify(from)}-to-${slugify(to)}-one-way-drop-taxi`;

export function seo({ title, description, path, image = OG_IMAGE, noindex = false }: { title: string; description: string; path: string; image?: string; noindex?: boolean }) {
  const url = siteUrl() + path;
  const img = image.startsWith("http") ? image : siteUrl() + image;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : [{ name: "robots", content: "index, follow, max-image-preview:large" }]),
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: BRAND },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: img },
      { property: "og:locale", content: "en_IN" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: img },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export const routeHead = (from: string, to: string) =>
  seo({
    title: `${from} to ${to} Taxi – One Way Drop Taxi Fare | ${BRAND}`,
    description: `Book ${from} to ${to} one way drop taxi – Sedan, SUV, Innova & Tempo Traveller, driver bata included. Pay only one way. 24/7 booking.`,
    path: routePath(from, to),
  });

export const hubHead = (city: string) =>
  seo({
    title: `Drop Taxi ${city} – One Way Outstation Cabs from ${city} | ${BRAND}`,
    description: `One way drop taxi from ${city} to anywhere in Tamil Nadu, Kerala, Karnataka & Andhra. Sedan from ₹15/km, SUV & Innova available. Verified drivers, 24/7 booking.`,
    path: `/routes/${slugify(city)}-one-way-drop-taxi`,
  });

// ---- JSON-LD builders ----
export const localBusinessLd = () => ({
  "@context": "https://schema.org",
  "@type": "TaxiService",
  "@id": siteUrl() + "/#business",
  name: BRAND,
  url: siteUrl() + "/",
  logo: siteUrl() + "/logo.png",
  image: siteUrl() + "/logo.png",
  telephone: PHONE,
  priceRange: "₹₹",
  areaServed: ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Puducherry"].map((name) => ({ "@type": "State", name })),
  provider: {
    "@type": "LocalBusiness",
    name: BRAND,
    telephone: PHONE,
    address: { "@type": "PostalAddress", ...ADDRESS },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00",
      closes: "23:59",
    },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.6", reviewCount: "419" },
  },
});

export const faqLd = (faqs: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

export const breadcrumbLd = (items: [string, string][]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: siteUrl() + path })),
});
