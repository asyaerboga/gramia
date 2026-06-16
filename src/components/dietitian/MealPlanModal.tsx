"use client";

import { useState, useMemo } from "react";
import { quickFoodCategories, ALL_KEY, CATEGORY_KEYS, type QuickFood } from "@/lib/quickFoods";

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

interface WeeklyPlan {
  monday: DayPlan;
  tuesday: DayPlan;
  wednesday: DayPlan;
  thursday: DayPlan;
  friday: DayPlan;
  saturday: DayPlan;
  sunday: DayPlan;
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
  dinner:    { label: "Akşam",     icon: "🌙", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200",tag: "bg-violet-100 text-violet-700"},
  snacks:    { label: "Ara Öğün",  icon: "🍎", color: "text-rose-700",   bg: "bg-rose-50",   border: "border-rose-200",  tag: "bg-rose-100 text-rose-700" },
};

const PLAN_TYPES = [
  { key: "weekly",  icon: "📅", title: "Haftalık", desc: "Her gün farklı öğün listesi" },
  { key: "monthly", icon: "📆", title: "Aylık",    desc: "Haftalık şablon 4 hafta tekrar" },
  { key: "general", icon: "✨", title: "Genel",    desc: "Tek liste, her gün geçerli" },
] as const;

type NewItemState = Record<MealKey, { name: string; portion: string; calories: string }>;

function emptyDay(): DayPlan { return { breakfast: [], lunch: [], dinner: [], snacks: [] }; }
function emptyWeeklyPlan(): WeeklyPlan {
  return { monday: emptyDay(), tuesday: emptyDay(), wednesday: emptyDay(), thursday: emptyDay(), friday: emptyDay(), saturday: emptyDay(), sunday: emptyDay() };
}
function emptyNewItemState(): NewItemState {
  return { breakfast: { name: "", portion: "", calories: "" }, lunch: { name: "", portion: "", calories: "" }, dinner: { name: "", portion: "", calories: "" }, snacks: { name: "", portion: "", calories: "" } };
}

function portionFromFood(foodName: string): string {
  const match = foodName.match(/\(([^)]+)\)$/);
  if (!match) return "1 porsiyon";
  const inner = match[1];
  if (inner.includes(",")) return inner.split(",").pop()!.trim();
  return inner;
}

