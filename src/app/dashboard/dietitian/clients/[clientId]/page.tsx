"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DatePickerModern from "@/components/shared/DatePickerModern";
import MealPlanModal from "@/components/dietitian/MealPlanModal";
import { useParams, useSearchParams } from "next/navigation";
import MannequinChart from "@/components/client/MannequinChart";
import CalorieBar from "@/components/client/CalorieBar";
import GoalProgressBar from "@/components/client/GoalProgressBar";
import MeasurementHistoryTable from "@/components/shared/MeasurementHistoryTable";
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

const satietyEmojis = ["😫", "😕", "😊", "😄", "🤩"];
const satietyLabels = ["Çok Aç", "Aç", "Normal", "Tok", "Çok Tok"];
const satietyMealColors: Record<string, string> = {
  breakfast: "bg-amber-50 text-amber-700 border-amber-100",
  lunch: "bg-blue-50 text-blue-700 border-blue-100",
  dinner: "bg-purple-50 text-purple-700 border-purple-100",
  snack: "bg-green-50 text-green-700 border-green-100",
};

function getWeekMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  date.setHours(0, 0, 0, 0);
  return date.toISOString().split("T")[0];
}

const WEEK_OPTIONS = (() => {
  const weeks: { value: string; label: string }[] = [];
  const currentMonday = new Date(getWeekMonday(new Date()));
  for (let i = 0; i < 12; i++) {
    const start = new Date(currentMonday);
    start.setDate(currentMonday.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const value = start.toISOString().split("T")[0];
    const sl = start.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
    const el = end.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
    weeks.push({ value, label: i === 0 ? `Bu hafta (${sl} – ${el})` : `${sl} – ${el}` });
  }
  return weeks;
})();

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
  const [mealWeek, setMealWeek] = useState(() => getWeekMonday(new Date()));
  const [mealWeekData, setMealWeekData] = useState<ClientData | null>(null);
  const [mealViewMode, setMealViewMode] = useState<"daily" | "weekly" | "yearly">("weekly");
  const [mealDay, setMealDay] = useState(() => new Date().toISOString().split("T")[0]);
  const [mealDayData, setMealDayData] = useState<ClientData | null>(null);
  const [mealYear, setMealYear] = useState(() => new Date().getFullYear());
  const [mealYearData, setMealYearData] = useState<ClientData | null>(null);
  const [calorieChartType, setCalorieChartType] = useState<"bar" | "line">("bar");
  const [yearlyChartType, setYearlyChartType] = useState<"bar" | "line">("bar");
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<keyof Regions>("waist");
  const [measurementView, setMeasurementView] = useState<"chart" | "history">("chart");
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [measurementForm, setMeasurementForm] = useState<Regions>({
    neck: 0, chest: 0, waist: 0, hip: 0, arm: 0, thigh: 0, calf: 0,
  });
  const [measurementWeight, setMeasurementWeight] = useState("");
  const [measurementHeight, setMeasurementHeight] = useState("");
  const [weightForm, setWeightForm] = useState("");
  const [targetWeightForm, setTargetWeightForm] = useState("");

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
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);

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

  const fetchMealWeekData = useCallback(async () => {
    const endDate = new Date(mealWeek);
    endDate.setDate(endDate.getDate() + 6);
    try {
      const res = await fetch(
        `/api/dietitian/clients/${clientId}/data?category=meals&startDate=${mealWeek}&endDate=${endDate.toISOString().split("T")[0]}`
      );
      if (res.ok) setMealWeekData(await res.json());
    } catch (error) {
      console.error("Failed to fetch meal week data:", error);
    }
  }, [clientId, mealWeek]);

  const fetchMealDayData = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/dietitian/clients/${clientId}/data?category=meals&startDate=${mealDay}&endDate=${mealDay}`
      );
      if (res.ok) setMealDayData(await res.json());
    } catch (error) {
      console.error("Failed to fetch meal day data:", error);
    }
  }, [clientId, mealDay]);

  const fetchMealYearData = useCallback(async () => {
    const startDate = `${mealYear}-01-01`;
    const endDate = `${mealYear}-12-31`;
    try {
      const res = await fetch(
        `/api/dietitian/clients/${clientId}/data?category=meals&startDate=${startDate}&endDate=${endDate}`
      );
      if (res.ok) setMealYearData(await res.json());
    } catch (error) {
      console.error("Failed to fetch meal year data:", error);
    }
  }, [clientId, mealYear]);

  useEffect(() => {
    fetchClient();
    fetchMeasurements();
  }, [fetchClient, fetchMeasurements]);

  useEffect(() => { fetchClientData(); }, [fetchClientData]);
  useEffect(() => { fetchMealWeekData(); }, [fetchMealWeekData]);
  useEffect(() => { fetchMealDayData(); }, [fetchMealDayData]);
  useEffect(() => { fetchMealYearData(); }, [fetchMealYearData]);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const POLLING_TABS: TabType[] = ["wellness", "exercises"];
    if (POLLING_TABS.includes(activeTab)) {
      pollingRef.current = setInterval(() => fetchClientData(), 30_000);
    } else if (activeTab === "meals") {
      if (mealViewMode === "daily") pollingRef.current = setInterval(() => fetchMealDayData(), 30_000);
      else if (mealViewMode === "weekly") pollingRef.current = setInterval(() => fetchMealWeekData(), 30_000);
      else if (mealViewMode === "yearly") pollingRef.current = setInterval(() => fetchMealYearData(), 30_000);
    }
    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    };
  }, [activeTab, mealViewMode, fetchClientData, fetchMealWeekData, fetchMealDayData, fetchMealYearData]);

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

  const handleSaveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = {
        regions: measurementForm,
        weight: measurementWeight ? parseFloat(measurementWeight) : null,
        height: measurementHeight ? parseFloat(measurementHeight) : null,
      };
      const res = editingMeasurementId
        ? await fetch(`/api/measurements/${editingMeasurementId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/measurements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...body, clientId, date: new Date().toISOString() }),
          });
      if (res.ok) {
        setShowMeasurementForm(false);
        setEditingMeasurementId(null);
        setMeasurementWeight("");
        setMeasurementHeight("");
        fetchMeasurements();
        fetchClient();
      }
    } catch (error) {
      console.error("Failed to save measurement:", error);
    }
  };

  const handleEditMeasurement = (measurement: MeasurementRecord) => {
    setEditingMeasurementId(measurement._id);
    setMeasurementForm(measurement.regions);
    setMeasurementWeight(measurement.weight != null ? String(measurement.weight) : "");
    setMeasurementHeight(measurement.height != null ? String(measurement.height) : "");
    setShowMeasurementForm(true);
  };

  const handleDeleteMeasurement = async (measurement: MeasurementRecord) => {
    const label = new Date(measurement.date).toLocaleDateString("tr-TR");
    if (!window.confirm(`${label} tarihli ölçüm kaydı silinsin mi?`)) return;
    try {
      const res = await fetch(`/api/measurements/${measurement._id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedMeasurementId === measurement._id) setSelectedMeasurementId(null);
        fetchMeasurements();
        fetchClient();
      }
    } catch (error) {
      console.error("Failed to delete measurement:", error);
    }
  };

  const handleUpdateWeight = async () => {
    const weight = weightForm ? parseFloat(weightForm) : undefined;
    const targetWeight = targetWeightForm ? parseFloat(targetWeightForm) : undefined;
    if (!weight && !targetWeight) return;
    try {
      const res = await fetch(`/api/dietitian/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight, targetWeight }),
      });
      if (res.ok) {
        setWeightForm("");
        setTargetWeightForm("");
        setShowWeightModal(false);
        fetchClient();
        fetchMeasurements();
      }
    } catch (error) {
      console.error("Failed to update weight:", error);
    }
  };

  const latestMeasurement = measurements[measurements.length - 1];
  const displayedMeasurement = selectedMeasurementId
    ? measurements.find((m) => m._id === selectedMeasurementId) || latestMeasurement
    : latestMeasurement;
  const regions = displayedMeasurement?.regions || { neck: 0, chest: 0, waist: 0, hip: 0, arm: 0, thigh: 0, calf: 0 };

  const chartData = measurements.map((m) => ({
    date: new Date(m.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
    value: m.regions[selectedRegion],
  }));

  const dailyCaloriesData = mealWeekData?.meals?.summary.dailyCalories
    ? Object.entries(mealWeekData.meals.summary.dailyCalories)
        .map(([date, calories]) => ({
          date: new Date(date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
          calories,
        }))
    : [];

  const monthlyCaloriesData = (() => {
    if (!mealYearData?.meals?.summary.dailyCalories) return [];
    const byMonth: Record<string, number> = {};
    Object.entries(mealYearData.meals.summary.dailyCalories).forEach(([date, cal]) => {
      const month = date.substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + cal;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, calories]) => ({
        date: new Date(month + "-15").toLocaleDateString("tr-TR", { month: "long" }),
        calories,
      }));
  })();

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
                onClick={() => {
                  setTargetWeightForm(String(client.targetWeight));
                  setShowWeightModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="3"/>
                  <path d="M6.5 8a2 2 0 00-1.905 1.46L2.1 18.5A2 2 0 004 21h16a2 2 0 001.925-2.54L19.4 9.46A2 2 0 0017.48 8z"/>
                </svg>
                Kilo Güncelle
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
                    {measurementView === "chart" && (
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value as keyof Regions)}
                        className="select-modern"
                      >
                        {Object.entries(regionLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const latest = measurements[measurements.length - 1];
                      setEditingMeasurementId(null);
                      setMeasurementForm({ neck: 0, chest: 0, waist: 0, hip: 0, arm: 0, thigh: 0, calf: 0 });
                      setMeasurementWeight(latest?.weight != null ? String(latest.weight) : "");
                      setMeasurementHeight(latest?.height != null ? String(latest.height) : "");
                      setShowMeasurementForm(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
                  >
                    + Ölçüm Ekle
                  </button>
                </div>

                <div className="flex gap-1 mb-4 bg-gray-50 rounded-lg p-1 w-fit">
                  <button
                    onClick={() => setMeasurementView("chart")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      measurementView === "chart" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Grafik
                  </button>
                  <button
                    onClick={() => setMeasurementView("history")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      measurementView === "history" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Geçmiş
                  </button>
                </div>

                {measurementView === "chart" ? (
                  chartData.length > 0 ? (
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
                  )
                ) : (
                  <MeasurementHistoryTable
                    measurements={measurements}
                    selectedId={selectedMeasurementId}
                    onSelectMeasurement={(m) => setSelectedMeasurementId(m._id)}
                    onEditMeasurement={handleEditMeasurement}
                    onDeleteMeasurement={handleDeleteMeasurement}
                  />
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
            {/* View Mode Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-gray-100 rounded-xl p-1">
                {(["daily", "weekly", "yearly"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setMealViewMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      mealViewMode === mode
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {mode === "daily" ? "Günlük" : mode === "weekly" ? "Haftalık" : "Yıllık"}
                  </button>
                ))}
              </div>
              {mealViewMode === "daily" && (
                <DatePickerModern value={mealDay} onChange={setMealDay} className="max-w-xs" />
              )}
              {mealViewMode === "weekly" && (
                <select
                  value={mealWeek}
                  onChange={(e) => setMealWeek(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                >
                  {WEEK_OPTIONS.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              )}
              {mealViewMode === "yearly" && (
                <select
                  value={mealYear}
                  onChange={(e) => setMealYear(Number(e.target.value))}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                >
                  {[0, 1, 2, 3].map((offset) => {
                    const y = new Date().getFullYear() - offset;
                    return <option key={y} value={y}>{y} Yılı</option>;
                  })}
                </select>
              )}
              </div>
              <button
                onClick={() => setShowMealPlanModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm shrink-0"
              >
                <span>📋</span> Yemek Listesi Oluştur
              </button>
            </div>

            {/* ── GÜNLÜK GÖRÜNÜM ── */}
            {mealViewMode === "daily" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Toplam Kalori" value={mealDayData?.meals?.summary.totalCalories || 0} sub="kcal" color="bg-orange-50 text-orange-600" icon="🔥" />
                  <StatCard label="Kalori Hedefi" value={client.targetCalories} sub="kcal/gün" color="bg-gray-100 text-gray-600" icon="🎯" />
                  <StatCard label="Öğün Sayısı" value={mealDayData?.meals?.summary.totalMeals || 0} color="bg-emerald-50 text-emerald-600" icon="🍽️" />
                  <StatCard
                    label="Ort. Tokluk"
                    value={mealDayData?.meals?.summary.avgSatiety
                      ? `${satietyEmojis[Math.round(mealDayData.meals.summary.avgSatiety) - 1]} ${mealDayData.meals.summary.avgSatiety}`
                      : "—"}
                    sub="/5"
                    color="bg-purple-50 text-purple-600"
                    icon="😋"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["breakfast", "lunch", "dinner", "snack"] as const).map((type) => {
                    const typeMeals = mealDayData?.meals?.items.filter((m) => m.mealType === type) || [];
                    const typeSatiety = mealDayData?.meals?.satietyRecords?.find((s) => s.mealType === type);
                    const typeCalories = typeMeals.reduce((sum, m) => sum + m.totalCalories, 0);
                    return (
                      <div key={type} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{mealTypeIcons[type]}</span>
                            <span className="font-semibold text-gray-900 text-sm">{mealTypeLabels[type]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {typeSatiety && (
                              <span title={satietyLabels[typeSatiety.satietyLevel - 1]} className="text-lg">
                                {satietyEmojis[typeSatiety.satietyLevel - 1]}
                              </span>
                            )}
                            {typeCalories > 0 && (
                              <span className="text-sm font-bold text-emerald-600">{typeCalories} kcal</span>
                            )}
                          </div>
                        </div>
                        {typeMeals.length > 0 ? (
                          <div className="space-y-1.5">
                            {typeMeals.flatMap((m) => m.items).map((f, i) => (
                              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                                <span className="text-gray-700">{f.name}{f.portion ? ` (${f.portion})` : ""}</span>
                                <span className="text-gray-400 text-xs shrink-0 ml-2">{f.calories} kcal</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 py-2">Bu öğün kaydedilmemiş</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── HAFTALIK GÖRÜNÜM ── */}
            {mealViewMode === "weekly" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <StatCard label="Toplam Öğün" value={mealWeekData?.meals?.summary.totalMeals || 0} color="bg-emerald-50 text-emerald-600" icon="🍽️" />
                  <StatCard label="Toplam Kalori" value={mealWeekData?.meals?.summary.totalCalories || 0} sub="kcal" color="bg-orange-50 text-orange-600" icon="🔥" />
                  <StatCard label="Ort. Kalori/Gün" value={mealWeekData?.meals?.summary.avgCaloriesPerDay || 0} sub="kcal" color="bg-blue-50 text-blue-600" icon="📊" />
                  <StatCard label="Kalori Hedefi" value={client.targetCalories} sub="kcal/gün" color="bg-gray-100 text-gray-600" icon="🎯" />
                  <StatCard
                    label="Ort. Tokluk"
                    value={mealWeekData?.meals?.summary.avgSatiety
                      ? `${satietyEmojis[Math.round(mealWeekData.meals.summary.avgSatiety) - 1]} ${mealWeekData.meals.summary.avgSatiety}`
                      : "—"}
                    sub="/5"
                    color="bg-purple-50 text-purple-600"
                    icon="😋"
                  />
                </div>

                {dailyCaloriesData.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-semibold text-gray-900">Günlük Kalori Alımı</h3>
                      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                        <button
                          onClick={() => setCalorieChartType("bar")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${calorieChartType === "bar" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                          Sütun
                        </button>
                        <button
                          onClick={() => setCalorieChartType("line")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${calorieChartType === "line" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                          Çizgi
                        </button>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                      {calorieChartType === "bar" ? (
                        <BarChart data={dailyCaloriesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" fontSize={11} tick={{ fill: "#9ca3af" }} />
                          <YAxis fontSize={11} tick={{ fill: "#9ca3af" }} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                          <Bar dataKey="calories" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      ) : (
                        <LineChart data={dailyCaloriesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" fontSize={11} tick={{ fill: "#9ca3af" }} />
                          <YAxis fontSize={11} tick={{ fill: "#9ca3af" }} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                          <Line type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}

                {mealWeekData?.meals?.summary.byType && Object.keys(mealWeekData.meals.summary.byType).length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Öğün Türlerine Göre</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(mealWeekData.meals.summary.byType).map(([type, data]) => (
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

                {mealWeekData?.meals?.satietyRecords && mealWeekData.meals.satietyRecords.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Tokluk Geçmişi</h3>
                    <div className="space-y-2">
                      {mealWeekData.meals.satietyRecords.map((s) => (
                        <div key={s._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${satietyMealColors[s.mealType] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                              {mealTypeIcons[s.mealType]} {mealTypeLabels[s.mealType] || s.mealType}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(s.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{satietyEmojis[s.satietyLevel - 1]}</span>
                            <span className="text-sm font-medium text-gray-700">{satietyLabels[s.satietyLevel - 1]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">Haftanın Öğünleri</h3>
                  {mealWeekData?.meals?.items && mealWeekData.meals.items.length > 0 ? (
                    <div className="space-y-3">
                      {mealWeekData.meals.items.map((meal) => (
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
                    <EmptyState message="Bu haftaya ait öğün kaydı yok." />
                  )}
                </div>
              </>
            )}

            {/* ── YILLIK GÖRÜNÜM ── */}
            {mealViewMode === "yearly" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Toplam Öğün" value={mealYearData?.meals?.summary.totalMeals || 0} color="bg-emerald-50 text-emerald-600" icon="🍽️" />
                  <StatCard label="Toplam Kalori" value={mealYearData?.meals?.summary.totalCalories || 0} sub="kcal" color="bg-orange-50 text-orange-600" icon="🔥" />
                  <StatCard label="Ort. Kalori/Gün" value={mealYearData?.meals?.summary.avgCaloriesPerDay || 0} sub="kcal" color="bg-blue-50 text-blue-600" icon="📊" />
                  <StatCard label="Kalori Hedefi" value={client.targetCalories} sub="kcal/gün" color="bg-gray-100 text-gray-600" icon="🎯" />
                </div>

                {monthlyCaloriesData.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-semibold text-gray-900">Aylık Kalori Alımı</h3>
                      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                        <button
                          onClick={() => setYearlyChartType("bar")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${yearlyChartType === "bar" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                          Sütun
                        </button>
                        <button
                          onClick={() => setYearlyChartType("line")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${yearlyChartType === "line" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                          Çizgi
                        </button>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      {yearlyChartType === "bar" ? (
                        <BarChart data={monthlyCaloriesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" fontSize={10} tick={{ fill: "#9ca3af" }} />
                          <YAxis fontSize={11} tick={{ fill: "#9ca3af" }} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                          <Bar dataKey="calories" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      ) : (
                        <LineChart data={monthlyCaloriesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" fontSize={10} tick={{ fill: "#9ca3af" }} />
                          <YAxis fontSize={11} tick={{ fill: "#9ca3af" }} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                          <Line type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: "#f59e0b", r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}

                {mealYearData?.meals?.summary.byType && Object.keys(mealYearData.meals.summary.byType).length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Öğün Türlerine Göre (Yıllık)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(mealYearData.meals.summary.byType).map(([type, data]) => (
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

                {monthlyCaloriesData.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Aylık Özet</h3>
                    <div className="space-y-2">
                      {(() => {
                        const maxCal = Math.max(...monthlyCaloriesData.map((x) => x.calories));
                        return monthlyCaloriesData.map((m) => (
                          <div key={m.date} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm font-medium text-gray-700 w-24 capitalize shrink-0">{m.date}</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full transition-all"
                                style={{ width: `${Math.round((m.calories / maxCal) * 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-amber-600 w-28 text-right shrink-0">{m.calories.toLocaleString("tr-TR")} kcal</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {monthlyCaloriesData.length === 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <EmptyState message={`${mealYear} yılına ait öğün kaydı yok.`} />
                  </div>
                )}
              </>
            )}
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
              <h3 className="font-bold text-gray-900">{editingMeasurementId ? "Ölçümü Düzenle" : "Yeni Ölçüm Ekle"}</h3>
              <button onClick={() => { setShowMeasurementForm(false); setEditingMeasurementId(null); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition">
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveMeasurement} className="p-6 space-y-5">
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
                <button type="button" onClick={() => { setShowMeasurementForm(false); setEditingMeasurementId(null); }}
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

      {/* Meal Plan Modal */}
      {showMealPlanModal && (
        <MealPlanModal
          clientId={clientId}
          onClose={() => setShowMealPlanModal(false)}
          onSaved={() => setShowMealPlanModal(false)}
        />
      )}

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Gradient Header */}
            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 px-6 pt-6 pb-8">
              <button
                onClick={() => { setShowWeightModal(false); setWeightForm(""); setTargetWeightForm(""); }}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="5" r="3"/>
                    <path d="M6.5 8a2 2 0 00-1.905 1.46L2.1 18.5A2 2 0 004 21h16a2 2 0 001.925-2.54L19.4 9.46A2 2 0 0017.48 8z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Kilo Takibi</p>
                  <h3 className="text-white text-xl font-bold">Güncelle</h3>
                </div>
              </div>

              {/* Weight comparison */}
              <div className="flex items-end gap-3">
                <div>
                  <p className="text-emerald-200 text-xs mb-1">Mevcut</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{client.weight}</span>
                    <span className="text-emerald-200 font-semibold">kg</span>
                  </div>
                </div>
                {weightForm && parseFloat(weightForm) > 0 && (
                  <>
                    <div className="pb-2">
                      <svg className="w-5 h-5 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-emerald-200 text-xs mb-1">Yeni</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">{parseFloat(weightForm).toFixed(1)}</span>
                        <span className="text-emerald-200 font-semibold">kg</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Delta badge */}
              {weightForm && parseFloat(weightForm) > 0 && parseFloat(weightForm) !== client.weight && (
                <div className="mt-3">
                  {(() => {
                    const diff = parseFloat(weightForm) - client.weight;
                    const isDown = diff < 0;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDown ? "bg-white/20 text-white" : "bg-amber-400/30 text-amber-100"}`}>
                        <span>{isDown ? "↓" : "↑"}</span>
                        <span>{Math.abs(diff).toFixed(1)} kg {isDown ? "azalma" : "artış"}</span>
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Weight journey progress */}
              {client.startWeight !== client.targetWeight && (
                <div className="bg-gray-50 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Başlangıç <span className="font-semibold text-gray-700">{client.startWeight} kg</span></span>
                    <span>Hedef <span className="font-semibold text-emerald-600">{client.targetWeight} kg</span></span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0,
                          ((client.startWeight - client.weight) / (client.startWeight - client.targetWeight)) * 100
                        ))}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Input */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Yeni Kilo</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={weightForm}
                    onChange={(e) => setWeightForm(e.target.value)}
                    placeholder={String(client.weight)}
                    autoFocus
                    className="w-full pl-5 pr-14 py-4 border-2 border-gray-100 rounded-2xl text-2xl font-bold text-gray-900 bg-gray-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">kg</span>
                </div>
              </div>

              {/* Target weight input */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hedef Kilo</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={targetWeightForm}
                    onChange={(e) => setTargetWeightForm(e.target.value)}
                    placeholder={String(client.targetWeight)}
                    className="w-full pl-5 pr-14 py-3 border-2 border-gray-100 rounded-2xl text-lg font-bold text-gray-900 bg-gray-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">kg</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowWeightModal(false); setWeightForm(""); setTargetWeightForm(""); }}
                  className="flex-1 py-3.5 border-2 border-gray-100 text-gray-500 rounded-2xl text-sm font-semibold hover:border-gray-200 hover:bg-gray-50 transition-all"
                >
                  İptal
                </button>
                <button
                  onClick={() => { handleUpdateWeight(); setShowWeightModal(false); }}
                  disabled={(!weightForm || parseFloat(weightForm) <= 0) && (!targetWeightForm || parseFloat(targetWeightForm) <= 0)}
                  className="flex-1 py-3.5 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-sm font-bold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
