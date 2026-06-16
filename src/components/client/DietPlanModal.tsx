"use client";

import { useState } from "react";

interface MealPlanItem {
  name: string;
  portion: string;
  calories: number;
}

interface DayPlan {
  breakfast: MealPlanItem[];
  lunch: MealPlanItem[];
  dinner: MealPlanItem[];
  snacks: MealPlanItem[];
}

interface DietPlan {
  _id: string;
  name: string;
  planType: "weekly" | "monthly" | "general";
  targetCalories: number;
  startDate?: string;
  weeklyPlan: {
    monday: DayPlan;
    tuesday: DayPlan;
    wednesday: DayPlan;
    thursday: DayPlan;
    friday: DayPlan;
    saturday: DayPlan;
    sunday: DayPlan;
  };
}

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
type DayKey = (typeof DAY_KEYS)[number];

const DAY_SHORT: Record<DayKey, string> = {
  monday: "Pzt", tuesday: "Sal", wednesday: "Çar", thursday: "Per",
  friday: "Cum", saturday: "Cmt", sunday: "Paz",
};
const DAY_LONG: Record<DayKey, string> = {
  monday: "Pazartesi", tuesday: "Salı", wednesday: "Çarşamba", thursday: "Perşembe",
  friday: "Cuma", saturday: "Cumartesi", sunday: "Pazar",
};

const MEAL_KEYS = ["breakfast", "lunch", "dinner", "snacks"] as const;
type MealKey = (typeof MEAL_KEYS)[number];

