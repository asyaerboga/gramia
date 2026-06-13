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
  const isOver = netCalories > adjustedTarget;

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-6">
      {/* Donut ring */}
      <div className="relative shrink-0">
        <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="14" />
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={isOver ? "#ef4444" : "url(#cal-grad)"}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
          <defs>
            <linearGradient id="cal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-gray-900">{Math.round(percentage)}%</span>
          <span className="text-xs text-gray-400 leading-tight">tüketildi</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex-1 space-y-2">
        <div>
          <p className="text-3xl font-bold text-gray-900 leading-none">{netCalories}</p>
          <p className="text-sm text-gray-400 mt-0.5">/ {adjustedTarget} kcal</p>
        </div>
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-gray-500">Alınan</span>
            </div>
            <span className="text-sm font-semibold text-gray-800">{current} kcal</span>
          </div>
          {burned > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                <span className="text-xs text-gray-500">Yakılan</span>
              </div>
              <span className="text-sm font-semibold text-orange-500">−{burned} kcal</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-xs text-gray-500">Kalan</span>
            </div>
            <span className="text-sm font-semibold text-gray-700">{remaining} kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
