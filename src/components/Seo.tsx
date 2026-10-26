import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { breadcrumbLd } from "@/lib/seo";

export function JsonLd({ data }: { data: object }) {
  // eslint-disable-next-line react/no-danger
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

// Visible breadcrumb + BreadcrumbList schema. Last item is the current page.
export function Breadcrumbs({ items, dark = false }: { items: [string, string][]; dark?: boolean }) {
  return (
    <nav aria-label="Breadcrumb" className={`text-xs font-medium ${dark ? "text-slate-300" : "text-slate-500"}`}>
      <JsonLd data={breadcrumbLd(items)} />
      <ol className="flex flex-wrap items-center gap-1">
        {items.map(([name, path], i) => (
          <li key={path} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3 opacity-60" aria-hidden />}
            {i === items.length - 1 ? (
              <span aria-current="page" className={dark ? "text-white" : "text-slate-800"}>
                {name}
              </span>
            ) : (
              <Link to={path} className={dark ? "hover:text-amber-400" : "hover:text-amber-600"}>
                {name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
