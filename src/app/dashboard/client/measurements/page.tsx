"use client";

import { useState, useEffect, useCallback } from "react";
import MannequinChart from "@/components/client/MannequinChart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

interface MeasurementRecord {
  _id: string;
  date: string;
  weight?: number;
  height?: number;
  regions: Regions;
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

const regionEmojis: Record<keyof Regions, string> = {
  neck: "🫴",
  chest: "💪",
  waist: "✨",
  hip: "🌟",
  arm: "💪",
  thigh: "🦵",
  calf: "🦵",
};

type ChartKey = keyof Regions | "weight" | "height";

const extraLabels: Record<"weight" | "height", string> = {
  weight: "Kilo",
  height: "Boy",
};

function getBMICategory(bmi: number): { label: string; color: string; bg: string } {
  if (bmi < 18.5) return { label: "Zayıf", color: "text-blue-600", bg: "bg-blue-100" };
  if (bmi < 25) return { label: "Normal", color: "text-emerald-600", bg: "bg-emerald-100" };
  if (bmi < 30) return { label: "Fazla Kilolu", color: "text-amber-600", bg: "bg-amber-100" };
  return { label: "Obez", color: "text-red-600", bg: "bg-red-100" };
}

function getDelta(current: number, previous: number) {
  const diff = current - previous;
  if (diff === 0) return null;
  return diff;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-lg font-bold text-emerald-600">
          {payload[0].value} <span className="text-xs text-gray-400">cm/kg</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<ChartKey>("waist");
  const [profileWeight, setProfileWeight] = useState<number | null>(null);
  const [profileHeight, setProfileHeight] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"chart" | "history">("chart");

  const fetchMeasurements = useCallback(async () => {
    try {
      const res = await fetch("/api/measurements");
      if (res.ok) {
        const data = await res.json();
        setMeasurements(data);
      }
    } catch (error) {
      console.error("Failed to fetch measurements:", error);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/client/daily-summary");
      if (res.ok) {
        const data = await res.json();
        if (data.currentWeight) setProfileWeight(data.currentWeight);
        if (data.currentHeight) setProfileHeight(data.currentHeight);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  }, []);

  useEffect(() => {
    fetchMeasurements();
    fetchProfile();
  }, [fetchMeasurements, fetchProfile]);

  const latestMeasurement = measurements[measurements.length - 1];
  const firstMeasurement = measurements[0];

  const latestWeight = (() => {
    for (let i = measurements.length - 1; i >= 0; i--) {
      if (measurements[i].weight != null) return measurements[i].weight!;
    }
    return profileWeight;
  })();

  const latestHeight = (() => {
    for (let i = measurements.length - 1; i >= 0; i--) {
      if (measurements[i].height != null) return measurements[i].height!;
    }
    return profileHeight;
  })();

  const bmi =
    latestWeight && latestHeight
      ? parseFloat((latestWeight / Math.pow(latestHeight / 100, 2)).toFixed(1))
      : null;

  const bmiCategory = bmi ? getBMICategory(bmi) : null;

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
    value:
      selectedRegion === "weight"
        ? (m.weight ?? null)
        : selectedRegion === "height"
          ? (m.height ?? null)
          : m.regions[selectedRegion as keyof Regions],
  }));

  const allKeys: ChartKey[] = ["weight", "height", "neck", "chest", "waist", "hip", "arm", "thigh", "calf"];
  const allLabels: Record<ChartKey, string> = { ...extraLabels, ...regionLabels };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-emerald-50/40 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-violet-600 via-purple-600 to-emerald-500 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 text-[120px] leading-none select-none pointer-events-none">🏃</div>
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse inline-block"></span>
              Diyetisyeniniz tarafından güncelleniyor
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Vücut Takibi</h1>
            <p className="text-purple-100 text-sm">
              {measurements.length > 0
                ? `${measurements.length} ölçüm kaydın var — harika gidiyorsun!`
                : "İlk ölçümlerin girilince burada görünecek."}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Weight */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">⚖️</div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Kilo</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {latestWeight != null ? latestWeight : "—"}
              {latestWeight != null && <span className="text-sm font-normal text-gray-400 ml-1">kg</span>}
            </p>
            {firstMeasurement?.weight && latestWeight && firstMeasurement.weight !== latestWeight && (
              <p className={`text-xs mt-1 font-medium ${latestWeight < firstMeasurement.weight ? "text-emerald-500" : "text-rose-400"}`}>
                {latestWeight < firstMeasurement.weight ? "↓" : "↑"} {Math.abs(latestWeight - firstMeasurement.weight).toFixed(1)} kg
              </p>
            )}
          </div>

