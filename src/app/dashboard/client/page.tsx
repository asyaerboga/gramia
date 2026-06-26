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
  FaTimes,
  FaBell,
} from "react-icons/fa";

interface AppointmentNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
}

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
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
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
  const [notifications, setNotifications] = useState<AppointmentNotification[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) setNotifications(await res.json());
    } catch { /* ignore */ }
  }, []);

  const dismissNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {});
  };

  const dismissAll = async () => {
    setNotifications([]);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
  };

  const fetchSummary = useCallback(async () => {
    try {
      const d = new Date();
      const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const res = await fetch(`/api/client/daily-summary?date=${localDate}`, { cache: "no-store" });
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
    fetchNotifications();
    const notifPoll = setInterval(fetchNotifications, 15_000);
    return () => clearInterval(notifPoll);
  }, [fetchNotifications]);

  useEffect(() => {
    fetchSummary();
    fetch("/api/user/avatar")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.image && setAvatarImage(d.image))
      .catch(() => {});

    const onVisible = () => {
      if (document.visibilityState === "visible") fetchSummary();
    };
    document.addEventListener("visibilitychange", onVisible);
    const poll = setInterval(fetchSummary, 30_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(poll);
    };
  }, [fetchSummary]);

  const handleWaterUpdate = async (amount: number) => {
    try {
      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const res = await fetch("/api/water-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, date: localDate }),
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

  const getMoodGradient = (mood: number) => {
    const g = [
      "from-blue-500 to-indigo-600",
      "from-slate-500 to-blue-500",
      "from-amber-400 to-yellow-500",
      "from-emerald-400 to-teal-500",
      "from-orange-400 to-amber-400",
    ];
    return g[mood - 1] ?? g[2];
  };

  const getMoodLabel = (mood: number) => {
    const labels = ["Üzgün", "Keyifsiz", "İdare Eder", "İyi", "Harika!"];
    return labels[mood - 1] ?? "İdare Eder";
  };

  const getVibeMessage = (mood: number, energy: number) => {
    const avg = (mood + energy) / 2;
    if (avg >= 4.5) return "Bugün yıldızsın! Harika enerjin var ✨";
    if (avg >= 3.5) return "İyi bir gün seni bekliyor! 🌿";
    if (avg >= 2.5) return "Adım adım ilerliyorsun! 💪";
    return "Kendine iyi bak, yarın daha iyi olacak 🌱";
  };

  const MacroRing = ({
    label,
    current,
    target,
    stroke,
    emoji,
  }: {
    label: string;
    current: number;
    target: number;
    stroke: string;
    emoji: string;
  }) => {
    const pct = Math.min((current / target) * 100, 100);
    const r = 24;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative">
          <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
            <circle cx="32" cy="32" r={r} fill="none" stroke="#f3f4f6" strokeWidth="7" />
            <circle
              cx="32" cy="32" r={r}
              fill="none"
              stroke={stroke}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.7s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base">{emoji}</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900 leading-none">{current}g</p>
          <p className="text-xs text-gray-400">/{target}g</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
          <p className="text-xs font-bold mt-0.5" style={{ color: stroke }}>{Math.round(pct)}%</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-emerald-50 to-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto animate-pulse space-y-6">
          <div className="h-32 bg-linear-to-r from-emerald-200 to-teal-200 rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-52 bg-gray-200 rounded-2xl lg:col-span-2" />
            <div className="h-52 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const totalExerciseCalories = summary.todayExercise?.totalCaloriesBurned || 0;
  const caloriePercent = summary.targetCalories > 0
    ? Math.round((summary.totalCalories / summary.targetCalories) * 100)
    : 0;

  const notifColors: Record<string, { bg: string; border: string; icon: string }> = {
    appointment_confirmed:      { bg: "bg-emerald-50",  border: "border-emerald-400", icon: "text-emerald-600" },
    appointment_cancelled:      { bg: "bg-red-50",      border: "border-red-400",     icon: "text-red-600" },
    appointment_completed:      { bg: "bg-blue-50",     border: "border-blue-400",    icon: "text-blue-600" },
    appointment_time_changed:   { bg: "bg-amber-50",    border: "border-amber-400",   icon: "text-amber-600" },
    appointment_deleted:        { bg: "bg-red-50",      border: "border-red-400",     icon: "text-red-600" },
    appointment_status_changed: { bg: "bg-violet-50",   border: "border-violet-400",  icon: "text-violet-600" },
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-100 via-emerald-50/50 to-teal-50/30">
      {/* Notification banners */}
      {notifications.length > 0 && (
        <div className="px-4 md:px-6 pt-4 space-y-2">
          {notifications.map((notif) => {
            const colors = notifColors[notif.type] ?? { bg: "bg-gray-50", border: "border-gray-400", icon: "text-gray-600" };
            return (
              <div
                key={notif._id}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border-l-4 shadow-md animate-in slide-in-from-top-2 duration-300 ${colors.bg} ${colors.border}`}
              >
                <FaBell className={`mt-0.5 shrink-0 text-lg ${colors.icon}`} />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${colors.icon}`}>{notif.title}</p>
                  <p className="text-gray-700 text-sm mt-0.5">{notif.message}</p>
                </div>
                <button
                  onClick={() => dismissNotification(notif._id)}
                  className="shrink-0 text-gray-400 hover:text-gray-600 transition p-1 rounded"
                  aria-label="Kapat"
                >
                  <FaTimes />
                </button>
              </div>
            );
          })}
          {notifications.length > 1 && (
            <div className="flex justify-end">
              <button
                onClick={dismissAll}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Tümünü kapat
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col lg:flex-row">
        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 space-y-5">

          {/* Hero Header */}
          <div className="relative overflow-hidden bg-linear-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl p-6 shadow-lg shadow-emerald-300/30">
            {/* Decorative blobs */}
            <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute right-36 top-4 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                {avatarImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarImage}
                    alt="Profil"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white/40 shadow-lg shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl border-2 border-white/30 shadow-lg shrink-0">
                    {session?.user?.name?.charAt(0) || "D"}
                  </div>
                )}
                <div>
                  <p className="text-emerald-100 text-sm font-medium">
                    {new Date().toLocaleDateString("tr-TR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mt-0.5">
                    Hoş Geldin, {session?.user?.name?.split(" ")[0] || "Danışan"} 👋
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-linear-to-r from-orange-500 to-red-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-lg shadow-orange-400/40">
                  <FaFire className="text-yellow-300 text-lg shrink-0" />
                  <div>
                    <p className="font-bold text-lg leading-tight">{summary.loginStreak}</p>
                    <p className="text-orange-100 text-xs leading-tight">gün seri</p>
                  </div>
                </div>
                <div className="bg-linear-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-lg shadow-violet-400/40">
                  <FaTrophy className="text-yellow-300 text-lg shrink-0" />
                  <div>
                    <p className="font-bold text-lg leading-tight">{summary.totalPoints}</p>
                    <p className="text-violet-100 text-xs leading-tight">puan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* Kalori */}
            <Link href="/dashboard/client/meals" className="bg-linear-to-br from-orange-100 to-red-100 rounded-2xl p-4 shadow-sm border border-orange-200 card-hover block">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center">
                  <FaFire className="text-orange-500" />
                </div>
                <span className="text-xs font-semibold text-orange-600 bg-white/60 px-2 py-0.5 rounded-full">
                  {caloriePercent}%
                </span>
              </div>
              <p className="text-2xl font-bold text-orange-900 leading-tight">{summary.totalCalories}</p>
              <p className="text-xs text-orange-500 mt-0.5">/ {summary.targetCalories} kcal</p>
              <p className="text-xs font-semibold text-orange-700 mt-2 uppercase tracking-wide">Kalori</p>
            </Link>

            {/* Egzersiz */}
            <Link href="/dashboard/client/exercises" className="bg-linear-to-br from-violet-100 to-purple-100 rounded-2xl p-4 shadow-sm border border-violet-200 card-hover block">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center">
                  <FaDumbbell className="text-violet-500" />
                </div>
                {summary.todayExercise?.exerciseCount ? (
                  <span className="text-xs font-semibold text-violet-600 bg-white/60 px-2 py-0.5 rounded-full">
                    {summary.todayExercise.exerciseCount}x
                  </span>
                ) : null}
              </div>
              <p className="text-2xl font-bold text-violet-900 leading-tight">{totalExerciseCalories}</p>
              <p className="text-xs text-violet-500 mt-0.5">kcal yakıldı</p>
              <p className="text-xs font-semibold text-violet-700 mt-2 uppercase tracking-wide">Egzersiz</p>
            </Link>

            {/* Uyku */}
            <Link href="/dashboard/client/wellness?tab=sleep" className="bg-linear-to-br from-indigo-100 to-blue-100 rounded-2xl p-4 shadow-sm border border-indigo-200 card-hover block">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center">
                  <FaMoon className="text-indigo-500" />
                </div>
                {summary.todaySleep?.quality ? (
                  <span className="text-xs font-semibold text-indigo-600 bg-white/60 px-2 py-0.5 rounded-full">
                    ★ {summary.todaySleep.quality}/5
                  </span>
                ) : null}
              </div>
              <p className="text-2xl font-bold text-indigo-900 leading-tight">
                {summary.todaySleep?.duration || "—"}
              </p>
              <p className="text-xs text-indigo-500 mt-0.5">saat uyku</p>
              <p className="text-xs font-semibold text-indigo-700 mt-2 uppercase tracking-wide">Uyku</p>
            </Link>

            {/* Ruh Hali */}
            <Link href="/dashboard/client/wellness?tab=checkin" className="bg-linear-to-br from-amber-100 to-yellow-100 rounded-2xl p-4 shadow-sm border border-amber-200 card-hover block">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center">
                  <FaSmile className="text-amber-500" />
                </div>
                {summary.todayCheckIn?.energyLevel ? (
                  <span className="text-xs font-semibold text-amber-600 bg-white/60 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <FaBolt className="text-xs" />{summary.todayCheckIn.energyLevel}/5
                  </span>
                ) : null}
              </div>
              <p className="text-3xl leading-tight">
                {summary.todayCheckIn ? getMoodEmoji(summary.todayCheckIn.mood) : "—"}
              </p>
              <p className="text-xs text-amber-500 mt-0.5">
                {summary.todayCheckIn ? "Kayıtlı" : "Kayıt yok"}
              </p>
              <p className="text-xs font-semibold text-amber-700 mt-2 uppercase tracking-wide">Ruh Hali</p>
            </Link>
          </div>

          {/* Nutrition + Water */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Calorie + Macros */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2.5">
                  <span className="w-8 h-8 bg-linear-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center text-base shadow-sm">🍽️</span>
                  Günlük Besin Takibi
                </h3>
                <Link
                  href="/dashboard/client/meals"
                  className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  Öğün Ekle <FaArrowRight className="text-xs" />
                </Link>
              </div>
              <div className="p-6 space-y-6">
                <CalorieBar
                  current={summary.totalCalories}
                  target={summary.targetCalories}
                  burned={totalExerciseCalories}
                />
                <div className="border-t border-gray-50 pt-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Makro Dağılımı</p>
                  <div className="flex justify-around">
                    <MacroRing label="Protein" current={summary.totalProtein} target={summary.targetProtein} stroke="#ef4444" emoji="🥩" />
                    <MacroRing label="Karbonhidrat" current={summary.totalCarbs} target={summary.targetCarbs} stroke="#f59e0b" emoji="🍞" />
                    <MacroRing label="Yağ" current={summary.totalFat} target={summary.targetFat} stroke="#3b82f6" emoji="🥑" />
                  </div>
                </div>
              </div>
            </div>

            {/* Water Tracker */}
            <div className="bg-linear-to-b from-blue-50/60 to-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-blue-100/60">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2.5">
                  <span className="w-8 h-8 bg-linear-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center text-base shadow-sm">💧</span>
                  Su Takibi
                </h3>
              </div>
              <div className="p-6">
                <WaterTracker
                  current={summary.waterIntake}
                  target={summary.waterTarget}
                  onUpdate={handleWaterUpdate}
                />
              </div>
            </div>
          </div>

          {/* Goal + Daily Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Goal Progress */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2.5">
                  <span className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-base">🎯</span>
                  Kilo Hedefi
                </h3>
              </div>
              <div className="p-6">
                <GoalProgressBar
                  startWeight={summary.startWeight}
                  currentWeight={summary.currentWeight}
                  targetWeight={summary.targetWeight}
                />
              </div>
            </div>

            {/* Today's Check-in */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2.5">
                  <span className="w-8 h-8 bg-yellow-50 rounded-xl flex items-center justify-center text-base">✨</span>
                  Günlük Durum
                </h3>
                <Link
                  href="/dashboard/client/wellness"
                  className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  Güncelle <FaArrowRight className="text-xs" />
                </Link>
              </div>
              <div className="p-5">
                {summary.todayCheckIn ? (
                  <div className="space-y-3">
                    {/* Mood + Energy row */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Mood card */}
                      <div className={`relative overflow-hidden bg-linear-to-br ${getMoodGradient(summary.todayCheckIn.mood)} rounded-2xl p-4 text-white text-center shadow-md`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
                        <div className="relative">
                          <p className="text-4xl mb-1.5 drop-shadow">{getMoodEmoji(summary.todayCheckIn.mood)}</p>
                          <p className="text-xs font-black uppercase tracking-widest text-white/70">Ruh Hali</p>
                          <p className="text-sm font-bold text-white mt-0.5">{getMoodLabel(summary.todayCheckIn.mood)}</p>
                        </div>
                      </div>

                      {/* Energy card */}
                      <div className="relative overflow-hidden bg-linear-to-br from-violet-600 to-purple-700 rounded-2xl p-4 text-white text-center shadow-md">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.15),transparent_55%)]" />
                        <div className="relative">
                          <div className="flex items-end justify-center gap-1 mb-2 h-8">
                            {[1, 2, 3, 4, 5].map((bar) => (
                              <div
                                key={bar}
                                className="w-3 rounded-t-sm transition-all duration-500"
                                style={{
                                  height: `${bar * 20}%`,
                                  background: bar <= summary.todayCheckIn!.energyLevel
                                    ? "rgba(255,255,255,0.9)"
                                    : "rgba(255,255,255,0.18)",
                                  boxShadow: bar <= summary.todayCheckIn!.energyLevel
                                    ? "0 0 6px rgba(255,255,255,0.5)"
                                    : "none",
                                }}
                              />
                            ))}
                          </div>
                          <p className="text-xs font-black uppercase tracking-widest text-white/70">Enerji</p>
                          <p className="text-sm font-bold text-white mt-0.5">{getEnergyLabel(summary.todayCheckIn.energyLevel)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vibe message */}
                    <div className="bg-linear-to-r from-slate-50 to-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-2.5">
                      <span className="text-xl shrink-0">💬</span>
                      <p className="text-sm text-gray-600 font-medium leading-snug">
                        {getVibeMessage(summary.todayCheckIn.mood, summary.todayCheckIn.energyLevel)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-100 p-6 text-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(251,191,36,0.18),transparent_65%)]" />
                    <div className="relative">
                      <div className="text-4xl mb-1 animate-bounce inline-block">🌟</div>
                      <div className="flex justify-center gap-1 mb-3">
                        {["✨", "💫", "⭐"].map((s, i) => (
                          <span key={i} className="text-sm opacity-50">{s}</span>
                        ))}
                      </div>
                      <p className="text-gray-800 font-bold text-sm mb-1">Bugün nasılsın?</p>
                      <p className="text-gray-400 text-xs mb-4">Ruh halini ve enerjini kaydet</p>
                      <Link
                        href="/dashboard/client/wellness"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-amber-400 to-orange-500 text-white rounded-xl hover:from-amber-500 hover:to-orange-600 transition text-sm font-bold shadow-lg shadow-amber-300/40"
                      >
                        <FaCheckCircle /> Check-in Yap
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Achievements */}
          {summary.recentAchievements?.length > 0 && (
            <div className="bg-linear-to-r from-amber-50 via-orange-50 to-yellow-50 rounded-2xl p-6 border border-amber-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2.5">
                  <span className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-base">🏆</span>
                  Son Kazanılan Rozetler
                </h3>
                <Link
                  href="/dashboard/client/achievements"
                  className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  Tümünü Gör <FaArrowRight className="text-xs" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {summary.recentAchievements.map((achievement) => (
                  <div
                    key={achievement.achievementId}
                    className="shrink-0 bg-white rounded-2xl p-4 text-center shadow-sm border border-amber-100 min-w-28 card-hover"
                  >
                    <span className="text-3xl block mb-2">{achievement.icon}</span>
                    <p className="text-xs font-semibold text-gray-800 leading-tight">{achievement.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <aside className="w-full lg:w-80 p-4 md:p-6 space-y-5 lg:border-l border-t lg:border-t-0 border-gray-100 bg-white/60 backdrop-blur-sm">

          {/* Appointments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center text-sm">📅</span>
                Randevularım
              </h3>
              <Link href="/dashboard/client/appointments" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                Tümü →
              </Link>
            </div>
            <div className="space-y-2">
              {summary.upcomingAppointments.length > 0 ? (
                summary.upcomingAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt._id}
                    className="bg-linear-to-r from-emerald-50 to-teal-50 rounded-xl p-3.5 border border-emerald-100 card-hover"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500 text-white rounded-xl px-2.5 py-2 text-center shrink-0 min-w-12">
                        <p className="text-base font-bold leading-tight">
                          {new Date(apt.date).toLocaleDateString("tr-TR", { day: "numeric" })}
                        </p>
                        <p className="text-xs opacity-80 leading-tight uppercase">
                          {new Date(apt.date).toLocaleDateString("tr-TR", { month: "short" })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">⏰ {apt.time}</p>
                        {apt.dietitianName && (
                          <p className="text-xs text-gray-500 mt-0.5">{apt.dietitianName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-400">Yaklaşan randevu yok</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Today's Exercises */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center text-sm">🏃</span>
                Bugünkü Egzersiz
              </h3>
              <Link href="/dashboard/client/exercises" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                + Ekle
              </Link>
            </div>
            {summary.todayExercise && summary.todayExercise.exerciseCount > 0 ? (
              <div className="bg-linear-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  {summary.todayExercise.exerciseCount} egzersiz tamamlandı
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-violet-600">{summary.todayExercise.totalCaloriesBurned}</p>
                    <p className="text-xs text-gray-400">kcal</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-violet-600">{summary.todayExercise.totalMinutes}</p>
                    <p className="text-xs text-gray-400">dakika</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-400">Henüz egzersiz eklenmedi</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100" />

          {/* Sleep Summary */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center text-sm">😴</span>
              Uyku Özeti
            </h3>
            {summary.todaySleep ? (
              <div className="bg-linear-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-indigo-700 leading-tight">
                      {summary.todaySleep.duration}
                      <span className="text-base font-normal text-indigo-400 ml-1">saat</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-0.5 justify-end mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${star <= summary.todaySleep!.quality ? "text-yellow-400" : "text-gray-200"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">Kalite</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-400 mb-2">Uyku kaydı yok</p>
                <Link
                  href="/dashboard/client/wellness"
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Uyku Kaydet →
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
