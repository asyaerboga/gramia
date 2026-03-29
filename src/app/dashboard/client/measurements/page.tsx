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

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<keyof Regions>("waist");

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

  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

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
