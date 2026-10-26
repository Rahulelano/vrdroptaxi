import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Phone } from "lucide-react";
import { Btn, Card, Empty, Field, Input, Modal, PageHeader, Spinner, Textarea, Toggle } from "@/components/admin/ui";
import { api, type Driver } from "@/lib/api";
import { useDrivers, useMe, useVehicles } from "@/components/admin/hooks";

export const Route = createFileRoute("/admin/drivers")({ component: DriversPage });

function DriversPage() {
  const { data, isLoading } = useDrivers();
  const isAdmin = useMe().data?.role === "admin";
  const [editing, setEditing] = useState<Partial<Driver> | null>(null);
  const qc = useQueryClient();
  const refresh = () => void qc.invalidateQueries({ queryKey: ["drivers"] });

  const save = useMutation({
    mutationFn: (d: Partial<Driver>) => (d.id ? api(`/api/admin/drivers/${d.id}`, { method: "PATCH", body: d }) : api("/api/admin/drivers", { body: d })),
    onSuccess: () => {
      refresh();
      toast.success("Driver saved");
      setEditing(null);
    },
    onError: (e) => toast.error(e.message),
  });
  const patch = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api(`/api/admin/drivers/${id}`, { method: "PATCH", body: { active } }),
    onSuccess: refresh,
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => api(`/api/admin/drivers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      refresh();
      toast.success("Driver deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Drivers"
        subtitle="Assign drivers to bookings. The customer gets the driver's name, phone and vehicle number by email."
        actions={
          isAdmin && (
            <Btn onClick={() => setEditing({ active: true })}>
              <Plus className="size-4" /> Add driver
            </Btn>
          )
        }
      />
      <Card className="p-0">
        {isLoading || !data ? (
          <Spinner />
        ) : data.length === 0 ? (
          <Empty>No drivers yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Trips</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{d.name}</p>
                      <a href={`tel:${d.phone}`} className="flex items-center gap-1 text-xs text-slate-500 hover:underline">
                        <Phone className="size-3" /> {d.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{d.vehicleNo || "—"}</p>
                      <p className="text-xs text-slate-500">{d.vehicleType}</p>
                    </td>
                    <td className="px-4 py-3">
                      {d.tripCount ?? 0} done{d.activeTrips ? <span className="ml-1 text-xs font-bold text-indigo-600">· {d.activeTrips} active</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <Toggle checked={d.active} onChange={(active) => isAdmin && patch.mutate({ id: d.id, active })} label={d.active ? "Available" : "Inactive"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isAdmin && (
                        <>
                          <Btn variant="ghost" onClick={() => setEditing(d)} aria-label="Edit">
                            <Pencil className="size-4" />
                          </Btn>
                          <Btn variant="ghost" className="text-red-600" onClick={() => confirm(`Delete ${d.name}?`) && del.mutate(d.id)} aria-label="Delete">
                            <Trash2 className="size-4" />
                          </Btn>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {editing && <DriverForm initial={editing} saving={save.isPending} onClose={() => setEditing(null)} onSave={(d) => save.mutate(d)} />}
    </div>
  );
}

function DriverForm({ initial, saving, onClose, onSave }: { initial: Partial<Driver>; saving: boolean; onClose: () => void; onSave: (d: Partial<Driver>) => void }) {
  const [d, setD] = useState(initial);
  const vehicles = useVehicles().data ?? [];
  const s = (k: keyof Driver) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value });
  return (
    <Modal
      open
      onClose={onClose}
      title={initial.id ? "Edit driver" : "Add driver"}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn loading={saving} onClick={() => onSave(d)}>
            Save
          </Btn>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *">
          <Input value={d.name ?? ""} onChange={s("name")} />
        </Field>
        <Field label="Phone *">
          <Input value={d.phone ?? ""} onChange={s("phone")} />
        </Field>
        <Field label="Vehicle number">
          <Input value={d.vehicleNo ?? ""} onChange={s("vehicleNo")} placeholder="TN 01 AB 1234" />
        </Field>
        <Field label="Vehicle type">
          <Input list="vehicle-types" value={d.vehicleType ?? ""} onChange={s("vehicleType")} />
          <datalist id="vehicle-types">
            {vehicles.map((v) => (
              <option key={v.id} value={v.name} />
            ))}
          </datalist>
        </Field>
        <Field label="Licence number">
          <Input value={d.licenseNo ?? ""} onChange={s("licenseNo")} />
        </Field>
        <div className="flex items-end">
          <Toggle checked={d.active ?? true} onChange={(active) => setD({ ...d, active })} label="Available for trips" />
        </div>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <Textarea value={d.notes ?? ""} onChange={s("notes")} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
