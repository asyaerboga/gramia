"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DatePickerModern from "@/components/shared/DatePickerModern";
import { useParams, useSearchParams } from "next/navigation";
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
  avatarUrl?: string | null;
  age: number;
  height: number;
  weight: number;
  startWeight: number;
  targetWeight: number;
  chronicDiseases: string[];
  totalCalories: number;
  targetCalories: number;
}

interface BloodTestRecord {
  _id: string;
  imageUrl: string;
  originalName: string;
  notes?: string;
  testDate: string;
}

interface SatietyRecord {
  _id: string;
  mealType: string;
  satietyLevel: number;
  date: string;
  notes?: string;
}

interface MeasurementRecord {
  _id: string;
  date: string;
  weight?: number;
  height?: number;
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
      byType: Record<string, { count: number; minutes: number; calories: number }>;
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
    satietyRecords?: SatietyRecord[];
    summary: {
      totalMeals: number;
      totalCalories: number;
      avgCaloriesPerDay: number;
      byType: Record<string, { count: number; calories: number }>;
      dailyCalories: Record<string, number>;
      avgSatiety?: number;
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

const exerciseTypeIcons: Record<string, string> = {
  walking: "🚶",
  running: "🏃",
  cycling: "🚴",
  swimming: "🏊",
  yoga: "🧘",
  gym: "🏋️",
  other: "⚡",
};

const mealTypeLabels: Record<string, string> = {
  breakfast: "Kahvaltı",
  lunch: "Öğle",
  dinner: "Akşam",
  snack: "Ara Öğün",
};

const mealTypeIcons: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

type TabType = "overview" | "exercises" | "wellness" | "meals" | "achievements";

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color} shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-2xl mb-3">
        📭
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function ClientProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.clientId as string;

  const initialTab = (searchParams.get("tab") as TabType) || "overview";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [dateRange, setDateRange] = useState(7);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<keyof Regions>("waist");
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [measurementForm, setMeasurementForm] = useState<Regions>({
    neck: 0, chest: 0, waist: 0, hip: 0, arm: 0, thigh: 0, calf: 0,
  });
  const [measurementWeight, setMeasurementWeight] = useState("");
  const [measurementHeight, setMeasurementHeight] = useState("");
  const [weightForm, setWeightForm] = useState("");

