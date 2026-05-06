import { apiUrl } from "../apiBase";
import type { Booking, FoodTruck } from "../../types.ts";

export interface ApiMeta {
  name: string;
  version: string;
  features: string[];
}

export async function fetchApiMeta(): Promise<ApiMeta | null> {
  try {
    const r = await fetch(apiUrl("/api/v1/meta"));
    if (!r.ok) return null;
    return (await r.json()) as ApiMeta;
  } catch {
    return null;
  }
}

export async function fetchTrucksFromApi(count: number): Promise<FoodTruck[] | null> {
  try {
    const q = Math.min(500, Math.max(50, Math.floor(count)));
    const r = await fetch(apiUrl(`/api/v1/trucks?count=${q}`));
    if (!r.ok) return null;
    const j = (await r.json()) as { trucks?: FoodTruck[] };
    return j.trucks ?? null;
  } catch {
    return null;
  }
}

export async function fetchBookingsForUser(
  userId: string,
): Promise<Booking[] | null> {
  try {
    const r = await fetch(
      apiUrl(`/api/v1/bookings?userId=${encodeURIComponent(userId)}`),
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { bookings?: Booking[] };
    return j.bookings ?? [];
  } catch {
    return null;
  }
}

export interface CreateBookingResult {
  ok: boolean;
  booking?: Booking;
  error?: string;
  conflict?: boolean;
}

export async function createBookingOnApi(
  booking: Booking,
): Promise<CreateBookingResult> {
  try {
    const r = await fetch(apiUrl("/api/v1/bookings"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });
    const j = (await r.json()) as {
      booking?: Booking;
      error?: string;
    };
    if (r.status === 409) {
      return { ok: false, error: j.error ?? "slot_conflict", conflict: true };
    }
    if (!r.ok) {
      return { ok: false, error: j.error ?? `http_${r.status}` };
    }
    return { ok: true, booking: j.booking };
  } catch {
    return { ok: false, error: "network" };
  }
}
