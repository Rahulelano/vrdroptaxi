import { useEffect, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { X, Loader2 } from "lucide-react";
import type { BookingStatus } from "@/lib/api";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string | undefined; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

type BtnVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
const btnStyles: Record<BtnVariant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-slate-600 hover:bg-slate-100",
  success: "bg-green-600 text-white hover:bg-green-700",
};

export function Btn({
  variant = "primary",
  loading = false,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${btnStyles[variant]} ${className}`}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string | undefined }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm text-slate-700"
      aria-pressed={checked}
    >
      <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-green-500" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:items-center" onMouseDown={onClose}>
      <div
        className={`my-8 w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl bg-white shadow-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export const STATUS_META: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmed", cls: "bg-blue-100 text-blue-800" },
  assigned: { label: "Driver Assigned", cls: "bg-indigo-100 text-indigo-800" },
  ongoing: { label: "On Trip", cls: "bg-purple-100 text-purple-800" },
  completed: { label: "Completed", cls: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-700" },
};
export const STATUSES = Object.keys(STATUS_META) as BookingStatus[];

export function StatusBadge({ status }: { status: BookingStatus }) {
  const m = STATUS_META[status] ?? { label: status, cls: "bg-slate-100 text-slate-700" };
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${m.cls}`}>{m.label}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="py-12 text-center text-sm text-slate-400">{children}</div>;
}

export function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="size-6 animate-spin text-slate-400" />
    </div>
  );
}

export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";

export const tripLabel = { one: "One Way", round: "Round Trip", package: "Package" } as const;
