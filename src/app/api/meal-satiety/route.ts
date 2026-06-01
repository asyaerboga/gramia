import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import MealSatiety from "@/lib/models/MealSatiety";

// GET /api/meal-satiety?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) return NextResponse.json([]);

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    const query: Record<string, unknown> = { clientId: client._id };
    if (dateParam) {
      const date = new Date(dateParam);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: date, $lt: nextDay };
    }

    const records = await MealSatiety.find(query).sort({ date: -1 });
    return NextResponse.json(records);
  } catch (error) {
    console.error("GET meal-satiety error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/meal-satiety
// Body: { date, mealType, satietyLevel, notes? }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date, mealType, satietyLevel, notes } = await request.json();

    if (!mealType || !satietyLevel) {
      return NextResponse.json({ error: "mealType ve satietyLevel gereklidir" }, { status: 400 });
    }

    await dbConnect();

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) {
      return NextResponse.json({ error: "Danışan profili bulunamadı" }, { status: 404 });
    }

    const mealDate = date ? new Date(date) : new Date();
    mealDate.setHours(12, 0, 0, 0);

    // Upsert: one record per client/date/mealType
    const record = await MealSatiety.findOneAndUpdate(
      { clientId: client._id, date: mealDate, mealType },
      { $set: { satietyLevel, notes: notes || "" } },
      { upsert: true, new: true },
    );

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("POST meal-satiety error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
