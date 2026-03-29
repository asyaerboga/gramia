"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import MannequinChart from "@/components/client/MannequinChart";
import CalorieBar from "@/components/client/CalorieBar";
import GoalProgressBar from "@/components/client/GoalProgressBar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface Regions {
  neck: number;
  chest: number;
  waist: number;
  hip: number;
  arm: number;
  thigh: number;
  calf: number;
}

interface ClientProfile {
  _id: string;
  name: string;
  age: number;
  height: number;
  weight: number;
  startWeight: number;
  targetWeight: number;
  chronicDiseases: string[];
  totalCalories: number;
  targetCalories: number;
}

interface MeasurementRecord {
  _id: string;
  date: string;
  regions: Regions;
}

interface ExerciseItem {
  _id: string;
  type: string;
  duration: number;
  caloriesBurned: number;
  date: string;
}

interface SleepItem {
  _id: string;
  duration: number;
  quality: number;
  date: string;
}

interface CheckInItem {
  _id: string;
  mood: number;
  energyLevel: number;
  stressLevel: number;
  date: string;
}

interface WaterItem {
  _id: string;
  amount: number;
  date: string;
}

interface MealItem {
  _id: string;
  mealType: string;
  items: { name: string; calories: number; portion?: string }[];
  totalCalories: number;
  date: string;
}

interface AchievementItem {
  _id: string;
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt: string;
}

interface ClientData {
  exercises?: {
    items: ExerciseItem[];
    summary: {
      totalCount: number;
      totalMinutes: number;
      totalCalories: number;
      byType: Record<
        string,
        { count: number; minutes: number; calories: number }
      >;
    };
  };
  wellness?: {
    sleep: SleepItem[];
    checkIns: CheckInItem[];
    waterIntakes: WaterItem[];
    summary: {
      avgSleepHours: number;
      avgSleepQuality: number;
      avgEnergy: number;
      avgStress: number;
      avgWater: number;
    };
  };
  meals?: {
    items: MealItem[];
    summary: {
      totalMeals: number;
      totalCalories: number;
      avgCaloriesPerDay: number;
      byType: Record<string, { count: number; calories: number }>;
      dailyCalories: Record<string, number>;
    };
  };
  achievements?: {
    items: AchievementItem[];
    summary: {
      totalAchievements: number;
      unlockedCount: number;
      totalPoints: number;
    };
  };
}

const regionLabels: Record<keyof Regions, string> = {
  neck: "Boyun",
  chest: "Göğüs",
  waist: "Bel",
  hip: "Kalça",
  arm: "Kol",
  thigh: "Uyluk",
  calf: "Baldır",
};

const exerciseTypeLabels: Record<string, string> = {
  walking: "Yürüyüş",
  running: "Koşu",
  cycling: "Bisiklet",
  swimming: "Yüzme",
  yoga: "Yoga",
  gym: "Fitness",
  other: "Diğer",
};

const mealTypeLabels: Record<string, string> = {
  breakfast: "Kahvaltı",
  lunch: "Öğle",
  dinner: "Akşam",
  snack: "Ara Öğün",
};

type TabType = "overview" | "exercises" | "wellness" | "meals" | "achievements";

