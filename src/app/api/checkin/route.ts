import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import CheckIn from "@/lib/models/CheckIn";
import Client from "@/lib/models/Client";

// GET /api/checkin - Check-in kayıtlarını getir
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const date = searchParams.get("date");

    let targetClientId = clientId;

    if (session.user.role === "client") {
      const client = await Client.findOne({ userId: session.user.id });
      if (!client) {
        return NextResponse.json(
          { error: "Danışan bulunamadı" },
          { status: 404 },
        );
      }
      targetClientId = client._id.toString();
    }

    if (!targetClientId) {
      return NextResponse.json(
        { error: "clientId gereklidir" },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { clientId: targetClientId };

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: d, $lt: nextDay };
    }

    const checkIns = await CheckIn.find(query).sort({ date: -1 }).limit(30);

    return NextResponse.json(checkIns);
  } catch (error) {
    console.error("CheckIn fetch error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/checkin - Check-in yap
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const {
      date,
      mood,
      energyLevel,
      stressLevel,
      hungerLevel,
      symptoms,
      notes,
    } = body;

    if (!mood || !energyLevel) {
      return NextResponse.json(
        { error: "mood ve energyLevel gereklidir" },
        { status: 400 },
      );
    }

    await dbConnect();

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) {
      return NextResponse.json(
        { error: "Danışan bulunamadı" },
        { status: 404 },
      );
    }

    const checkInDate = date ? new Date(date) : new Date();
    checkInDate.setHours(0, 0, 0, 0);

    // Upsert: varsa güncelle, yoksa oluştur
    const checkIn = await CheckIn.findOneAndUpdate(
      { clientId: client._id, date: checkInDate },
      {
        clientId: client._id,
        date: checkInDate,
        mood,
        energyLevel,
        stressLevel: stressLevel || 3,
        hungerLevel: hungerLevel || 3,
        symptoms: symptoms || [],
        notes,
      },
      { upsert: true, new: true },
    );

    // Login streak güncelle
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!client.lastLoginDate) {
      client.loginStreak = 1;
    } else {
      const lastLogin = new Date(client.lastLoginDate);
      lastLogin.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        client.loginStreak = (client.loginStreak || 0) + 1;
      } else if (diffDays > 1) {
        client.loginStreak = 1;
      }
    }

    client.lastLoginDate = today;
    await client.save();

    return NextResponse.json(checkIn, { status: 201 });
  } catch (error) {
    console.error("CheckIn create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
