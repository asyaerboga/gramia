"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import CalorieBar from "@/components/client/CalorieBar";
import WaterTracker from "@/components/client/WaterTracker";
import GoalProgressBar from "@/components/client/GoalProgressBar";
import {
  FaFire,
  FaDumbbell,
  FaMoon,
  FaSmile,
  FaTrophy,
  FaBolt,
  FaArrowRight,
  FaCheckCircle,
} from "react-icons/fa";

interface Appointment {
  _id: string;
  date: string;
  time: string;
  dietitianName?: string;
}

interface TodayExercise {
  totalMinutes: number;
  totalCaloriesBurned: number;
  exerciseCount: number;
}

interface Sleep {
  duration: number;
  quality: number;
}

interface CheckIn {
  mood: number;
  energyLevel: number;
}

interface Achievement {
  achievementId: string;
  name: string;
  icon: string;
  unlockedAt: string;
}

interface ClientSummary {
  totalCalories: number;
  targetCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  waterIntake: number;
  waterTarget: number;
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  upcomingAppointments: Appointment[];
  todayExercise: TodayExercise | null;
  todaySleep: Sleep | null;
  todayCheckIn: CheckIn | null;
  loginStreak: number;
  totalPoints: number;
  recentAchievements: Achievement[];
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<ClientSummary>({
    totalCalories: 0,
    targetCalories: 1800,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    targetProtein: 120,
    targetCarbs: 200,
    targetFat: 60,
    waterIntake: 0,
    waterTarget: 2.5,
    startWeight: 85,
    currentWeight: 79,
    targetWeight: 70,
    upcomingAppointments: [],
    todayExercise: null,
    todaySleep: null,
    todayCheckIn: null,
    loginStreak: 0,
    totalPoints: 0,
    recentAchievements: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/client/daily-summary");
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Failed to fetch summary:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleWaterUpdate = async (amount: number) => {
    try {
      const res = await fetch("/api/water-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        setSummary((prev) => ({
          ...prev,
          waterIntake: +(prev.waterIntake + amount).toFixed(1),
        }));
      }
    } catch (error) {
      console.error("Failed to update water intake:", error);
    }
  };

  const getMoodEmoji = (mood: number) => {
    const emojis = ["😢", "😔", "😐", "🙂", "😄"];
    return emojis[mood - 1] || "😐";
  };

  const getEnergyLabel = (level: number) => {
    const labels = ["Çok Düşük", "Düşük", "Orta", "Yüksek", "Çok Yüksek"];
    return labels[level - 1] || "Orta";
  };

  const MacroBar = ({
    label,
    current,
    target,
    color,
  }: {
    label: string;
    current: number;
    target: number;
    color: string;
  }) => {
    const percentage = Math.min((current / target) * 100, 100);
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium text-gray-900">
            {current}g / {target}g
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full progress-bar ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded-lg w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-48 bg-gray-200 rounded-2xl lg:col-span-2" />
            <div className="h-48 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const totalExerciseCalories = summary.todayExercise?.totalCaloriesBurned || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      <div className="flex flex-col lg:flex-row">
        {/* Main content */}
        <div className="flex-1 p-4 md:p-6">
          {/* Header with Streak */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Hoş Geldin, {session?.user?.name?.split(" ")[0] || "Danışan"} 👋
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {new Date().toLocaleDateString("tr-TR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {/* Streak Badge */}
              <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 md:px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-200">
                <FaFire className="text-yellow-200" />
                <span className="font-bold">{summary.loginStreak}</span>
                <span className="text-xs md:text-sm opacity-90">gün seri</span>
              </div>
              {/* Points Badge */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 md:px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-200">
                <FaTrophy className="text-yellow-200" />
                <span className="font-bold">{summary.totalPoints}</span>
                <span className="text-xs md:text-sm opacity-90">puan</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 card-hover">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FaFire className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Kalori</p>
                  <p className="font-bold text-gray-900">
                    {summary.totalCalories}
                    <span className="text-gray-400 font-normal text-sm">
                      /{summary.targetCalories}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 card-hover">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaDumbbell className="text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Egzersiz</p>
                  <p className="font-bold text-gray-900">
                    {totalExerciseCalories}
                    <span className="text-gray-400 font-normal text-sm">
                      {" "}
                      kcal
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 card-hover">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FaMoon className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Uyku</p>
                  <p className="font-bold text-gray-900">
                    {summary.todaySleep?.duration || "-"}
                    <span className="text-gray-400 font-normal text-sm">
                      {" "}
                      saat
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 card-hover">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FaSmile className="text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ruh Hali</p>
                  <p className="font-bold text-gray-900 text-xl">
                    {summary.todayCheckIn
                      ? getMoodEmoji(summary.todayCheckIn.mood)
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Cards Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Calorie + Macros Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🍽️ Günlük Besin Takibi
              </h3>
              <div className="mb-6">
                <CalorieBar
                  current={summary.totalCalories}
                  target={summary.targetCalories}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MacroBar
                  label="Protein"
                  current={summary.totalProtein}
                  target={summary.targetProtein}
                  color="bg-red-500"
                />
                <MacroBar
                  label="Karbonhidrat"
                  current={summary.totalCarbs}
                  target={summary.targetCarbs}
                  color="bg-amber-500"
                />
                <MacroBar
                  label="Yağ"
                  current={summary.totalFat}
                  target={summary.targetFat}
                  color="bg-blue-500"
                />
              </div>
              <Link
                href="/dashboard/client/meals"
                className="mt-4 inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700"
              >
                Öğün ekle <FaArrowRight className="ml-1 text-xs" />
              </Link>
            </div>

            {/* Water Tracker */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                💧 Su Takibi
              </h3>
              <WaterTracker
                current={summary.waterIntake}
                target={summary.waterTarget}
                onUpdate={handleWaterUpdate}
              />
            </div>
          </div>

          {/* Goal + Today's Activity Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Goal Progress */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🎯 Kilo Hedefi
              </h3>
              <GoalProgressBar
                startWeight={summary.startWeight}
                currentWeight={summary.currentWeight}
                targetWeight={summary.targetWeight}
              />
            </div>

            {/* Today's Check-in */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  ✨ Günlük Durum
                </h3>
                <Link
                  href="/dashboard/client/wellness"
                  className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
                >
                  Güncelle <FaArrowRight className="ml-1 text-xs" />
                </Link>
              </div>
              {summary.todayCheckIn ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-yellow-50 rounded-xl p-4 text-center">
                    <p className="text-3xl mb-1">
                      {getMoodEmoji(summary.todayCheckIn.mood)}
                    </p>
                    <p className="text-xs text-gray-500">Ruh Hali</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <FaBolt className="text-purple-500" />
                      <span className="font-bold text-purple-700">
                        {summary.todayCheckIn.energyLevel}/5
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {getEnergyLabel(summary.todayCheckIn.energyLevel)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm mb-3">
                    Bugün henüz check-in yapmadınız
                  </p>
                  <Link
                    href="/dashboard/client/wellness"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition text-sm"
                  >
                    <FaCheckCircle /> Check-in Yap
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Achievements */}
          {summary.recentAchievements?.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  🏆 Son Kazanılan Rozetler
                </h3>
                <Link
                  href="/dashboard/client/achievements"
                  className="text-sm text-amber-600 hover:text-amber-700 flex items-center"
                >
                  Tümünü Gör <FaArrowRight className="ml-1 text-xs" />
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {summary.recentAchievements.map((achievement) => (
                  <div
                    key={achievement.achievementId}
                    className="flex-shrink-0 bg-white rounded-xl p-4 text-center shadow-sm min-w-[120px]"
                  >
                    <span className="text-3xl block mb-2">
                      {achievement.icon}
                    </span>
                    <p className="text-sm font-medium text-gray-900">
                      {achievement.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <aside className="w-full lg:w-80 bg-white lg:min-h-screen p-4 md:p-6 shadow-sm lg:border-l border-t lg:border-t-0 border-gray-100">
          {/* Appointments */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📅 Randevularım
            </h3>
            <div className="space-y-3">
              {summary.upcomingAppointments.length > 0 ? (
                summary.upcomingAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt._id}
                    className="bg-emerald-50 rounded-xl p-4 border border-emerald-100"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      📅{" "}
                      {new Date(apt.date).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    <p className="text-sm text-gray-600">⏰ {apt.time}</p>
                    {apt.dietitianName && (
                      <p className="text-sm text-gray-500 mt-1">
                        {apt.dietitianName}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  Yaklaşan randevu yok
                </p>
              )}
            </div>
          </div>

          {/* Today's Exercises */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                🏃 Bugünkü Egzersiz
              </h3>
              <Link
                href="/dashboard/client/exercises"
                className="text-xs text-emerald-600 hover:text-emerald-700"
              >
                + Ekle
              </Link>
            </div>
            <div className="space-y-2">
              {summary.todayExercise &&
              summary.todayExercise.exerciseCount > 0 ? (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {summary.todayExercise.exerciseCount} egzersiz
                    </p>
                    <span className="text-xs text-purple-600 font-semibold">
                      {summary.todayExercise.totalCaloriesBurned} kcal
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Toplam {summary.todayExercise.totalMinutes} dakika
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  Henüz egzersiz eklenmedi
                </p>
              )}
            </div>
          </div>

          {/* Sleep Summary */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              😴 Uyku Özeti
            </h3>
            {summary.todaySleep ? (
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Süre</span>
                  <span className="font-semibold text-gray-900">
                    {summary.todaySleep.duration} saat
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Kalite</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= summary.todaySleep!.quality
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400 mb-2">Uyku kaydı yok</p>
                <Link
                  href="/dashboard/client/wellness"
                  className="text-xs text-emerald-600 hover:text-emerald-700"
                >
                  Uyku Kaydet
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
