"use client";

import { useState } from "react";

interface WaterTrackerProps {
  current: number;
  target: number;
  onUpdate: (amount: number) => void;
}

export default function WaterTracker({ current, target, onUpdate }: WaterTrackerProps) {
  const [input, setInput] = useState("");
  const percentage = Math.min((current / target) * 100, 100);

  const getMessage = () => {
    if (percentage === 0) return "Susamadan için! 🌊";
    if (percentage < 30) return "Devam et, iyi başlangıç!";
    if (percentage < 60) return "Harika ilerliyorsun!";
    if (percentage < 90) return "Az kaldı, neredeyse tam!";
    if (percentage < 100) return "Son düzlükteysin! 💪";
    return "Günlük hedefe ulaştın! 🎉";
  };

  const handleCustomAdd = () => {
    const val = parseFloat(input);
    if (val > 0) {
      onUpdate(val);
      setInput("");
    }
  };

  const totalDrops = 8;
  const filledDrops = Math.round((percentage / 100) * totalDrops);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Water glass visual */}
      <div className="relative w-24 h-44 mx-auto">
        <div className="absolute inset-0 rounded-b-3xl rounded-t-2xl border-2 border-blue-200 bg-blue-50/40 overflow-hidden">
          {/* Water fill rising from bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
            style={{
              height: `${percentage}%`,
              background:
                percentage >= 100
                  ? "linear-gradient(to top, #1d4ed8, #3b82f6, #93c5fd)"
                  : "linear-gradient(to top, #1e40af, #3b82f6, #bfdbfe)",
            }}
          >
            {/* Water surface ripple */}
            <div className="absolute -top-2 left-0 right-0 h-4 rounded-full opacity-40"
              style={{ background: "radial-gradient(ellipse at center, #93c5fd 0%, transparent 70%)" }}
            />
          </div>
          {/* Glass shine */}
          <div className="absolute top-3 right-2 w-1 h-10 bg-white/60 rounded-full" />
          <div className="absolute top-3 right-4 w-0.5 h-5 bg-white/30 rounded-full" />
          {/* Percentage overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xl font-black text-blue-700 drop-shadow">
              {Math.round(percentage)}%
            </p>
          </div>
        </div>
        {/* Glass rim */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-blue-200/70 rounded-t-2xl" />
      </div>

      {/* Amount display */}
      <div className="text-center -mt-1">
        <p className="text-2xl font-bold text-gray-900">
          {current}
          <span className="text-sm font-normal text-gray-400 ml-1">L</span>
        </p>
        <p className="text-xs text-gray-400">/ {target}L hedef</p>
        <p className="text-xs font-semibold text-blue-500 mt-1">{getMessage()}</p>
      </div>

      {/* Droplet progress bar */}
      <div className="flex gap-1">
        {Array.from({ length: totalDrops }).map((_, i) => (
          <span
            key={i}
            className="text-base transition-all duration-300"
            style={{ opacity: i < filledDrops ? 1 : 0.18 }}
          >
            💧
          </span>
        ))}
      </div>

      {/* Quick-add preset buttons */}
      <div className="flex gap-2 w-full">
        {[0.25, 0.5, 1].map((amount) => (
          <button
            key={amount}
            onClick={() => onUpdate(amount)}
            className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-linear-to-b from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200 border border-blue-200 transition-all active:scale-95"
          >
            +{amount}L
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex gap-2 w-full">
        <input
          type="number"
          step="0.1"
          min="0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleCustomAdd(); }}
          placeholder="Özel miktar (L)"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-900 bg-white"
        />
        <button
          onClick={handleCustomAdd}
          className="px-4 py-2 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm hover:from-blue-600 hover:to-blue-700 transition font-semibold shadow-md shadow-blue-200"
        >
          Ekle
        </button>
      </div>
    </div>
  );
}
