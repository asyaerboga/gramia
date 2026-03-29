import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import Exercise from "@/lib/models/Exercise";
import Sleep from "@/lib/models/Sleep";
import CheckIn from "@/lib/models/CheckIn";
import Meal from "@/lib/models/Meal";
import WaterIntake from "@/lib/models/WaterIntake";
import Achievement, { ACHIEVEMENT_DEFINITIONS } from "@/lib/models/Achievement";

// GET /api/dietitian/clients/[clientId]/data - Get all client data for dietitian
export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { clientId } = await params;
    const url = new URL(request.url);
    const category = url.searchParams.get("category") || "all";
    const days = parseInt(url.searchParams.get("days") || "7");

    await dbConnect();

    // Verify client belongs to this dietitian
    const client = await Client.findOne({
      _id: clientId,
      dietitianId: session.user.id,
    });

    if (!client) {
      return NextResponse.json(
        { error: "Danışan bulunamadı" },
        { status: 404 },
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const result: Record<string, unknown> = {};

    // Exercises
    if (category === "all" || category === "exercises") {
      const exercises = await Exercise.find({
        clientId,
        date: { $gte: startDate },
      }).sort({ date: -1 });

      const totalMinutes = exercises.reduce((sum, e) => sum + e.duration, 0);
      const totalCalories = exercises.reduce(
        (sum, e) => sum + (e.caloriesBurned || 0),
        0,
      );

      // Group by type
      const byType: Record<
        string,
        { count: number; minutes: number; calories: number }
      > = {};
      exercises.forEach((e) => {
        if (!byType[e.type]) {
          byType[e.type] = { count: 0, minutes: 0, calories: 0 };
        }
        byType[e.type].count++;
        byType[e.type].minutes += e.duration;
        byType[e.type].calories += e.caloriesBurned || 0;
      });

      result.exercises = {
        items: exercises,
        summary: {
          totalCount: exercises.length,
          totalMinutes,
          totalCalories,
          byType,
        },
      };
    }

    // Wellness (Sleep + CheckIn)
    if (category === "all" || category === "wellness") {
      const sleepRecords = await Sleep.find({
        clientId,
        date: { $gte: startDate },
      }).sort({ date: -1 });

      const checkIns = await CheckIn.find({
        clientId,
        date: { $gte: startDate },
      }).sort({ date: -1 });

      const waterIntakes = await WaterIntake.find({
        clientId,
        date: { $gte: startDate },
      }).sort({ date: -1 });

      // Sleep summary
      const avgSleepHours =
        sleepRecords.length > 0
          ? sleepRecords.reduce((sum, s) => sum + s.duration, 0) /
            sleepRecords.length
          : 0;
      const avgSleepQuality =
        sleepRecords.length > 0
          ? sleepRecords.reduce((sum, s) => sum + s.quality, 0) /
            sleepRecords.length
          : 0;

      // CheckIn summary (mood, energy, stress)
      const avgEnergy =
        checkIns.length > 0
          ? checkIns.reduce((sum, c) => sum + c.energyLevel, 0) /
            checkIns.length
          : 0;
      const avgStress =
        checkIns.length > 0
          ? checkIns.reduce((sum, c) => sum + c.stressLevel, 0) /
            checkIns.length
          : 0;

      // Water summary
      const avgWater =
        waterIntakes.length > 0
          ? waterIntakes.reduce((sum, w) => sum + w.amount, 0) /
            waterIntakes.length
          : 0;

      result.wellness = {
        sleep: sleepRecords,
        checkIns,
        waterIntakes,
        summary: {
          avgSleepHours: Math.round(avgSleepHours * 10) / 10,
          avgSleepQuality: Math.round(avgSleepQuality * 10) / 10,
          avgEnergy: Math.round(avgEnergy * 10) / 10,
          avgStress: Math.round(avgStress * 10) / 10,
          avgWater: Math.round(avgWater * 10) / 10,
        },
      };
    }

    // Meals
    if (category === "all" || category === "meals") {
      const meals = await Meal.find({
        clientId,
        date: { $gte: startDate },
      }).sort({ date: -1 });

      const totalCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);
      const avgCaloriesPerDay = meals.length > 0 ? totalCalories / days : 0;

      // Group by meal type
      const byType: Record<string, { count: number; calories: number }> = {};
      meals.forEach((m) => {
        if (!byType[m.mealType]) {
          byType[m.mealType] = { count: 0, calories: 0 };
        }
        byType[m.mealType].count++;
        byType[m.mealType].calories += m.totalCalories;
      });

      // Daily breakdown
      const dailyCalories: Record<string, number> = {};
      meals.forEach((m) => {
        const dateKey = new Date(m.date).toISOString().split("T")[0];
        dailyCalories[dateKey] =
          (dailyCalories[dateKey] || 0) + m.totalCalories;
      });

      result.meals = {
        items: meals,
        summary: {
          totalMeals: meals.length,
          totalCalories,
          avgCaloriesPerDay: Math.round(avgCaloriesPerDay),
          byType,
          dailyCalories,
        },
      };
    }

    // Achievements
    if (category === "all" || category === "achievements") {
      const achievements = await Achievement.find({ clientId }).sort({
        unlockedAt: -1,
      });

      const achievementDefs = Object.values(ACHIEVEMENT_DEFINITIONS);
      const enrichedAchievements = achievements.map((a) => {
        const def = achievementDefs.find((d) => d.id === a.achievementId);
        return {
          _id: a._id,
          achievementId: a.achievementId,
          name: def?.name || a.achievementId,
          description: def?.description || "",
          icon: def?.icon || "🏅",
          points: def?.points || 0,
          unlockedAt: a.unlockedAt,
        };
      });

      const totalPoints = enrichedAchievements.reduce(
        (sum, a) => sum + a.points,
        0,
      );

      result.achievements = {
        items: enrichedAchievements,
        summary: {
          totalAchievements: achievementDefs.length,
          unlockedCount: achievements.length,
          totalPoints,
        },
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Fetch client data error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
