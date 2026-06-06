"use client";

import { useState, useEffect, useCallback } from "react";
import MannequinChart from "@/components/client/MannequinChart";
import {
  LineChart,
  Line,
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

type ChartKey = keyof Regions | "weight" | "height";

const extraLabels: Record<"weight" | "height", string> = {
  weight: "Kilo",
  height: "Boy",
};

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<ChartKey>("waist");
  const [profileWeight, setProfileWeight] = useState<number | null>(null);
  const [profileHeight, setProfileHeight] = useState<number | null>(null);

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

  // Find the most recent measurement that has a non-null weight/height
  const latestWeight = (() => {
    for (let i = measurements.length - 1; i >= 0; i--) {
      if (measurements[i].weight != null) return measurements[i].weight;
    }
    return profileWeight;
  })();

  const latestHeight = (() => {
    for (let i = measurements.length - 1; i >= 0; i--) {
      if (measurements[i].height != null) return measurements[i].height;
    }
    return profileHeight;
  })();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            📏 Vücut Ölçüm Takibi
          </h2>
          <div className="bg-emerald-50 rounded-lg px-4 py-2 border border-emerald-100">
            <p className="text-xs text-emerald-600">
              ℹ️ Ölçümler diyetisyeniniz tarafından girilmektedir
            </p>
          </div>
        </div>

        {/* Weight & Height summary */}
        {(latestWeight != null || latestHeight != null) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl">
                ⚖️
              </div>
              <div>
                <p className="text-xs text-gray-500">Son Kilo</p>
                <p className="text-2xl font-bold text-gray-900">
                  {latestWeight != null ? `${latestWeight} kg` : "—"}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-xl">
                📏
              </div>
              <div>
                <p className="text-xs text-gray-500">Boy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {latestHeight != null ? `${latestHeight} cm` : "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mannequin Chart */}
        <MannequinChart regions={regions} />

        {/* Region selector & chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-6">
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium text-gray-700">
              Bölge Seçin:
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as ChartKey)}
              className="select-modern"
            >
              <optgroup label="Kilo & Boy">
                {Object.entries(extraLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Vücut Bölgeleri">
                {Object.entries(regionLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
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
              Henüz ölçüm verisi bulunmuyor.
            </p>
          )}
        </div>

        {/* History list */}
        <div className="bg-white rounded-xl p-6 shadow-sm mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Geçmiş Ölçümler</h3>
          {measurements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500">Tarih</th>
                    <th className="text-center py-2 text-gray-500">Kilo</th>
                    <th className="text-center py-2 text-gray-500">Boy</th>
                    {Object.values(regionLabels).map((label) => (
                      <th
                        key={label}
                        className="text-center py-2 text-gray-500"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...measurements].reverse().map((m) => (
                    <tr key={m._id} className="border-b border-gray-50">
                      <td className="py-2 text-gray-700">
                        {new Date(m.date).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="text-center py-2 text-blue-600 font-medium">
                        {m.weight != null ? `${m.weight}kg` : "—"}
                      </td>
                      <td className="text-center py-2 text-emerald-600 font-medium">
                        {m.height != null ? `${m.height}cm` : "—"}
                      </td>
                      {(Object.keys(regionLabels) as (keyof Regions)[]).map(
                        (key) => (
                          <td
                            key={key}
                            className="text-center py-2 text-gray-600"
                          >
                            {m.regions[key]}cm
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Henüz ölçüm kaydı yok.</p>
          )}
        </div>
      </div>
    </div>
  );
}
