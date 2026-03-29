import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Exercise from "@/lib/models/Exercise";
import Client from "@/lib/models/Client";

// GET /api/exercises - Egzersiz kayıtlarını getir
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let targetClientId = clientId;

    // Client rolü için kendi clientId'sini bul
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

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const exercises = await Exercise.find(query).sort({ date: -1 }).limit(100);

    return NextResponse.json(exercises);
  } catch (error) {
    console.error("Exercise fetch error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/exercises - Yeni egzersiz kaydı ekle
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const { date, type, name, duration, caloriesBurned, intensity, notes } =
      body;

    if (!type || !name || !duration) {
      return NextResponse.json(
        { error: "type, name ve duration gereklidir" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Client'ın ID'sini bul
    const client = await Client.findOne({ userId: session.user.id });
    if (!client) {
      return NextResponse.json(
        { error: "Danışan bulunamadı" },
        { status: 404 },
      );
    }

    const exercise = await Exercise.create({
      clientId: client._id,
      date: date ? new Date(date) : new Date(),
      type,
      name,
      duration,
      caloriesBurned: caloriesBurned || Math.round(duration * 5), // Varsayılan hesaplama
      intensity: intensity || "medium",
      notes,
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    console.error("Exercise create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/exercises - Egzersiz sil
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("id");

    if (!exerciseId) {
      return NextResponse.json({ error: "id gereklidir" }, { status: 400 });
    }

    await dbConnect();

    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return NextResponse.json(
        { error: "Egzersiz bulunamadı" },
        { status: 404 },
      );
    }

    await Exercise.deleteOne({ _id: exerciseId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Exercise delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
