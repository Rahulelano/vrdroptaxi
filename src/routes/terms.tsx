import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";
import { terms } from "@/lib/content";
import { BRAND, seo } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    seo({
      title: `Terms & Conditions | ${BRAND}`,
      description: "Terms for our drop taxi service: fare calculation, minimum km, waiting time, toll and hill charges, luggage, pets and trip changes.",
      path: "/terms",
    }),
  component: Terms,
});

function Terms() {
  return (
    <InfoPage title="Terms & Conditions" intro="Please read these points before booking so fare, route and travel details stay clear.">
      <ol className="space-y-3">
        {terms.map(([t, d], i) => (
          <li key={t} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-sm font-bold text-amber-700">{i + 1}</span>
            <p className="text-sm leading-relaxed">
              <b className="text-slate-900">{t}.</b> <span className="text-slate-600">{d}</span>
            </p>
          </li>
        ))}
      </ol>
    </InfoPage>
  );
}
