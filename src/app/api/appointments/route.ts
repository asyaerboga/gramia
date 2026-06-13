import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/lib/models/Appointment";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";
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
      const oldStatus = appointment.status;
      const oldDate = appointment.date;
      const oldTime = appointment.time;

      if (status) appointment.status = status;
      if (notes !== undefined) appointment.notes = notes;
      if (date) appointment.date = new Date(date);
      if (time) appointment.time = time;

      await appointment.save();

      // Değişen alanlara göre bildirim oluştur
      const aptDate = formatAppointmentDate(appointment.date, appointment.time);
      if (status && status !== oldStatus) {
        const notifMap: Record<string, { type: string; title: string }> = {
          confirmed:  { type: "appointment_confirmed",  title: "Randevunuz Onaylandı ✅" },
          cancelled:  { type: "appointment_cancelled",  title: "Randevunuz İptal Edildi ❌" },
          completed:  { type: "appointment_completed",  title: "Randevunuz Tamamlandı 🎉" },
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

      return NextResponse.json(appointment);
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
      // İptal öncesi: bu randevuya ait danışanın eski bildirimlerini temizle
      if (status === "cancelled") {
        await Notification.updateMany(
          { appointmentId: appointment._id, userId: session.user.id, isRead: false },
          { $set: { isRead: true } }
        ).catch(() => {});
      }
      if (status) appointment.status = status;
      await appointment.save();

      // Diyetisyene iptal bildirimi gönder
      if (status === "cancelled") {
        try {
          const clientUser = await User.findById(client.userId);
          const aptDate = formatAppointmentDate(appointment.date, appointment.time);
          await Notification.create({
            userId: appointment.dietitianId,
            type: "appointment_cancelled_by_client",
            title: "Randevu İptal Edildi ❌",
            message: `${clientUser?.name || "Danışanınız"} ${aptDate} tarihli randevuyu iptal etti.`,
            appointmentId: appointment._id,
            isRead: false,
          });
        } catch { /* ignore */ }
      }

      return NextResponse.json(appointment);
    }
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

    const aptDate = formatAppointmentDate(appointment.date, appointment.time);

    // Silme öncesi: danışanın bu randevuya ait eski bildirimlerini temizle
    const clientForClear = await Client.findById(appointment.clientId);
    if (clientForClear) {
      await Notification.updateMany(
        { appointmentId: appointment._id, userId: clientForClear.userId, isRead: false },
        { $set: { isRead: true } }
      ).catch(() => {});
    }

    await createAppointmentNotification(
      appointment.clientId,
      appointment._id as Types.ObjectId,
      "appointment_deleted",
      "Randevunuz Silindi ⚠️",
      `${aptDate} tarihli randevunuz diyetisyeniniz tarafından silindi.`
    );

    await Appointment.deleteOne({ _id: appointmentId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete appointment error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
