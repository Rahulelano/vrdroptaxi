import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, Upload, Image as ImageIcon, Video, Tag } from "lucide-react";
import { Btn, Card, Empty, Field, Input, Modal, PageHeader, Select, Spinner, Textarea, Toggle, fmtDate } from "@/components/admin/ui";
import { useMe } from "@/components/admin/hooks";
import { PopupView, mediaSrc } from "@/components/SitePopup";
import { api, uploadFile, type Popup, type PopupType } from "@/lib/api";

export const Route = createFileRoute("/admin/popups")({ component: PopupsPage });

const TYPE_META: Record<PopupType, { label: string; icon: React.ElementType }> = {
  image: { label: "Image", icon: ImageIcon },
  video: { label: "Video", icon: Video },
  offer: { label: "Offer", icon: Tag },
};
const FREQ = { session: "Once per visit", day: "Once a day", once: "Only once ever", always: "Every page load" } as const;
const PAGES = { all: "All pages", home: "Home page only", routes: "Route pages only" } as const;

const EMPTY: Partial<Popup> = {
  type: "offer",
  title: "",
  message: "",
  mediaUrl: "",
  ctaText: "Book Now",
  ctaLink: "/routes",
  couponCode: "",
  bgColor: "",
  pages: "all",
  frequency: "session",
  delaySec: 2,
  startAt: "",
  endAt: "",
  active: true,
  sort: 0,
};

function status(p: Popup) {
  const t = new Date().toISOString();
  if (!p.active) return { label: "Off", cls: "bg-slate-100 text-slate-600" };
  if (p.startAt && p.startAt > t) return { label: "Scheduled", cls: "bg-blue-100 text-blue-700" };
  if (p.endAt && p.endAt < t) return { label: "Expired", cls: "bg-red-100 text-red-700" };
  return { label: "Live", cls: "bg-green-100 text-green-700" };
}

