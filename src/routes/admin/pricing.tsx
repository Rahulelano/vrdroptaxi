import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Briefcase } from "lucide-react";
import { Btn, Card, Empty, Field, Input, Modal, PageHeader, Spinner, Textarea, Toggle } from "@/components/admin/ui";
import { api, computeFare, inr, type Vehicle } from "@/lib/api";
import { useAdminSettings, useMe, useVehicles } from "@/components/admin/hooks";

export const Route = createFileRoute("/admin/pricing")({ component: PricingPage });

const EMPTY: Omit<Vehicle, "id"> = {
  name: "",
  sub: "",
  img: "",
  oneway: 0,
  round: 0,
  bata: 0,
  pkg: 0,
  passengers: 4,
  bags: 2,
  features: [],
  active: true,
  popular: false,
  sort: 99,
};

function PricingPage() {
  const { data, isLoading } = useVehicles();
  const minKm = useAdminSettings().data?.minKm ?? 130;
  const isAdmin = useMe().data?.role === "admin";
  const [editing, setEditing] = useState<Partial<Vehicle> | null>(null);
  const qc = useQueryClient();

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["vehicles"] });
    void qc.invalidateQueries({ queryKey: ["public-config"] });
  };
  const save = useMutation({
    mutationFn: (v: Partial<Vehicle>) =>
      v.id ? api<Vehicle>(`/api/admin/vehicles/${v.id}`, { method: "PATCH", body: v }) : api<Vehicle>("/api/admin/vehicles", { body: v }),
    onSuccess: () => {
      refresh();
      toast.success("Saved. The website now shows the new price.");
      setEditing(null);
    },
    onError: (e) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: (v: Vehicle) => api(`/api/admin/vehicles/${v.id}`, { method: "PATCH", body: { active: !v.active } }),
    onSuccess: refresh,
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => api(`/api/admin/vehicles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      refresh();
      toast.success("Vehicle deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Vehicles & Pricing"
        subtitle={`Per-km rates, driver bata and package prices. Fare = rate × max(km, ${minKm}) + bata. Round trip counts km both ways.`}
        actions={
          isAdmin && (
            <Btn onClick={() => setEditing({ ...EMPTY })}>
              <Plus className="size-4" /> Add vehicle
            </Btn>
          )
        }
      />
      {isLoading || !data ? (
        <Spinner />
      ) : data.length === 0 ? (
        <Empty>No vehicles. Add one to start taking bookings.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((v) => (
            <Card key={v.id} className={v.active ? "" : "opacity-60"}>
              <div className="flex gap-4">
                {v.img && <img src={v.img} alt="" className="h-16 w-24 rounded-lg bg-slate-50 object-contain" />}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900">
                    {v.name} {v.popular && <span className="text-xs text-amber-600">★ Popular</span>}
                  </h3>
                  <p className="truncate text-xs text-slate-500">{v.sub}</p>
                  <p className="mt-1 flex gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3" /> {v.passengers}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="size-3" /> {v.bags}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <Price label="One way" value={`₹${v.oneway}/km`} />
                <Price label="Round trip" value={`₹${v.round}/km`} />
                <Price label="Driver bata" value={inr(v.bata)} />
                <Price label="Local package" value={v.pkg ? inr(v.pkg) : "Not offered"} />
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                e.g. 300 km one way = <b>{inr(computeFare(v, "one", 300, minKm))}</b>
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <Toggle checked={v.active} onChange={() => isAdmin && toggle.mutate(v)} label={v.active ? "Shown on site" : "Hidden"} />
                {isAdmin && (
                  <div className="flex gap-1">
                    <Btn variant="ghost" onClick={() => setEditing(v)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Btn>
                    <Btn variant="ghost" className="text-red-600" onClick={() => confirm(`Delete ${v.name}?`) && del.mutate(v.id)} aria-label="Delete">
                      <Trash2 className="size-4" />
                    </Btn>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && <VehicleForm initial={editing} saving={save.isPending} onClose={() => setEditing(null)} onSave={(v) => save.mutate(v)} />}
    </div>
  );
}

function Price({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-slate-500">{label}</p>
      <p className="font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function VehicleForm({ initial, saving, onClose, onSave }: { initial: Partial<Vehicle>; saving: boolean; onClose: () => void; onSave: (v: Partial<Vehicle>) => void }) {
  const [v, setV] = useState<Partial<Vehicle>>(initial);
  const [features, setFeatures] = useState((initial.features ?? []).join("\n"));
  const n = (k: keyof Vehicle) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: Number(e.target.value) });
  const s = (k: keyof Vehicle) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={initial.id ? `Edit ${initial.name}` : "Add vehicle"}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn loading={saving} onClick={() => onSave({ ...v, features: features.split("\n").map((x) => x.trim()).filter(Boolean) })}>
            Save
          </Btn>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vehicle name *">
          <Input value={v.name ?? ""} onChange={s("name")} placeholder="Sedan AC" />
        </Field>
        <Field label="Models">
          <Input value={v.sub ?? ""} onChange={s("sub")} placeholder="Swift Dzire / Etios or Similar" />
        </Field>
        <Field label="One-way rate (₹/km)">
          <Input type="number" min={0} value={v.oneway ?? 0} onChange={n("oneway")} />
        </Field>
        <Field label="Round-trip rate (₹/km)">
          <Input type="number" min={0} value={v.round ?? 0} onChange={n("round")} />
        </Field>
        <Field label="Driver bata (₹)">
          <Input type="number" min={0} value={v.bata ?? 0} onChange={n("bata")} />
        </Field>
        <Field label="Local package price (₹, 0 = not offered)" hint="10 km / 1 hr package">
          <Input type="number" min={0} value={v.pkg ?? 0} onChange={n("pkg")} />
        </Field>
        <Field label="Passengers">
          <Input type="number" min={1} value={v.passengers ?? 4} onChange={n("passengers")} />
        </Field>
        <Field label="Bags">
          <Input type="number" min={0} value={v.bags ?? 2} onChange={n("bags")} />
        </Field>
        <Field label="Image URL" hint="e.g. /swift.jpg or https://…">
          <Input value={v.img ?? ""} onChange={s("img")} />
        </Field>
        <Field label="Display order (smaller = first)">
          <Input type="number" value={v.sort ?? 0} onChange={n("sort")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Features (one per line)">
            <Textarea rows={4} value={features} onChange={(e) => setFeatures(e.target.value)} />
          </Field>
        </div>
        <div className="flex gap-6 sm:col-span-2">
          <Toggle checked={v.active ?? true} onChange={(active) => setV({ ...v, active })} label="Show on website" />
          <Toggle checked={v.popular ?? false} onChange={(popular) => setV({ ...v, popular })} label="Mark as Most Popular" />
        </div>
      </div>
    </Modal>
  );
}
