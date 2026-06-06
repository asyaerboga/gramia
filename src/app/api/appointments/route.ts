import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/lib/models/Appointment";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";

// GET /api/appointments - Get appointments for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    await dbConnect();

    if (session.user.role === "client") {
      const client = await Client.findOne({ userId: session.user.id });
      if (!client) {
        return NextResponse.json([]);
      }

      const appointments = await Appointment.find({
        clientId: client._id,
      })
        .sort({ date: 1 })
        .populate("dietitianId", "name");

      const result = appointments.map((apt) => {
        const dietitian = apt.dietitianId as unknown as { name: string };
        return {
          _id: apt._id,
          date: apt.date,
          time: apt.time,
          status: apt.status,
          dietitianName: dietitian?.name || "",
        };
      });

      return NextResponse.json(result);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Fetch appointments error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/appointments - Book an appointment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { date, time } = await request.json();

    if (!date || !time) {
      return NextResponse.json(
        { error: "Tarih ve saat gereklidir" },
        { status: 400 },
      );
    }

    await dbConnect();

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) {
      return NextResponse.json(
        { error: "Danışan profili bulunamadı" },
        { status: 404 },
      );
    }

    const bookingDate = new Date(date);
    const startOfDay = new Date(bookingDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const conflict = await Appointment.findOne({
      dietitianId: client.dietitianId,
      date: { $gte: startOfDay, $lte: endOfDay },
      time,
      status: { $ne: "cancelled" },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Bu tarih ve saatte başka bir randevu zaten mevcut" },
        { status: 409 },
      );
    }

    const appointment = await Appointment.create({
      clientId: client._id,
      dietitianId: client.dietitianId,
      date: bookingDate,
      time,
      status: "pending",
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/appointments - Randevu güncelle (diyetisyen için)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const { appointmentId, status, notes, date, time } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId gereklidir" },
        { status: 400 },
      );
    }

    await dbConnect();

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return NextResponse.json(
        { error: "Randevu bulunamadı" },
        { status: 404 },
      );
    }

    // Diyetisyen kontrolü
    if (session.user.role === "dietitian") {
      if (appointment.dietitianId.toString() !== session.user.id) {
        return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
      }

      const newDate = date ? new Date(date) : appointment.date;
      const newTime = time || appointment.time;
      const dateChanged = date && newDate.toISOString() !== appointment.date.toISOString();
      const timeChanged = time && time !== appointment.time;

      if (dateChanged || timeChanged) {
        const startOfDay = new Date(newDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(newDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const conflict = await Appointment.findOne({
          _id: { $ne: appointmentId },
          dietitianId: appointment.dietitianId,
          date: { $gte: startOfDay, $lte: endOfDay },
          time: newTime,
          status: { $ne: "cancelled" },
        });

        if (conflict) {
          return NextResponse.json(
            { error: "Bu tarih ve saatte başka bir randevu zaten mevcut" },
            { status: 409 },
          );
        }
      }

      // Diyetisyen tüm alanları güncelleyebilir
      if (status) appointment.status = status;
      if (notes !== undefined) appointment.notes = notes;
      if (date) appointment.date = new Date(date);
      if (time) appointment.time = time;
    } else {
      // Client sadece iptal edebilir
      const client = await Client.findOne({ userId: session.user.id });
      if (
        !client ||
        appointment.clientId.toString() !== client._id.toString()
      ) {
        return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
      }
      if (status && status !== "cancelled") {
        return NextResponse.json(
          { error: "Sadece iptal edebilirsiniz" },
          { status: 403 },
        );
      }
      if (status) appointment.status = status;
    }

    await appointment.save();

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/appointments - Randevu sil
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("id");

    if (!appointmentId) {
      return NextResponse.json({ error: "id gereklidir" }, { status: 400 });
    }

    await dbConnect();

    const appointment = await Appointment.findById(appointmentId);
    if (
      !appointment ||
      appointment.dietitianId.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await Appointment.deleteOne({ _id: appointmentId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete appointment error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