export default function ClientProfilePage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [dateRange, setDateRange] = useState(7);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<keyof Regions>("waist");
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [measurementForm, setMeasurementForm] = useState<Regions>({
    neck: 0,
    chest: 0,
    waist: 0,
    hip: 0,
    arm: 0,
    thigh: 0,
    calf: 0,
  });
  const [weightForm, setWeightForm] = useState("");

  const fetchClient = useCallback(async () => {
    try {
      const res = await fetch(`/api/dietitian/clients/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data);
      }
    } catch (error) {
      console.error("Failed to fetch client:", error);
    }
  }, [clientId]);

  const fetchMeasurements = useCallback(async () => {
    try {
      const res = await fetch(`/api/measurements?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setMeasurements(data);
      }
    } catch (error) {
      console.error("Failed to fetch measurements:", error);
    }
  }, [clientId]);

  const fetchClientData = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/dietitian/clients/${clientId}/data?days=${dateRange}`,
      );
      if (res.ok) {
        const data = await res.json();
        setClientData(data);
      }
    } catch (error) {
      console.error("Failed to fetch client data:", error);
    }
  }, [clientId, dateRange]);

  useEffect(() => {
    fetchClient();
    fetchMeasurements();
  }, [fetchClient, fetchMeasurements]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          date: new Date().toISOString(),
          regions: measurementForm,
        }),
      });
      if (res.ok) {
        setShowMeasurementForm(false);
        fetchMeasurements();
      }
    } catch (error) {
      console.error("Failed to add measurement:", error);
    }
  };

  const handleUpdateWeight = async () => {
    const weight = parseFloat(weightForm);
    if (!weight) return;
    try {
      const res = await fetch(`/api/dietitian/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight }),
      });
      if (res.ok) {
        setWeightForm("");
        fetchClient();
      }
    } catch (error) {
      console.error("Failed to update weight:", error);
    }
  };

  const latestMeasurement = measurements[measurements.length - 1];
  const regions = latestMeasurement?.regions || {
    neck: 0,
    chest: 0,
    waist: 0,
    hip: 0,
    arm: 0,
    thigh: 0,
    calf: 0,
  };

  const chartData = measurements.map((m) => ({
    date: new Date(m.date).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
    }),
    value: m.regions[selectedRegion],
  }));

  // Daily calories chart data
  const dailyCaloriesData = clientData?.meals?.summary.dailyCalories
    ? Object.entries(clientData.meals.summary.dailyCalories)
        .map(([date, calories]) => ({
          date: new Date(date).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
          }),
          calories,
        }))
        .slice(-7)
    : [];

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "overview", label: "Genel", icon: "📊" },
    { id: "exercises", label: "Egzersiz", icon: "🏃" },
    { id: "wellness", label: "Wellness", icon: "💚" },
    { id: "meals", label: "Öğünler", icon: "🍽️" },
    { id: "achievements", label: "Başarılar", icon: "🏆" },
  ];

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              👤 {client.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {client.age} yaş | {client.height}cm | {client.weight}kg
              {client.chronicDiseases.length > 0 &&
                ` | ${client.chronicDiseases.join(", ")}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700"
            >
              <option value={7}>Son 7 gün</option>
              <option value={14}>Son 14 gün</option>
              <option value={30}>Son 30 gün</option>
            </select>
            <button
              onClick={() => setShowWeightModal(true)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
            >
              ⚖️ Kilo Güncelle
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CalorieBar
                current={client.totalCalories}
                target={client.targetCalories}
              />
              <GoalProgressBar
                startWeight={client.startWeight}
                currentWeight={client.weight}
                targetWeight={client.targetWeight}
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Toplam Egzersiz</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clientData?.exercises?.summary.totalCount || 0}
                </p>
                <p className="text-xs text-emerald-600">
                  {clientData?.exercises?.summary.totalMinutes || 0} dk
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Ort. Uyku</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clientData?.wellness?.summary.avgSleepHours || 0}
                </p>
                <p className="text-xs text-blue-600">saat/gün</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Ort. Kalori</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clientData?.meals?.summary.avgCaloriesPerDay || 0}
                </p>
                <p className="text-xs text-orange-600">kcal/gün</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Başarılar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clientData?.achievements?.summary.unlockedCount || 0}
                </p>
                <p className="text-xs text-amber-600">
                  {clientData?.achievements?.summary.totalPoints || 0} puan
                </p>
              </div>
            </div>

            {/* Mannequin & Measurements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MannequinChart regions={regions} />
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">
                      Bölge:
                    </label>
                    <select
                      value={selectedRegion}
                      onChange={(e) =>
                        setSelectedRegion(e.target.value as keyof Regions)
                      }
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    >
                      {Object.entries(regionLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setShowMeasurementForm(true)}
                    className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
                  >
                    + Ölçüm
                  </button>
                </div>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">
                    Henüz ölçüm verisi yok.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Exercises Tab */}
        {activeTab === "exercises" && (
          <div className="space-y-6">
            {/* Exercise Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Toplam Antrenman</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {clientData?.exercises?.summary.totalCount || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Toplam Süre</p>
                <p className="text-2xl font-bold text-blue-600">
                  {clientData?.exercises?.summary.totalMinutes || 0} dk
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Yakılan Kalori</p>
                <p className="text-2xl font-bold text-orange-600">
                  {clientData?.exercises?.summary.totalCalories || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Ort. Süre/Gün</p>
                <p className="text-2xl font-bold text-purple-600">
                  {clientData?.exercises?.summary.totalCount
                    ? Math.round(
                        clientData.exercises.summary.totalMinutes / dateRange,
                      )
                    : 0}{" "}
                  dk
                </p>
              </div>
            </div>

            {/* By Type */}
            {clientData?.exercises?.summary.byType &&
              Object.keys(clientData.exercises.summary.byType).length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Egzersiz Türlerine Göre
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(clientData.exercises.summary.byType).map(
                      ([type, data]) => (
                        <div key={type} className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900">
                            {exerciseTypeLabels[type] || type}
                          </p>
                          <p className="text-sm text-gray-500">
                            {data.count} kez | {data.minutes} dk
                          </p>
                          <p className="text-xs text-emerald-600">
                            {data.calories} kcal
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* Exercise List */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">
                Son Egzersizler
              </h3>
              {clientData?.exercises?.items &&
              clientData.exercises.items.length > 0 ? (
                <div className="space-y-3">
                  {clientData.exercises.items.slice(0, 10).map((ex) => (
                    <div
                      key={ex._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {exerciseTypeLabels[ex.type] || ex.type}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(ex.date).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {ex.duration} dk
                        </p>
                        <p className="text-sm text-emerald-600">
                          {ex.caloriesBurned} kcal
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">
                  Henüz egzersiz kaydı yok.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Wellness Tab */}
        {activeTab === "wellness" && (
          <div className="space-y-6">
            {/* Wellness Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Ort. Uyku</p>
                <p className="text-2xl font-bold text-blue-600">
                  {clientData?.wellness?.summary.avgSleepHours || 0}
                </p>
                <p className="text-xs text-gray-400">saat</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Uyku Kalitesi</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {clientData?.wellness?.summary.avgSleepQuality || 0}/5
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Ort. Enerji</p>
                <p className="text-2xl font-bold text-amber-600">
                  {clientData?.wellness?.summary.avgEnergy || 0}/5
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Ort. Stres</p>
                <p className="text-2xl font-bold text-red-600">
                  {clientData?.wellness?.summary.avgStress || 0}/5
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Ort. Su</p>
                <p className="text-2xl font-bold text-cyan-600">
                  {clientData?.wellness?.summary.avgWater || 0}
                </p>
                <p className="text-xs text-gray-400">bardak</p>
              </div>
            </div>

            {/* Sleep Records */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">
                😴 Uyku Kayıtları
              </h3>
              {clientData?.wellness?.sleep &&
              clientData.wellness.sleep.length > 0 ? (
                <div className="space-y-3">
                  {clientData.wellness.sleep.slice(0, 7).map((s) => (
                    <div
                      key={s._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <p className="text-sm text-gray-700">
                        {new Date(s.date).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-blue-600 font-medium">
                          {s.duration} saat
                        </span>
                        <span className="text-indigo-600">
                          Kalite: {s.quality}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Henüz uyku kaydı yok.</p>
              )}
            </div>

            {/* Check-ins */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">
                🎯 Günlük Durum
              </h3>
              {clientData?.wellness?.checkIns &&
              clientData.wellness.checkIns.length > 0 ? (
                <div className="space-y-3">
                  {clientData.wellness.checkIns.slice(0, 7).map((c) => (
                    <div
                      key={c._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <p className="text-sm text-gray-700">
                        {new Date(c.date).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-purple-600">
                          Ruh hali: {c.mood}/5
                        </span>
                        <span className="text-amber-600">
                          Enerji: {c.energyLevel}/5
                        </span>
                        <span className="text-red-600">
                          Stres: {c.stressLevel}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">
                  Henüz günlük durum kaydı yok.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Meals Tab */}
        {activeTab === "meals" && (
          <div className="space-y-6">
            {/* Meals Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Toplam Öğün</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {clientData?.meals?.summary.totalMeals || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Toplam Kalori</p>
                <p className="text-2xl font-bold text-orange-600">
                  {clientData?.meals?.summary.totalCalories || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Ort. Kalori/Gün</p>
                <p className="text-2xl font-bold text-blue-600">
                  {clientData?.meals?.summary.avgCaloriesPerDay || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Hedef</p>
                <p className="text-2xl font-bold text-gray-600">
                  {client.targetCalories}
                </p>
              </div>
            </div>

            {/* Daily Calories Chart */}
            {dailyCaloriesData.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Günlük Kalori Alımı
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyCaloriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar
                      dataKey="calories"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* By Type */}
            {clientData?.meals?.summary.byType &&
              Object.keys(clientData.meals.summary.byType).length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Öğün Türlerine Göre
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(clientData.meals.summary.byType).map(
                      ([type, data]) => (
                        <div key={type} className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900">
                            {mealTypeLabels[type] || type}
                          </p>
                          <p className="text-sm text-gray-500">
                            {data.count} öğün
                          </p>
                          <p className="text-xs text-emerald-600">
                            {data.calories} kcal
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* Meal List */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Son Öğünler</h3>
              {clientData?.meals?.items && clientData.meals.items.length > 0 ? (
                <div className="space-y-3">
                  {clientData.meals.items.slice(0, 10).map((meal) => (
                    <div key={meal._id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium text-gray-900">
                            {mealTypeLabels[meal.mealType] || meal.mealType}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            {new Date(meal.date).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "long",
                            })}
                          </span>
                        </div>
                        <span className="font-medium text-emerald-600">
                          {meal.totalCalories} kcal
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {meal.items.map((f, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 bg-white rounded text-gray-600"
                          >
                            {f.name} {f.portion ? `(${f.portion})` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Henüz öğün kaydı yok.</p>
              )}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div className="space-y-6">
            {/* Achievement Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Kazanılan</p>
                <p className="text-2xl font-bold text-amber-600">
                  {clientData?.achievements?.summary.unlockedCount || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Toplam</p>
                <p className="text-2xl font-bold text-gray-600">
                  {clientData?.achievements?.summary.totalAchievements || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Toplam Puan</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {clientData?.achievements?.summary.totalPoints || 0}
                </p>
              </div>
            </div>

            {/* Achievement List */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">
                🏆 Kazanılan Başarılar
              </h3>
              {clientData?.achievements?.items &&
              clientData.achievements.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientData.achievements.items.map((a) => (
                    <div
                      key={a._id}
                      className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{a.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900">{a.name}</p>
                          <p className="text-xs text-gray-500">
                            {a.description}
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            +{a.points} puan |{" "}
                            {new Date(a.unlockedAt).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">
                  Henüz kazanılan başarı yok.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Measurement form - Modal */}
        {showMeasurementForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Yeni Ölçüm Ekle</h3>
                <button
                  onClick={() => setShowMeasurementForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddMeasurement} className="p-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(
                    Object.entries(regionLabels) as [keyof Regions, string][]
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {label} (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={measurementForm[key] || ""}
                        onChange={(e) =>
                          setMeasurementForm({
                            ...measurementForm,
                            [key]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMeasurementForm(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Weight update - Modal */}
        {showWeightModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">
                  ⚖️ Kilo Güncelle
                </h3>
                <button
                  onClick={() => setShowWeightModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  Güncel:{" "}
                  <span className="font-bold text-gray-900">
                    {client.weight}kg
                  </span>
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yeni Kilo (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightForm}
                    onChange={(e) => setWeightForm(e.target.value)}
                    placeholder="Örn: 82.5"
                    autoFocus
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWeightModal(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateWeight();
                      setShowWeightModal(false);
                    }}
                    className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
                  >
                    Güncelle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
