"use client";

interface CalorieBarProps {
  current: number;
  target: number;
}

export default function CalorieBar({ current, target }: CalorieBarProps) {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 mb-2">
        Günlük Kalori
      </h3>
      <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
        <div
          className="bg-emerald-500 h-4 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-lg font-bold text-gray-900">
        {current} <span className="text-gray-400 font-normal">/ {target} kcal</span>
      </p>
    </div>
  );
}
