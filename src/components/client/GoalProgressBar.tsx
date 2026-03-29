"use client";

interface GoalProgressBarProps {
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
}

export default function GoalProgressBar({
  startWeight,
  currentWeight,
  targetWeight,
}: GoalProgressBarProps) {
  const totalToLose = startWeight - targetWeight;
  const lost = startWeight - currentWeight;
  const percentage = totalToLose > 0 ? Math.min((lost / totalToLose) * 100, 100) : 0;
  const remaining = currentWeight - targetWeight;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 mb-3">
        🎯 Hedef Kilo İlerlemesi
      </h3>
      <div className="flex justify-between text-sm text-gray-500 mb-1">
        <span>Başlangıç: {startWeight}kg</span>
        <span>Hedef: {targetWeight}kg</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-5 mb-2 relative">
        <div
          className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-5 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-emerald-600 rounded-full shadow"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between">
        <p className="text-sm text-gray-700">
          Güncel: <span className="font-bold">{currentWeight}kg</span>
        </p>
        <p className="text-sm text-gray-500">
          Kalan: <span className="font-semibold text-emerald-600">{remaining > 0 ? remaining : 0}kg</span>
        </p>
      </div>
    </div>
  );
}
