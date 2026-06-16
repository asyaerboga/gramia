"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import MealCard from "@/components/client/MealCard";
import DatePickerModern from "@/components/shared/DatePickerModern";
import DietPlanModal from "@/components/client/DietPlanModal";

interface MealItem {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface MealsByType {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snack: MealItem[];
}

interface SatietyRecord {
  mealType: string;
  satietyLevel: number;
}

interface DietPlan {
  _id: string;
  name: string;
  planType: "weekly" | "monthly" | "general";
  targetCalories: number;
  startDate?: string;
  weeklyPlan: Record<string, unknown>;
}

const mealLabels: Record<string, string> = {
  breakfast: "🥣 Kahvaltı",
  lunch: "🍽️ Öğlen",
  dinner: "🥘 Akşam",
  snack: "🍎 Atıştırmalık",
};

const PLAN_TYPE_META = {
  weekly:  { icon: "📅", label: "Haftalık", order: 0 },
  monthly: { icon: "📆", label: "Aylık",    order: 1 },
  general: { icon: "✨", label: "Genel",    order: 2 },
} as const;


function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return getLocalDateStr(d);
}

function getLocalDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function MealsPage() {
  const router = useRouter();
  const todayStr = getLocalDateStr();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [meals, setMeals] = useState<MealsByType>({ breakfast: [], lunch: [], dinner: [], snack: [] });
  const [satiety, setSatiety] = useState<Record<string, number>>({});
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [activePlan, setActivePlan] = useState<DietPlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const fetchMeals = useCallback(async () => {
    try {
      const res = await fetch(`/api/meals?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        const grouped: MealsByType = { breakfast: [], lunch: [], dinner: [], snack: [] };
        for (const meal of data) {
          if (grouped[meal.mealType as keyof MealsByType]) {
            grouped[meal.mealType as keyof MealsByType].push(...meal.items);
          }
        }
        setMeals(grouped);
      }
    } catch (error) {
      console.error("Failed to fetch meals:", error);
    }
  }, [selectedDate]);

  const fetchSatiety = useCallback(async () => {
    try {
      const res = await fetch(`/api/meal-satiety?date=${selectedDate}`);
      if (res.ok) {
        const data: SatietyRecord[] = await res.json();
        const map: Record<string, number> = {};
        for (const r of data) map[r.mealType] = r.satietyLevel;
        setSatiety(map);
      }
    } catch (error) {
      console.error("Failed to fetch satiety:", error);
    }
  }, [selectedDate]);

  const fetchDietPlans = useCallback(async () => {
    try {
      // activeOnly filtresi yok — her tipten en son planı göster
      const res = await fetch("/api/diet-plans");
      if (res.ok) {
        const data: DietPlan[] = await res.json();
        // API createdAt desc sıralar; her tipten ilki (en yeni) alınır
        const byType = new Map<string, DietPlan>();
        for (const plan of data) {
          if (!byType.has(plan.planType)) byType.set(plan.planType, plan);
        }
        const sorted = Array.from(byType.values()).sort(
          (a, b) => PLAN_TYPE_META[a.planType].order - PLAN_TYPE_META[b.planType].order,
        );
        setDietPlans(sorted);
      }
    } catch {
      // sessizce geç
    }
  }, []);

  useEffect(() => {
    void fetchMeals();
    void fetchSatiety();
  }, [fetchMeals, fetchSatiety]);

  useEffect(() => {
    void fetchDietPlans();
  }, [fetchDietPlans]);

  const handleAddItem = async (mealType: string, items: MealItem[]) => {
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, mealType, items }),
      });
      if (res.ok) {
        fetchMeals();
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to add meal:", error);
    }
  };

  const handleSetSatiety = async (mealType: string, level: number) => {
    setSatiety((prev) => ({ ...prev, [mealType]: level }));
    try {
      await fetch("/api/meal-satiety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, mealType, satietyLevel: level }),
      });
    } catch (error) {
      console.error("Failed to save satiety:", error);
      fetchSatiety();
    }
  };

  const allItems = Object.values(meals).flat();
  const totalCalories = allItems.reduce((sum, i) => sum + i.calories, 0);
  const totalProtein = allItems.reduce((sum, i) => sum + (i.protein || 0), 0);
  const totalCarbs = allItems.reduce((sum, i) => sum + (i.carbs || 0), 0);
  const totalFat = allItems.reduce((sum, i) => sum + (i.fat || 0), 0);
  const macroCalories = totalProtein * 4 + totalCarbs * 4 + totalFat * 9;
  const isToday = selectedDate === todayStr;
  const isPast = selectedDate < todayStr;

  const openPlan = (plan: DietPlan) => {
    setActivePlan(plan);
    setShowPlanModal(true);
  };

  return (
    <>
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-orange-50/30 to-amber-50/20 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 via-amber-400 to-yellow-400 p-6 text-white shadow-xl shadow-orange-200">
          <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-sm" />
          <div className="absolute -bottom-10 -left-6 w-40 h-40 bg-white/10 rounded-full blur-sm" />
          <div className="absolute top-4 right-32 w-6 h-6 bg-white/20 rounded-full" />
          <div className="absolute bottom-6 right-16 w-3 h-3 bg-white/30 rounded-full" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-4xl drop-shadow-lg">🍽️</span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Yemek Günlüğü</h1>
              </div>
              <p className="text-orange-100 text-sm mt-1 font-medium">Öğünlerinizi takip edin</p>
            </div>

            {totalCalories > 0 && (
              <div className="flex gap-3">
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center border border-white/20">
                  <p className="text-2xl font-bold">{totalCalories}</p>
                  <p className="text-xs text-orange-100 font-medium">kcal</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center border border-white/20">
                  <p className="text-2xl font-bold">{totalProtein}</p>
                  <p className="text-xs text-orange-100 font-medium">g protein</p>
                </div>
              </div>
            )}
          </div>

          {/* Date navigation */}
          <div className="relative z-10 mt-5 flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-colors text-xl leading-none backdrop-blur-sm shrink-0"
            >
              ‹
            </button>
            <DatePickerModern value={selectedDate} onChange={setSelectedDate} className="flex-1" />
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-colors text-xl leading-none backdrop-blur-sm shrink-0"
            >
              ›
            </button>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="hidden sm:flex items-center px-3 h-10 text-xs font-semibold text-orange-600 bg-white rounded-xl hover:bg-orange-50 transition-colors whitespace-nowrap shadow-md shrink-0"
              >
                Bugün
              </button>
            )}
          </div>
        </div>

        {/* Daily summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Günlük Toplam</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-4xl font-black text-gray-900">{totalCalories}</span>
                <span className="text-sm text-gray-400 font-medium">kcal</span>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Protein</p>
                <p className="text-lg font-bold text-rose-500">{totalProtein}<span className="text-xs font-normal">g</span></p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Karb</p>
                <p className="text-lg font-bold text-amber-500">{totalCarbs}<span className="text-xs font-normal">g</span></p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Yağ</p>
                <p className="text-lg font-bold text-sky-500">{totalFat}<span className="text-xs font-normal">g</span></p>
              </div>
            </div>
          </div>
          {macroCalories > 0 ? (
            <div className="flex rounded-full h-2.5 overflow-hidden bg-gray-100">
              <div className="bg-rose-400 transition-all duration-500" style={{ width: `${(totalProtein * 4 / macroCalories) * 100}%` }} />
              <div className="bg-amber-400 transition-all duration-500" style={{ width: `${(totalCarbs * 4 / macroCalories) * 100}%` }} />
              <div className="bg-sky-400 transition-all duration-500" style={{ width: `${(totalFat * 9 / macroCalories) * 100}%` }} />
            </div>
          ) : (
            <div className="h-2.5 rounded-full bg-gray-100" />
          )}
        </div>

        {/* Beslenme planı tip seçici */}
        {dietPlans.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Beslenme Planlarım</p>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${dietPlans.length}, minmax(0, 1fr))` }}>
              {dietPlans.map((plan) => {
                const meta = PLAN_TYPE_META[plan.planType];
                return (
                  <button
                    key={plan._id}
                    onClick={() => openPlan(plan)}
                    className="flex flex-col items-center gap-2 border-2 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/50 rounded-2xl p-3.5 transition-all group"
                  >
                    <span className="text-2xl">{meta.icon}</span>
                    <span className="text-xs font-bold text-gray-700 group-hover:text-emerald-700">{meta.label}</span>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {plan.targetCalories} kcal
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Meal cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(mealLabels) as (keyof MealsByType)[]).map((mealType) => (
            <MealCard
              key={mealType}
              mealType={mealType}
              mealLabel={mealLabels[mealType]}
              items={meals[mealType]}
              onAddItem={handleAddItem}
              satietyLevel={satiety[mealType]}
              onSetSatiety={handleSetSatiety}
              isPast={isPast}
            />
          ))}
        </div>

      </div>
    </div>

    {showPlanModal && activePlan && (
      <DietPlanModal
        plan={activePlan}
        onClose={() => { setShowPlanModal(false); setActivePlan(null); }}
        onAddToLog={(mealType, items) => handleAddItem(mealType, items)}
        currentDate={selectedDate}
      />
    )}
    </>
  );
}
