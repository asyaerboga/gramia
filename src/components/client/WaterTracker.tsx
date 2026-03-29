"use client";

import { useState } from "react";

interface WaterTrackerProps {
  current: number;
  target: number;
  onUpdate: (amount: number) => void;
}

export default function WaterTracker({
  current,
  target,
  onUpdate,
}: WaterTrackerProps) {
  const [input, setInput] = useState("");
  const percentage = Math.min((current / target) * 100, 100);

  const handleAdd = () => {
    const val = parseFloat(input);
    if (val > 0) {
      onUpdate(val);
      setInput("");
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 mb-2">
        💧 Su Tüketimi
      </h3>
      <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
        <div
          className="bg-blue-400 h-4 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-lg font-bold text-gray-900 mb-3">
        {current}L <span className="text-gray-400 font-normal">/ {target}L</span>
      </p>
      <div className="flex gap-2">
        <input
          type="number"
          step="0.1"
          min="0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Litre"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-400 text-white rounded-lg text-sm hover:bg-blue-500 transition"
        >
          Ekle
        </button>
      </div>
    </div>
  );
}
