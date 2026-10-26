import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Phone, MessageCircle, Plus, Search, Mail, Trash2, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import {
  Btn,
  Card,
  Empty,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  StatusBadge,
  STATUSES,
  STATUS_META,
  Textarea,
  Toggle,
  fmtDate,
  tripLabel,
} from "@/components/admin/ui";
import { api, adminToken, API_URL, computeFare, inr, waLink, type Booking, type BookingStatus, type TripType } from "@/lib/api";
import { useAdminSettings, useDrivers, useMe, useVehicles } from "@/components/admin/hooks";

type Search = { id?: string; status?: string; q?: string; customerId?: string };

export const Route = createFileRoute("/admin/bookings")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    for (const k of ["id", "status", "q", "customerId"] as const) if (typeof s[k] === "string" && s[k]) out[k] = s[k] as string;
    return out;
  },
  component: BookingsPage,
});

interface ListResponse {
  total: number;
  page: number;
  size: number;
  items: Booking[];
}


function BookingsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/bookings" });
  const [q, setQ] = useState(search.q ?? "");
  const [range, setRange] = useState({ from: "", to: "" });
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const status = search.status ?? "all";

  const params = new URLSearchParams({ status, page: String(page), size: "25" });
  if (search.q) params.set("q", search.q);
  if (search.customerId) params.set("customerId", search.customerId);
  if (range.from) params.set("from", range.from);
  if (range.to) params.set("to", range.to);

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", params.toString()],
    queryFn: () => api<ListResponse>(`/api/admin/bookings?${params}`),
  });

  useEffect(() => setPage(1), [status, search.q, search.customerId, range.from, range.to]);

  const setSearch = (patch: Partial<Search>) =>
    void navigate({ search: (prev: Search) => Object.fromEntries(Object.entries({ ...prev, ...patch }).filter(([, v]) => v)) as Search });

  const exportCsv = async () => {
    params.delete("page");
    const res = await fetch(`${API_URL}/api/admin/bookings.csv?${params}`, { headers: { Authorization: `Bearer ${adminToken.get()}` } });
    if (!res.ok) {
      toast.error("Export failed");
      return;
    }
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle={search.customerId ? "Showing bookings of one customer" : "All customer bookings from the website and phone"}
        actions={
          <>
            <Btn variant="secondary" onClick={exportCsv}>
              <Download className="size-4" /> Export CSV
            </Btn>
            <Btn onClick={() => setCreating(true)}>
              <Plus className="size-4" /> New booking
            </Btn>
          </>
        }
      />

      <Card className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {["all", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setSearch({ status: s === "all" ? "" : s })}
              className={`rounded-full px-3 py-1 text-xs font-bold ${status === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {s === "all" ? "All" : STATUS_META[s as BookingStatus].label}
            </button>
          ))}
          {search.customerId && (
            <button onClick={() => setSearch({ customerId: "" })} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              Customer filter ✕
            </button>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch({ q });
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, name, phone, city… (press Enter)" className="pl-9" />
          </form>
          <Input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} title="Pickup from" />
          <Input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} title="Pickup to" />
        </div>
      </Card>

      <Card className="p-0">
        {isLoading || !data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <Empty>No bookings found.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Trip</th>
                  <th className="px-4 py-3">Pickup</th>
                  <th className="px-4 py-3">Fare</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((b) => (
                  <tr key={b.id} onClick={() => setSearch({ id: b.id })} className="cursor-pointer hover:bg-amber-50/50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{b.ref}</p>
                      <p className="text-xs text-slate-400">{fmtDate(b.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{b.name}</p>
                      <p className="text-xs text-slate-500">{b.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">
                        {b.from} → {b.to}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tripLabel[b.tripType]} · {b.vehicleName} · {b.distanceKm || "?"} km
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {b.date || "-"} <span className="text-slate-500">{b.time}</span>
                    </td>
                    <td className="px-4 py-3 font-bold">{inr(b.finalFare ?? b.estimatedFare)}</td>
                    <td className="px-4 py-3 text-slate-600">{b.driver?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.total > data.size && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
            <span className="text-slate-500">
              Page {page} of {pages} · {data.total} bookings
            </span>
            <div className="flex gap-2">
              <Btn variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-4" />
              </Btn>
              <Btn variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="size-4" />
              </Btn>
            </div>
          </div>
        )}
      </Card>

      {search.id && <BookingDetail id={search.id} onClose={() => setSearch({ id: "" })} />}
      {creating && <NewBookingModal onClose={() => setCreating(false)} onCreated={(id) => setSearch({ id })} />}
    </div>
  );
}

function BookingDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const me = useMe();
  const { data: b } = useQuery({ queryKey: ["bookings", "one", id], queryFn: () => api<Booking>(`/api/admin/bookings/${id}`) });
  const vehicles = useVehicles().data ?? [];
  const drivers = useDrivers().data ?? [];
  const settings = useAdminSettings().data;
  const minKm = settings?.minKm ?? 130;
  const [form, setForm] = useState<Partial<Booking>>({});
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    if (b) setForm({});
  }, [b?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: (patch: Record<string, unknown>) => api<Booking>(`/api/admin/bookings/${id}`, { method: "PATCH", body: { ...patch, notifyCustomer: notify } }),
    onSuccess: (updated) => {
      qc.setQueryData(["bookings", "one", id], updated);
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Booking updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => api(`/api/admin/bookings/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking deleted");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const email = useMutation({
    mutationFn: () => api(`/api/admin/bookings/${id}/email`, { body: {} }),
    onSuccess: () => toast.success("Email sent to customer"),
    onError: (e) => toast.error(e.message),
  });

  if (!b)
    return (
      <Modal open onClose={onClose} title="Booking">
        <Spinner />
      </Modal>
    );

  const v = { ...b, ...form } as Booking;
  const set = <K extends keyof Booking>(k: K, val: Booking[K]) => setForm((f) => ({ ...f, [k]: val }));
  const dirty = Object.keys(form).length > 0;
  const waText = `Hi ${b.name}, this is ${settings?.businessName ?? "Droptaxii"} regarding your booking ${b.ref} (${b.from} → ${b.to} on ${b.date} ${b.time}).`;

  const nextActions: { status: BookingStatus; label: string; variant: "primary" | "success" | "danger" | "secondary" }[] = [];
  if (b.status === "pending") nextActions.push({ status: "confirmed", label: "Confirm booking", variant: "success" });
  if (["confirmed", "assigned"].includes(b.status)) nextActions.push({ status: "ongoing", label: "Mark trip started", variant: "primary" });
  if (["assigned", "ongoing", "confirmed"].includes(b.status)) nextActions.push({ status: "completed", label: "Mark completed", variant: "success" });
  if (!["cancelled", "completed"].includes(b.status)) nextActions.push({ status: "cancelled", label: "Cancel booking", variant: "danger" });
  if (b.status === "cancelled") nextActions.push({ status: "pending", label: "Re-open", variant: "secondary" });

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={`Booking ${b.ref}`}
      footer={
        <>
          {me.data?.role === "admin" && (
            <Btn variant="ghost" className="mr-auto text-red-600" loading={del.isPending} onClick={() => confirm(`Delete booking ${b.ref} permanently?`) && del.mutate()}>
              <Trash2 className="size-4" /> Delete
            </Btn>
          )}
          <Btn variant="secondary" onClick={onClose}>
            Close
          </Btn>
          <Btn disabled={!dirty} loading={save.isPending} onClick={() => save.mutate(form as Record<string, unknown>)}>
            Save changes
          </Btn>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={b.status} />
        {b.emailVerified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
            <BadgeCheck className="size-3.5" /> Email verified
          </span>
        )}
        <span className="text-xs text-slate-400">
          {b.source === "admin" ? "Added by admin" : "Website booking"} · {fmtDate(b.createdAt)}
        </span>
      </div>

      {/* Quick contact + status actions */}
      <div className="mb-5 flex flex-wrap gap-2">
        <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          <Phone className="size-4" /> Call
        </a>
        <a href={waLink(b.phone.length === 10 ? `91${b.phone}` : b.phone, waText)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white">
          <MessageCircle className="size-4" /> WhatsApp
        </a>
        {b.email && (
          <Btn variant="secondary" loading={email.isPending} onClick={() => email.mutate()}>
            <Mail className="size-4" /> Email status
          </Btn>
        )}
        <span className="mx-1 hidden w-px bg-slate-200 sm:block" />
        {nextActions.map((a) => (
          <Btn
            key={a.status}
            variant={a.variant}
            loading={save.isPending && save.variables?.["status"] === a.status}
            onClick={() => {
              if (a.status === "cancelled" && !confirm("Cancel this booking?")) return;
              save.mutate({ ...form, status: a.status });
            }}
          >
            {a.label}
          </Btn>
        ))}
      </div>
      {b.email && (
        <div className="mb-4">
          <Toggle checked={notify} onChange={setNotify} label="Email the customer when status changes" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer name">
          <Input value={v.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={v.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={v.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Trip type">
          <Select value={v.tripType} onChange={(e) => set("tripType", e.target.value as TripType)}>
            <option value="one">One Way</option>
            <option value="round">Round Trip</option>
            <option value="package">Package</option>
          </Select>
        </Field>
        <Field label="From">
          <Input value={v.from} onChange={(e) => set("from", e.target.value)} />
        </Field>
        <Field label="To">
          <Input value={v.to} onChange={(e) => set("to", e.target.value)} />
        </Field>
        <Field label="Pickup date">
          <Input type="date" value={v.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label="Pickup time">
          <Input type="time" value={v.time} onChange={(e) => set("time", e.target.value)} />
        </Field>
        <Field label="Vehicle">
          <Select value={v.vehicleId} onChange={(e) => set("vehicleId", e.target.value)}>
            {vehicles.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Distance (km, one way)">
          <Input type="number" min={0} value={v.distanceKm} onChange={(e) => set("distanceKm", Number(e.target.value))} />
        </Field>
        <Field label="Assign driver">
          <Select value={v.driverId ?? ""} onChange={(e) => set("driverId", e.target.value || null)}>
            <option value="">— Not assigned —</option>
            {drivers
              .filter((d) => d.active || d.id === b.driverId)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.vehicleType} {d.vehicleNo} {d.activeTrips ? `(${d.activeTrips} active)` : ""}
                </option>
              ))}
          </Select>
        </Field>
        <Field
          label="Final fare (₹)"
          hint={`Estimated: ${inr(computeFare(vehicles.find((x) => x.id === v.vehicleId), v.tripType, v.distanceKm, minKm) || b.estimatedFare)} — leave empty to use the estimate`}
        >
          <Input
            type="number"
            min={0}
            value={v.finalFare ?? ""}
            onChange={(e) => set("finalFare", e.target.value === "" ? null : Number(e.target.value))}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Customer notes">
            <Textarea value={v.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Internal admin notes (not shown to customer)">
            <Textarea value={v.adminNotes} onChange={(e) => set("adminNotes", e.target.value)} />
          </Field>
        </div>
      </div>

      {b.history?.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-bold text-slate-900">History</h3>
          <ol className="space-y-1.5 border-l-2 border-slate-200 pl-4 text-xs text-slate-600">
            {b.history.map((h, i) => (
              <li key={i}>
                <span className="font-semibold text-slate-800">{STATUS_META[h.status as BookingStatus]?.label ?? h.status}</span> · {fmtDate(h.at)} · by {h.by}
                {h.note ? ` — ${h.note}` : ""}
              </li>
            ))}
          </ol>
        </div>
      )}
    </Modal>
  );
}

function NewBookingModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const qc = useQueryClient();
  const vehicles = useVehicles().data ?? [];
  const minKm = useAdminSettings().data?.minKm ?? 130;
  const [f, setF] = useState({ name: "", phone: "", email: "", from: "Chennai", to: "", tripType: "one" as TripType, date: "", time: "", vehicleId: "", distanceKm: 0, notes: "" });
  const create = useMutation({
    mutationFn: () => api<Booking>("/api/admin/bookings", { body: f }),
    onSuccess: (b) => {
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success(`Booking ${b.ref} created`);
      onClose();
      onCreated(b.id);
    },
    onError: (e) => toast.error(e.message),
  });
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((x) => ({ ...x, [k]: k === "distanceKm" ? Number(e.target.value) : e.target.value }));

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="New booking (phone / walk-in)"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn loading={create.isPending} onClick={() => create.mutate()}>
            Create booking
          </Btn>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer name *">
          <Input value={f.name} onChange={up("name")} />
        </Field>
        <Field label="Phone *">
          <Input value={f.phone} onChange={up("phone")} />
        </Field>
        <Field label="Email (booking confirmation will be sent)">
          <Input type="email" value={f.email} onChange={up("email")} />
        </Field>
        <Field label="Trip type">
          <Select value={f.tripType} onChange={up("tripType")}>
            <option value="one">One Way</option>
            <option value="round">Round Trip</option>
            <option value="package">Package</option>
          </Select>
        </Field>
        <Field label="From *">
          <Input value={f.from} onChange={up("from")} />
        </Field>
        <Field label="To *">
          <Input value={f.to} onChange={up("to")} />
        </Field>
        <Field label="Pickup date">
          <Input type="date" value={f.date} onChange={up("date")} />
        </Field>
        <Field label="Pickup time">
          <Input type="time" value={f.time} onChange={up("time")} />
        </Field>
        <Field label="Vehicle">
          <Select value={f.vehicleId} onChange={up("vehicleId")}>
            <option value="">Choose…</option>
            {vehicles.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Distance (km, one way)" hint={f.vehicleId ? `Estimate: ${inr(computeFare(vehicles.find((x) => x.id === f.vehicleId), f.tripType, f.distanceKm, minKm))}` : undefined}>
          <Input type="number" min={0} value={f.distanceKm} onChange={up("distanceKm")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <Textarea value={f.notes} onChange={up("notes")} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