const MEAL_META: Record<MealKey, { label: string; icon: string; color: string; bg: string; border: string; tag: string }> = {
  breakfast: { label: "Kahvaltı",  icon: "🌅", color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200", tag: "bg-amber-100 text-amber-700" },
  lunch:     { label: "Öğle",      icon: "☀️", color: "text-sky-700",    bg: "bg-sky-50",    border: "border-sky-200",   tag: "bg-sky-100 text-sky-700"   },
  dinner:    { label: "Akşam",     icon: "🌙", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", tag: "bg-violet-100 text-violet-700" },
  snacks:    { label: "Ara Öğün",  icon: "🍎", color: "text-rose-700",   bg: "bg-rose-50",   border: "border-rose-200",  tag: "bg-rose-100 text-rose-700" },
};

const MEAL_KEY_TO_LOG_TYPE: Record<MealKey, string> = {
  breakfast: "breakfast",
  lunch: "lunch",
  dinner: "dinner",
  snacks: "snack",
};

const MEAL_TYPE_PICKER = [
  { key: "breakfast", label: "Kahvaltı", icon: "🌅" },
  { key: "lunch",     label: "Öğle",     icon: "☀️" },
  { key: "dinner",    label: "Akşam",    icon: "🌙" },
  { key: "snack",     label: "Ara Öğün", icon: "🍎" },
] as const;

const PLAN_TYPE_META = {
  weekly:  { icon: "📅", label: "Haftalık" },
  monthly: { icon: "📆", label: "Aylık" },
  general: { icon: "✨", label: "Genel" },
};

function getTodayKey(): DayKey {
  const map: DayKey[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return map[new Date().getDay()];
}

function getDateDayKey(dateStr: string): DayKey {
  const map: DayKey[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return map[new Date(dateStr + "T12:00:00").getDay()];
}

const EMPTY_DAY_PLAN = { breakfast: [], lunch: [], dinner: [], snacks: [] } as const;

interface Props {
  plan: DietPlan;
  onClose: () => void;
  onAddToLog: (mealType: string, items: { name: string; calories: number }[]) => void;
  currentDate?: string;
}

export default function DietPlanModal({ plan, onClose, onAddToLog, currentDate }: Props) {
  const [selectedDay, setSelectedDay] = useState<DayKey>(
    currentDate ? getDateDayKey(currentDate) : getTodayKey()
  );
  const [openMeal, setOpenMeal] = useState<MealKey | null>("breakfast");
  const [activePicker, setActivePicker] = useState<number | null>(null);

  const isGeneral = plan.planType === "general";
  const generalItems = plan.weeklyPlan.monday?.breakfast ?? [];

  const dayCalories = (day: DayKey) =>
    MEAL_KEYS.flatMap((k) => plan.weeklyPlan[day]?.[k] ?? []).reduce((s, i) => s + i.calories, 0);

  const activeDayPlan = plan.weeklyPlan[selectedDay] ?? EMPTY_DAY_PLAN;
  const selectedDayCal = isGeneral
    ? generalItems.reduce((s, i) => s + i.calories, 0)
    : dayCalories(selectedDay);
  const calPct = Math.min(100, Math.round((selectedDayCal / plan.targetCalories) * 100));
  const generalTotalCal = generalItems.reduce((s, i) => s + i.calories, 0);
  const generalPct = Math.min(100, Math.round((generalTotalCal / plan.targetCalories) * 100));

  const planMeta = PLAN_TYPE_META[plan.planType];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-3xl shadow-2xl sm:max-w-2xl max-h-[96dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">

        {/* Gradient header */}
        <div className="relative bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-500 px-6 pt-6 pb-5 shrink-0">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-emerald-100 text-xs font-semibold uppercase tracking-widest">Yemek Listesi</p>
                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {planMeta.icon} {planMeta.label}
                </span>
              </div>
              <p className="text-xl font-bold text-white">{plan.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors text-xl mt-0.5 shrink-0"
            >
              ×
            </button>
          </div>

          <div className="relative flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
              <span className="text-white/70 text-xs">🎯 Hedef kalori</span>
              <span className="text-white font-bold text-sm">{plan.targetCalories}</span>
              <span className="text-white/70 text-xs">kcal</span>
            </div>
            {plan.startDate && !isGeneral && (
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
                <span className="text-white/70 text-xs">📅 Başlangıç</span>
                <span className="text-white text-xs font-medium">
                  {plan.startDate.split("-").reverse().join(".")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ══ GENEL ══ */}
          {isGeneral && (
            <div className="px-6 pb-6 space-y-4 pt-4">
              {/* Kalori özeti */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">🎯 Hedef kalori</span>
                  <span className="text-sm font-bold text-emerald-700">{plan.targetCalories} kcal</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Toplam öneri</span>
                  <span className="text-sm font-bold text-gray-900">{generalTotalCal} kcal</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${generalPct >= 100 ? "bg-rose-400" : generalPct >= 80 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${generalPct}%` }}
                  />
                </div>
              </div>

              {generalItems.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl mb-3">🥗</div>
                  <p className="text-sm font-medium text-gray-400">Henüz öneri eklenmemiş</p>
                </div>
              ) : (
                <>
                  {/* Tümünü ekle */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Günlük Öneriler</p>
                    <button
                      onClick={() => { onAddToLog("breakfast", generalItems.map((i) => ({ name: i.name, calories: i.calories }))); onClose(); }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Tümünü Ekle
                    </button>
                  </div>

                  <div className="space-y-2">
                    {generalItems.map((item, i) => (
                      <div key={i} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-sm shrink-0">🥗</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.portion}</p>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">{item.calories} kcal</span>
                          <button
                            onClick={() => setActivePicker(activePicker === i ? null : i)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 ${activePicker === i ? "bg-gray-200 text-gray-600" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
                          >
                            {activePicker === i ? "İptal" : "Ekle"}
                          </button>
                        </div>
                        {activePicker === i && (
                          <div className="flex gap-1.5 mt-3 flex-wrap">
                            {MEAL_TYPE_PICKER.map((mt) => (
                              <button
                                key={mt.key}
                                onClick={() => { onAddToLog(mt.key, [{ name: item.name, calories: item.calories }]); setActivePicker(null); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm"
                              >
                                {mt.icon} {mt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ HAFTALIK / AYLIK ══ */}
          {!isGeneral && (
            <div className="pb-6">
              {/* Gün seçici — her zaman 7 gün göster */}
              <div className="px-6 pt-4 pb-3">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {DAY_KEYS.map((day) => {
                    const cal = dayCalories(day);
                    const hasItems = MEAL_KEYS.some((k) => (plan.weeklyPlan[day]?.[k]?.length ?? 0) > 0);
                    const pct = Math.min(100, Math.round((cal / plan.targetCalories) * 100));
                    const isActive = selectedDay === day;
                    return (
                      <button
                        key={day}
                        onClick={() => { setSelectedDay(day); setOpenMeal("breakfast"); }}
                        className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border-2 transition-all shrink-0 ${
                          isActive
                            ? "border-emerald-400 bg-emerald-50 shadow-sm"
                            : hasItems
                              ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300"
                              : "border-gray-100 bg-white hover:border-gray-200"
                        }`}
                      >
                        <span className={`text-xs font-bold ${isActive ? "text-emerald-700" : "text-gray-600"}`}>{DAY_SHORT[day]}</span>
                        {hasItems ? (
                          <div className="w-6 h-1 rounded-full bg-gray-200 overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 100 ? "bg-rose-400" : "bg-emerald-400"}`} style={{ width: `${pct}%` }} />
                          </div>
                        ) : (
                          <div className="w-4 h-1 rounded-full bg-gray-100" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Seçili gün başlığı + kalori bar */}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-800">{DAY_LONG[selectedDay]}</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${calPct >= 100 ? "bg-rose-400" : calPct >= 80 ? "bg-amber-400" : "bg-emerald-400"}`}
                        style={{ width: `${calPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500">{selectedDayCal} / {plan.targetCalories} kcal</span>
                  </div>
                </div>
              </div>

              {/* Öğün kartları — her zaman 4 öğün göster */}
              <div className="px-6 space-y-3">
                {MEAL_KEYS.map((mealKey) => {
                  const meta = MEAL_META[mealKey];
                  const items = activeDayPlan[mealKey] ?? [];
                  const mealCal = items.reduce((s, i) => s + i.calories, 0);
                  const isOpen = openMeal === mealKey;
                  const logType = MEAL_KEY_TO_LOG_TYPE[mealKey];

                  return (
                    <div key={mealKey} className={`rounded-2xl border-2 overflow-hidden transition-all ${isOpen ? meta.border : "border-gray-100"}`}>
                      {/* Öğün başlık satırı */}
                      <button
                        onClick={() => setOpenMeal(isOpen ? null : mealKey)}
                        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${isOpen ? meta.bg : "bg-white hover:bg-gray-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{meta.icon}</span>
                          <span className={`text-sm font-bold ${isOpen ? meta.color : "text-gray-700"}`}>{meta.label}</span>
                          {items.length > 0 && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.tag}`}>
                              {items.length} yemek · {mealCal} kcal
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isOpen && items.length > 0 && (
                            <span
                              role="button"
                              onClick={(e) => { e.stopPropagation(); onAddToLog(logType, items.map((i) => ({ name: i.name, calories: i.calories }))); }}
                              className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors"
                            >
                              Tümünü Ekle
                            </span>
                          )}
                          <span className={`text-gray-400 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="p-4 space-y-2 bg-white">
                          {items.length === 0 ? (
                            <div className="flex flex-col items-center py-6 text-center">
                              <p className="text-2xl mb-2">🍽️</p>
                              <p className="text-xs text-gray-400">Bu öğün için öneri yok</p>
                            </div>
                          ) : (
                            items.map((item, i) => (
                              <div key={i} className={`flex items-center gap-3 ${meta.bg} rounded-xl px-3 py-2.5`}>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-gray-800">{item.name}</span>
                                  <span className="text-xs text-gray-400 ml-2">({item.portion})</span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${meta.tag} shrink-0`}>{item.calories} kcal</span>
                                <button
                                  onClick={() => onAddToLog(logType, [{ name: item.name, calories: item.calories }])}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                                >
                                  Ekle
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
