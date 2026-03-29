"use client";

import { useState } from "react";
import { FaPlus, FaFire } from "react-icons/fa";

interface MealItem {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  portion?: string;
}

interface MealCardProps {
  mealType: string;
  mealLabel: string;
  items: MealItem[];
  onAddItem: (mealType: string, item: MealItem) => void;
}

const quickFoods = [
  { name: "Yumurta (1 adet)", calories: 78, protein: 6, carbs: 1, fat: 5 },
  { name: "Ekmek (1 dilim)", calories: 80, protein: 3, carbs: 15, fat: 1 },
  { name: "Tavuk göğsü (100g)", calories: 165, protein: 31, carbs: 0, fat: 4 },
  { name: "Pilav (1 porsiyon)", calories: 200, protein: 4, carbs: 45, fat: 1 },
  { name: "Salata (1 porsiyon)", calories: 50, protein: 2, carbs: 10, fat: 0 },
  { name: "Yoğurt (1 kase)", calories: 100, protein: 8, carbs: 12, fat: 2 },
  { name: "Muz (1 adet)", calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: "Elma (1 adet)", calories: 95, protein: 0, carbs: 25, fat: 0 },
];

export default function MealCard({
  mealType,
  mealLabel,
  items,
  onAddItem,
}: MealCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const total = items.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = items.reduce(
    (sum, item) => sum + (item.protein || 0),
    0,
  );
  const totalCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const totalFat = items.reduce((sum, item) => sum + (item.fat || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && calories) {
      onAddItem(mealType, {
        name,
        calories: parseInt(calories),
        protein: protein ? parseInt(protein) : undefined,
        carbs: carbs ? parseInt(carbs) : undefined,
        fat: fat ? parseInt(fat) : undefined,
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setShowAdvanced(false);
    setShowModal(false);
  };

  const selectQuickFood = (food: (typeof quickFoods)[0]) => {
    setName(food.name);
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFat(food.fat.toString());
    setShowAdvanced(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">{mealLabel}</h4>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-emerald-500 hover:text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-1 rounded-lg transition"
          >
            <FaPlus className="text-xs" /> Ekle
          </button>
        </div>

        {items.length > 0 ? (
          <>
            <ul className="space-y-2 mb-3">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-3 py-2"
                >
                  <div>
                    <span className="text-gray-900">{item.name}</span>
                    {(item.protein || item.carbs || item.fat) && (
                      <div className="flex gap-2 mt-0.5 text-[10px] text-gray-400">
                        {item.protein && <span>P: {item.protein}g</span>}
                        {item.carbs && <span>K: {item.carbs}g</span>}
                        {item.fat && <span>Y: {item.fat}g</span>}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-emerald-600 flex items-center gap-1">
                    <FaFire className="text-orange-400 text-xs" />
                    {item.calories}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm font-bold text-gray-900">
                <span>Toplam</span>
                <span className="text-emerald-600">{total} kcal</span>
              </div>
              {(totalProtein > 0 || totalCarbs > 0 || totalFat > 0) && (
                <div className="flex justify-end gap-3 text-xs text-gray-500">
                  <span className="text-red-500">P: {totalProtein}g</span>
                  <span className="text-amber-500">K: {totalCarbs}g</span>
                  <span className="text-blue-500">Y: {totalFat}g</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            Henüz yemek eklenmedi
          </p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">
                {mealLabel} - Yemek Ekle
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Quick Foods */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Hızlı Seçim</p>
              <div className="flex flex-wrap gap-1.5">
                {quickFoods.slice(0, 6).map((food) => (
                  <button
                    key={food.name}
                    type="button"
                    onClick={() => selectQuickFood(food)}
                    className="px-2 py-1 bg-white text-xs text-gray-700 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition"
                  >
                    {food.name.split(" (")[0]}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yemek Adı
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Tavuk göğsü"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kalori (kcal)
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="Örn: 250"
                  required
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                />
              </div>

              {/* Advanced Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                {showAdvanced ? "- Basit Görünüm" : "+ Makro Değerler Ekle"}
              </button>

              {/* Advanced Fields */}
              {showAdvanced && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Karb (g)
                    </label>
                    <input
                      type="number"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Yağ (g)
                    </label>
                    <input
                      type="number"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
