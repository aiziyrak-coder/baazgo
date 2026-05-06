import fs from "fs/promises";
import path from "path";
import type { Booking } from "../src/types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "bookings.json");

let writeChain: Promise<void> = Promise.resolve();

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readRaw(): Promise<Booking[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Booking[]) : [];
  } catch {
    return [];
  }
}

export async function readBookings(): Promise<Booking[]> {
  return readRaw();
}

export function appendBooking(booking: Booking): Promise<void> {
  writeChain = writeChain.then(async () => {
    const all = await readRaw();
    all.push(booking);
    await fs.writeFile(FILE, JSON.stringify(all, null, 2), "utf-8");
  });
  return writeChain;
}

/** Overlap if [start, end) intersects existing pending/confirmed intervals (inclusive end-date days). */
export function bookingsOverlap(
  truckId: string,
  start: Date,
  end: Date,
  existing: Booking[],
  ignoreBookingId?: string,
): boolean {
  const active = existing.filter(
    (x) =>
      x.truckId === truckId &&
      x.id !== ignoreBookingId &&
      (x.status === "pending" || x.status === "confirmed"),
  );
  for (const b of active) {
    const s = new Date(b.startDate);
    const e = new Date(b.endDate);
    if (start < e && end > s) return true;
  }
  return false;
}
