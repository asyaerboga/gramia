"use client";

import { useState, useEffect, useCallback } from "react";
import { FaTrophy, FaLock, FaStar, FaMedal } from "react-icons/fa";

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

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

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
      if (achievement.id.includes("STREAK")) {
        categories.streak.push(achievement);
      } else if (achievement.id.includes("WEIGHT")) {
        categories.weight.push(achievement);
      } else if (achievement.id.includes("MEAL")) {
        categories.meal.push(achievement);
      } else if (achievement.id.includes("WATER")) {
        categories.water.push(achievement);
      } else if (achievement.id.includes("EXERCISE")) {
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-2/3 md:w-1/3" />
            <div className="h-32 bg-gray-200 rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaTrophy className="text-amber-500" />
            Rozetler & Başarılar
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            İlerlemeni takip et ve rozetler kazan
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-200">
                <FaTrophy className="text-white text-2xl" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {unlockedCount}
              </p>
              <p className="text-sm text-gray-500">Rozet Kazanıldı</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-purple-200">
                <FaStar className="text-white text-2xl" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
              <p className="text-sm text-gray-500">Toplam Puan</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-200">
                <FaMedal className="text-white text-2xl" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {achievements.length - unlockedCount}
              </p>
              <p className="text-sm text-gray-500">Kilitli Rozet</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Genel İlerleme</span>
              <span className="font-medium text-gray-900">
                {unlockedCount} / {achievements.length}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full progress-bar"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Achievement Categories */}
        {categorizeAchievements().map((category) => (
          <div key={category.name} className="mb-8">
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
