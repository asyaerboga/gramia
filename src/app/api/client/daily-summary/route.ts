import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import Meal from "@/lib/models/Meal";
import WaterIntake from "@/lib/models/WaterIntake";
import Appointment from "@/lib/models/Appointment";
import Exercise from "@/lib/models/Exercise";
import Sleep from "@/lib/models/Sleep";
import CheckIn from "@/lib/models/CheckIn";
import Achievement, { ACHIEVEMENT_DEFINITIONS } from "@/lib/models/Achievement";

// GET /api/client/daily-summary - Get daily summary for the client
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await dbConnect();

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) {
      return NextResponse.json({
        totalCalories: 0,
        targetCalories: 1800,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        waterIntake: 0,
        waterTarget: 2.5,
        startWeight: 0,
        currentWeight: 0,
        targetWeight: 0,
        upcomingAppointments: [],
        todayExercise: null,
        todaySleep: null,
        todayCheckIn: null,
        loginStreak: 0,
        totalPoints: 0,
        recentAchievements: [],
      });
    }

    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's meals with macros
    const meals = await Meal.find({
      clientId: client._id,
      date: { $gte: today, $lt: tomorrow },
    });
    const totalCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);
    const totalProtein = meals.reduce(
      (sum, m) => sum + (m.totalProtein || 0),
      0,
    );
    const totalCarbs = meals.reduce((sum, m) => sum + (m.totalCarbs || 0), 0);
    const totalFat = meals.reduce((sum, m) => sum + (m.totalFat || 0), 0);

    // Today's water intake
    const waterRecord = await WaterIntake.findOne({
      clientId: client._id,
      date: { $gte: today, $lt: tomorrow },
    });

    // Today's exercise
    const todayExercises = await Exercise.find({
      clientId: client._id,
      date: { $gte: today, $lt: tomorrow },
    });
    const totalExerciseMinutes = todayExercises.reduce(
      (sum, e) => sum + e.duration,
      0,
    );
    const totalCaloriesBurned = todayExercises.reduce(
      (sum, e) => sum + (e.caloriesBurned || 0),
      0,
    );

    // Today's sleep (previous night)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const todaySleep = await Sleep.findOne({
      clientId: client._id,
      date: { $gte: yesterday, $lt: today },
    });

    // Today's check-in
    const todayCheckIn = await CheckIn.findOne({
      clientId: client._id,
      date: { $gte: today, $lt: tomorrow },
    });

    // Recent achievements (last 5)
    const recentAchievements = await Achievement.find({
      clientId: client._id,
    })
      .sort({ unlockedAt: -1 })
      .limit(5);

    // Upcoming appointments
    const appointments = await Appointment.find({
      clientId: client._id,
      date: { $gte: new Date() },
      status: { $in: ["pending", "confirmed"] },
    })
      .sort({ date: 1 })
      .limit(5)
      .populate("dietitianId", "name");

    const upcomingAppointments = appointments.map((apt) => {
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
      targetProtein: client.targetProtein || 0,
      totalCarbs,
      targetCarbs: client.targetCarbs || 0,
      totalFat,
      targetFat: client.targetFat || 0,
      waterIntake: waterRecord?.amount || 0,
      waterTarget: client.targetWater || 2.5,
      startWeight: client.startWeight,
      currentWeight: client.weight,
      targetWeight: client.targetWeight,
      upcomingAppointments,
      todayExercise: {
        totalMinutes: totalExerciseMinutes,
        totalCaloriesBurned,
        exerciseCount: todayExercises.length,
      },
      todaySleep: todaySleep
        ? {
            duration: todaySleep.duration,
            quality: todaySleep.quality,
          }
        : null,
      todayCheckIn: todayCheckIn
        ? {
            mood: todayCheckIn.mood,
            energyLevel: todayCheckIn.energyLevel,
          }
        : null,
      loginStreak: client.loginStreak || 0,
      totalPoints: client.totalPoints || 0,
      recentAchievements: recentAchievements.map((a) => {
        const def =
          ACHIEVEMENT_DEFINITIONS[
            a.achievementId as keyof typeof ACHIEVEMENT_DEFINITIONS
          ];
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
