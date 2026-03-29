import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import Meal from "@/lib/models/Meal";
import Exercise from "@/lib/models/Exercise";
import Sleep from "@/lib/models/Sleep";
import CheckIn from "@/lib/models/CheckIn";
import WaterIntake from "@/lib/models/WaterIntake";
import Measurement from "@/lib/models/Measurement";

// GET /api/client/weekly-summary - Haftalık özet
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

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

    const client = await Client.findById(targetClientId);
    if (!client) {
      return NextResponse.json(
        { error: "Danışan bulunamadı" },
        { status: 404 },
      );
    }

    // Son 7 gün
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    // Öğün verileri
    const meals = await Meal.find({
      clientId: targetClientId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Egzersiz verileri
    const exercises = await Exercise.find({
      clientId: targetClientId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Uyku verileri
    const sleepRecords = await Sleep.find({
      clientId: targetClientId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Check-in verileri
    const checkIns = await CheckIn.find({
      clientId: targetClientId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Su verileri
    const waterRecords = await WaterIntake.find({
      clientId: targetClientId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Son ölçüm
    const latestMeasurement = await Measurement.findOne({
      clientId: targetClientId,
    }).sort({ date: -1 });

    // Günlük veriler
    const dailyData = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayMeals = meals.filter((m) => {
        const mDate = new Date(m.date);
        return mDate >= day && mDate <= dayEnd;
      });

      const dayExercises = exercises.filter((e) => {
        const eDate = new Date(e.date);
        return eDate >= day && eDate <= dayEnd;
      });

      const daySleep = sleepRecords.find((s) => {
        const sDate = new Date(s.date);
        sDate.setHours(0, 0, 0, 0);
        day.setHours(0, 0, 0, 0);
        return sDate.getTime() === day.getTime();
      });

      const dayCheckIn = checkIns.find((c) => {
        const cDate = new Date(c.date);
        cDate.setHours(0, 0, 0, 0);
        day.setHours(0, 0, 0, 0);
        return cDate.getTime() === day.getTime();
      });

      const dayWater = waterRecords.find((w) => {
        const wDate = new Date(w.date);
        wDate.setHours(0, 0, 0, 0);
        day.setHours(0, 0, 0, 0);
        return wDate.getTime() === day.getTime();
      });

      dailyData.push({
        date: day.toISOString(),
        dayName: day.toLocaleDateString("tr-TR", { weekday: "short" }),
        calories: dayMeals.reduce((sum, m) => sum + m.totalCalories, 0),
        protein: dayMeals.reduce((sum, m) => sum + (m.totalProtein || 0), 0),
        carbs: dayMeals.reduce((sum, m) => sum + (m.totalCarbs || 0), 0),
        fat: dayMeals.reduce((sum, m) => sum + (m.totalFat || 0), 0),
        exerciseMinutes: dayExercises.reduce((sum, e) => sum + e.duration, 0),
        caloriesBurned: dayExercises.reduce(
          (sum, e) => sum + (e.caloriesBurned || 0),
          0,
        ),
        sleepHours: daySleep?.duration || 0,
        sleepQuality: daySleep?.quality || 0,
        mood: dayCheckIn?.mood || 0,
        energyLevel: dayCheckIn?.energyLevel || 0,
        waterIntake: dayWater?.amount || 0,
      });
    }

    // Toplam ve ortalamalar
    const totalCalories = dailyData.reduce((sum, d) => sum + d.calories, 0);
    const avgCalories = Math.round(totalCalories / 7);
    const totalExerciseMinutes = dailyData.reduce(
      (sum, d) => sum + d.exerciseMinutes,
      0,
    );
    const avgSleep =
      dailyData.filter((d) => d.sleepHours > 0).length > 0
        ? Math.round(
            (dailyData.reduce((sum, d) => sum + d.sleepHours, 0) /
              dailyData.filter((d) => d.sleepHours > 0).length) *
              10,
          ) / 10
        : 0;
    const avgMood =
      dailyData.filter((d) => d.mood > 0).length > 0
        ? Math.round(
            (dailyData.reduce((sum, d) => sum + d.mood, 0) /
              dailyData.filter((d) => d.mood > 0).length) *
              10,
          ) / 10
        : 0;
    const totalWater = dailyData.reduce((sum, d) => sum + d.waterIntake, 0);

    // Hedef karşılaştırması
    const calorieGoalMet = dailyData.filter((d) => {
      const target = client.targetCalories || 1800;
      return d.calories >= target * 0.9 && d.calories <= target * 1.1;
    }).length;

    const waterGoalMet = dailyData.filter(
      (d) => d.waterIntake >= (client.targetWater || 2.5),
    ).length;

    return NextResponse.json({
      client: {
        name: client.userId,
        currentWeight: client.weight,
        targetWeight: client.targetWeight,
        startWeight: client.startWeight,
        targetCalories: client.targetCalories || 1800,
        targetWater: client.targetWater || 2.5,
        loginStreak: client.loginStreak || 0,
        totalPoints: client.totalPoints || 0,
      },
      dailyData,
      summary: {
        totalCalories,
        avgCalories,
        totalExerciseMinutes,
        avgSleep,
        avgMood,
        totalWater,
        calorieGoalMet,
        waterGoalMet,
        daysLogged: dailyData.filter((d) => d.calories > 0).length,
      },
      latestMeasurement: latestMeasurement?.regions || null,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  } catch (error) {
    console.error("Weekly summary error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
