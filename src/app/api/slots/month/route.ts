import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import WeeklySchedule from "@/lib/models/WeeklySchedule";
import AvailableSlot from "@/lib/models/AvailableSlot";
import Appointment from "@/lib/models/Appointment";
import { eachDayOfInterval } from "date-fns";
import {
  generateTimeSlots,
  isTurkishFixedHoliday,
  toDateKey,
} from "@/lib/slotUtils";

const FALLBACK_SCHEDULE = {
  days: [0, 1, 2, 3, 4, 5, 6].map((dow) => ({
    dayOfWeek: dow,
    enabled: dow >= 1 && dow <= 5,
    startTime: "09:00",
    endTime: "17:00",
  })),
  slotDuration: 30,
  excludePublicHolidays: true,
};

// GET /api/slots/month?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns dates that have at least one available slot
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json({ error: "from ve to gereklidir" }, { status: 400 });
    }

    await dbConnect();

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) return NextResponse.json([]);

    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    const [schedule, overrides, bookedAppointments] = await Promise.all([
      WeeklySchedule.findOne({ dietitianId: client.dietitianId }),
      AvailableSlot.find({
        dietitianId: client.dietitianId,
        date: { $gte: startDate, $lte: endDate },
      }).select("date time type"),
      Appointment.find({
        dietitianId: client.dietitianId,
        date: { $gte: startDate, $lte: endDate },
        status: { $in: ["pending", "confirmed"] },
      }).select("date time"),
    ]);

    // Build booked map
    const bookedMap = new Map<string, Set<string>>();
    for (const apt of bookedAppointments) {
      const key = toDateKey(new Date(apt.date));
      if (!bookedMap.has(key)) bookedMap.set(key, new Set());
      bookedMap.get(key)!.add(apt.time);
    }

    // Build overrides map
    const extrasMap = new Map<string, Set<string>>();
    const blockedMap = new Map<string, Set<string>>();
    for (const ov of overrides) {
      const key = toDateKey(new Date(ov.date));
      if (ov.type === "extra") {
        if (!extrasMap.has(key)) extrasMap.set(key, new Set());
        extrasMap.get(key)!.add(ov.time);
      } else {
        if (!blockedMap.has(key)) blockedMap.set(key, new Set());
        blockedMap.get(key)!.add(ov.time);
      }
    }

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const availableDates: string[] = [];
    const activeSchedule = schedule ?? FALLBACK_SCHEDULE;
    const now = new Date();
    const todayKey = toDateKey(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + 5;

    for (const day of days) {
      const key = toDateKey(day);
      const dow = day.getDay();
      let scheduleTimes: string[] = [];

      {
        const isHoliday = activeSchedule.excludePublicHolidays && isTurkishFixedHoliday(day);
        if (!isHoliday) {
          const dayConf = activeSchedule.days.find((d) => d.dayOfWeek === dow);
          if (dayConf?.enabled) {
            scheduleTimes = generateTimeSlots(dayConf.startTime, dayConf.endTime, activeSchedule.slotDuration);
          }
        }
      }

      const extras = extrasMap.get(key) ?? new Set<string>();
      const blocked = blockedMap.get(key) ?? new Set<string>();
      const booked = bookedMap.get(key) ?? new Set<string>();
      const isToday = key === todayKey;

      const allTimes = new Set([...scheduleTimes, ...extras]);
      const hasAvailable = [...allTimes].some((t) => {
        if (blocked.has(t) || booked.has(t)) return false;
        if (isToday) {
          const [h, m] = t.split(":").map(Number);
          return h * 60 + m >= nowMinutes;
        }
        return true;
      });

      if (hasAvailable) {
        availableDates.push(key);
      }
    }

    return NextResponse.json(availableDates);
  } catch (error) {
    console.error("GET slots/month error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
