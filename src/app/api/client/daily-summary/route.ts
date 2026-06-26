import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import Meal from "@/lib/models/Meal";
import Measurement from "@/lib/models/Measurement";
import WaterIntake from "@/lib/models/WaterIntake";
import Appointment from "@/lib/models/Appointment";
import Exercise from "@/lib/models/Exercise";
import Sleep from "@/lib/models/Sleep";
import CheckIn from "@/lib/models/CheckIn";
import Achievement, { ACHIEVEMENT_DEFINITIONS } from "@/lib/models/Achievement";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

// GET /api/client/daily-summary - Get daily summary for the client
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await dbConnect();
    // Ensure User model is registered for populate calls
    void User;

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) {
      return NextResponse.json({
        totalCalories: 0,
        targetCalories: 1800,
        totalProtein: 0,
        targetProtein: 120,
        totalCarbs: 0,
        targetCarbs: 200,
        totalFat: 0,
        targetFat: 60,
        waterIntake: 0,
        waterTarget: 2.5,
        startWeight: 0,
        currentWeight: 0,
        targetWeight: 0,
        upcomingAppointments: [],
        todayExercise: { totalMinutes: 0, totalCaloriesBurned: 0, exerciseCount: 0 },
        todaySleep: null,
        todayCheckIn: null,
        loginStreak: 0,
        totalPoints: 0,
        recentAchievements: [],
      });
    }

    // Use the client's local date when provided to avoid UTC vs local timezone mismatch
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date"); // "YYYY-MM-DD" from client's local date

    let today: Date;
    let tomorrow: Date;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      today = new Date(dateParam + "T00:00:00.000Z");
      tomorrow = new Date(dateParam + "T00:00:00.000Z");
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    } else {
      today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      tomorrow = new Date(today);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    }

    // Each query runs independently so a single failure doesn't block the rest
    const [meals, waterRecord, todayExercises, todaySleep, todayCheckIn, recentAchievements, appointments, latestMeasurement] =
      await Promise.allSettled([
        Meal.find({ clientId: client._id, date: { $gte: today, $lt: tomorrow } }),
        WaterIntake.findOne({ clientId: client._id, date: { $gte: today, $lt: tomorrow } }),
        Exercise.find({ clientId: client._id, date: { $gte: today, $lt: tomorrow } }),
        Sleep.findOne({ clientId: client._id, date: { $gte: today, $lt: tomorrow } }),
        CheckIn.findOne({ clientId: client._id, date: { $gte: today, $lt: tomorrow } }),
        Achievement.find({ clientId: client._id }).sort({ unlockedAt: -1 }).limit(5),
        Appointment.find({
          clientId: client._id,
          date: { $gte: new Date() },
          status: { $in: ["pending", "confirmed"] },
        })
          .sort({ date: 1 })
          .limit(5)
          .populate("dietitianId", "name"),
        Measurement.findOne({ clientId: client._id, weight: { $exists: true, $ne: null } })
          .sort({ date: -1 }),
      ]);

    // Meals
    const mealDocs = meals.status === "fulfilled" ? meals.value : [];
    const totalCalories = mealDocs.reduce((sum, m) => sum + (m.totalCalories || 0), 0);
    const totalProtein = mealDocs.reduce((sum, m) => sum + (m.totalProtein || 0), 0);
    const totalCarbs = mealDocs.reduce((sum, m) => sum + (m.totalCarbs || 0), 0);
    const totalFat = mealDocs.reduce((sum, m) => sum + (m.totalFat || 0), 0);

    // Water
    const waterAmount = waterRecord.status === "fulfilled" ? (waterRecord.value?.amount || 0) : 0;

    // Exercises
    const exerciseDocs = todayExercises.status === "fulfilled" ? todayExercises.value : [];
    const totalExerciseMinutes = exerciseDocs.reduce((sum, e) => sum + e.duration, 0);
    const totalCaloriesBurned = exerciseDocs.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);

    // Sleep
    const sleepDoc = todaySleep.status === "fulfilled" ? todaySleep.value : null;

    // CheckIn
    const checkInDoc = todayCheckIn.status === "fulfilled" ? todayCheckIn.value : null;

    // Achievements
    const achievementDocs = recentAchievements.status === "fulfilled" ? recentAchievements.value : [];

    // Latest measurement weight
    const latestMeasurementDoc = latestMeasurement.status === "fulfilled" ? latestMeasurement.value : null;
    const currentWeight = latestMeasurementDoc?.weight ?? client.weight;

    // Appointments
    const appointmentDocs = appointments.status === "fulfilled" ? appointments.value : [];
    const upcomingAppointments = appointmentDocs.map((apt) => {
      const dietitian = apt.dietitianId as unknown as { name: string };
      return {
        _id: apt._id,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        dietitianName: dietitian?.name || "",
      };
    });

    return NextResponse.json({
      totalCalories,
      targetCalories: client.targetCalories || 1800,
      totalProtein,
      targetProtein: client.targetProtein || 120,
      totalCarbs,
      targetCarbs: client.targetCarbs || 200,
      totalFat,
      targetFat: client.targetFat || 60,
      waterIntake: waterAmount,
      waterTarget: client.targetWater || 2.5,
      startWeight: client.startWeight,
      currentWeight,
      currentHeight: client.height,
      targetWeight: client.targetWeight,
      upcomingAppointments,
      todayExercise: {
        totalMinutes: totalExerciseMinutes,
        totalCaloriesBurned,
        exerciseCount: exerciseDocs.length,
      },
      todaySleep: sleepDoc
        ? { duration: sleepDoc.duration, quality: sleepDoc.quality }
        : null,
      todayCheckIn: checkInDoc
        ? { mood: checkInDoc.mood, energyLevel: checkInDoc.energyLevel }
        : null,
      loginStreak: client.loginStreak || 0,
      totalPoints: client.totalPoints || 0,
      recentAchievements: achievementDocs.map((a) => {
        const def = Object.values(ACHIEVEMENT_DEFINITIONS).find(
          (d) => d.id === a.achievementId,
        );
        return {
          achievementId: a.achievementId,
          name: def?.name || a.achievementId,
          icon: def?.icon || "🏆",
          unlockedAt: a.unlockedAt,
        };
      }),
    });
  } catch (error) {
    console.error("Daily summary error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
