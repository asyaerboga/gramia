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
  const totalChange = startWeight - targetWeight;
  const change = startWeight - currentWeight;
  const percentage =
    totalChange !== 0
      ? Math.min(Math.max((change / totalChange) * 100, 0), 100)
      : 0;
  const remaining = Math.max(0, currentWeight - targetWeight);
  const isCompleted = totalChange > 0 && currentWeight <= targetWeight;

  if (isCompleted) {
    return (
      <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200 text-center">
        <div className="text-5xl mb-3">🏆</div>
        <h4 className="text-lg font-bold text-emerald-700 mb-1">Hedefe Ulaştın!</h4>
        <p className="text-sm text-emerald-600 mb-4">
          {startWeight} kg → {currentWeight} kg — {(startWeight - currentWeight).toFixed(1)} kg verdin
        </p>
        <div className="w-full bg-emerald-100 rounded-full h-4 relative overflow-hidden">
          <div className="bg-linear-to-r from-emerald-400 to-teal-500 h-4 rounded-full w-full" />
        </div>
        <p className="text-xs text-emerald-500 mt-2 font-medium">%100 Tamamlandı 🎉</p>
      </div>
    );
  }

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
          className="bg-linear-to-r from-emerald-400 to-emerald-600 h-5 rounded-full transition-all duration-500"
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
          Kalan: <span className="font-semibold text-emerald-600">{remaining > 0 ? remaining.toFixed(1) : 0}kg</span>
        </p>
      </div>
    </div>
  );
}
