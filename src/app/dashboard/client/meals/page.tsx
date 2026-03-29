"use client";

import { useState, useEffect, useCallback } from "react";
import MealCard from "@/components/client/MealCard";

interface MealItem {
  name: string;
  calories: number;
}

interface MealsByType {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snack: MealItem[];
}

const mealLabels: Record<string, string> = {
  breakfast: "🥣 Kahvaltı",
  lunch: "🍽️ Öğlen",
  dinner: "🥘 Akşam",
  snack: "🍎 Atıştırmalık",
};

export default function MealsPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [meals, setMeals] = useState<MealsByType>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  });

  const fetchMeals = useCallback(async () => {
    try {
      const res = await fetch(`/api/meals?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        const grouped: MealsByType = {
          breakfast: [],
          lunch: [],
          dinner: [],
          snack: [],
        };
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

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const handleAddItem = async (mealType: string, item: MealItem) => {
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          mealType,
          items: [item],
        }),
      });
      if (res.ok) {
        fetchMeals();
      }
    } catch (error) {
      console.error("Failed to add meal:", error);
    }
  };

  const totalCalories = Object.values(meals)
    .flat()
    .reduce((sum, item) => sum + item.calories, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
          🍽️ Yemek Ekleme
        </h2>

        {/* Date picker */}
        <div className="mb-6">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
          />
        </div>

        {/* Meal cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(mealLabels) as (keyof MealsByType)[]).map(
            (mealType) => (
              <MealCard
                key={mealType}
                mealType={mealType}
                mealLabel={mealLabels[mealType]}
                items={meals[mealType]}
                onAddItem={handleAddItem}
              />
            ),
          )}
        </div>

        {/* Daily total */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-6 text-center">
          <p className="text-gray-500 text-sm">Günlük Toplam</p>
          <p className="text-3xl font-bold text-emerald-600">
            {totalCalories} kcal
          </p>
        </div>

        {/* Tips */}
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mt-6">
          <h3 className="font-semibold text-emerald-700 mb-2">💡 İpuçları</h3>
          <p className="text-sm text-emerald-600">
            Her öğün için yemek adı ve kalori değerini girerek günlük
            beslenmenizi takip edin. Kalori barınız ana sayfada otomatik olarak
            güncellenir.
          </p>
        </div>
      </div>
    </div>
  );
}
