import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";
import { JsonLd } from "@/components/Seo";
import { faqs } from "@/lib/content";
import { BRAND, faqLd, seo } from "@/lib/seo";

export const Route = createFileRoute("/faqs")({
  head: () =>
    seo({
      title: `Drop Taxi FAQs – Fares, Booking & Cancellation | ${BRAND}`,
      description: "Answers to common questions about one way drop taxi fares, minimum km, driver bata, booking, cancellation and the cities we cover in South India.",
      path: "/faqs",
    }),
  component: Page,
});

function Page() {
  return (
    <InfoPage title="Frequently Asked Questions" intro="Everything you need to know about fares, booking and travel with us.">
      <JsonLd data={faqLd(faqs)} />
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <details key={f.q} open={i === 0} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
              <h2 className="text-base font-bold text-slate-900">{f.q}</h2>
              <span className="text-2xl leading-none text-amber-600 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
