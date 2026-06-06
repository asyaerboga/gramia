import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import WeeklySchedule from "@/lib/models/WeeklySchedule";

const DEFAULT_DAYS = [0, 1, 2, 3, 4, 5, 6].map((dow) => ({
  dayOfWeek: dow,
  enabled: dow >= 1 && dow <= 5,
  startTime: "09:00",
  endTime: "17:00",
}));

// GET /api/dietitian/schedule
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await dbConnect();

    // Auto-create default schedule if none exists so clients see availability immediately
    const schedule = await WeeklySchedule.findOneAndUpdate(
      { dietitianId: session.user.id },
      {
        $setOnInsert: {
          dietitianId: session.user.id,
          days: DEFAULT_DAYS,
          slotDuration: 30,
          excludePublicHolidays: true,
        },
      },
      { upsert: true, new: true },
    );

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("GET schedule error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PUT /api/dietitian/schedule
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { days, slotDuration, excludePublicHolidays } = await request.json();

    if (!days || !Array.isArray(days)) {
      return NextResponse.json({ error: "days gereklidir" }, { status: 400 });
    }

    await dbConnect();

    const schedule = await WeeklySchedule.findOneAndUpdate(
      { dietitianId: session.user.id },
      {
        $set: {
          days,
          slotDuration: slotDuration || 30,
          excludePublicHolidays: excludePublicHolidays ?? true,
        },
      },
      { upsert: true, new: true },
    );

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("PUT schedule error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
