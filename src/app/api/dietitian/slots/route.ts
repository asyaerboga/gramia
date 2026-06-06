import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import AvailableSlot from "@/lib/models/AvailableSlot";
import WeeklySchedule from "@/lib/models/WeeklySchedule";
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

// Build combined slots for a single date given the schedule + overrides
function buildSlotsForDate(
  date: Date,
  schedule: {
    days: { dayOfWeek: number; enabled: boolean; startTime: string; endTime: string }[];
    slotDuration: number;
    excludePublicHolidays: boolean;
  } | null,
  extras: Set<string>,    // "HH:MM" times that are manually added
  blocked: Set<string>,   // "HH:MM" times that are manually blocked
  booked: Set<string>,    // "HH:MM" times already booked
): { time: string; source: "schedule" | "extra"; isBooked: boolean; isBlocked: boolean }[] {
  const dow = date.getDay(); // 0=Sunday
  const activeSchedule = schedule ?? FALLBACK_SCHEDULE;

  // Generate schedule slots
  let scheduleTimes: string[] = [];
  if (activeSchedule.excludePublicHolidays && isTurkishFixedHoliday(date)) {
    scheduleTimes = [];
  } else {
    const dayConf = activeSchedule.days.find((d) => d.dayOfWeek === dow);
    if (dayConf?.enabled) {
      scheduleTimes = generateTimeSlots(dayConf.startTime, dayConf.endTime, activeSchedule.slotDuration);
    }
  }

  // All unique times
  const allTimes = new Set([...scheduleTimes, ...extras]);

  const result: { time: string; source: "schedule" | "extra"; isBooked: boolean; isBlocked: boolean }[] = [];
  for (const time of [...allTimes].sort()) {
    result.push({
      time,
      source: extras.has(time) && !scheduleTimes.includes(time) ? "extra" : "schedule",
      isBooked: booked.has(time),
      isBlocked: blocked.has(time),
    });
  }
  return result;
}

// GET /api/dietitian/slots?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    await dbConnect();

    const [schedule, appointments] = await Promise.all([
      WeeklySchedule.findOne({ dietitianId: session.user.id }),
      Appointment.find({
        dietitianId: session.user.id,
        status: { $in: ["pending", "confirmed"] },
      }).select("date time"),
    ]);

    // Build booked map: dateKey → Set<time>
    const bookedMap = new Map<string, Set<string>>();
    for (const apt of appointments) {
      const key = toDateKey(new Date(apt.date));
      if (!bookedMap.has(key)) bookedMap.set(key, new Set());
      bookedMap.get(key)!.add(apt.time);
    }

    if (!from || !to) {
      // Return schedule info only
      return NextResponse.json({ schedule });
    }

    const startDate = new Date(from);
    startDate.setHours(12, 0, 0, 0);
    const endDate = new Date(to);
    endDate.setHours(12, 0, 0, 0);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Fetch overrides for the range
    const overrides = await AvailableSlot.find({
      dietitianId: session.user.id,
      date: { $gte: new Date(from), $lte: new Date(to + "T23:59:59") },
    });

    // Group overrides by dateKey
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

    const result: {
      date: string;
      slots: { time: string; source: string; isBooked: boolean; isBlocked: boolean }[];
    }[] = [];

    for (const day of days) {
      const key = toDateKey(day);
      const slots = buildSlotsForDate(
        day,
        schedule
          ? {
              days: schedule.days.map((d) => ({
                dayOfWeek: d.dayOfWeek,
                enabled: d.enabled,
                startTime: d.startTime,
                endTime: d.endTime,
              })),
              slotDuration: schedule.slotDuration,
              excludePublicHolidays: schedule.excludePublicHolidays,
            }
          : null,
        extrasMap.get(key) ?? new Set(),
        blockedMap.get(key) ?? new Set(),
        bookedMap.get(key) ?? new Set(),
      );
      if (slots.length > 0) {
        result.push({ date: key, slots });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET dietitian slots error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/dietitian/slots
// Body: { date, time, type: "extra" | "blocked" }
// OR: { startDate, endDate, times, type } for bulk
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { startDate, endDate, times, type = "extra" } = body;

    if (!startDate || !endDate || !times || times.length === 0) {
      return NextResponse.json(
        { error: "startDate, endDate ve times gereklidir" },
        { status: 400 },
      );
    }

    await dbConnect();

    const start = new Date(startDate);
    start.setHours(12, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(12, 0, 0, 0);
    const days = eachDayOfInterval({ start, end });

    const docs = days.flatMap((day) =>
      (times as string[]).map((time) => ({
        dietitianId: session.user.id,
        date: new Date(new Date(day).setHours(12, 0, 0, 0)),
        time,
        type,
      })),
    );

    await AvailableSlot.insertMany(docs, { ordered: false }).catch(() => {});

    return NextResponse.json({ message: "Kaydedildi" }, { status: 201 });
  } catch (error) {
    console.error("POST dietitian slots error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/dietitian/slots?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    await dbConnect();

    if (id) {
      await AvailableSlot.findOneAndDelete({ _id: id, dietitianId: session.user.id });
    } else {
      const body = await request.json().catch(() => ({}));
      const { date } = body as { date?: string };
      if (date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        await AvailableSlot.deleteMany({
          dietitianId: session.user.id,
          date: { $gte: d, $lt: next },
        });
      }
    }

    return NextResponse.json({ message: "Silindi" });
  } catch (error) {
    console.error("DELETE dietitian slots error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
