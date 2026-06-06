"use client";

interface CalorieBarProps {
  current: number;
  target: number;
  burned?: number;
}

export default function CalorieBar({ current, target, burned = 0 }: CalorieBarProps) {
  const netCalories = Math.max(current - burned, 0);
  const adjustedTarget = target + burned;
  const percentage = Math.min((netCalories / adjustedTarget) * 100, 100);
  const remaining = Math.max(adjustedTarget - netCalories, 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 mb-2">
        Günlük Kalori
      </h3>
      <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
        <div
          className="bg-emerald-500 h-4 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-end justify-between">
        <p className="text-lg font-bold text-gray-900">
          {netCalories}{" "}
          <span className="text-gray-400 font-normal text-sm">
            / {adjustedTarget} kcal
          </span>
        </p>
        <p className="text-xs text-gray-400">{remaining} kcal kaldı</p>
      </div>
      {burned > 0 && (
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
          <span>
            🍽️ Alınan:{" "}
            <span className="font-semibold text-gray-700">{current} kcal</span>
          </span>
          <span>
            🔥 Yakılan:{" "}
            <span className="font-semibold text-orange-500">−{burned} kcal</span>
          </span>
        </div>
      )}
    </div>
  );
}
