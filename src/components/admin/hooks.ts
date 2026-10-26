import { useQuery } from "@tanstack/react-query";
import { api, adminToken, type AdminUser, type Driver, type Settings, type Vehicle } from "@/lib/api";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ admin: AdminUser }>("/api/admin/me").then((r) => r.admin),
    enabled: Boolean(adminToken.get()),
    staleTime: 60_000,
    retry: false,
  });
}

export const useVehicles = () => useQuery({ queryKey: ["vehicles"], queryFn: () => api<Vehicle[]>("/api/admin/vehicles") });
export const useDrivers = () => useQuery({ queryKey: ["drivers"], queryFn: () => api<Driver[]>("/api/admin/drivers") });
export const useAdminSettings = () => useQuery({ queryKey: ["settings"], queryFn: () => api<Settings>("/api/admin/settings") });
