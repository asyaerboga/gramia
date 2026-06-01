import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/lib/models/Appointment";
import Client from "@/lib/models/Client";

// GET /api/dietitian/appointments - Get all appointments for the dietitian
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get("upcoming");

    const pendingReview = searchParams.get("pendingReview");

    const query: Record<string, unknown> = {
      dietitianId: session.user.id,
    };

    if (upcoming === "true") {
      query.date = { $gte: new Date() };
    }

    if (pendingReview === "true") {
      // Past appointments still in pending or confirmed status
      query.date = { $lt: new Date() };
      query.status = { $in: ["pending", "confirmed"] };
    }

    const appointments = await Appointment.find(query)
      .sort({ date: 1 })
      .populate("clientId");

    const result = await Promise.all(
      appointments.map(async (apt) => {
        const client = apt.clientId as unknown as {
          _id: string;
          userId: string;
        };
        let clientName = "İsimsiz";

        if (client) {
          const clientDoc = await Client.findById(client._id || client).populate(
            "userId",
            "name"
          );
          if (clientDoc) {
            const user = clientDoc.userId as unknown as { name: string };
            clientName = user?.name || "İsimsiz";
          }
        }

        return {
          _id: apt._id,
          date: apt.date,
          time: apt.time,
          status: apt.status,
          notes: apt.notes,
          clientName,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Fetch dietitian appointments error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

// PATCH /api/dietitian/appointments - Update appointment (status, date, time, notes)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { appointmentId, status, date, time, notes } = await request.json();
    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId gereklidir" }, { status: 400 });
    }

    await dbConnect();

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      dietitianId: session.user.id,
    });

    if (!appointment) {
      return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });
    }

    if (status) appointment.status = status;
    if (date) appointment.date = new Date(date);
    if (time) appointment.time = time;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();
    return NextResponse.json({ message: "Güncellendi", appointment });
  } catch (error) {
    console.error("PATCH dietitian appointment error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
