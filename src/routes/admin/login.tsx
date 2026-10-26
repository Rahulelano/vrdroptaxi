import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Btn, Field, Input } from "@/components/admin/ui";
import { api, adminToken, usePublicConfig, type AdminUser } from "@/lib/api";

export const Route = createFileRoute("/admin/login")({
  validateSearch: (s: Record<string, unknown>): { reset?: string } => (typeof s["reset"] === "string" ? { reset: s["reset"] } : {}),
  component: LoginPage,
});

function LoginPage() {
  const { reset } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "forgot" | "reset">(reset ? "reset" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { settings } = usePublicConfig();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const r = await api<{ token: string; admin: AdminUser }>("/api/admin/login", { body: { email, password } });
        adminToken.set(r.token);
        qc.setQueryData(["me"], r.admin);
        void navigate({ to: "/admin" });
      } else if (mode === "forgot") {
        await api("/api/admin/forgot-password", { body: { email } });
        toast.success("If this email is registered, a reset link has been sent.");
        setMode("login");
      } else {
        await api("/api/admin/reset-password", { body: { token: reset, password } });
        toast.success("Password updated. Please log in.");
        setPassword("");
        setMode("login");
        void navigate({ to: "/admin/login", search: {} });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const title = { login: "Admin Login", forgot: "Forgot Password", reset: "Set New Password" }[mode];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={settings.logo || "/logo.png"} alt="" className="mb-4 h-14 w-auto rounded-lg bg-slate-900 p-2 object-contain" />
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
            <Lock className="size-5" /> {title}
          </h1>
        </div>
        <div className="space-y-4">
          {mode !== "reset" && (
            <Field label="Email">
              <Input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          )}
          {mode !== "forgot" && (
            <Field label={mode === "reset" ? "New password (min 8 characters)" : "Password"}>
              <Input
                type="password"
                required
                minLength={mode === "reset" ? 8 : 1}
                autoComplete={mode === "reset" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          )}
          <Btn type="submit" loading={loading} className="w-full py-3">
            {mode === "login" ? "Log in" : mode === "forgot" ? "Send reset link" : "Update password"}
          </Btn>
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "forgot" : "login")}
            className="block w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            {mode === "login" ? "Forgot password?" : "Back to login"}
          </button>
        </div>
      </form>
    </div>
  );
}
