import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Meal from "@/lib/models/Meal";
import Client from "@/lib/models/Client";

// GET /api/meals - Get meals for a date
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const clientIdParam = searchParams.get("clientId");

    let clientId = clientIdParam;

    if (session.user.role === "client") {
      const client = await Client.findOne({ userId: session.user.id });
      if (!client) {
        return NextResponse.json([]);
      }
      clientId = client._id.toString();
    }

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId gereklidir" },
        { status: 400 }
      );
    }

    const query: Record<string, unknown> = { clientId };

    if (dateParam) {
      const date = new Date(dateParam);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: date, $lt: nextDay };
    }

    const meals = await Meal.find(query).sort({ createdAt: 1 });

    return NextResponse.json(meals);
  } catch (error) {
    console.error("Fetch meals error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

// POST /api/meals - Add a meal
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { date, mealType, items } = await request.json();

    if (!mealType || !items || items.length === 0) {
      return NextResponse.json(
        { error: "mealType ve items gereklidir" },
        { status: 400 }
      );
    }

    await dbConnect();

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) {
      return NextResponse.json(
        { error: "Danışan profili bulunamadı" },
        { status: 404 }
      );
    }

    const mealDate = date ? new Date(date) : new Date();
    mealDate.setHours(12, 0, 0, 0);

    const meal = await Meal.create({
      clientId: client._id,
      date: mealDate,
      mealType,
      items,
    });

    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error("Create meal error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
