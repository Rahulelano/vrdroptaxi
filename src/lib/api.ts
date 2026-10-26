import { useQuery } from "@tanstack/react-query";

export const API_URL = (import.meta.env["VITE_API_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

export type TripType = "one" | "round" | "package";
export type BookingStatus = "pending" | "confirmed" | "assigned" | "ongoing" | "completed" | "cancelled";

export interface Vehicle {
  id: string;
  name: string;
  sub: string;
  img: string;
  oneway: number;
  round: number;
  bata: number;
  pkg: number;
  passengers: number;
  bags: number;
  features: string[];
  active: boolean;
  popular: boolean;
  sort: number;
}

export interface TaxiRoute {
  id: string;
  from: string;
  to: string;
  km: number;
  hrs: string;
  img: string;
  note: string;
  active: boolean;
  featured: boolean;
  sort: number;
}

export interface PublicSettings {
  businessName: string;
  logo?: string;
  phone: string;
  whatsapp: string;
  homeOrigin: string;
  minKm: number;
  requireEmailOtp: boolean;
  acceptingBookings: boolean;
  announcement: string;
}

export interface Settings extends PublicSettings {
  adminNotifyEmails: string;
  emailCustomerOnStatusChange: boolean;
  mailConfigured: boolean;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleNo: string;
  vehicleType: string;
  licenseNo?: string;
  notes?: string;
  active: boolean;
  tripCount?: number;
  activeTrips?: number;
}

export interface Booking {
  id: string;
  ref: string;
  name: string;
  phone: string;
  email: string;
  from: string;
  to: string;
  tripType: TripType;
  date: string;
  time: string;
  vehicleId: string;
  vehicleName: string;
  distanceKm: number;
  estimatedFare: number;
  finalFare: number | null;
  status: BookingStatus;
  driverId: string | null;
  driver: Driver | null;
  notes: string;
  adminNotes: string;
  source: string;
  emailVerified: boolean;
  customerId: string;
  createdAt: string;
  updatedAt: string;
  history: { at: string; status: string; by: string; note?: string }[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  blocked: boolean;
  notes: string;
  createdAt: string;
  lastBookingAt?: string;
  bookingCount: number;
  completedCount: number;
  totalSpent: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type PopupType = "image" | "video" | "offer";
export interface Popup {
  id: string;
  type: PopupType;
  title: string;
  message: string;
  mediaUrl: string;
  ctaText: string;
  ctaLink: string;
  couponCode: string;
  bgColor: string;
  pages: "all" | "home" | "routes";
  frequency: "session" | "day" | "always" | "once";
  delaySec: number;
  startAt: string;
  endAt: string;
  active: boolean;
  sort: number;
}

export interface PublicConfig {
  settings: PublicSettings;
  vehicles: Vehicle[];
  routes: TaxiRoute[];
  popups?: Popup[];
}

// ---- Fare (must match server/index.js computeFare) ----
export function computeFare(v: Vehicle | undefined, trip: TripType, km: number, minKm: number) {
  if (!v) return 0;
  if (trip === "package") return v.pkg > 0 ? v.pkg : 0;
  if (trip === "round") return Math.round(v.round * Math.max(km * 2, minKm) + v.bata);
  return Math.round(v.oneway * Math.max(km, minKm) + v.bata);
}

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

// ---- HTTP ----
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const TOKEN_KEY = "dtx_admin_token";
export const adminToken = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string | null) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const token = adminToken.get();
  if (token && path.startsWith("/api/admin")) headers["Authorization"] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
      headers,
      ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
    });
  } catch {
    throw new ApiError(0, "Cannot reach server. Check your internet connection.");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    if (res.status === 401 && path.startsWith("/api/admin") && !path.endsWith("/login")) {
      adminToken.set(null);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) window.location.href = "/admin/login";
    }
    throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export async function uploadFile(file: File): Promise<string> {
  const res = await fetch(`${API_URL}/api/admin/uploads`, {
    method: "POST",
    headers: { "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name), Authorization: `Bearer ${adminToken.get() ?? ""}` },
    body: file,
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new ApiError(res.status, data.error ?? (res.status === 413 ? "File is too large (max 25 MB)." : "Upload failed"));
  return data.url;
}

// ---- Public site config, with the old hardcoded values as an offline fallback ----
const img = (n: string) => `/destinations/${n.toLowerCase()}.png`;
export const FALLBACK_CONFIG: PublicConfig = {
  settings: {
    businessName: "Droptaxii",
    logo: "/logo.png",
    phone: "+919843600457",
    whatsapp: "919843600457",
    homeOrigin: "Chennai",
    minKm: 130,
    requireEmailOtp: true,
    acceptingBookings: true,
    announcement: "",
  },
  vehicles: [
    ["sedan", "Sedan AC", "Swift Dzire / Etios / Amaze or Similar", "/swift.jpg", 15, 14, 400, 300, 4, 2, ["Up to 4 Passengers", "Air-Conditioned Vehicle", "Medium Luggage Space", "Comfortable Budget Travel"]],
    ["suv", "SUV / Ertiga AC", "Ertiga / Xylo / Kia Carens or Similar", "/ertica.jpg", 20, 19, 500, 400, 7, 4, ["Up to 6 – 7 Passengers", "Spacious Air-Conditioned Cabin", "Large Luggage Space", "Best for Family Travel"]],
    ["innova", "Innova AC", "Toyota Innova", "/innova.jpg", 21, 19, 500, 0, 7, 5, ["Up to 7 Passengers", "Premium Comfortable Ride", "Extra Spacious Cabin", "Ideal for Long-Distance Trips"]],
    ["tempo", "Tempo Traveller", "12 to 14 Seater", "/tempo.jpg", 26, 26, 800, 0, 14, 8, ["12 to 14 Passengers", "Air-Conditioned Vehicle", "Spacious Luggage Space", "Ideal for Group Travel"]],
  ].map(([id, name, sub, image, oneway, round, bata, pkg, passengers, bags, features], i) => ({
    id: id as string,
    name: name as string,
    sub: sub as string,
    img: image as string,
    oneway: oneway as number,
    round: round as number,
    bata: bata as number,
    pkg: pkg as number,
    passengers: passengers as number,
    bags: bags as number,
    features: features as string[],
    active: true,
    popular: false,
    sort: i,
  })),
  routes: (
    [
      ["Madurai", "~8 hrs", 460],
      ["Thirunelveli", "~10.5 hrs", 625],
      ["Coimbatore", "~9 hrs", 510],
      ["Trichy", "~6 hrs", 330],
      ["Salem", "~6.5 hrs", 345],
      ["Bangalore", "~6.5 hrs", 350],
      ["Cochin", "~12 hrs", 690],
      ["Thiruvananthapuram", "~13 hrs", 770],
      ["Tirupathi", "~3 hrs", 135],
      ["Pondicherry", "~3.5 hrs", 165],
      ["Vellore", "~3 hrs", 140],
      ["Ooty", "~10.5 hrs", 550],
      ["Erode", "~7.5 hrs", 400],
    ] as const
  ).map(([to, hrs, km], i) => ({
    id: to,
    from: "Chennai",
    to,
    hrs,
    km,
    img: img(to),
    note: "",
    active: true,
    featured: i < 10,
    sort: i,
  })),
};

export function usePublicConfig() {
  const q = useQuery({
    queryKey: ["public-config"],
    queryFn: () => api<PublicConfig>("/api/public/config"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return q.data ?? FALLBACK_CONFIG;
}

export const waLink = (number: string, text: string) => `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
