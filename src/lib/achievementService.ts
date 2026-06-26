import dbConnect from "@/lib/mongodb";
import Achievement, { ACHIEVEMENT_DEFINITIONS } from "@/lib/models/Achievement";
import Client from "@/lib/models/Client";
import Exercise from "@/lib/models/Exercise";
import Measurement from "@/lib/models/Measurement";
import Message from "@/lib/models/Message";
import Meal from "@/lib/models/Meal";
import CheckIn from "@/lib/models/CheckIn";
import WaterIntake from "@/lib/models/WaterIntake";
import { WEIGHT_GOAL_TOLERANCE_KG } from "@/lib/constants";

function toKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function consecutiveDayStreak(
  dates: Date[],
  maxDays = 60,
): Promise<number> {
  const daySet = new Set(dates.map((d) => toKey(d)));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < maxDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (!daySet.has(toKey(d))) break;
    streak++;
  }
  return streak;
}

/**
 * Checks all achievement conditions for a client and awards any that are
 * newly earned. Returns array of newly awarded achievement IDs.
 * Safe to call after any user action (idempotent per achievement).
 */
export async function checkAndAwardAchievements(
  clientId: string,
): Promise<string[]> {
  try {
    await dbConnect();

    const [client, existing] = await Promise.all([
      Client.findById(clientId),
      Achievement.find({ clientId }).select("achievementId"),
    ]);

    if (!client) return [];

    const alreadyHas = new Set(existing.map((a) => a.achievementId));
    const awarded: string[] = [];

    const tryAward = async (id: string, points: number) => {
      if (alreadyHas.has(id)) return;
      try {
        await Achievement.create({
          clientId,
          achievementId: id,
          unlockedAt: new Date(),
        });
        await Client.findByIdAndUpdate(clientId, {
          $inc: { totalPoints: points },
        });
        alreadyHas.add(id);
        awarded.push(id);
      } catch {
        // duplicate key – already exists, safe to ignore
      }
    };

    /* ── Login streak ─────────────────────────────── */
    const streak = client.loginStreak || 0;
    if (streak >= 7) await tryAward("streak_7", 50);
    if (streak >= 30) await tryAward("streak_30", 200);
    if (streak >= 100) await tryAward("streak_100", 500);

    /* ── Weight progress ──────────────────────────── */
    // Hedef yönü: hedef kilo başlangıçtan belirgin şekilde düşükse "verme",
    // belirgin şekilde yüksekse "alma", aksi halde "koruma" hedefi sayılır.
    const startW = client.startWeight ?? client.weight;
    const curW = client.weight;
    const targetW = client.targetWeight;
    const isGainGoal =
      startW != null && targetW != null && targetW > startW + WEIGHT_GOAL_TOLERANCE_KG;
    const isLoseGoal =
      startW != null && targetW != null && targetW < startW - WEIGHT_GOAL_TOLERANCE_KG;
    const isMaintainGoal = !isGainGoal && !isLoseGoal;

    if (startW && curW) {
      if (isLoseGoal) {
        const lost = startW - curW;
        if (lost >= 1) await tryAward("weight_lost_1", 25);
        if (lost >= 5) await tryAward("weight_lost_5", 100);
        if (lost >= 10) await tryAward("weight_lost_10", 250);
      } else if (isGainGoal) {
        const gained = curW - startW;
        if (gained >= 1) await tryAward("weight_gained_1", 25);
        if (gained >= 5) await tryAward("weight_gained_5", 100);
        if (gained >= 10) await tryAward("weight_gained_10", 250);
      }
    }
    if (curW && targetW) {
      const goalReached = isGainGoal
        ? curW >= targetW
        : isMaintainGoal
          ? Math.abs(curW - targetW) <= WEIGHT_GOAL_TOLERANCE_KG
          : curW <= targetW;
      if (goalReached) {
        await tryAward("goal_reached", ACHIEVEMENT_DEFINITIONS.GOAL_REACHED.points);
      }
    }

    /* ── Weight maintenance streak (koruma hedefi) ─── */
    if (isMaintainGoal && targetW) {
      const maintainCutoff = new Date();
      maintainCutoff.setDate(maintainCutoff.getDate() - 30);
      maintainCutoff.setHours(0, 0, 0, 0);

      const weightMeasurements = await Measurement.find({
        clientId,
        date: { $gte: maintainCutoff },
        weight: { $exists: true, $ne: null },
      })
        .select("date weight")
        .sort({ date: 1 });

      if (weightMeasurements.length > 0) {
        const allWithinRange = weightMeasurements.every(
          (m) =>
            m.weight != null &&
            Math.abs(m.weight - targetW) <= WEIGHT_GOAL_TOLERANCE_KG,
        );
        const daysTracked = Math.floor(
          (Date.now() - new Date(weightMeasurements[0].date).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (allWithinRange && daysTracked >= 14) {
          await tryAward("weight_maintained_14", 75);
        }
        if (allWithinRange && daysTracked >= 30) {
          await tryAward("weight_maintained_30", 250);
        }
      }
    }

    /* ── Exercise count ───────────────────────────── */
    const exerciseCount = await Exercise.countDocuments({ clientId });
    if (exerciseCount >= 1) await tryAward("exercise_first", 25);
    if (exerciseCount >= 10) await tryAward("exercise_10", 100);
    if (exerciseCount >= 50) await tryAward("exercise_50", 300);

    /* ── Measurement count ────────────────────────── */
    const measurementCount = await Measurement.countDocuments({ clientId });
    if (measurementCount >= 1) await tryAward("measurement_first", 15);
    if (measurementCount >= 10) await tryAward("measurement_10", 75);

    /* ── Message count ────────────────────────────── */
    const msgCount = await Message.countDocuments({
      senderId: client.userId,
    });
    if (msgCount >= 1) await tryAward("message_first", 10);

    /* ── Meal consecutive days ────────────────────── */
    const cutoff60 = new Date();
    cutoff60.setDate(cutoff60.getDate() - 60);
    cutoff60.setHours(0, 0, 0, 0);

    const mealDocs = await Meal.find({
      clientId,
      date: { $gte: cutoff60 },
    }).select("date");
    const mealStreak = await consecutiveDayStreak(
      mealDocs.map((m) => new Date(m.date)),
    );
    if (mealStreak >= 7) await tryAward("meal_logged_7", 50);
    if (mealStreak >= 30) await tryAward("meal_logged_30", 200);

    /* ── Check-in consecutive days ────────────────── */
    const checkInDocs = await CheckIn.find({
      clientId,
      date: { $gte: cutoff60 },
    }).select("date");
    const checkInStreak = await consecutiveDayStreak(
      checkInDocs.map((c) => new Date(c.date)),
    );
    if (checkInStreak >= 7) await tryAward("checkin_7", 50);

    /* ── Water intake ─────────────────────────────── */
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayWater = await WaterIntake.find({
      clientId,
      date: { $gte: todayStart, $lte: todayEnd },
    });
    const todayWaterTotal = todayWater.reduce((s, w) => s + w.amount, 0);
    const targetWater = client.targetWater || 8; // glasses default
    if (todayWaterTotal >= targetWater) {
      await tryAward("water_daily", 10);
    }

    // Water weekly: 7 consecutive days meeting target (simplified: 7 days with any water intake)
    const waterDocs = await WaterIntake.find({
      clientId,
      date: { $gte: cutoff60 },
    }).select("date");
    const waterStreak = await consecutiveDayStreak(
      waterDocs.map((w) => new Date(w.date)),
    );
    if (waterStreak >= 7) await tryAward("water_weekly", 75);

    return awarded;
  } catch (err) {
    console.error("checkAndAwardAchievements error:", err);
    return [];
  }
}
