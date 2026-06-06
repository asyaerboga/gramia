"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import MealCard from "@/components/client/MealCard";

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

const mealLabels: Record<string, string> = {
  breakfast: "🥣 Kahvaltı",
  lunch: "🍽️ Öğlen",
  dinner: "🥘 Akşam",
  snack: "🍎 Atıştırmalık",
};

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return getLocalDateStr(d);
}

function formatDateLabel(dateStr: string) {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Bugün";
  if (diff === -1) return "Dün";
  if (diff === 1) return "Yarın";
  return date.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
}

function getLocalDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function MealsPage() {
  const router = useRouter();
  const todayStr = getLocalDateStr();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [meals, setMeals] = useState<MealsByType>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  });
  const [satiety, setSatiety] = useState<Record<string, number>>({});

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

  useEffect(() => {
    fetchMeals();
    fetchSatiety();
  }, [fetchMeals, fetchSatiety]);

  const handleAddItem = async (mealType: string, item: MealItem) => {
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, mealType, items: [item] }),
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

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-emerald-50/40 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yemek Günlüğü</h1>
          <p className="text-sm text-gray-500 mt-0.5">Öğünlerinizi takip edin</p>
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm text-xl leading-none"
          >
            ‹
          </button>

          <div className="flex-1 flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <span className="font-semibold text-gray-900 text-sm md:text-base">
              {formatDateLabel(selectedDate)}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs text-gray-400 cursor-pointer focus:outline-none bg-transparent"
            />
          </div>

          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm text-xl leading-none"
          >
            ›
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="hidden sm:flex items-center px-3 h-10 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors whitespace-nowrap"
            >
              Bugün
            </button>
          )}
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
              <div
                className="bg-rose-400 transition-all duration-500"
                style={{ width: `${(totalProtein * 4 / macroCalories) * 100}%` }}
              />
              <div
                className="bg-amber-400 transition-all duration-500"
                style={{ width: `${(totalCarbs * 4 / macroCalories) * 100}%` }}
              />
              <div
                className="bg-sky-400 transition-all duration-500"
                style={{ width: `${(totalFat * 9 / macroCalories) * 100}%` }}
              />
            </div>
          ) : (
            <div className="h-2.5 rounded-full bg-gray-100" />
          )}
        </div>

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
            />
          ))}
        </div>

      </div>
    </div>
  );
}
