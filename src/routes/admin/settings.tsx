import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Mail, Plus, Trash2, ShieldCheck, CheckCircle2, AlertTriangle, KeyRound, Upload, RotateCcw } from "lucide-react";
import { Btn, Card, Field, Input, Modal, PageHeader, Select, Spinner, Toggle, fmtDate } from "@/components/admin/ui";
import { api, uploadFile, type AdminUser, type Settings } from "@/lib/api";
import { useAdminSettings, useMe } from "@/components/admin/hooks";
import { disablePush, enablePush, getPushState, playAlertSound } from "@/lib/push";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const me = useMe().data;
  const isAdmin = me?.role === "admin";
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Settings" />
      <DeviceAlerts />
      {isAdmin && <BusinessSettings />}
      {isAdmin && <AdminUsers meId={me.id} />}
      <ChangePassword />
    </div>
  );
}

function Section({ title, icon: Icon, children, desc }: { title: string; icon: React.ElementType; children: React.ReactNode; desc?: string }) {
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <Icon className="size-5 text-amber-600" /> {title}
      </h2>
      {desc && <p className="mb-4 mt-1 text-sm text-slate-500">{desc}</p>}
      <div className={desc ? "" : "mt-4"}>{children}</div>
    </Card>
  );
}

function DeviceAlerts() {
  const [state, setState] = useState<Awaited<ReturnType<typeof getPushState>> | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void getPushState().then(setState);
  }, []);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      setState(await getPushState());
    }
  };

  return (
    <Section
      title="Booking alerts on this device"
      icon={Bell}
      desc="Get a phone/desktop notification with sound the moment a customer books — even when this panel is closed. Turn it on separately on every phone or computer you want alerts on."
    >
      <div className="flex flex-wrap items-center gap-3">
        {state === null ? null : state === "on" ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
              <CheckCircle2 className="size-4" /> Alerts are ON for this device
            </span>
            <Btn variant="secondary" loading={busy} onClick={() => run(disablePush, "Alerts turned off")}>
              <BellOff className="size-4" /> Turn off
            </Btn>
          </>
        ) : state === "unsupported" ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-amber-700">
            <AlertTriangle className="size-4" /> This browser can't receive push alerts. On iPhone: open the site in Safari → Share → "Add to Home Screen", then open it from there.
          </span>
        ) : state === "denied" ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-red-700">
            <AlertTriangle className="size-4" /> Notifications are blocked. Allow them in the browser's site settings, then reload.
          </span>
        ) : (
          <Btn loading={busy} onClick={() => run(enablePush, "Alerts enabled on this device")}>
            <Bell className="size-4" /> Enable alerts on this device
          </Btn>
        )}
        <Btn
          variant="secondary"
          loading={busy}
          onClick={() =>
            run(async () => {
              playAlertSound();
              const r = await api<{ devices: number }>("/api/admin/push/test", { body: {} });
              return r;
            }, "Test alert sent to all registered devices")
          }
        >
          Send test alert
        </Btn>
      </div>
      <p className="mt-3 text-xs text-slate-400">While this panel is open you also get an on-screen popup with a sound for every new booking.</p>
    </Section>
  );
}

