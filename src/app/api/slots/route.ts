import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import WeeklySchedule from "@/lib/models/WeeklySchedule";
import AvailableSlot from "@/lib/models/AvailableSlot";
import Appointment from "@/lib/models/Appointment";
import {
  generateTimeSlots,
  isTurkishFixedHoliday,
  toDateKey,
} from "@/lib/slotUtils";

// GET /api/slots?date=YYYY-MM-DD
// Returns available (unbooked, unblocked) time slots for the client's dietitian
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    if (!dateParam) {
      return NextResponse.json({ error: "date gereklidir" }, { status: 400 });
    }

    await dbConnect();

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) return NextResponse.json([]);

    const targetDate = new Date(dateParam);
    targetDate.setHours(12, 0, 0, 0);
    const dateKey = toDateKey(targetDate);

    const startOfDay = new Date(dateParam);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateParam);
    endOfDay.setHours(23, 59, 59, 999);

    const [schedule, overrides, bookedAppointments] = await Promise.all([
      WeeklySchedule.findOne({ dietitianId: client.dietitianId }),
      AvailableSlot.find({
        dietitianId: client.dietitianId,
        date: { $gte: startOfDay, $lte: endOfDay },
      }),
      Appointment.find({
        dietitianId: client.dietitianId,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ["pending", "confirmed"] },
      }).select("time"),
    ]);

    const bookedTimes = new Set(bookedAppointments.map((a) => a.time));
    const extraTimes = new Set<string>();
    const blockedTimes = new Set<string>();

    for (const ov of overrides) {
      if (ov.type === "extra") extraTimes.add(ov.time);
      else blockedTimes.add(ov.time);
    }

    // Generate schedule slots for this day
    const dow = targetDate.getDay();
    let scheduleTimes: string[] = [];

    if (schedule) {
      const isHoliday = schedule.excludePublicHolidays && isTurkishFixedHoliday(targetDate);
      if (!isHoliday) {
        const dayConf = schedule.days.find((d) => d.dayOfWeek === dow);
        if (dayConf?.enabled) {
          scheduleTimes = generateTimeSlots(dayConf.startTime, dayConf.endTime, schedule.slotDuration);
        }
      }
    }

    // Combined = schedule + extras - blocked - booked
    const allTimes = new Set([...scheduleTimes, ...extraTimes]);
    const available: string[] = [];
    for (const time of [...allTimes].sort()) {
      if (!blockedTimes.has(time) && !bookedTimes.has(time)) {
        available.push(time);
      }
    }

    // Also return dateKey for reference
    return NextResponse.json({ date: dateKey, slots: available });
  } catch (error) {
    console.error("GET slots (client) error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
