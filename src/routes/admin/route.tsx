import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  IndianRupee,
  MapPinned,
  UserRound,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Wifi,
  WifiOff,
  Megaphone,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/admin/ui";
import { useMe } from "@/components/admin/hooks";
import { adminToken, API_URL, usePublicConfig, type AdminUser, type Booking } from "@/lib/api";
import { playAlertSound } from "@/lib/push";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/pricing", label: "Vehicles & Pricing", icon: IndianRupee },
  { to: "/admin/destinations", label: "Routes & Destinations", icon: MapPinned },
  { to: "/admin/drivers", label: "Drivers", icon: UserRound },
  { to: "/admin/popups", label: "Website Popups", icon: Megaphone },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname.startsWith("/admin/login");
  const navigate = useNavigate();
  const me = useMe();

  useEffect(() => {
    if (!isLogin && !adminToken.get()) void navigate({ to: "/admin/login" });
  }, [isLogin, navigate]);

  if (isLogin)
    return (
      <>
        <Outlet />
        <Toaster position="top-center" richColors />
      </>
    );
  if (!adminToken.get() || me.isLoading || !me.data) return <Spinner />;
  return <Shell admin={me.data} pathname={pathname} />;
}

function Shell({ admin, pathname }: { admin: AdminUser; pathname: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const live = useLiveBookings(() => setNewCount((n) => n + 1));
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (pathname.startsWith("/admin/bookings")) setNewCount(0);
    setMenuOpen(false);
  }, [pathname]);

  const logout = () => {
    adminToken.set(null);
    qc.clear();
    void navigate({ to: "/admin/login" });
  };

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = "exact" in item ? pathname === item.to || pathname === item.to + "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
              active ? "bg-amber-500 text-slate-900" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <item.icon className="size-4" />
            <span className="flex-1">{item.label}</span>
            {item.to === "/admin/bookings" && newCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 text-xs font-bold text-white">{newCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster position="top-right" richColors closeButton />
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-slate-900 p-4 lg:flex">
        <Brand />
        <div className="mt-6 flex-1">{nav}</div>
        <Footer admin={admin} live={live} onLogout={logout} />
      </aside>

      {/* Top bar (mobile) */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-slate-900 px-4 py-3 lg:hidden">
        <Brand />
        <button onClick={() => setMenuOpen((v) => !v)} className="relative rounded-lg p-2 text-white" aria-label="Menu">
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          {newCount > 0 && <span className="absolute right-1 top-1 size-2.5 rounded-full bg-red-500" />}
        </button>
      </div>
      {menuOpen && (
        <div className="fixed inset-x-0 top-[60px] z-40 bg-slate-900 p-4 shadow-xl lg:hidden">
          {nav}
          <div className="mt-4">
            <Footer admin={admin} live={live} onLogout={logout} />
          </div>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

function Brand() {
  const { settings } = usePublicConfig();
  return (
    <Link to="/admin" className="flex items-center gap-2">
      <img src={settings.logo || "/logo.png"} alt={settings.businessName || "Admin"} className="h-9 w-auto max-w-[120px] object-contain" />
      <span className="text-sm font-bold text-amber-400">Admin</span>
    </Link>
  );
}

function Footer({ admin, live, onLogout }: { admin: AdminUser; live: boolean; onLogout: () => void }) {
  return (
    <div className="space-y-3 border-t border-slate-800 pt-4 text-sm">
      <div className="flex items-center gap-2 text-xs" title={live ? "Live booking alerts connected" : "Reconnecting…"}>
        {live ? <Wifi className="size-3.5 text-green-400" /> : <WifiOff className="size-3.5 text-red-400" />}
        <span className={live ? "text-green-400" : "text-red-400"}>{live ? "Live alerts on" : "Reconnecting…"}</span>
      </div>
      <div className="text-slate-300">
        <p className="font-semibold text-white">{admin.name}</p>
        <p className="text-xs">{admin.email} · {admin.role === "admin" ? "Full admin" : "Staff"}</p>
      </div>
      <div className="flex gap-2">
        <a href="/" target="_blank" className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700">
          <ExternalLink className="size-3.5" /> Website
        </a>
        <button onClick={onLogout} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700">
          <LogOut className="size-3.5" /> Logout
        </button>
      </div>
    </div>
  );
}

// Listens to the server's event stream; new bookings trigger toast + sound + refresh.
function useLiveBookings(onNew: () => void) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [live, setLive] = useState(false);

  useEffect(() => {
    const token = adminToken.get();
    if (!token) return;
    const es = new EventSource(`${API_URL}/api/admin/events?token=${encodeURIComponent(token)}`);
    const refresh = () => {
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["stats"] });
      void qc.invalidateQueries({ queryKey: ["customers"] });
    };
    es.addEventListener("ready", () => setLive(true));
    es.onerror = () => setLive(false);
    es.addEventListener("booking:new", (e) => {
      const b = JSON.parse((e as MessageEvent<string>).data) as Booking;
      refresh();
      if (b.source === "admin") return;
      onNew();
      playAlertSound();
      toast.success(`New booking ${b.ref}`, {
        description: `${b.name} · ${b.phone}\n${b.from} → ${b.to} · ${b.date || "date TBD"} ${b.time || ""}`,
        duration: 30_000,
        action: { label: "View", onClick: () => void navigate({ to: "/admin/bookings", search: { id: b.id } }) },
      });
      // Tab is open but hidden and push isn't set up -> show a basic system notification.
      if (document.hidden && "Notification" in window && Notification.permission === "granted") {
        navigator.serviceWorker?.getRegistration("/admin-sw.js").then((reg) => {
          if (!reg) new Notification(`🚕 New booking ${b.ref}`, { body: `${b.name} · ${b.from} → ${b.to}`, icon: "/favicon.png" });
        });
      }
    });
    es.addEventListener("booking:update", refresh);
    es.addEventListener("booking:delete", refresh);
    es.addEventListener("test", () => {
      playAlertSound();
      toast.info("🔔 Test alert received on this screen");
    });
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return live;
}