  const [healthTab, setHealthTab] = useState<"diseases" | "blood">("diseases");
  const [chronicDiseases, setChronicDiseases] = useState<string[]>([]);
  const [bloodTests, setBloodTests] = useState<BloodTestRecord[]>([]);
  const [newDisease, setNewDisease] = useState("");
  const [bloodFile, setBloodFile] = useState<File | null>(null);
  const [bloodNotes, setBloodNotes] = useState("");
  const [bloodDate, setBloodDate] = useState(new Date().toISOString().split("T")[0]);
  const [healthLoading, setHealthLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchClient = useCallback(async () => {
    try {
      const res = await fetch(`/api/dietitian/clients/${clientId}`);
      if (res.ok) setClient(await res.json());
    } catch (error) {
      console.error("Failed to fetch client:", error);
    }
  }, [clientId]);

  const fetchMeasurements = useCallback(async () => {
    try {
      const res = await fetch(`/api/measurements?clientId=${clientId}`);
      if (res.ok) setMeasurements(await res.json());
    } catch (error) {
      console.error("Failed to fetch measurements:", error);
    }
  }, [clientId]);

  const fetchClientData = useCallback(async () => {
    try {
      const res = await fetch(`/api/dietitian/clients/${clientId}/data?days=${dateRange}`);
      if (res.ok) setClientData(await res.json());
    } catch (error) {
      console.error("Failed to fetch client data:", error);
    }
  }, [clientId, dateRange]);

  useEffect(() => {
    fetchClient();
    fetchMeasurements();
  }, [fetchClient, fetchMeasurements]);

  useEffect(() => { fetchClientData(); }, [fetchClientData]);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const POLLING_TABS: TabType[] = ["wellness", "meals", "exercises"];
    if (POLLING_TABS.includes(activeTab)) {
      pollingRef.current = setInterval(() => fetchClientData(), 30_000);
    }
    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    };
  }, [activeTab, fetchClientData]);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch(`/api/dietitian/clients/${clientId}/health`);
      if (res.ok) {
        const data = await res.json();
        setChronicDiseases(data.chronicDiseases || []);
        setBloodTests(data.bloodTests || []);
      }
    } catch (error) {
      console.error("Failed to fetch health:", error);
    } finally {
      setHealthLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (activeTab === "wellness") fetchHealth();
  }, [activeTab, fetchHealth]);

  const handleOpenHealthModal = () => { setShowHealthModal(true); fetchHealth(); };

  const handleAddDisease = async () => {
    if (!newDisease.trim()) return;
    try {
      const res = await fetch(`/api/dietitian/clients/${clientId}/health`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disease: newDisease.trim() }),
      });
      if (res.ok) { setNewDisease(""); fetchHealth(); fetchClient(); }
    } catch (error) {
      console.error("Failed to add disease:", error);
    }
  };

  const handleRemoveDisease = async (disease: string) => {
    try {
      await fetch(`/api/dietitian/clients/${clientId}/health`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "disease", disease }),
      });
      fetchHealth();
      fetchClient();
    } catch (error) {
      console.error("Failed to remove disease:", error);
    }
  };

  const handleUploadBloodTest = async () => {
    if (!bloodFile) return;
    setUploadLoading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("image", bloodFile);
      fd.append("notes", bloodNotes);
      fd.append("testDate", bloodDate);
      const res = await fetch(`/api/dietitian/clients/${clientId}/health`, { method: "POST", body: fd });
      if (res.ok) {
        setBloodFile(null);
        setBloodNotes("");
        setBloodDate(new Date().toISOString().split("T")[0]);
        fetchHealth();
      } else {
        const data = await res.json().catch(() => ({}));
        setUploadError(data.error || "Yükleme başarısız oldu.");
      }
    } catch {
      setUploadError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteBloodTest = async (bloodTestId: string) => {
    try {
      await fetch(`/api/dietitian/clients/${clientId}/health`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bloodTest", bloodTestId }),
      });
      fetchHealth();
    } catch (error) {
      console.error("Failed to delete blood test:", error);
    }
  };

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
          ...(measurementWeight && { weight: parseFloat(measurementWeight) }),
          ...(measurementHeight && { height: parseFloat(measurementHeight) }),
        }),
      });
      if (res.ok) {
        setShowMeasurementForm(false);
        setMeasurementWeight("");
        setMeasurementHeight("");
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
      if (res.ok) { setWeightForm(""); setShowWeightModal(false); fetchClient(); fetchMeasurements(); }
    } catch (error) {
      console.error("Failed to update weight:", error);
    }
  };

  const latestMeasurement = measurements[measurements.length - 1];
  const regions = latestMeasurement?.regions || { neck: 0, chest: 0, waist: 0, hip: 0, arm: 0, thigh: 0, calf: 0 };

  const chartData = measurements.map((m) => ({
    date: new Date(m.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
    value: m.regions[selectedRegion],
  }));

  const dailyCaloriesData = clientData?.meals?.summary.dailyCalories
    ? Object.entries(clientData.meals.summary.dailyCalories)
        .map(([date, calories]) => ({
          date: new Date(date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
          calories,
        }))
        .slice(-7)
    : [];

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "overview", label: "Genel Bakış", icon: "📊" },
    { id: "exercises", label: "Egzersiz", icon: "🏃" },
    { id: "wellness", label: "Wellness", icon: "💚" },
    { id: "meals", label: "Öğünler", icon: "🍽️" },
    { id: "achievements", label: "Başarılar", icon: "🏆" },
  ];

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  const initials = client.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const weightDiff = client.weight - client.targetWeight;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-linear-to-br from-emerald-400 via-emerald-300 to-teal-300 px-4 md:px-8 pt-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            {/* Profile info */}
            <div className="flex items-center gap-5">
              {client.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={client.avatarUrl}
                  alt={client.name}
                  className="w-18 h-18 rounded-2xl object-cover border-3 border-white/30 shadow-lg"
                />
              ) : (
                <div className="w-18 h-18 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">{initials}</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{client.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="px-2.5 py-1 bg-white/20 rounded-lg text-xs text-white font-medium backdrop-blur-sm">
                    {client.age} yaş
                  </span>
                  <span className="px-2.5 py-1 bg-white/20 rounded-lg text-xs text-white font-medium backdrop-blur-sm">
                    {client.height} cm
                  </span>
                  <span className="px-2.5 py-1 bg-white/20 rounded-lg text-xs text-white font-medium backdrop-blur-sm">
                    {client.weight} kg
                  </span>
                  {weightDiff > 0 && (
                    <span className="px-2.5 py-1 bg-amber-400/30 rounded-lg text-xs text-white font-medium">
                      Hedefe {weightDiff.toFixed(1)} kg kaldı
                    </span>
                  )}
                  {weightDiff <= 0 && (
                    <span className="px-2.5 py-1 bg-green-400/30 rounded-lg text-xs text-white font-medium">
                      ✓ Hedefe ulaştı
                    </span>
                  )}
                </div>
                {client.chronicDiseases.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {client.chronicDiseases.map((d) => (
                      <span key={d} className="px-2 py-0.5 bg-red-400/25 border border-red-300/30 rounded-full text-xs text-white">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(parseInt(e.target.value))}
                className="px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 [&>option]:text-gray-900"
              >
                <option value={7}>Son 7 gün</option>
                <option value={14}>Son 14 gün</option>
                <option value={30}>Son 30 gün</option>
              </select>
              <button
                onClick={handleOpenHealthModal}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition shadow-sm"
              >
                🩸 Kan & Hastalıklar
              </button>
              <button
                onClick={() => setShowWeightModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition shadow-sm"
              >
                ⚖️ Kilo Güncelle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content pulled up over hero */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-12">
        {/* Tab bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 flex-1 justify-center ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-600 bg-emerald-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <CalorieBar current={client.totalCalories} target={client.targetCalories} />
              <GoalProgressBar
                startWeight={client.startWeight}
                currentWeight={client.weight}
                targetWeight={client.targetWeight}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Toplam Egzersiz"
                value={clientData?.exercises?.summary.totalCount || 0}
                sub={`${clientData?.exercises?.summary.totalMinutes || 0} dakika`}
                color="bg-emerald-50 text-emerald-600"
                icon="🏃"
              />
              <StatCard
                label="Ortalama Uyku"
                value={`${clientData?.wellness?.summary.avgSleepHours || 0}s`}
                sub="saat/gün"
                color="bg-blue-50 text-blue-600"
                icon="😴"
              />
              <StatCard
                label="Ort. Kalori"
                value={clientData?.meals?.summary.avgCaloriesPerDay || 0}
                sub="kcal/gün"
                color="bg-orange-50 text-orange-600"
                icon="🔥"
              />
              <StatCard
                label="Başarılar"
                value={clientData?.achievements?.summary.unlockedCount || 0}
                sub={`${clientData?.achievements?.summary.totalPoints || 0} puan`}
                color="bg-amber-50 text-amber-600"
                icon="🏆"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MannequinChart regions={regions} />
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">Vücut Ölçümleri</h3>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value as keyof Regions)}
                      className="select-modern"
                    >
                      {Object.entries(regionLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      const latest = measurements[measurements.length - 1];
                      setMeasurementWeight(latest?.weight != null ? String(latest.weight) : "");
                      setMeasurementHeight(latest?.height != null ? String(latest.height) : "");
                      setShowMeasurementForm(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
                  >
                    + Ölçüm Ekle
                  </button>
                </div>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" fontSize={11} tick={{ fill: "#9ca3af" }} />
                      <YAxis fontSize={11} tick={{ fill: "#9ca3af" }} />
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Henüz ölçüm verisi yok." />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Exercises Tab */}
        {activeTab === "exercises" && (
          <div className="space-y-6 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Toplam Antrenman"
                value={clientData?.exercises?.summary.totalCount || 0}
                color="bg-emerald-50 text-emerald-600"
                icon="🏋️"
              />
              <StatCard
                label="Toplam Süre"
                value={`${clientData?.exercises?.summary.totalMinutes || 0} dk`}
                color="bg-blue-50 text-blue-600"
                icon="⏱️"
              />
              <StatCard
                label="Yakılan Kalori"
                value={clientData?.exercises?.summary.totalCalories || 0}
                sub="kcal"
                color="bg-orange-50 text-orange-600"
                icon="🔥"
              />
              <StatCard
                label="Ort. Süre/Gün"
                value={`${clientData?.exercises?.summary.totalCount ? Math.round((clientData.exercises.summary.totalMinutes || 0) / dateRange) : 0} dk`}
                color="bg-purple-50 text-purple-600"
                icon="📅"
              />
            </div>

            {clientData?.exercises?.summary.byType && Object.keys(clientData.exercises.summary.byType).length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Egzersiz Türleri</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(clientData.exercises.summary.byType).map(([type, data]) => (
                    <div key={type} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-2xl mb-2">{exerciseTypeIcons[type] || "⚡"}</div>
                      <p className="font-semibold text-gray-900 text-sm">{exerciseTypeLabels[type] || type}</p>
                      <p className="text-xs text-gray-500 mt-1">{data.count} kez · {data.minutes} dk</p>
                      <p className="text-xs text-emerald-600 font-medium mt-1">{data.calories} kcal</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Son Egzersizler</h3>
              {clientData?.exercises?.items && clientData.exercises.items.length > 0 ? (
                <div className="space-y-2">
                  {clientData.exercises.items.slice(0, 10).map((ex) => (
                    <div key={ex._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{exerciseTypeIcons[ex.type] || "⚡"}</span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{exerciseTypeLabels[ex.type] || ex.type}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(ex.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-sm">{ex.duration} dk</p>
                        <p className="text-xs text-emerald-600">{ex.caloriesBurned} kcal</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="Henüz egzersiz kaydı yok." />
              )}
            </div>
          </div>
        )}

        {/* Wellness Tab */}
        {activeTab === "wellness" && (
          <div className="space-y-6 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Ort. Uyku" value={`${clientData?.wellness?.summary.avgSleepHours || 0}s`} sub="saat/gün" color="bg-blue-50 text-blue-600" icon="😴" />
              <StatCard label="Uyku Kalitesi" value={`${clientData?.wellness?.summary.avgSleepQuality || 0}/5`} color="bg-indigo-50 text-indigo-600" icon="⭐" />
              <StatCard label="Ort. Enerji" value={`${clientData?.wellness?.summary.avgEnergy || 0}/5`} color="bg-amber-50 text-amber-600" icon="⚡" />
              <StatCard label="Ort. Stres" value={`${clientData?.wellness?.summary.avgStress || 0}/5`} color="bg-red-50 text-red-600" icon="🧠" />
              <StatCard label="Ort. Su" value={`${clientData?.wellness?.summary.avgWater || 0}`} sub="bardak/gün" color="bg-cyan-50 text-cyan-600" icon="💧" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-sm">😴</span>
                  Uyku Kayıtları
                </h3>
                {clientData?.wellness?.sleep && clientData.wellness.sleep.length > 0 ? (
                  <div className="space-y-2">
                    {clientData.wellness.sleep.slice(0, 7).map((s) => (
                      <div key={s._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-600">
                          {new Date(s.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-blue-600">{s.duration}s</span>
                          <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-medium">
                            {s.quality}/5 kalite
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Henüz uyku kaydı yok." />
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-sm">🎯</span>
                  Günlük Durum
                </h3>
                {clientData?.wellness?.checkIns && clientData.wellness.checkIns.length > 0 ? (
                  <div className="space-y-2">
                    {clientData.wellness.checkIns.slice(0, 7).map((c) => (
                      <div key={c._id} className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-400 mb-2">
                          {new Date(c.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-lg font-medium">
                            😊 {c.mood}/5
                          </span>
                          <span className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded-lg font-medium">
                            ⚡ {c.energyLevel}/5
                          </span>
                          <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg font-medium">
                            🧠 {c.stressLevel}/5
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Henüz günlük durum kaydı yok." />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-sm">🏥</span>
                    Kronik Hastalıklar
                  </h3>
                  <button
                    onClick={() => { setHealthTab("diseases"); handleOpenHealthModal(); }}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    Düzenle
                  </button>
                </div>
                {healthLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent" />
                    <span className="text-sm text-gray-400">Yükleniyor...</span>
                  </div>
                ) : chronicDiseases.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">Kronik hastalık kaydı yok.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {chronicDiseases.map((d) => (
                      <span key={d} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-full text-sm font-medium">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-sm">🔬</span>
                    Kan Tahlilleri
                  </h3>
                  <button
                    onClick={() => { setHealthTab("blood"); handleOpenHealthModal(); }}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    Yeni Ekle
                  </button>
                </div>
                {healthLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent" />
                    <span className="text-sm text-gray-400">Yükleniyor...</span>
                  </div>
                ) : bloodTests.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">Henüz kan tahlili yüklenmedi.</p>
                ) : (
                  <div className="space-y-2">
                    {bloodTests.map((bt) => (
                      <div key={bt._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        {bt.imageUrl.toLowerCase().endsWith(".pdf") ? (
                          <a href={bt.imageUrl} target="_blank" rel="noreferrer"
                            className="shrink-0 w-12 h-12 bg-red-50 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-red-100 transition">
                            <span className="text-xl">📄</span>
                          </a>
                        ) : (
                          <button onClick={() => setLightboxUrl(bt.imageUrl)} className="shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={bt.imageUrl} alt={bt.originalName}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition" />
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{bt.originalName}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(bt.testDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                          {bt.notes && <p className="text-xs text-gray-400 truncate">{bt.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Meals Tab */}
        {activeTab === "meals" && (
          <div className="space-y-6 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Toplam Öğün" value={clientData?.meals?.summary.totalMeals || 0} color="bg-emerald-50 text-emerald-600" icon="🍽️" />
              <StatCard label="Toplam Kalori" value={clientData?.meals?.summary.totalCalories || 0} sub="kcal" color="bg-orange-50 text-orange-600" icon="🔥" />
              <StatCard label="Ort. Kalori/Gün" value={clientData?.meals?.summary.avgCaloriesPerDay || 0} sub="kcal" color="bg-blue-50 text-blue-600" icon="📊" />
              <StatCard label="Kalori Hedefi" value={client.targetCalories} sub="kcal/gün" color="bg-gray-100 text-gray-600" icon="🎯" />
              <StatCard
                label="Ort. Tokluk"
                value={clientData?.meals?.summary.avgSatiety
                  ? `${["😫","😕","😊","😄","🤩"][Math.round(clientData.meals.summary.avgSatiety) - 1]} ${clientData.meals.summary.avgSatiety}`
                  : "—"}
                sub="/5"
                color="bg-purple-50 text-purple-600"
                icon="😋"
              />
            </div>

            {dailyCaloriesData.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-5">Günlük Kalori Alımı</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={dailyCaloriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={11} tick={{ fill: "#9ca3af" }} />
                    <YAxis fontSize={11} tick={{ fill: "#9ca3af" }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="calories" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {clientData?.meals?.summary.byType && Object.keys(clientData.meals.summary.byType).length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Öğün Türlerine Göre</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(clientData.meals.summary.byType).map(([type, data]) => (
                    <div key={type} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-2xl mb-2">{mealTypeIcons[type] || "🍴"}</div>
                      <p className="font-semibold text-gray-900 text-sm">{mealTypeLabels[type] || type}</p>
                      <p className="text-xs text-gray-500 mt-1">{data.count} öğün</p>
                      <p className="text-xs text-emerald-600 font-medium mt-1">{data.calories} kcal</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clientData?.meals?.satietyRecords && clientData.meals.satietyRecords.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Tokluk Geçmişi</h3>
                <div className="space-y-2">
                  {clientData.meals.satietyRecords.slice(0, 20).map((s) => {
                    const emojis = ["😫","😕","😊","😄","🤩"];
                    const labels = ["Çok Aç","Aç","Normal","Tok","Çok Tok"];
                    const mealColors: Record<string,string> = {
                      breakfast:"bg-amber-50 text-amber-700 border-amber-100",
                      lunch:"bg-blue-50 text-blue-700 border-blue-100",
                      dinner:"bg-purple-50 text-purple-700 border-purple-100",
                      snack:"bg-green-50 text-green-700 border-green-100",
                    };
                    return (
                      <div key={s._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${mealColors[s.mealType] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                            {mealTypeIcons[s.mealType]} {mealTypeLabels[s.mealType] || s.mealType}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(s.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{emojis[s.satietyLevel - 1]}</span>
                          <span className="text-sm font-medium text-gray-700">{labels[s.satietyLevel - 1]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Son Öğünler</h3>
              {clientData?.meals?.items && clientData.meals.items.length > 0 ? (
                <div className="space-y-3">
                  {clientData.meals.items.slice(0, 10).map((meal) => (
                    <div key={meal._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{mealTypeIcons[meal.mealType] || "🍴"}</span>
                          <span className="font-semibold text-gray-900 text-sm">{mealTypeLabels[meal.mealType] || meal.mealType}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(meal.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600">{meal.totalCalories} kcal</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {meal.items.map((f, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600">
                            {f.name}{f.portion ? ` (${f.portion})` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="Henüz öğün kaydı yok." />
              )}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div className="space-y-6 pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Kazanılan Başarı" value={clientData?.achievements?.summary.unlockedCount || 0} color="bg-amber-50 text-amber-600" icon="🏆" />
              <StatCard label="Toplam Başarı" value={clientData?.achievements?.summary.totalAchievements || 0} color="bg-gray-100 text-gray-600" icon="🎖️" />
              <StatCard label="Toplam Puan" value={clientData?.achievements?.summary.totalPoints || 0} sub="puan" color="bg-emerald-50 text-emerald-600" icon="⭐" />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Kazanılan Başarılar</h3>
              {clientData?.achievements?.items && clientData.achievements.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientData.achievements.items.map((a) => (
                    <div key={a._id} className="p-4 bg-linear-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl shrink-0">{a.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{a.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{a.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">
                              +{a.points} puan
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(a.unlockedAt).toLocaleDateString("tr-TR")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="Henüz kazanılan başarı yok." />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Measurement Modal */}
      {showMeasurementForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Yeni Ölçüm Ekle</h3>
              <button onClick={() => setShowMeasurementForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddMeasurement} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-blue-600 mb-1.5">Kilo (kg)</label>
                  <input
                    type="number" step="0.1" value={measurementWeight}
                    onChange={(e) => setMeasurementWeight(e.target.value)}
                    placeholder="72.5"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-600 mb-1.5">Boy (cm)</label>
                  <input
                    type="number" step="0.1" value={measurementHeight}
                    onChange={(e) => setMeasurementHeight(e.target.value)}
                    placeholder="168"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.entries(regionLabels) as [keyof Regions, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label} (cm)</label>
                    <input
                      type="number" step="0.1"
                      value={measurementForm[key] || ""}
                      onChange={(e) => setMeasurementForm({ ...measurementForm, [key]: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowMeasurementForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                  İptal
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Health Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-gray-900">🩸 Kan & Kronik Hastalıklar</h3>
              <button onClick={() => setShowHealthModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition">
                ✕
              </button>
            </div>
            <div className="flex border-b border-gray-100 shrink-0">
              <button
                onClick={() => setHealthTab("diseases")}
                className={`flex-1 py-3.5 text-sm font-medium transition border-b-2 ${healthTab === "diseases" ? "text-red-600 border-red-500 bg-red-50/50" : "text-gray-500 border-transparent hover:text-gray-700"}`}
              >
                🏥 Kronik Hastalıklar
              </button>
              <button
                onClick={() => setHealthTab("blood")}
                className={`flex-1 py-3.5 text-sm font-medium transition border-b-2 ${healthTab === "blood" ? "text-red-600 border-red-500 bg-red-50/50" : "text-gray-500 border-transparent hover:text-gray-700"}`}
              >
                🔬 Kan Tahlili
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {healthLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent" />
                </div>
              ) : healthTab === "diseases" ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text" value={newDisease}
                      onChange={(e) => setNewDisease(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddDisease()}
                      placeholder="Örn: Diyabet, Hipertansiyon..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 text-gray-900"
                    />
                    <button onClick={handleAddDisease}
                      className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition">
                      Ekle
                    </button>
                  </div>
                  {chronicDiseases.length === 0 ? (
                    <EmptyState message="Henüz kronik hastalık eklenmedi." />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {chronicDiseases.map((d) => (
                        <span key={d} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-full text-sm flex items-center gap-2 font-medium">
                          {d}
                          <button onClick={() => handleRemoveDisease(d)} className="text-red-400 hover:text-red-700 leading-none">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-5 space-y-4 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-700">Yeni Tahlil Yükle</p>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1.5">Dosya (JPG / PNG / PDF)</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => { setBloodFile(e.target.files?.[0] || null); setUploadError(null); }}
                        className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-red-50 file:text-red-600 hover:file:bg-red-100 file:font-medium"
                      />
                      {bloodFile && (
                        <p className="text-xs text-gray-500 mt-1.5 truncate">
                          {bloodFile.name.toLowerCase().endsWith(".pdf") ? "📄" : "🖼️"} {bloodFile.name}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1.5">Tarih</label>
                        <DatePickerModern value={bloodDate} onChange={setBloodDate} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1.5">Not (opsiyonel)</label>
                        <input type="text" value={bloodNotes} onChange={(e) => setBloodNotes(e.target.value)}
                          placeholder="Açıklama..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white" />
                      </div>
                    </div>
                    {uploadError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                        {uploadError}
                      </p>
                    )}
                    <button onClick={handleUploadBloodTest} disabled={!bloodFile || uploadLoading}
                      className="w-full py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                      {uploadLoading ? "Yükleniyor..." : "Yükle"}
                    </button>
                  </div>
                  {bloodTests.length === 0 ? (
                    <EmptyState message="Henüz kan tahlili yüklenmedi." />
                  ) : (
                    <div className="space-y-2">
                      {bloodTests.map((bt) => (
                        <div key={bt._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          {bt.imageUrl.toLowerCase().endsWith(".pdf") ? (
                            <a href={bt.imageUrl} target="_blank" rel="noreferrer"
                              className="shrink-0 w-12 h-12 bg-red-50 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-red-100 transition">
                              <span className="text-xl">📄</span>
                            </a>
                          ) : (
                            <button onClick={() => setLightboxUrl(bt.imageUrl)} className="shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={bt.imageUrl} alt={bt.originalName}
                                className="w-12 h-12 object-cover rounded-xl border border-gray-200 hover:opacity-80 transition" />
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{bt.originalName}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(bt.testDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                            {bt.notes && <p className="text-xs text-gray-400 truncate">{bt.notes}</p>}
                          </div>
                          <button onClick={() => handleDeleteBloodTest(bt._id)}
                            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition text-lg leading-none">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-3xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightboxUrl(null)}
              className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition text-xl">
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightboxUrl} alt="Kan tahlili" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
          </div>
        </div>
      )}

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">⚖️ Kilo Güncelle</h3>
              <button onClick={() => setShowWeightModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <span className="text-sm text-gray-500">Mevcut kilo</span>
                <span className="text-lg font-bold text-gray-900">{client.weight} kg</span>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Yeni Kilo (kg)</label>
                <input
                  type="number" step="0.1" value={weightForm}
                  onChange={(e) => setWeightForm(e.target.value)}
                  placeholder="82.5" autoFocus
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowWeightModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                  İptal
                </button>
                <button
                  onClick={() => { handleUpdateWeight(); setShowWeightModal(false); }}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition">
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
