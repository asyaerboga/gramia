import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Sleep from "@/lib/models/Sleep";
import Client from "@/lib/models/Client";

// GET /api/sleep - Uyku kayıtlarını getir
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

    const sleepRecords = await Sleep.find(query).sort({ date: -1 }).limit(30);

    return NextResponse.json(sleepRecords);
  } catch (error) {
    console.error("Sleep fetch error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/sleep - Uyku kaydı ekle/güncelle
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const { date, bedTime, wakeTime, quality, notes } = body;

    if (!bedTime || !wakeTime || !quality) {
      return NextResponse.json(
        { error: "bedTime, wakeTime ve quality gereklidir" },
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

    // Uyku süresini hesapla
    const [bedHour, bedMin] = bedTime.split(":").map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(":").map(Number);

    let duration = wakeHour * 60 + wakeMin - (bedHour * 60 + bedMin);
    if (duration < 0) duration += 24 * 60; // Gece yarısını geçtiyse
    duration = Math.round((duration / 60) * 10) / 10; // Saat cinsinden

    const sleepDate = date ? new Date(date) : new Date();
    sleepDate.setHours(0, 0, 0, 0);

    // Upsert: varsa güncelle, yoksa oluştur
    const sleep = await Sleep.findOneAndUpdate(
      { clientId: client._id, date: sleepDate },
      {
        clientId: client._id,
        date: sleepDate,
        bedTime,
        wakeTime,
        duration,
        quality,
        notes,
      },
      { upsert: true, new: true },
    );

    return NextResponse.json(sleep, { status: 201 });
  } catch (error) {
    console.error("Sleep create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