function QuickFoodPanel({ onSelect }: { onSelect: (food: QuickFood) => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL_KEY);

  const allFoods = useMemo(() => CATEGORY_KEYS.flatMap((k) => quickFoodCategories[k]), []);

  const displayed = useMemo(() => {
    const base = category === ALL_KEY ? allFoods : (quickFoodCategories[category] ?? []);
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((f) => f.name.toLowerCase().includes(q));
  }, [category, search, allFoods]);

  return (
    <div className="pt-3 border-t border-gray-100">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        ⚡ Hızlı Seçim
        <span className="ml-auto text-gray-300 font-medium normal-case tracking-normal">Tıkla → anında ekle</span>
      </p>
      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setCategory(ALL_KEY); }}
        placeholder="Yemek ara… (örn: tavuk, elma)"
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs mb-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:bg-white transition-colors"
      />
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none mb-2">
        {[ALL_KEY, ...CATEGORY_KEYS].map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setSearch(""); }}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
              category === cat
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="max-h-40 overflow-y-auto space-y-0.5">
        {displayed.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">Sonuç bulunamadı</p>
        ) : (
          displayed.map((food) => (
            <button
              key={food.name}
              onClick={() => onSelect(food)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-emerald-50 transition-colors group"
            >
              <span className="text-xs text-gray-700 truncate flex-1 group-hover:text-gray-900">{food.name}</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg shrink-0 ml-2 group-hover:bg-emerald-100">{food.calories} kcal</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

interface Props { clientId: string; onClose: () => void; onSaved: () => void; }

export default function MealPlanModal({ clientId, onClose, onSaved }: Props) {
  const [planType, setPlanType] = useState<"weekly" | "monthly" | "general">("weekly");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [targetCalories, setTargetCalories] = useState(2000);

  const [selectedDay, setSelectedDay] = useState<DayKey>("monday");
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(emptyWeeklyPlan);
  const [newItem, setNewItem] = useState<NewItemState>(emptyNewItemState);
  const [openMeal, setOpenMeal] = useState<MealKey | null>("breakfast");

  const [generalItems, setGeneralItems] = useState<MealPlanItem[]>([]);
  const [generalNew, setGeneralNew] = useState({ name: "", portion: "", calories: "" });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [planId, setPlanId] = useState<string | null>(null);
  const [savingDay, setSavingDay] = useState(false);
  const [savedDay, setSavedDay] = useState<DayKey | null>(null);

  const autoName = { weekly: "Haftalık Beslenme Planı", monthly: "Aylık Beslenme Planı", general: "Genel Beslenme Planı" }[planType];

  // ── helpers ──────────────────────────────────────────────────────────────

  const addWeeklyItem = (mealKey: MealKey) => {
    const item = newItem[mealKey];
    if (!item.name.trim() || !item.calories) return;
    setWeeklyPlan((prev) => ({
      ...prev,
      [selectedDay]: { ...prev[selectedDay], [mealKey]: [...prev[selectedDay][mealKey], { name: item.name.trim(), portion: item.portion.trim() || "1 porsiyon", calories: Number(item.calories) }] },
    }));
    setNewItem((prev) => ({ ...prev, [mealKey]: { name: "", portion: "", calories: "" } }));
  };

  const addWeeklyItemFromQuick = (mealKey: MealKey, food: QuickFood) => {
    setWeeklyPlan((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [mealKey]: [...prev[selectedDay][mealKey], {
          name: food.name,
          portion: portionFromFood(food.name),
          calories: food.calories,
        }],
      },
    }));
  };

  const removeWeeklyItem = (mealKey: MealKey, i: number) => {
    setWeeklyPlan((prev) => ({
      ...prev,
      [selectedDay]: { ...prev[selectedDay], [mealKey]: prev[selectedDay][mealKey].filter((_, idx) => idx !== i) },
    }));
  };

  const addGeneralItemFromQuick = (food: QuickFood) => {
    setGeneralItems((prev) => [...prev, {
      name: food.name,
      portion: portionFromFood(food.name),
      calories: food.calories,
    }]);
  };

  const addGeneralItem = () => {
    if (!generalNew.name.trim() || !generalNew.calories) return;
    setGeneralItems((prev) => [...prev, { name: generalNew.name.trim(), portion: generalNew.portion.trim() || "1 porsiyon", calories: Number(generalNew.calories) }]);
    setGeneralNew({ name: "", portion: "", calories: "" });
  };

  const removeGeneralItem = (i: number) => setGeneralItems((prev) => prev.filter((_, idx) => idx !== i));

  const handleSaveDay = async (day: DayKey) => {
    setSavingDay(true); setError(null);
    try {
      let pid = planId;
      if (!pid) {
        const endDate = planType === "monthly"
          ? new Date(new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          : new Date(new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const res = await fetch("/api/diet-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, name: autoName, planType, startDate, endDate, targetCalories: targetCalories || 2000, weeklyPlan }),
        });
        if (!res.ok) { const d = await res.json(); setError((d as { error?: string }).error ?? "Sunucu hatası"); return; }
        const created = await res.json() as { _id: string };
        pid = created._id;
        setPlanId(pid);
      } else {
        const res = await fetch("/api/diet-plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: pid, weeklyPlan }),
        });
        if (!res.ok) { const d = await res.json(); setError((d as { error?: string }).error ?? "Sunucu hatası"); return; }
      }
      setSavedDay(day);
      setTimeout(() => setSavedDay(null), 2000);
      onSaved();
    } catch { setError("Sunucu hatası"); } finally { setSavingDay(false); }
  };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const endDate = planType === "monthly"
        ? new Date(new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : planType === "weekly"
          ? new Date(new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          : undefined;

      const generalDay: DayPlan = { breakfast: generalItems, lunch: [], dinner: [], snacks: [] };
      const savedWeeklyPlan = planType === "general"
        ? { monday: generalDay, tuesday: generalDay, wednesday: generalDay, thursday: generalDay, friday: generalDay, saturday: generalDay, sunday: generalDay }
        : weeklyPlan;

      if (planId) {
        const res = await fetch("/api/diet-plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, weeklyPlan: savedWeeklyPlan }),
        });
        if (!res.ok) { const d = await res.json(); setError((d as { error?: string }).error ?? "Sunucu hatası"); return; }
      } else {
        const res = await fetch("/api/diet-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, name: autoName, planType, startDate, endDate, targetCalories: targetCalories || 2000, weeklyPlan: savedWeeklyPlan }),
        });
        if (!res.ok) { const d = await res.json(); setError((d as { error?: string }).error ?? "Sunucu hatası"); return; }
      }
      onSaved(); onClose();
    } catch { setError("Sunucu hatası"); } finally { setSaving(false); }
  };

  const dayItemCount = (day: DayKey) => Object.values(weeklyPlan[day]).reduce((s, a) => s + a.length, 0);
  const dayCalories = (day: DayKey) => Object.values(weeklyPlan[day]).flat().reduce((s, i) => s + i.calories, 0);
  const selectedDayCal = dayCalories(selectedDay);
  const calPct = Math.min(100, Math.round((selectedDayCal / targetCalories) * 100));
  const generalTotalCal = generalItems.reduce((s, i) => s + i.calories, 0);
  const generalPct = Math.min(100, Math.round((generalTotalCal / targetCalories) * 100));

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-3xl shadow-2xl sm:max-w-2xl max-h-[96dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Gradient header ── */}
        <div className="relative bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-500 px-6 pt-6 pb-5 shrink-0">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-widest mb-1">Yemek Listesi</p>
              <p className="text-xl font-bold text-white">{autoName}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors text-xl mt-0.5 shrink-0">×</button>
          </div>

          {/* Kalori hedefi satırı */}
          <div className="relative flex items-center gap-3 mt-4">
            {planType !== "general" && (
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5 ring-1 ring-transparent hover:ring-white/30 transition-all">
                <span className="text-white/70 text-xs">🎯 Hedef kalori</span>
                <input
                  type="number" min={500} max={9999}
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(Number(e.target.value))}
                  className="w-20 bg-white/10 hover:bg-white/20 focus:bg-white/20 text-white font-bold text-sm outline-none text-center rounded-lg px-1 py-0.5 transition-colors cursor-text"
                />
                <span className="text-white/70 text-xs">kcal</span>
              </div>
            )}
            {planType !== "general" && (
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
                <span className="text-white/70 text-xs">📅 Başlangıç</span>
                <input
                  type="date" value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-white text-xs font-medium outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Plan türü seçimi ── */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="grid grid-cols-3 gap-2">
            {PLAN_TYPES.map(({ key, icon, title, desc }) => {
              const active = planType === key;
              return (
                <button
                  key={key}
                  onClick={() => setPlanType(key as typeof planType)}
                  className={`relative flex flex-col items-center gap-1 px-3 py-3 rounded-2xl border-2 transition-all text-center ${
                    active
                      ? "border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-100"
                      : "border-gray-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                  }`}
                >
                  {active && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />}
                  <span className="text-xl">{icon}</span>
                  <span className={`text-xs font-bold ${active ? "text-emerald-700" : "text-gray-700"}`}>{title}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">{desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ══ GENEL ══ */}
          {planType === "general" && (
            <div className="px-6 pb-6 space-y-4 pt-2">
              {/* Kalori özeti */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                {/* Hedef kalori - düzenlenebilir satır */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">🎯 Hedef kalori</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={500}
                      max={9999}
                      value={targetCalories}
                      onChange={(e) => setTargetCalories(Number(e.target.value))}
                      className="w-20 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 text-right outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                    />
                    <span className="text-xs text-gray-500">kcal</span>
                  </div>
                </div>

                {/* Gerçekleşen */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Eklenen</span>
                  <span className="text-sm font-bold text-gray-900">{generalTotalCal} kcal</span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${generalPct >= 100 ? "bg-rose-400" : generalPct >= 80 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${generalPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400">
                  {generalPct >= 100 ? "Hedef kalori aşıldı" : `${targetCalories - generalTotalCal} kcal kaldı`}
                </p>
              </div>

              {/* Liste */}
              {generalItems.length > 0 && (
                <div className="space-y-2">
                  {generalItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-xs">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-sm shrink-0">🥗</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.portion}</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">{item.calories} kcal</span>
                      <button onClick={() => removeGeneralItem(i)} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0 text-base">×</button>
                    </div>
                  ))}
                </div>
              )}

              {generalItems.length === 0 && (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl mb-3">🥗</div>
                  <p className="text-sm font-medium text-gray-400">Henüz yiyecek eklenmedi</p>
                  <p className="text-xs text-gray-300 mt-1">Aşağıdaki formu kullanarak öneri ekleyin</p>
                </div>
              )}

              {/* Hızlı seçim - genel plan */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <QuickFoodPanel onSelect={addGeneralItemFromQuick} />
              </div>

              {/* Ekleme formu */}
              <div className="bg-white border-2 border-dashed border-emerald-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Manuel Ekle</p>
                <input
                  value={generalNew.name}
                  onChange={(e) => setGeneralNew((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addGeneralItem()}
                  placeholder="Yiyecek adı (örn: Tavuk göğsü)"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                />
                <div className="flex gap-2">
                  <input
                    value={generalNew.portion}
                    onChange={(e) => setGeneralNew((p) => ({ ...p, portion: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addGeneralItem()}
                    placeholder="Miktar (örn: 150g)"
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                  />
                  <input
                    type="number"
                    value={generalNew.calories}
                    onChange={(e) => setGeneralNew((p) => ({ ...p, calories: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addGeneralItem()}
                    placeholder="kcal"
                    className="w-24 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                  />
                  <button
                    onClick={addGeneralItem}
                    disabled={!generalNew.name.trim() || !generalNew.calories}
                    className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-40 shrink-0"
                  >
                    + Ekle
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ HAFTALIK / AYLIK ══ */}
          {planType !== "general" && (
            <div className="pb-6">
              {/* Gün seçici */}
              <div className="px-6 pt-3 pb-4">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {DAY_KEYS.map((day) => {
                    const count = dayItemCount(day);
                    const cal = dayCalories(day);
                    const pct = Math.min(100, Math.round((cal / targetCalories) * 100));
                    const isActive = selectedDay === day;
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border-2 transition-all shrink-0 min-w-13 ${
                          isActive
                            ? "border-emerald-400 bg-emerald-50 shadow-sm"
                            : count > 0
                              ? "border-emerald-200 bg-emerald-50/50"
                              : "border-gray-100 bg-white hover:border-emerald-200"
                        }`}
                      >
                        <span className={`text-xs font-bold ${isActive ? "text-emerald-700" : "text-gray-600"}`}>{DAY_SHORT[day]}</span>
                        {count > 0 ? (
                          <>
                            <div className="w-6 h-1 rounded-full bg-gray-200 overflow-hidden">
                              <div className={`h-full rounded-full ${pct >= 100 ? "bg-rose-400" : "bg-emerald-400"}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[9px] text-gray-400">{count}</span>
                          </>
                        ) : (
                          <div className="w-4 h-1 rounded-full bg-gray-100" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Seçili gün kalori özeti */}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-800">{DAY_LONG[selectedDay]}</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${calPct >= 100 ? "bg-rose-400" : calPct >= 80 ? "bg-amber-400" : "bg-emerald-400"}`}
                        style={{ width: `${calPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500">{selectedDayCal} / {targetCalories} kcal</span>
                  </div>
                </div>
              </div>

              {/* Öğün kartları */}
              <div className="px-6 space-y-3">
                {MEAL_KEYS.map((mealKey) => {
                  const meta = MEAL_META[mealKey];
                  const items = weeklyPlan[selectedDay][mealKey];
                  const inp = newItem[mealKey];
                  const mealCal = items.reduce((s, i) => s + i.calories, 0);
                  const isOpen = openMeal === mealKey;
                  return (
                    <div key={mealKey} className={`rounded-2xl border-2 overflow-hidden transition-all ${isOpen ? meta.border : "border-gray-100"}`}>
                      {/* Öğün başlığı */}
                      <button
                        onClick={() => setOpenMeal(isOpen ? null : mealKey)}
                        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${isOpen ? meta.bg : "bg-white hover:bg-gray-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{meta.icon}</span>
                          <span className={`text-sm font-bold ${isOpen ? meta.color : "text-gray-700"}`}>{meta.label}</span>
                          {items.length > 0 && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.tag}`}>{items.length} yemek · {mealCal} kcal</span>
                          )}
                        </div>
                        <span className={`text-gray-400 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                      </button>

                      {isOpen && (
                        <div className="p-4 space-y-2 bg-white">
                          {/* Mevcut yemekler */}
                          {items.map((item, i) => (
                            <div key={i} className={`flex items-center gap-3 ${meta.bg} rounded-xl px-3 py-2.5`}>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-800">{item.name}</span>
                                <span className="text-xs text-gray-400 ml-2">({item.portion})</span>
                              </div>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${meta.tag} shrink-0`}>{item.calories} kcal</span>
                              <button onClick={() => removeWeeklyItem(mealKey, i)} className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors shrink-0 text-base">×</button>
                            </div>
                          ))}

                          {items.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-2">Bu öğün için henüz yemek yok</p>
                          )}

                          {/* Hızlı seçim */}
                          <QuickFoodPanel onSelect={(food) => addWeeklyItemFromQuick(mealKey, food)} />

                          {/* Ekleme satırı */}
                          <div className={`flex gap-2 pt-2 border-t ${meta.border} mt-2`}>
                            <input
                              value={inp.name}
                              onChange={(e) => setNewItem((p) => ({ ...p, [mealKey]: { ...p[mealKey], name: e.target.value } }))}
                              onKeyDown={(e) => e.key === "Enter" && addWeeklyItem(mealKey)}
                              placeholder="Yemek adı"
                              className="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:bg-white transition-colors mt-1"
                            />
                            <input
                              value={inp.portion}
                              onChange={(e) => setNewItem((p) => ({ ...p, [mealKey]: { ...p[mealKey], portion: e.target.value } }))}
                              onKeyDown={(e) => e.key === "Enter" && addWeeklyItem(mealKey)}
                              placeholder="Miktar"
                              className="w-20 shrink-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:bg-white transition-colors mt-1"
                            />
                            <input
                              type="number"
                              value={inp.calories}
                              onChange={(e) => setNewItem((p) => ({ ...p, [mealKey]: { ...p[mealKey], calories: e.target.value } }))}
                              onKeyDown={(e) => e.key === "Enter" && addWeeklyItem(mealKey)}
                              placeholder="kcal"
                              className="w-16 shrink-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:bg-white transition-colors mt-1"
                            />
                            <button
                              onClick={() => addWeeklyItem(mealKey)}
                              disabled={!inp.name.trim() || !inp.calories}
                              className={`shrink-0 mt-1 px-3 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-40 ${
                                mealKey === "breakfast" ? "bg-amber-500 hover:bg-amber-600" :
                                mealKey === "lunch" ? "bg-sky-500 hover:bg-sky-600" :
                                mealKey === "dinner" ? "bg-violet-500 hover:bg-violet-600" :
                                "bg-rose-500 hover:bg-rose-600"
                              }`}
                            >
                              + Ekle
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Günü kaydet */}
              <div className="px-6 pt-4 pb-2">
                <button
                  onClick={() => handleSaveDay(selectedDay)}
                  disabled={savingDay || saving}
                  className={`w-full py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                    savedDay === selectedDay
                      ? "bg-emerald-500 text-white shadow-emerald-200"
                      : "bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-200 disabled:opacity-50"
                  }`}
                >
                  {savingDay ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Kaydediliyor…
                    </>
                  ) : savedDay === selectedDay ? (
                    <>✓ {DAY_LONG[selectedDay]} Kaydedildi!</>
                  ) : (
                    <>💾 {DAY_LONG[selectedDay]}&#39;i Kaydet</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {error && <p className="mx-6 mb-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 shrink-0">{error}</p>}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-2 py-3 rounded-2xl text-sm font-bold text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? "Kaydediliyor…" : "✓ Planı Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
