import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Measurement from "@/lib/models/Measurement";
import Client from "@/lib/models/Client";

// GET /api/measurements - Get measurements
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get("clientId");

    let clientId = clientIdParam;

    // If client role, find their clientId
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

    const measurements = await Measurement.find({ clientId }).sort({
      date: 1,
    });

    return NextResponse.json(measurements);
  } catch (error) {
    console.error("Fetch measurements error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

// POST /api/measurements - Add measurement (dietitian only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { clientId, date, regions } = await request.json();

    if (!clientId || !regions) {
      return NextResponse.json(
        { error: "clientId ve regions gereklidir" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify the client belongs to this dietitian
    const client = await Client.findOne({
      _id: clientId,
      dietitianId: session.user.id,
    });
    if (!client) {
      return NextResponse.json(
        { error: "Danışan bulunamadı" },
        { status: 404 }
      );
    }

    const measurement = await Measurement.create({
      clientId,
      date: date || new Date(),
      regions,
    });

    return NextResponse.json(measurement, { status: 201 });
  } catch (error) {
    console.error("Create measurement error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
