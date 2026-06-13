import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/lib/models/Appointment";
import Client from "@/lib/models/Client";
import Notification from "@/lib/models/Notification";
import { Types } from "mongoose";

async function createAppointmentNotification(
  clientId: Types.ObjectId,
  appointmentId: Types.ObjectId,
  type: string,
  title: string,
  message: string
) {
  try {
    const client = await Client.findById(clientId);
    if (!client) return;
    await Notification.create({ userId: client.userId, type, title, message, appointmentId, isRead: false });
  } catch { /* bildirim oluşturulamazsa sessizce devam et */ }
}

function formatAppointmentDate(date: Date, time: string) {
  return `${new Date(date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} saat ${time}`;
}

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
        dietitianId: session.user.id,
        date: { $gte: startOfDay, $lte: endOfDay },
        time: newTime,
        status: { $ne: "cancelled" },
      });

      if (conflict) {
        return NextResponse.json(
          { error: "Bu tarih ve saatte başka bir randevu zaten mevcut" },
          { status: 409 }
        );
      }
    }

    const oldStatus = appointment.status;
    const oldDate = appointment.date;
    const oldTime = appointment.time;

    if (status) appointment.status = status;
    if (date) appointment.date = new Date(date);
    if (time) appointment.time = time;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    const aptDate = formatAppointmentDate(appointment.date, appointment.time);

    // İptal durumunda danışanın eski bildirimlerini temizle (yeni bildirim gelmeden önce)
    if (status === "cancelled" && status !== oldStatus) {
      const clientForClear = await Client.findById(appointment.clientId);
      if (clientForClear) {
        await Notification.updateMany(
          { appointmentId: appointment._id, userId: clientForClear.userId, isRead: false },
          { $set: { isRead: true } }
        ).catch(() => {});
      }
    }

    if (status && status !== oldStatus) {
      const notifMap: Record<string, { type: string; title: string }> = {
        confirmed: { type: "appointment_confirmed",  title: "Randevunuz Onaylandı ✅" },
        cancelled: { type: "appointment_cancelled",  title: "Randevunuz İptal Edildi ❌" },
        completed: { type: "appointment_completed",  title: "Randevunuz Tamamlandı 🎉" },
      };
      const notif = notifMap[status] ?? { type: "appointment_status_changed", title: "Randevu Durumu Güncellendi" };
      await createAppointmentNotification(
        appointment.clientId,
        appointment._id as Types.ObjectId,
        notif.type,
        notif.title,
        `${aptDate} tarihli randevunuzun durumu güncellendi.`
      );
    }
    if ((date && new Date(date).toISOString() !== oldDate.toISOString()) || (time && time !== oldTime)) {
      await createAppointmentNotification(
        appointment.clientId,
        appointment._id as Types.ObjectId,
        "appointment_time_changed",
        "Randevu Tarihiniz Değiştirildi 📅",
        `Randevunuz ${aptDate} olarak güncellendi.`
      );
    }

    return NextResponse.json({ message: "Güncellendi", appointment });
  } catch (error) {
    console.error("PATCH dietitian appointment error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