function BusinessSettings() {
  const { data } = useAdminSettings();
  const [s, setS] = useState<Settings | null>(null);
  const [testTo, setTestTo] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const qc = useQueryClient();
  useEffect(() => {
    if (data) setS(data);
  }, [data]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadFile(file);
      setS((prev) => (prev ? { ...prev, logo: url } : prev));
      toast.success("Logo uploaded! Click 'Save settings' below to apply.");
    } catch (err) {
      toast.error((err as Error).message || "Logo upload failed");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const save = useMutation({
    mutationFn: (body: Settings) => api<Settings>("/api/admin/settings", { method: "PUT", body }),
    onSuccess: (r) => {
      qc.setQueryData(["settings"], r);
      void qc.invalidateQueries({ queryKey: ["public-config"] });
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(e.message),
  });
  const test = useMutation({
    mutationFn: () => api<{ dev: boolean }>("/api/admin/test-email", { body: { to: testTo } }),
    onSuccess: (r) => toast.success(r.dev ? "SMTP not configured — email printed in server console" : "Test email sent. Check the inbox."),
    onError: (e) => toast.error(e.message),
  });

  if (!s) return <Spinner />;
  const t = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: k === "minKm" ? Number(e.target.value) : e.target.value });

  return (
    <>
      <Section title="Business & booking settings" icon={ShieldCheck}>
        {/* Logo settings */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <label className="mb-2 block text-sm font-semibold text-slate-900">Website Logo</label>
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-16 w-48 items-center justify-center rounded-lg border border-slate-300 bg-slate-900 p-2 shadow-inner">
              <img
                src={s.logo || "/logo.png"}
                alt="Logo Preview"
                className="max-h-12 max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.png";
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow transition hover:bg-amber-500">
                <Upload className="size-4" />
                {uploadingLogo ? "Uploading..." : "Upload New Logo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={handleLogoUpload}
                />
              </label>
              {s.logo && s.logo !== "/logo.png" && (
                <button
                  type="button"
                  onClick={() => setS({ ...s, logo: "/logo.png" })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  title="Reset to default /logo.png"
                >
                  <RotateCcw className="size-3.5" /> Reset Default
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Preview shown above on dark background. Click &quot;Save settings&quot; to apply your new logo across the website and admin panel.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name">
            <Input value={s.businessName} onChange={t("businessName")} />
          </Field>
          <Field label="Phone number (shown on site)">
            <Input value={s.phone} onChange={t("phone")} />
          </Field>
          <Field label="WhatsApp number (with country code)" hint="e.g. 919843600457">
            <Input value={s.whatsapp} onChange={t("whatsapp")} />
          </Field>
          <Field label="Default pickup city">
            <Input value={s.homeOrigin} onChange={t("homeOrigin")} />
          </Field>
          <Field label="Minimum km charged per trip">
            <Input type="number" min={0} value={s.minKm} onChange={t("minKm")} />
          </Field>
          <Field label="Announcement banner on website (optional)" hint="e.g. Diwali offer: 10% off on Innova">
            <Input value={s.announcement} onChange={t("announcement")} />
          </Field>
        </div>
        <div className="mt-5 space-y-3">
          <Toggle checked={s.acceptingBookings} onChange={(v) => setS({ ...s, acceptingBookings: v })} label="Accept online bookings" />
          <br />
          <Toggle checked={s.requireEmailOtp} onChange={(v) => setS({ ...s, requireEmailOtp: v })} label="Customers must verify their email with a code (OTP) before booking" />
          <br />
          <Toggle
            checked={s.emailCustomerOnStatusChange}
            onChange={(v) => setS({ ...s, emailCustomerOnStatusChange: v })}
            label="Email customer when booking status changes (confirmed, driver assigned, …)"
          />
        </div>
        <div className="mt-5 flex justify-end">
          <Btn loading={save.isPending} onClick={() => save.mutate(s)}>
            Save settings
          </Btn>
        </div>
      </Section>

      <Section title="Email (Nodemailer)" icon={Mail}>
        <div className={`mb-4 rounded-lg p-3 text-sm ${s.mailConfigured ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
          {s.mailConfigured
            ? "SMTP is configured. Emails are being sent."
            : "SMTP is not configured yet. Add SMTP_HOST, SMTP_USER and SMTP_PASS to the server's .env file (see .env.example), then restart the server. Until then emails are only printed in the server log."}
        </div>
        <Field label="Send new-booking emails to (comma separated)" hint="These addresses get an email for every new website booking.">
          <Input value={s.adminNotifyEmails} onChange={t("adminNotifyEmails")} placeholder="owner@gmail.com, office@gmail.com" />
        </Field>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <Field label="Send a test email to">
              <Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="your email" />
            </Field>
          </div>
          <Btn variant="secondary" loading={test.isPending} onClick={() => test.mutate()}>
            Send test
          </Btn>
          <Btn loading={save.isPending} onClick={() => save.mutate(s)}>
            Save
          </Btn>
        </div>
      </Section>
    </>
  );
}

function AdminUsers({ meId }: { meId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admins"], queryFn: () => api<AdminUser[]>("/api/admin/admins") });
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: "", email: "", password: "", role: "staff" });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["admins"] });

  const create = useMutation({
    mutationFn: () => api("/api/admin/admins", { body: f }),
    onSuccess: () => {
      refresh();
      toast.success("Admin user added");
      setAdding(false);
      setF({ name: "", email: "", password: "", role: "staff" });
    },
    onError: (e) => toast.error(e.message),
  });
  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api(`/api/admin/admins/${id}`, { method: "PATCH", body }),
    onSuccess: () => {
      refresh();
      toast.success("Updated");
    },
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => api(`/api/admin/admins/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      refresh();
      toast.success("Admin removed");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Section title="Admin users" icon={KeyRound} desc="Full admins can change prices, routes and settings. Staff can only manage bookings and customers.">
      <div className="divide-y divide-slate-100">
        {(data ?? []).map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-semibold text-slate-900">
                {a.name} {a.id === meId && <span className="text-xs text-slate-400">(you)</span>}
              </p>
              <p className="text-xs text-slate-500">
                {a.email} · last login {fmtDate(a.lastLoginAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={a.role}
                onChange={(e) => patch.mutate({ id: a.id, body: { role: e.target.value } })}
                className="w-32 py-1.5"
              >
                <option value="admin">Full admin</option>
                <option value="staff">Staff</option>
              </Select>
              <Toggle checked={a.active} onChange={(active) => patch.mutate({ id: a.id, body: { active } })} label={a.active ? "Active" : "Disabled"} />
              <Btn
                variant="ghost"
                onClick={() => {
                  const password = prompt(`New password for ${a.email} (min 8 characters):`);
                  if (password) patch.mutate({ id: a.id, body: { password } });
                }}
              >
                Reset password
              </Btn>
              {a.id !== meId && (
                <Btn variant="ghost" className="text-red-600" onClick={() => confirm(`Remove ${a.email}?`) && del.mutate(a.id)} aria-label="Delete">
                  <Trash2 className="size-4" />
                </Btn>
              )}
            </div>
          </div>
        ))}
      </div>
      <Btn variant="secondary" className="mt-3" onClick={() => setAdding(true)}>
        <Plus className="size-4" /> Add admin user
      </Btn>
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add admin user"
        footer={
          <Btn loading={create.isPending} onClick={() => create.mutate()}>
            Add
          </Btn>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Field>
          <Field label="Email (login)">
            <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Field>
          <Field label="Password (min 8 characters)">
            <Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          </Field>
          <Field label="Role">
            <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
              <option value="staff">Staff (bookings & customers only)</option>
              <option value="admin">Full admin</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </Section>
  );
}

function ChangePassword() {
  const [f, setF] = useState({ currentPassword: "", newPassword: "" });
  const m = useMutation({
    mutationFn: () => api("/api/admin/change-password", { body: f }),
    onSuccess: () => {
      toast.success("Password changed");
      setF({ currentPassword: "", newPassword: "" });
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Section title="Change my password" icon={KeyRound}>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Current password">
          <Input type="password" autoComplete="current-password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} />
        </Field>
        <Field label="New password (min 8)">
          <Input type="password" autoComplete="new-password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} />
        </Field>
        <Btn loading={m.isPending} onClick={() => m.mutate()}>
          Update
        </Btn>
      </div>
    </Section>
  );
}