          {/* Height */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">📏</div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Boy</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {latestHeight != null ? latestHeight : "—"}
              {latestHeight != null && <span className="text-sm font-normal text-gray-400 ml-1">cm</span>}
            </p>
          </div>

          {/* BMI */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">🎯</div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">VKİ (BMI)</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{bmi ?? "—"}</p>
            {bmiCategory && (
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${bmiCategory.bg} ${bmiCategory.color}`}>
                {bmiCategory.label}
              </span>
            )}
          </div>

          {/* Total sessions */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">📊</div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Toplam Ölçüm</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{measurements.length}</p>
            {measurements.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Son: {new Date(latestMeasurement.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
              </p>
            )}
          </div>
        </div>

        {/* Mannequin + Region Cards side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MannequinChart regions={regions} />
          </div>

          {/* Region highlight cards */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">Bölge Ölçümleri</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 overflow-y-auto max-h-130 pr-1">
              {(Object.keys(regionLabels) as (keyof Regions)[]).map((key) => {
                const current = regions[key];
                const firstVal = firstMeasurement?.regions?.[key];
                const delta = firstVal && current ? getDelta(current, firstVal) : null;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedRegion(key)}
                    className={`text-left rounded-xl p-3 border transition-all duration-200 hover:shadow-sm ${
                      selectedRegion === key
                        ? "bg-linear-to-r from-violet-500 to-purple-500 border-transparent text-white shadow-md"
                        : "bg-white border-gray-100 text-gray-700 hover:border-purple-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${selectedRegion === key ? "text-purple-100" : "text-gray-400"}`}>
                        {regionLabels[key]}
                      </span>
                      {delta !== null && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          selectedRegion === key
                            ? delta < 0 ? "bg-emerald-400/30 text-emerald-100" : "bg-rose-400/30 text-rose-100"
                            : delta < 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                        }`}>
                          {delta > 0 ? "+" : ""}{delta} cm
                        </span>
                      )}
                    </div>
                    <p className={`text-xl font-bold mt-0.5 ${selectedRegion === key ? "text-white" : "text-gray-900"}`}>
                      {current > 0 ? `${current} cm` : "—"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart + History tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab("chart")}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                activeTab === "chart"
                  ? "text-violet-600 border-b-2 border-violet-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Grafik
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                activeTab === "history"
                  ? "text-violet-600 border-b-2 border-violet-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Geçmiş
            </button>
          </div>

          <div className="p-6">
            {activeTab === "chart" && (
              <>
                {/* Pill selector */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {allKeys.map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedRegion(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        selectedRegion === key
                          ? "bg-linear-to-r from-violet-500 to-purple-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {allLabels[key]}
                    </button>
                  ))}
                </div>

                {chartData.filter((d) => d.value != null).length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" fontSize={11} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis fontSize={11} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        fill="url(#colorGradient)"
                        dot={{ fill: "#8b5cf6", r: 4, strokeWidth: 2, stroke: "white" }}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: "white" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="text-5xl mb-3">📉</span>
                    <p className="text-gray-400 text-sm">Bu bölge için henüz veri yok.</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "history" && (
              <>
                {measurements.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 pr-4 text-xs text-gray-400 font-semibold uppercase tracking-wide">Tarih</th>
                          <th className="text-center py-3 px-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">Kilo</th>
                          <th className="text-center py-3 px-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">Boy</th>
                          {Object.values(regionLabels).map((label) => (
                            <th key={label} className="text-center py-3 px-2 text-xs text-gray-400 font-semibold uppercase tracking-wide whitespace-nowrap">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...measurements].reverse().map((m, i) => (
                          <tr key={m._id} className={`border-b border-gray-50 ${i === 0 ? "bg-violet-50/50" : "hover:bg-gray-50/50"} transition-colors`}>
                            <td className="py-3 pr-4 font-medium text-gray-700 whitespace-nowrap">
                              {i === 0 && (
                                <span className="inline-block text-[10px] font-bold bg-violet-100 text-violet-600 rounded-full px-2 py-0.5 mr-2">YENİ</span>
                              )}
                              {new Date(m.date).toLocaleDateString("tr-TR")}
                            </td>
                            <td className="text-center py-3 px-2 text-blue-600 font-semibold">
                              {m.weight != null ? `${m.weight}` : "—"}
                            </td>
                            <td className="text-center py-3 px-2 text-emerald-600 font-semibold">
                              {m.height != null ? `${m.height}` : "—"}
                            </td>
                            {(Object.keys(regionLabels) as (keyof Regions)[]).map((key) => (
                              <td key={key} className="text-center py-3 px-2 text-gray-600">
                                {m.regions[key] > 0 ? m.regions[key] : "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="text-5xl mb-3">🗓️</span>
                    <p className="text-gray-400 text-sm">Henüz ölçüm kaydı yok.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
