import type {
  Booking,
  BookingInput,
  ChatResponse,
  DashboardStats,
  Lead,
  LeadInput,
  Property,
  PropertyInput,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/* ---------------- Chat ---------------- */

export function sendChatMessage(message: string, conversationId?: string) {
  return request<ChatResponse>("/chat/", {
    method: "POST",
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });
}

/* ---------------- Properties ---------------- */

export interface PropertyFilters {
  city?: string;
  property_type?: string;
  status?: string;
  listing_type?: string;
  search?: string;
}

export function getProperties(filters: PropertyFilters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v) as [string, string][]
  );
  const qs = params.toString();
  return request<Property[]>(`/properties/${qs ? `?${qs}` : ""}`);
}

export function createProperty(data: PropertyInput) {
  return request<Property>("/properties/", { method: "POST", body: JSON.stringify(data) });
}

export function updateProperty(id: number, data: Partial<PropertyInput>) {
  return request<Property>(`/properties/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteProperty(id: number) {
  return request<void>(`/properties/${id}`, { method: "DELETE" });
}

/* ---------------- Leads ---------------- */

export function getLeads(params: { status_filter?: string; search?: string } = {}) {
  const search = new URLSearchParams();
  if (params.status_filter) search.set("status_filter", params.status_filter);
  if (params.search) search.set("search", params.search);
  const qs = search.toString();
  return request<Lead[]>(`/leads/${qs ? `?${qs}` : ""}`);
}

export function getLead(id: number) {
  return request<Lead>(`/leads/${id}`);
}

export function createLead(data: LeadInput) {
  return request<Lead>("/leads/", { method: "POST", body: JSON.stringify(data) });
}

export function updateLead(id: number, data: LeadInput) {
  return request<Lead>(`/leads/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteLead(id: number) {
  return request<void>(`/leads/${id}`, { method: "DELETE" });
}

/* ---------------- Bookings ---------------- */

export function getBookings(statusFilter?: string) {
  const qs = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : "";
  return request<Booking[]>(`/bookings/${qs}`);
}

export function createBooking(data: BookingInput) {
  return request<Booking>("/bookings/", { method: "POST", body: JSON.stringify(data) });
}

export function updateBookingStatus(id: number, status: string) {
  return request<Booking>(`/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function cancelBooking(id: number) {
  return request<void>(`/bookings/${id}`, { method: "DELETE" });
}

/* ---------------- Stats ---------------- */

export function getDashboardStats() {
  return request<DashboardStats>("/stats/");
}
