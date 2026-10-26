import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Phone, Ban, Pencil, Trash2 } from "lucide-react";
import { Btn, Card, Empty, Field, Input, Modal, PageHeader, Spinner, Textarea, Toggle, fmtDate } from "@/components/admin/ui";
import { api, inr, type Customer } from "@/lib/api";
import { useMe } from "@/components/admin/hooks";

export const Route = createFileRoute("/admin/customers")({ component: CustomersPage });

function CustomersPage() {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const me = useMe();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["customers", q],
    queryFn: () => api<Customer[]>(`/api/admin/customers?q=${encodeURIComponent(q)}`),
  });

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Customer> }) => api<Customer>(`/api/admin/customers/${id}`, { method: "PATCH", body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated");
      setEditing(null);
    },
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: ({ id, withBookings }: { id: string; withBookings: boolean }) =>
      api(`/api/admin/customers/${id}?withBookings=${withBookings}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Customer deleted");
      setEditing(null);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Customers" subtitle="Everyone who has booked. Customers are added automatically from bookings (matched by phone number)." />
      <Card className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone or email" className="pl-9" />
        </div>
      </Card>
      <Card className="p-0">
        {isLoading || !data ? (
          <Spinner />
        ) : data.length === 0 ? (
          <Empty>No customers yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Spent</th>
                  <th className="px-4 py-3">Last booking</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((c) => (
                  <tr key={c.id} className={c.blocked ? "bg-red-50/50" : ""}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {c.name} {c.blocked && <span className="ml-1 rounded bg-red-100 px-1.5 text-[10px] font-bold text-red-700">BLOCKED</span>}
                      </p>
                      {c.notes && <p className="max-w-xs truncate text-xs text-slate-500">{c.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-slate-700 hover:underline">
                        <Phone className="size-3" /> {c.phone}
                      </a>
                      <p className="text-xs text-slate-500">{c.email || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link to="/admin/bookings" search={{ customerId: c.id }} className="font-semibold text-amber-700 hover:underline">
                        {c.bookingCount} bookings
                      </Link>
                      <p className="text-xs text-slate-500">{c.completedCount} completed</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">{inr(c.totalSpent)}</td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(c.lastBookingAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Btn variant="ghost" onClick={() => setEditing(c)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <EditCustomer
          customer={editing}
          canDelete={me.data?.role === "admin"}
          saving={patch.isPending}
          onClose={() => setEditing(null)}
          onSave={(body) => patch.mutate({ id: editing.id, body })}
          onDelete={(withBookings) => del.mutate({ id: editing.id, withBookings })}
        />
      )}
    </div>
  );
}

function EditCustomer({
  customer,
  canDelete,
  saving,
  onClose,
  onSave,
  onDelete,
}: {
  customer: Customer;
  canDelete: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (b: Partial<Customer>) => void;
  onDelete: (withBookings: boolean) => void;
}) {
  const [f, setF] = useState({ name: customer.name, phone: customer.phone, email: customer.email ?? "", notes: customer.notes ?? "", blocked: customer.blocked });
  return (
    <Modal
      open
      onClose={onClose}
      title="Edit customer"
      footer={
        <>
          {canDelete && (
            <Btn
              variant="ghost"
              className="mr-auto text-red-600"
              onClick={() => {
                if (!confirm(`Delete ${customer.name}?`)) return;
                onDelete(confirm("Also delete all bookings of this customer? (Cancel = keep bookings)"));
              }}
            >
              <Trash2 className="size-4" /> Delete
            </Btn>
          )}
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn loading={saving} onClick={() => onSave(f)}>
            Save
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name">
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Phone">
          <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </Field>
        <Field label="Notes (internal)">
          <Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        </Field>
        <div className="rounded-lg border border-red-100 bg-red-50/50 p-3">
          <Toggle checked={f.blocked} onChange={(blocked) => setF({ ...f, blocked })} label="Block this customer from booking online" />
          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <Ban className="size-3" /> Blocked customers are asked to call instead.
          </p>
        </div>
      </div>
    </Modal>
  );
}
