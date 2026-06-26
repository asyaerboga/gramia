"use client";

import { useState, useEffect, useCallback } from "react";
import { FaTrophy, FaLock, FaStar } from "react-icons/fa";
import { useToast } from "@/components/providers/ToastProvider";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
}

interface AchievementCategory {
  name: string;
  achievements: Achievement[];
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const { success } = useToast();

  const fetchAchievements = useCallback(async () => {
    try {
      const res = await fetch("/api/achievements");
      if (res.ok) {
        const data = await res.json();
        setAchievements(data.achievements || []);
        setUnlockedCount(data.unlockedCount || 0);
        setTotalPoints(data.totalPoints || 0);
      }
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: trigger a full achievement check, then refresh list.
  // `success` is intentionally NOT in deps — it's never stable between renders
  // and including it would cause infinite loops.
  useEffect(() => {
    let cancelled = false;
    const checkAndFetch = async () => {
      try {
        const res = await fetch("/api/achievements/check", { method: "POST" });
        if (res.ok && !cancelled) {
          const { newlyAwarded } = await res.json();
          if (newlyAwarded && newlyAwarded.length > 0) {
            for (const a of newlyAwarded) {
              success(
                `🏆 Yeni Rozet: ${a.name}`,
                `${a.description} — +${a.points} puan`,
              );
            }
          }
        }
      } catch {
        // ignore check errors
      }
      if (!cancelled) await fetchAchievements();
    };
    checkAndFetch();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAchievements]); // `success` deliberately excluded

  const categorizeAchievements = (): AchievementCategory[] => {
    const categories: { [key: string]: Achievement[] } = {
      streak: [],
      weight: [],
      meal: [],
      water: [],
      exercise: [],
      other: [],
    };

    achievements.forEach((achievement) => {
      const id = achievement.id.toUpperCase();
      if (id.includes("STREAK")) {
        categories.streak.push(achievement);
      } else if (id.includes("WEIGHT")) {
        categories.weight.push(achievement);
      } else if (id.includes("MEAL")) {
        categories.meal.push(achievement);
      } else if (id.includes("WATER")) {
        categories.water.push(achievement);
      } else if (id.includes("EXERCISE")) {
        categories.exercise.push(achievement);
      } else {
        categories.other.push(achievement);
      }
    });

    return [
      { name: "🔥 Seri Başarıları", achievements: categories.streak },
      { name: "⚖️ Kilo Hedefleri", achievements: categories.weight },
      { name: "🍽️ Beslenme", achievements: categories.meal },
      { name: "💧 Su İçme", achievements: categories.water },
      { name: "💪 Egzersiz", achievements: categories.exercise },
      { name: "✨ Diğer", achievements: categories.other },
    ].filter((c) => c.achievements.length > 0);
  };

  const progressPercentage = (unlockedCount / achievements.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-amber-50/30 to-orange-50/20 p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="animate-pulse h-44 bg-amber-200/40 rounded-3xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-amber-50/30 to-orange-50/20 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-500 via-orange-400 to-yellow-400 p-6 text-white shadow-xl shadow-amber-200">
          {/* Dekoratif daireler */}
          <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-sm" />
          <div className="absolute -bottom-10 -left-6 w-40 h-40 bg-white/10 rounded-full blur-sm" />
          <div className="absolute top-4 right-32 w-6 h-6 bg-white/20 rounded-full" />
          <div className="absolute bottom-6 right-16 w-3 h-3 bg-white/30 rounded-full" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-4xl drop-shadow-lg">🏆</span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Rozetler & Başarılar</h1>
              </div>
              <p className="text-amber-100 text-sm mt-1 font-medium">İlerlemeni takip et ve rozetler kazan</p>
            </div>

            <div className="flex gap-3 shrink-0">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center border border-white/20">
                <p className="text-2xl font-bold">{unlockedCount}</p>
                <p className="text-xs text-amber-100 font-medium">Rozet</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center border border-white/20">
                <p className="text-2xl font-bold">{totalPoints}</p>
                <p className="text-xs text-amber-100 font-medium">Puan</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center border border-white/20">
                <p className="text-2xl font-bold">{achievements.length - unlockedCount}</p>
                <p className="text-xs text-amber-100 font-medium">Kilitli</p>
              </div>
            </div>
          </div>

          {/* İlerleme çubuğu */}
          <div className="relative z-10 mt-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-amber-100 font-medium">Genel İlerleme</span>
              <span className="font-bold text-white">{unlockedCount} / {achievements.length}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5">
              <div
                className="bg-white h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${isNaN(progressPercentage) ? 0 : progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Achievement Categories */}
        {categorizeAchievements().map((category) => (
          <div key={category.name}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`relative rounded-xl p-4 border-2 transition-all ${
                    achievement.unlocked
                      ? "bg-white border-amber-200 shadow-sm hover:shadow-md hover:border-amber-300"
                      : "bg-gray-50 border-gray-200 opacity-60"
                  }`}
                >
                  {/* Badge Icon */}
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                        achievement.unlocked
                          ? "bg-gradient-to-br from-amber-100 to-orange-100"
                          : "bg-gray-100"
                      }`}
                    >
                      {achievement.unlocked ? (
                        achievement.icon
                      ) : (
                        <FaLock className="text-gray-400" />
                      )}
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        achievement.unlocked
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      +{achievement.points} puan
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3
                    className={`font-semibold mb-1 ${
                      achievement.unlocked ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {achievement.name}
                  </h3>
                  <p
                    className={`text-sm ${
                      achievement.unlocked ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {achievement.description}
                  </p>

                  {/* Unlock Date */}
                  {achievement.unlocked && achievement.unlockedAt && (
                    <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                      <FaStar className="text-yellow-400" />
                      {new Date(achievement.unlockedAt).toLocaleDateString(
                        "tr-TR",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}{" "}
                      tarihinde kazanıldı
                    </p>
                  )}

                  {/* Shine Effect for unlocked */}
                  {achievement.unlocked && (
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl pointer-events-none animate-shimmer" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {achievements.length === 0 && (
          <div className="text-center py-16">
            <FaTrophy className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Henüz rozet tanımlanmamış. Yakında!</p>
          </div>
        )}
      </div>
    </div>
  );
}