function PopupsPage() {
  const qc = useQueryClient();
  const isAdmin = useMe().data?.role === "admin";
  const { data, isLoading } = useQuery({ queryKey: ["popups"], queryFn: () => api<Popup[]>("/api/admin/popups") });
  const [editing, setEditing] = useState<Partial<Popup> | null>(null);
  const [preview, setPreview] = useState<Popup | null>(null);
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["popups"] });
    void qc.invalidateQueries({ queryKey: ["public-config"] });
  };

  const save = useMutation({
    mutationFn: (p: Partial<Popup>) => (p.id ? api(`/api/admin/popups/${p.id}`, { method: "PATCH", body: p }) : api("/api/admin/popups", { body: p })),
    onSuccess: () => {
      refresh();
      toast.success("Popup saved");
      setEditing(null);
    },
    onError: (e) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: (p: Popup) => api(`/api/admin/popups/${p.id}`, { method: "PATCH", body: { active: !p.active } }),
    onSuccess: refresh,
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => api(`/api/admin/popups/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      refresh();
      toast.success("Popup deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Website Popups"
        subtitle="Show an image, video or offer to visitors when they open the website. Only one popup is shown at a time — the first live one (by order) that matches the page."
        actions={
          isAdmin && (
            <Btn onClick={() => setEditing({ ...EMPTY })}>
              <Plus className="size-4" /> New popup
            </Btn>
          )
        }
      />
      {isLoading || !data ? (
        <Spinner />
      ) : data.length === 0 ? (
        <Card>
          <Empty>No popups yet. Create one to show an offer, poster or video to visitors.</Empty>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => {
            const st = status(p);
            const T = TYPE_META[p.type];
            return (
              <Card key={p.id} className="flex flex-col p-0 overflow-hidden">
                <div className="relative grid h-40 place-items-center bg-slate-100">
                  {p.type === "image" && p.mediaUrl ? (
                    <img src={mediaSrc(p.mediaUrl)} alt="" className="h-full w-full object-cover" />
                  ) : p.type === "video" && p.mediaUrl && !/youtu/.test(p.mediaUrl) ? (
                    <video src={mediaSrc(p.mediaUrl)} muted className="h-full w-full object-cover" />
                  ) : p.type === "offer" ? (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-slate-900 to-blue-900 p-4 text-center text-white">
                      <div>
                        <p className="text-lg font-black">{p.title}</p>
                        {p.couponCode && <p className="mt-1 font-mono text-amber-300">{p.couponCode}</p>}
                      </div>
                    </div>
                  ) : (
                    <T.icon className="size-10 text-slate-400" />
                  )}
                  <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold ${st.cls}`}>{st.label}</span>
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    <T.icon className="size-3" /> {T.label}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-bold text-slate-900">{p.title || "(no title)"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {PAGES[p.pages]} · {FREQ[p.frequency]} · after {p.delaySec}s
                  </p>
                  {(p.startAt || p.endAt) && (
                    <p className="text-xs text-slate-500">
                      {p.startAt ? fmtDate(p.startAt) : "now"} → {p.endAt ? fmtDate(p.endAt) : "no end"}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                    <Toggle checked={p.active} onChange={() => isAdmin && toggle.mutate(p)} label={p.active ? "On" : "Off"} />
                    <div className="flex gap-1">
                      <Btn variant="ghost" onClick={() => setPreview(p)} aria-label="Preview">
                        <Eye className="size-4" />
                      </Btn>
                      {isAdmin && (
                        <>
                          <Btn variant="ghost" onClick={() => setEditing(p)} aria-label="Edit">
                            <Pencil className="size-4" />
                          </Btn>
                          <Btn variant="ghost" className="text-red-600" onClick={() => confirm("Delete this popup?") && del.mutate(p.id)} aria-label="Delete">
                            <Trash2 className="size-4" />
                          </Btn>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editing && <PopupForm initial={editing} saving={save.isPending} onClose={() => setEditing(null)} onSave={(p) => save.mutate(p)} onPreview={setPreview} />}
      {preview && <PopupView popup={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

// datetime-local <-> ISO
const toLocal = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : "");

function PopupForm({
  initial,
  saving,
  onClose,
  onSave,
  onPreview,
}: {
  initial: Partial<Popup>;
  saving: boolean;
  onClose: () => void;
  onSave: (p: Partial<Popup>) => void;
  onPreview: (p: Popup) => void;
}) {
  const [p, setP] = useState<Partial<Popup>>({ ...EMPTY, ...initial });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Popup>(k: K, v: Popup[K]) => setP((x) => ({ ...x, [k]: v }));
  const type = p.type ?? "offer";

  const onFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      set("mediaUrl", await uploadFile(file));
      toast.success("Uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={initial.id ? "Edit popup" : "New popup"}
      footer={
        <>
          <Btn variant="secondary" className="mr-auto" onClick={() => onPreview({ ...EMPTY, ...p, id: p.id ?? "preview" } as Popup)}>
            <Eye className="size-4" /> Preview
          </Btn>
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn loading={saving} onClick={() => onSave(p)}>
            Save
          </Btn>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <span className="mb-2 block text-xs font-semibold text-slate-600">Popup type</span>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TYPE_META) as PopupType[]).map((t) => {
              const M = TYPE_META[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("type", t)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-sm font-bold ${type === t ? "border-amber-500 bg-amber-50 text-slate-900" : "border-slate-200 text-slate-500"}`}
                >
                  <M.icon className="size-5" /> {M.label}
                </button>
              );
            })}
          </div>
        </div>

        {type !== "offer" && (
          <div className="rounded-xl border border-dashed border-slate-300 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Field
                  label={type === "image" ? "Image URL" : "Video URL"}
                  hint={type === "image" ? "Upload a poster (JPG/PNG/WEBP, square or portrait works best) or paste a link." : "Upload an MP4 (max 25 MB) or paste a YouTube link."}
                >
                  <Input value={p.mediaUrl ?? ""} onChange={(e) => set("mediaUrl", e.target.value)} placeholder={type === "video" ? "https://youtu.be/…" : "https://…"} />
                </Field>
              </div>
              <input
                ref={fileRef}
                type="file"
                hidden
                accept={type === "image" ? "image/jpeg,image/png,image/webp,image/gif" : "video/mp4,video/webm"}
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
              <Btn variant="secondary" loading={uploading} onClick={() => fileRef.current?.click()}>
                <Upload className="size-4" /> Upload
              </Btn>
            </div>
            {p.mediaUrl && type === "image" && <img src={mediaSrc(p.mediaUrl)} alt="" className="mt-3 max-h-40 rounded-lg" />}
            {p.mediaUrl && type === "video" && !/youtu/.test(p.mediaUrl) && <video src={mediaSrc(p.mediaUrl)} controls muted className="mt-3 max-h-40 rounded-lg" />}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={type === "offer" ? "Offer headline *" : "Title (optional)"}>
            <Input value={p.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder={type === "offer" ? "Flat ₹500 OFF on Innova" : ""} />
          </Field>
          {type === "offer" && (
            <Field label="Coupon code (optional)">
              <Input value={p.couponCode ?? ""} onChange={(e) => set("couponCode", e.target.value.toUpperCase())} placeholder="DIWALI500" />
            </Field>
          )}
          <div className="sm:col-span-2">
            <Field label="Message (optional)">
              <Textarea value={p.message ?? ""} onChange={(e) => set("message", e.target.value)} placeholder="Valid on all one-way trips above 300 km till 31 Oct." />
            </Field>
          </div>
          <Field label="Button text" hint="Leave empty for no button">
            <Input value={p.ctaText ?? ""} onChange={(e) => set("ctaText", e.target.value)} />
          </Field>
          <Field label="Button link" hint="/routes, a full URL, tel:+91… or https://wa.me/91…">
            <Input value={p.ctaLink ?? ""} onChange={(e) => set("ctaLink", e.target.value)} />
          </Field>
          <Field label="Show on">
            <Select value={p.pages} onChange={(e) => set("pages", e.target.value as Popup["pages"])}>
              {Object.entries(PAGES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="How often">
            <Select value={p.frequency} onChange={(e) => set("frequency", e.target.value as Popup["frequency"])}>
              {Object.entries(FREQ).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Show after (seconds)">
            <Input type="number" min={0} max={120} value={p.delaySec ?? 2} onChange={(e) => set("delaySec", Number(e.target.value))} />
          </Field>
          <Field label="Order (smaller shows first)">
            <Input type="number" value={p.sort ?? 0} onChange={(e) => set("sort", Number(e.target.value))} />
          </Field>
          <Field label="Start (optional)">
            <Input type="datetime-local" value={toLocal(p.startAt)} onChange={(e) => set("startAt", fromLocal(e.target.value))} />
          </Field>
          <Field label="End (optional)" hint="Popup hides automatically after this">
            <Input type="datetime-local" value={toLocal(p.endAt)} onChange={(e) => set("endAt", fromLocal(e.target.value))} />
          </Field>
        </div>
        <Toggle checked={p.active ?? true} onChange={(v) => set("active", v)} label="Popup is ON" />
      </div>
    </Modal>
  );
}
