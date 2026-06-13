import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Notification from "@/lib/models/Notification";
import Appointment from "@/lib/models/Appointment";
import { Types } from "mongoose";

// GET /api/notifications - fetch unread appointment notifications for the current user (client or dietitian)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await dbConnect();

    const notifications = await Notification.find({
      userId: session.user.id,
      isRead: false,
    }).sort({ createdAt: -1 }).limit(20);

    // Tarihi geçmiş veya iptal edilmiş randevuların alakasız bildirimlerini filtrele
    const apptIds = notifications
      .filter(n => n.appointmentId)
      .map(n => n.appointmentId as Types.ObjectId);

    if (apptIds.length > 0) {
      const staleAppts = await Appointment.find(
        {
          _id: { $in: apptIds },
          $or: [{ status: "cancelled" }, { date: { $lt: new Date() } }],
        },
        { _id: 1 }
      );

      if (staleAppts.length > 0) {
        const staleSet = new Set(staleAppts.map(a => (a._id as Types.ObjectId).toString()));
        // Bu tipler iptal/geçmiş randevu sonrasında anlamsız kalır
        const obsoleteTypes = new Set([
          "appointment_confirmed",
          "appointment_time_changed",
          "appointment_status_changed",
        ]);

        const toMarkRead: Types.ObjectId[] = [];
        const valid = notifications.filter(n => {
          if (!n.appointmentId) return true;
          if (!staleSet.has(n.appointmentId.toString())) return true;
          if (obsoleteTypes.has(n.type)) {
            toMarkRead.push(n._id as Types.ObjectId);
            return false;
          }
          return true;
        });

        if (toMarkRead.length > 0) {
          Notification.updateMany(
            { _id: { $in: toMarkRead } },
            { $set: { isRead: true } }
          ).catch(() => {});
        }

        return NextResponse.json(valid.slice(0, 10));
      }
    }

    return NextResponse.json(notifications.slice(0, 10));
  } catch (error) {
    console.error("GET notifications error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/notifications - mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { ids } = await request.json();

    await dbConnect();

    if (ids && Array.isArray(ids) && ids.length > 0) {
      await Notification.updateMany(
        { _id: { $in: ids }, userId: session.user.id },
        { $set: { isRead: true } }
      );
    } else {
      await Notification.updateMany(
        { userId: session.user.id, isRead: false },
        { $set: { isRead: true } }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH notifications error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
