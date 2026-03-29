import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import Meal from "@/lib/models/Meal";
import Appointment from "@/lib/models/Appointment";
import Message from "@/lib/models/Message";
import Measurement from "@/lib/models/Measurement";
import Exercise from "@/lib/models/Exercise";

// GET /api/dietitian/stats - Diyetisyen genel istatistikleri
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await dbConnect();

    // Tüm danışanları bul
    const clients = await Client.find({
      dietitianId: session.user.id,
    }).populate("userId", "name email");

    const clientIds = clients.map((c) => c._id);

    // Bugünün tarihi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Bu haftanın başlangıcı
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Pazartesi
    weekStart.setHours(0, 0, 0, 0);

    // Bugünkü öğünler
    const todayMeals = await Meal.find({
      clientId: { $in: clientIds },
      date: { $gte: today, $lt: tomorrow },
    });

    // Bugünkü egzersizler
    const todayExercises = await Exercise.find({
      clientId: { $in: clientIds },
      date: { $gte: today, $lt: tomorrow },
    });

    // Bu haftaki ölçümler
    const weekMeasurements = await Measurement.find({
      clientId: { $in: clientIds },
      date: { $gte: weekStart },
    });

    // Yaklaşan randevular (bugün ve sonrası)
    const upcomingAppointments = await Appointment.find({
      dietitianId: session.user.id,
      date: { $gte: today },
      status: { $in: ["pending", "confirmed"] },
    })
      .sort({ date: 1, time: 1 })
      .limit(10);

    // Bekleyen randevular
    const pendingAppointments = await Appointment.countDocuments({
      dietitianId: session.user.id,
      status: "pending",
    });

    // Okunmamış mesajlar
    const unreadMessages = await Message.countDocuments({
      receiverId: session.user.id,
      status: { $in: ["sent", "delivered"] },
    });

    // Bu ayki toplam randevular
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthAppointments = await Appointment.countDocuments({
      dietitianId: session.user.id,
      date: { $gte: monthStart, $lte: monthEnd },
    });

    // En aktif danışanlar (bu hafta en çok kayıt giren)
    const clientActivity = await Promise.all(
      clients.map(async (client) => {
        const mealCount = await Meal.countDocuments({
          clientId: client._id,
          date: { $gte: weekStart },
        });
        const exerciseCount = await Exercise.countDocuments({
          clientId: client._id,
          date: { $gte: weekStart },
        });
        const user = client.userId as unknown as {
          name: string;
          email: string;
        };
        return {
          clientId: client._id,
          name: user?.name || "İsimsiz",
          activityScore: mealCount + exerciseCount,
          weight: client.weight,
          targetWeight: client.targetWeight,
          progress:
            client.startWeight > client.targetWeight
              ? Math.round(
                  ((client.startWeight - client.weight) /
                    (client.startWeight - client.targetWeight)) *
                    100,
                )
              : 0,
        };
      }),
    );

    // Hedefine ulaşan danışanlar
    const goalReached = clients.filter(
      (c) => c.weight <= c.targetWeight,
    ).length;

    // İlerleme raporları
    const clientsWithProgress = clients
      .map((c) => {
        const user = c.userId as unknown as { name: string };
        const totalToLose = c.startWeight - c.targetWeight;
        const lost = c.startWeight - c.weight;
        const progress =
          totalToLose > 0
            ? Math.min(100, Math.round((lost / totalToLose) * 100))
            : 0;
        return {
          id: c._id,
          name: user?.name || "İsimsiz",
          startWeight: c.startWeight,
          currentWeight: c.weight,
          targetWeight: c.targetWeight,
          progress,
          lostKg: Math.round(lost * 10) / 10,
        };
      })
      .sort((a, b) => b.progress - a.progress);

    return NextResponse.json({
      overview: {
        totalClients: clients.length,
        activeToday:
          todayMeals.length > 0
            ? new Set(todayMeals.map((m) => m.clientId.toString())).size
            : 0,
        goalReached,
        pendingAppointments,
        unreadMessages,
        monthAppointments,
      },
      todayStats: {
        mealsLogged: todayMeals.length,
        exercisesLogged: todayExercises.length,
        measurementsTaken: weekMeasurements.filter((m) => {
          const d = new Date(m.date);
          return d >= today && d < tomorrow;
        }).length,
      },
      upcomingAppointments: upcomingAppointments.map((a) => ({
        _id: a._id,
        date: a.date,
        time: a.time,
        status: a.status,
        clientId: a.clientId,
      })),
      clientActivity: clientActivity
        .sort((a, b) => b.activityScore - a.activityScore)
        .slice(0, 5),
      clientProgress: clientsWithProgress.slice(0, 5),
      weekMeasurements: weekMeasurements.length,
    });
  } catch (error) {
    console.error("Dietitian stats error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
