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

    // Bugün ölçüm yapan danışanlar
    const todayMeasurements = weekMeasurements.filter((m) => {
      const d = new Date(m.date);
      return d >= today && d < tomorrow;
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

    // Her danışanın en güncel ağırlığını ölçümlerden al
    const measurementsWithWeight = await Measurement.find({
      clientId: { $in: clientIds },
      weight: { $exists: true, $ne: null },
    }).sort({ date: -1 });

    const latestWeightMap = new Map<string, number>();
    for (const m of measurementsWithWeight) {
      const key = m.clientId.toString();
      if (!latestWeightMap.has(key)) {
        latestWeightMap.set(key, m.weight as number);
      }
    }

    // Hedef yönünü belirle ve ilerleme hesapla (kilo verme veya alma)
    const calcProgress = (startW: number, currentW: number, targetW: number): number => {
      if (startW === targetW) return 0;
      if (startW > targetW) {
        // Kilo verme hedefi
        const totalToLose = startW - targetW;
        const lost = startW - currentW;
        return Math.min(100, Math.max(0, Math.round((lost / totalToLose) * 100)));
      } else {
        // Kilo alma hedefi
        const totalToGain = targetW - startW;
        const gained = currentW - startW;
        return Math.min(100, Math.max(0, Math.round((gained / totalToGain) * 100)));
      }
    };

    const hasReachedGoal = (startW: number, currentW: number, targetW: number): boolean => {
      if (startW > targetW) return currentW <= targetW;
      if (startW < targetW) return currentW >= targetW;
      return false;
    };

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
        const currentWeight =
          latestWeightMap.get(client._id.toString()) ?? client.weight;
        const startW = client.startWeight ?? client.weight;
        return {
          clientId: client._id,
          name: user?.name || "İsimsiz",
          activityScore: mealCount + exerciseCount,
          weight: currentWeight,
          targetWeight: client.targetWeight,
          progress: calcProgress(startW, currentWeight, client.targetWeight),
        };
      }),
    );

    // Hedefine ulaşan danışanlar (kilo verme veya alma hedefi olan ve hedefe ulaşmış)
    const goalReached = clients.filter((c) => {
      const currentWeight =
        latestWeightMap.get(c._id.toString()) ?? c.weight;
      const startW = c.startWeight ?? c.weight;
      return hasReachedGoal(startW, currentWeight, c.targetWeight);
    }).length;

    // İlerleme raporları
    const clientsWithProgress = clients
      .map((c) => {
        const user = c.userId as unknown as { name: string };
        const currentWeight =
          latestWeightMap.get(c._id.toString()) ?? c.weight;
        const startW = c.startWeight ?? c.weight;
        const progress = calcProgress(startW, currentWeight, c.targetWeight);
        return {
          id: c._id,
          name: user?.name || "İsimsiz",
          startWeight: startW,
          currentWeight,
          targetWeight: c.targetWeight,
          progress,
          lostKg: Math.round(Math.abs(startW - currentWeight) * 10) / 10,
        };
      })
      .sort((a, b) => b.progress - a.progress);

    // Bugün öğün kaydeden, egzersiz kaydeden, ölçüm yapan danışan listeleri
    const clientMap = new Map(
      clients.map((c) => {
        const user = c.userId as unknown as { name: string };
        return [c._id.toString(), user?.name || "İsimsiz"];
      }),
    );

    const uniqueClientNames = (ids: string[]) =>
      [...new Set(ids)].map((id) => ({ id, name: clientMap.get(id) || "İsimsiz" }));

    const mealClients = uniqueClientNames(todayMeals.map((m) => m.clientId.toString()));
    const exerciseClients = uniqueClientNames(todayExercises.map((e) => e.clientId.toString()));
    const measurementClients = uniqueClientNames(todayMeasurements.map((m) => m.clientId.toString()));

    // Hedefe ulaşan danışanların tam listesi (modal için)
    const goalReachedClients = clients
      .filter((c) => {
        const currentWeight =
          latestWeightMap.get(c._id.toString()) ?? c.weight;
        const startW = c.startWeight ?? c.weight;
        return hasReachedGoal(startW, currentWeight, c.targetWeight);
      })
      .map((c) => {
        const user = c.userId as unknown as { name: string };
        const currentWeight =
          latestWeightMap.get(c._id.toString()) ?? c.weight;
        const startW = c.startWeight ?? c.weight;
        const changedKg = Math.round(Math.abs(startW - currentWeight) * 10) / 10;
        return {
          id: c._id,
          name: user?.name || "İsimsiz",
          startWeight: startW,
          currentWeight,
          targetWeight: c.targetWeight,
          progress: 100,
          lostKg: changedKg,
          direction: startW > c.targetWeight ? "loss" : "gain",
        };
      })
      .sort((a, b) => b.lostKg - a.lostKg);

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
        measurementsTaken: todayMeasurements.length,
        mealClients,
        exerciseClients,
        measurementClients,
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
      goalReachedClients,
      weekMeasurements: weekMeasurements.length,
    });
  } catch (error) {
    console.error("Dietitian stats error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
