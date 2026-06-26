"use client";

interface GoalProgressBarProps {
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
}

const getMotivation = (pct: number) => {
  if (pct < 10) return { text: "Yolculuk başladı! 🚀", color: "text-blue-500" };
  if (pct < 30) return { text: "Harika gidiyorsun! 💪", color: "text-emerald-600" };
  if (pct < 50) return { text: "Yarıya yaklaşıyorsun! 🔥", color: "text-orange-500" };
  if (pct < 75) return { text: "Yarı yoldasın! ⚡", color: "text-violet-600" };
  if (pct < 90) return { text: "Neredeyse orada! 🌟", color: "text-amber-600" };
  return { text: "Son adımlar! 🎯", color: "text-red-500" };
};

export default function GoalProgressBar({
  startWeight,
  currentWeight,
  targetWeight,
}: GoalProgressBarProps) {
  const isGain = targetWeight > startWeight;
  const totalChange = startWeight - targetWeight;
  const change = startWeight - currentWeight;
  const percentage =
    totalChange !== 0
      ? Math.min(Math.max((change / totalChange) * 100, 0), 100)
      : 0;
  const remaining = Math.max(
    0,
    isGain ? targetWeight - currentWeight : currentWeight - targetWeight
  );
  const lost = Math.max(
    0,
    isGain ? currentWeight - startWeight : startWeight - currentWeight
  );
  const isCompleted = isGain
    ? totalChange !== 0 && currentWeight >= targetWeight
    : totalChange > 0 && currentWeight <= targetWeight;
  const motivation = getMotivation(percentage);
  const lostLabel = isGain ? "alındı" : "verildi";
  const lostIcon = isGain ? "📈" : "📉";

  if (isCompleted) {
    return (
      <div className="relative overflow-hidden bg-linear-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-2xl p-6 text-white text-center shadow-lg shadow-emerald-300/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="relative">
          <div className="text-6xl mb-3 inline-block animate-bounce">🏆</div>
          <h4 className="text-xl font-black mb-1">Hedefe Ulaştın!</h4>
          <p className="text-emerald-100 text-sm mb-4">
            {startWeight} kg → {currentWeight} kg · {lost.toFixed(1)} kg {isGain ? "aldın" : "verdin"}
          </p>
          <div className="bg-white/20 rounded-full h-3 w-full overflow-hidden">
            <div className="bg-white h-3 rounded-full w-full shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
          </div>
          <p className="text-white/80 text-xs mt-2 font-bold">%100 Tamamlandı 🎉</p>
        </div>
      </div>
    );
  }

  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;

  return (
    <div className="space-y-3">
      {/* Main card */}
      <div className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100 rounded-2xl p-5">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at ${percentage}% 100%, rgba(16,185,129,0.12), transparent 60%)`,
          }}
        />

        <div className="relative flex items-center gap-4">
          {/* SVG ring */}
          <div className="relative shrink-0">
            <svg width="90" height="90" viewBox="0 0 90 90" className="-rotate-90">
              <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="7" />
              <circle
                cx="45" cy="45" r={r}
                fill="none"
                stroke="url(#gpGrad)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
              />
              <defs>
                <linearGradient id="gpGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-emerald-700 leading-none">{Math.round(percentage)}%</span>
              <span className="text-[10px] text-teal-500 font-semibold tracking-wide">tamam</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold mb-2.5 ${motivation.color}`}>{motivation.text}</p>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-white/70 border border-gray-100 rounded-xl p-2 text-center shadow-sm">
                <p className="text-gray-700 text-sm font-black leading-none">{startWeight}</p>
                <p className="text-gray-400 text-[10px] mt-0.5 leading-tight">başlangıç</p>
              </div>
              <div className="bg-emerald-500 rounded-xl p-2 text-center shadow-md shadow-emerald-200">
                <p className="text-white text-sm font-black leading-none">{currentWeight}</p>
                <p className="text-emerald-100 text-[10px] mt-0.5 leading-tight">şimdi</p>
              </div>
              <div className="bg-white/70 border border-gray-100 rounded-xl p-2 text-center shadow-sm">
                <p className="text-gray-700 text-sm font-black leading-none">{targetWeight}</p>
                <p className="text-gray-400 text-[10px] mt-0.5 leading-tight">hedef</p>
              </div>
            </div>
          </div>
        </div>

        {/* Track */}
        <div className="relative mt-4 pb-5">
          <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${percentage}%`,
                background: "linear-gradient(90deg, #10b981, #06b6d4)",
                boxShadow: "0 0 8px rgba(16,185,129,0.4)",
              }}
            />
          </div>
          <div
            className="absolute -top-2 text-xl transition-all duration-1000"
            style={{ left: `calc(${Math.min(percentage, 94)}% - 10px)` }}
          >
            🏃
          </div>
          <div className="absolute left-0 bottom-0 text-[10px] text-gray-400 font-semibold">{startWeight} kg</div>
          <div className="absolute right-0 bottom-0 text-[10px] text-gray-400 font-semibold">{targetWeight} kg</div>
        </div>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5">
          <span className="text-2xl">{lostIcon}</span>
          <div>
            <p className="text-base font-black text-emerald-700 leading-none">{lost.toFixed(1)} kg</p>
            <p className="text-xs text-emerald-500 mt-0.5">{lostLabel}</p>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2.5">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-base font-black text-orange-700 leading-none">{remaining.toFixed(1)} kg</p>
            <p className="text-xs text-orange-500 mt-0.5">kaldı</p>
          </div>
        </div>
      </div>
    </div>
  );
}
