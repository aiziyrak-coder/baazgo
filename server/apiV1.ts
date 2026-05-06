import type { Express } from "express";
import { Router } from "express";
import type { Booking } from "../src/types";
import { generateMockTrucks } from "../src/lib/mockData";
import * as bookingStore from "./bookingStore";

function isBookingPayload(x: unknown): x is Partial<Booking> {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.truckId === "string" &&
    typeof o.userId === "string" &&
    typeof o.startDate === "string" &&
    typeof o.endDate === "string"
  );
}

export function registerApiV1(app: Express): void {
  const r = Router();

  r.get("/meta", (_req, res) => {
    res.json({
      name: "baazgo-api",
      version: "1.0.0",
      environment: process.env.NODE_ENV ?? "development",
      features: [
        "trucks",
        "bookings",
        "health",
        "slot_validation",
      ],
      docs: "POST /api/v1/bookings — server-side conflict check; GET /api/v1/trucks?count=",
    });
  });

  r.get("/stats", async (_req, res) => {
    const bookings = await bookingStore.readBookings();
    res.json({
      bookingCount: bookings.length,
      dataBackend: "json_file",
    });
  });

  r.get("/trucks", (req, res) => {
    const n = Number(req.query.count);
    const count = Number.isFinite(n)
      ? Math.min(500, Math.max(50, Math.floor(n)))
      : 450;
    const trucks = generateMockTrucks(count);
    res.json({ trucks, count: trucks.length });
  });

  r.get("/bookings", async (req, res) => {
    const userId = String(req.query.userId ?? "").trim();
    if (!userId) {
      res.status(400).json({ error: "userId_required" });
      return;
    }
    const all = await bookingStore.readBookings();
    res.json({ bookings: all.filter((b) => b.userId === userId) });
  });

  r.post("/bookings", async (req, res) => {
    if (!isBookingPayload(req.body)) {
      res.status(400).json({ error: "invalid_body" });
      return;
    }
    const body = req.body;
    const start = new Date(body.startDate!);
    const end = new Date(body.endDate!);
    if (Number.isNaN(+start) || Number.isNaN(+end) || end <= start) {
      res.status(400).json({ error: "invalid_dates" });
      return;
    }

    const all = await bookingStore.readBookings();
    if (
      bookingStore.bookingsOverlap(body.truckId!, start, end, all, body.id)
    ) {
      res.status(409).json({
        error: "slot_conflict",
        message: "Tanlangan sanalar uchun bu furgon allaqachon band.",
      });
      return;
    }

    const allowed: Booking["status"][] = [
      "pending",
      "confirmed",
      "cancelled",
      "completed",
    ];
    const st = allowed.includes(body.status as Booking["status"])
      ? (body.status as Booking["status"])
      : "pending";

    const booking: Booking = {
      id: body.id ?? `booking-${Date.now()}`,
      truckId: body.truckId!,
      userId: body.userId!,
      startDate: body.startDate!,
      endDate: body.endDate!,
      totalPrice: Number(body.totalPrice) || 0,
      status: st,
      paymentStatus: body.paymentStatus === "paid" ? "paid" : "unpaid",
      createdAt: body.createdAt ?? new Date().toISOString(),
    };

    await bookingStore.appendBooking(booking);
    res.status(201).json({ booking });
  });

  app.use("/api/v1", r);
}
