import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Star } from "lucide-react";
import { Btn, Card, Empty, Field, Input, Modal, PageHeader, Spinner, Toggle } from "@/components/admin/ui";
import { api, computeFare, inr, type TaxiRoute } from "@/lib/api";
import { useAdminSettings, useMe, useVehicles } from "@/components/admin/hooks";

export const Route = createFileRoute("/admin/destinations")({ component: DestinationsPage });

function DestinationsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["routes"], queryFn: () => api<TaxiRoute[]>("/api/admin/routes") });
  const vehicles = useVehicles().data ?? [];
  const settings = useAdminSettings().data;
  const minKm = settings?.minKm ?? 130;
  const isAdmin = useMe().data?.role === "admin";
  const [editing, setEditing] = useState<Partial<TaxiRoute> | null>(null);
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["routes"] });
    void qc.invalidateQueries({ queryKey: ["public-config"] });
  };
  const save = useMutation({
    mutationFn: (r: Partial<TaxiRoute>) =>
      r.id ? api(`/api/admin/routes/${r.id}`, { method: "PATCH", body: r }) : api("/api/admin/routes", { body: r }),
    onSuccess: () => {
      refresh();
      toast.success("Route saved");
      setEditing(null);
    },
    onError: (e) => toast.error(e.message),
  });
  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<TaxiRoute> }) => api(`/api/admin/routes/${id}`, { method: "PATCH", body }),
    onSuccess: refresh,
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => api(`/api/admin/routes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      refresh();
      toast.success("Route deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const [v1, v2] = vehicles.filter((v) => v.active);
  const items = (data ?? []).filter((r) => `${r.from} ${r.to}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Routes & Destinations"
        subtitle="Popular routes shown on the home page. Known routes use this distance for fare calculation."
        actions={
          isAdmin && (
            <Btn onClick={() => setEditing({ from: settings?.homeOrigin ?? "Chennai", to: "", km: 0, hrs: "", img: "", note: "", active: true, featured: true })}>
              <Plus className="size-4" /> Add destination
            </Btn>
          )
        }
      />
      <Card className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search city" className="pl-9" />
        </div>
      </Card>
      {isLoading || !data ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty>No routes found.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((r) => (
            <Card key={r.id} className={`p-0 overflow-hidden ${r.active ? "" : "opacity-60"}`}>
              <div className="relative h-32 bg-slate-100">
                {r.img && <img src={r.img} alt="" className="h-full w-full object-cover" />}
                {r.featured && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-900">
                    <Star className="size-3 fill-current" /> Home page
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-500">{r.from} to</p>
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900">{r.to}</h3>
                  <p className="text-right text-xs font-semibold text-slate-500">
                    {r.km} km
                    <br />
                    {r.hrs}
                  </p>
                </div>
                {v1 && (
                  <p className="mt-2 text-xs text-slate-600">
                    {v1.name}: <b>{inr(computeFare(v1, "one", r.km, minKm))}</b>
                    {v2 && (
                      <>
                        {" "}
                        · {v2.name}: <b>{inr(computeFare(v2, "one", r.km, minKm))}</b>
                      </>
                    )}
                  </p>
                )}
                {r.note && <p className="mt-1 text-[11px] text-slate-400">{r.note}</p>}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <Toggle checked={r.active} onChange={(active) => isAdmin && patch.mutate({ id: r.id, body: { active } })} label={r.active ? "Active" : "Hidden"} />
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Btn variant="ghost" onClick={() => setEditing(r)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Btn>
                      <Btn variant="ghost" className="text-red-600" onClick={() => confirm(`Delete ${r.from} → ${r.to}?`) && del.mutate(r.id)} aria-label="Delete">
                        <Trash2 className="size-4" />
                      </Btn>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && <RouteForm initial={editing} saving={save.isPending} onClose={() => setEditing(null)} onSave={(r) => save.mutate(r)} />}
    </div>
  );
}

function RouteForm({ initial, saving, onClose, onSave }: { initial: Partial<TaxiRoute>; saving: boolean; onClose: () => void; onSave: (r: Partial<TaxiRoute>) => void }) {
  const [r, setR] = useState(initial);
  const s = (k: keyof TaxiRoute) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setR({ ...r, [k]: k === "km" || k === "sort" ? Number(e.target.value) : e.target.value });
  return (
    <Modal
      open
      onClose={onClose}
      title={initial.id ? "Edit route" : "Add destination"}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn loading={saving} onClick={() => onSave(r)}>
            Save
          </Btn>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From *">
          <Input value={r.from ?? ""} onChange={s("from")} />
        </Field>
        <Field label="To (destination) *">
          <Input value={r.to ?? ""} onChange={s("to")} />
        </Field>
        <Field label="Distance (km) *">
          <Input type="number" min={1} value={r.km ?? 0} onChange={s("km")} />
        </Field>
        <Field label="Travel time">
          <Input value={r.hrs ?? ""} onChange={s("hrs")} placeholder="~6 hrs" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Image URL" hint="e.g. /destinations/madurai.png or any https:// image">
            <Input value={r.img ?? ""} onChange={s("img")} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Note (shown under the fare)">
            <Input value={r.note ?? ""} onChange={s("note")} placeholder="Fare based on 130 km minimum" />
          </Field>
        </div>
        <Field label="Display order (smaller = first)">
          <Input type="number" value={r.sort ?? 0} onChange={s("sort")} />
        </Field>
        <div className="flex flex-col justify-end gap-2">
          <Toggle checked={r.active ?? true} onChange={(active) => setR({ ...r, active })} label="Active" />
          <Toggle checked={r.featured ?? true} onChange={(featured) => setR({ ...r, featured })} label="Show on home page" />
        </div>
      </div>
    </Modal>
  );
}
