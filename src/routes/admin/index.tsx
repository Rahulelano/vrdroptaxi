import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Clock, IndianRupee, Users, Car, CalendarDays } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, PageHeader, Spinner, StatusBadge, STATUSES, STATUS_META, fmtDate } from "@/components/admin/ui";
import { api, inr, type Booking, type BookingStatus } from "@/lib/api";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

interface Stats {
  total: number;
  today: number;
  pickupsToday: number;
  byStatus: Record<BookingStatus, number>;
  monthRevenue: number;
  customers: number;
  drivers: number;
  last14: { date: string; count: number }[];
  topRoutes: { route: string; count: number }[];
  recent: Booking[];
}

function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["stats"], queryFn: () => api<Stats>("/api/admin/stats"), refetchInterval: 60_000 });
  if (isLoading || !data) return <Spinner />;

  const tiles = [
    { label: "New today", value: data.today, icon: CalendarCheck, color: "text-blue-600 bg-blue-50" },
    { label: "Pending (action needed)", value: data.byStatus.pending, icon: Clock, color: "text-amber-600 bg-amber-50", to: "pending" },
    { label: "Pickups today", value: data.pickupsToday, icon: CalendarDays, color: "text-purple-600 bg-purple-50" },
    { label: "Revenue this month", value: inr(data.monthRevenue), icon: IndianRupee, color: "text-green-600 bg-green-50" },
    { label: "Customers", value: data.customers, icon: Users, color: "text-slate-700 bg-slate-100" },
    { label: "Active drivers", value: data.drivers, icon: Car, color: "text-slate-700 bg-slate-100" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`${data.total} bookings in total`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label} className="flex items-center gap-4">
            <span className={`grid size-12 place-items-center rounded-xl ${t.color}`}>
              <t.icon className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{t.value}</p>
              <p className="text-xs font-semibold text-slate-500">{t.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="mb-4 font-bold text-slate-900">Bookings – last 14 days</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.last14.map((d) => ({ ...d, day: d.date.slice(5) }))}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Bar dataKey="count" name="Bookings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-bold text-slate-900">By status</h2>
          <ul className="space-y-2">
            {STATUSES.map((s) => (
              <li key={s}>
                <Link to="/admin/bookings" search={{ status: s }} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50">
                  <span className="text-sm text-slate-600">{STATUS_META[s].label}</span>
                  <span className="font-bold text-slate-900">{data.byStatus[s]}</span>
                </Link>
              </li>
            ))}
          </ul>
          {data.topRoutes.length > 0 && (
            <>
              <h2 className="mb-2 mt-6 font-bold text-slate-900">Top routes</h2>
              <ul className="space-y-1 text-sm">
                {data.topRoutes.map((r) => (
                  <li key={r.route} className="flex justify-between text-slate-600">
                    <span className="truncate">{r.route}</span>
                    <span className="font-bold text-slate-900">{r.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Latest bookings</h2>
          <Link to="/admin/bookings" className="text-sm font-semibold text-amber-600 hover:underline">
            View all →
          </Link>
        </div>
        {data.recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No bookings yet. They will appear here the moment a customer books.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recent.map((b) => (
              <Link
                key={b.id}
                to="/admin/bookings"
                search={{ id: b.id }}
                className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {b.ref} · {b.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {b.from} → {b.to} · {b.date || "no date"} {b.time} · booked {fmtDate(b.createdAt)}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
