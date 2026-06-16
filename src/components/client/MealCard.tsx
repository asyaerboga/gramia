"use client";

import { useState, useMemo } from "react";
import { FaPlus, FaFire, FaSearch, FaCheck } from "react-icons/fa";
import { quickFoodCategories, ALL_KEY, CATEGORY_KEYS, type QuickFood } from "@/lib/quickFoods";

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
  onAddItem: (mealType: string, items: MealItem[]) => void;
  satietyLevel?: number;
  onSetSatiety: (mealType: string, level: number) => void;
  isPast?: boolean;
}

const satietyOptions = [
  { level: 1, emoji: "😫", label: "Çok Aç" },
  { level: 2, emoji: "😕", label: "Aç" },
  { level: 3, emoji: "😊", label: "Normal" },
  { level: 4, emoji: "😄", label: "Tok" },
  { level: 5, emoji: "🤩", label: "Çok Tok" },
];

const mealThemes = {
  breakfast: {
    gradient: "from-amber-400 via-orange-400 to-yellow-400",
    headerGlow: "shadow-amber-200",
    addBtn: "bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-lg shadow-amber-200",
    calText: "text-amber-600",
    satietySelected: "border-amber-400 bg-amber-50 scale-105",
    satietySelectedText: "text-amber-700 font-semibold",
    savedText: "text-amber-600",
    kcalBadge: "bg-amber-100 text-amber-700 font-bold",
    submitBtn: "bg-linear-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 active:scale-95 text-white shadow-lg shadow-amber-200",
    ring: "focus:ring-amber-400",
    catActive: "bg-amber-500 text-white shadow-sm",
    progressBar: "bg-linear-to-r from-amber-400 to-orange-400",
    accent: "text-amber-500",
    iconBg: "bg-amber-100",
    selectedFood: "bg-amber-50 border-amber-200",
    pendingBg: "bg-amber-50",
    pendingBorder: "border-amber-100",
  },
  lunch: {
    gradient: "from-emerald-400 via-teal-400 to-green-400",
    headerGlow: "shadow-emerald-200",
    addBtn: "bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white shadow-lg shadow-emerald-200",
    calText: "text-emerald-600",
    satietySelected: "border-emerald-400 bg-emerald-50 scale-105",
    satietySelectedText: "text-emerald-700 font-semibold",
    savedText: "text-emerald-600",
    kcalBadge: "bg-emerald-100 text-emerald-700 font-bold",
    submitBtn: "bg-linear-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white shadow-lg shadow-emerald-200",
    ring: "focus:ring-emerald-400",
    catActive: "bg-emerald-500 text-white shadow-sm",
    progressBar: "bg-linear-to-r from-emerald-400 to-teal-400",
    accent: "text-emerald-500",
    iconBg: "bg-emerald-100",
    selectedFood: "bg-emerald-50 border-emerald-200",
    pendingBg: "bg-emerald-50",
    pendingBorder: "border-emerald-100",
  },
  dinner: {
    gradient: "from-indigo-500 via-purple-500 to-violet-500",
    headerGlow: "shadow-indigo-200",
    addBtn: "bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white shadow-lg shadow-indigo-200",
    calText: "text-indigo-600",
    satietySelected: "border-indigo-400 bg-indigo-50 scale-105",
    satietySelectedText: "text-indigo-700 font-semibold",
    savedText: "text-indigo-600",
    kcalBadge: "bg-indigo-100 text-indigo-700 font-bold",
    submitBtn: "bg-linear-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 active:scale-95 text-white shadow-lg shadow-indigo-200",
    ring: "focus:ring-indigo-400",
    catActive: "bg-indigo-500 text-white shadow-sm",
    progressBar: "bg-linear-to-r from-indigo-500 to-purple-500",
    accent: "text-indigo-500",
    iconBg: "bg-indigo-100",
    selectedFood: "bg-indigo-50 border-indigo-200",
    pendingBg: "bg-indigo-50",
    pendingBorder: "border-indigo-100",
  },
  snack: {
    gradient: "from-rose-400 via-pink-400 to-fuchsia-400",
    headerGlow: "shadow-rose-200",
    addBtn: "bg-rose-500 hover:bg-rose-600 active:scale-95 text-white shadow-lg shadow-rose-200",
    calText: "text-rose-600",
    satietySelected: "border-rose-400 bg-rose-50 scale-105",
    satietySelectedText: "text-rose-700 font-semibold",
    savedText: "text-rose-600",
    kcalBadge: "bg-rose-100 text-rose-700 font-bold",
    submitBtn: "bg-linear-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 active:scale-95 text-white shadow-lg shadow-rose-200",
    ring: "focus:ring-rose-400",
    catActive: "bg-rose-500 text-white shadow-sm",
    progressBar: "bg-linear-to-r from-rose-400 to-pink-400",
    accent: "text-rose-500",
    iconBg: "bg-rose-100",
    selectedFood: "bg-rose-50 border-rose-200",
    pendingBg: "bg-rose-50",
    pendingBorder: "border-rose-100",
  },
};

const mealMeta: Record<string, { emoji: string; timeHint: string; bgPattern: string }> = {
  breakfast: { emoji: "🌅", timeHint: "Güne enerjik başlayın", bgPattern: "☀️🥚🍞" },
  lunch: { emoji: "☀️", timeHint: "Gün ortası yakıtınız", bgPattern: "🥗🍱🥘" },
  dinner: { emoji: "🌙", timeHint: "Günü güzel kapatın", bgPattern: "🍝🥩🫕" },
  snack: { emoji: "⚡", timeHint: "Küçük ama önemli", bgPattern: "🍎🌰🍫" },
};

export default function MealCard({
  mealType,
  mealLabel,
  items,
  onAddItem,
  satietyLevel,
  onSetSatiety,
  isPast = false,
}: MealCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_KEY);
  const [search, setSearch] = useState("");
  const [pendingItems, setPendingItems] = useState<MealItem[]>([]);
  const [justAdded, setJustAdded] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });

  const theme = mealThemes[mealType as keyof typeof mealThemes] ?? mealThemes.lunch;
  const meta = mealMeta[mealType] ?? mealMeta.lunch;

  const total = items.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = items.reduce((sum, item) => sum + (item.protein || 0), 0);
  const totalCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const totalFat = items.reduce((sum, item) => sum + (item.fat || 0), 0);

  const pendingTotal = pendingItems.reduce((sum, item) => sum + item.calories, 0);

  const allFoods: QuickFood[] = useMemo(
    () => CATEGORY_KEYS.flatMap((k) => quickFoodCategories[k]),
    [],
  );

  const displayedFoods = useMemo(() => {
    const base = activeCategory === ALL_KEY ? allFoods : (quickFoodCategories[activeCategory] ?? []);
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((f) => f.name.toLowerCase().includes(q));
  }, [activeCategory, search, allFoods]);

  const resetForm = () => {
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setShowAdvanced(false);
    setSearch("");
    setActiveCategory(ALL_KEY);
    setShowModal(false);
    setPendingItems([]);
    setJustAdded(false);
    setEditingIdx(null);
    setEditDraft({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  };

  const startEdit = (idx: number) => {
    const item = pendingItems[idx];
    setEditingIdx(idx);
    setEditDraft({
      name: item.name,
      calories: item.calories.toString(),
      protein: item.protein?.toString() ?? "",
      carbs: item.carbs?.toString() ?? "",
      fat: item.fat?.toString() ?? "",
    });
  };

  const saveEdit = () => {
    if (editingIdx === null || !editDraft.name || !editDraft.calories) return;
    setPendingItems((prev) =>
      prev.map((item, i) =>
        i === editingIdx
          ? {
              name: editDraft.name,
              calories: parseInt(editDraft.calories),
              protein: editDraft.protein ? parseInt(editDraft.protein) : undefined,
              carbs: editDraft.carbs ? parseInt(editDraft.carbs) : undefined,
              fat: editDraft.fat ? parseInt(editDraft.fat) : undefined,
            }
          : item,
      ),
    );
    setEditingIdx(null);
  };

  const cancelEdit = () => setEditingIdx(null);

  const selectQuickFood = (food: QuickFood) => {
    setPendingItems((prev) => [
      ...prev,
      { name: food.name, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat },
    ]);
  };

  const removePendingItem = (idx: number) => {
    if (editingIdx === idx) setEditingIdx(null);
    else if (editingIdx !== null && idx < editingIdx) setEditingIdx(editingIdx - 1);
    setPendingItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddToPending = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !calories) return;
    setPendingItems((prev) => [
      ...prev,
      {
        name,
        calories: parseInt(calories),
        protein: protein ? parseInt(protein) : undefined,
        carbs: carbs ? parseInt(carbs) : undefined,
        fat: fat ? parseInt(fat) : undefined,
      },
    ]);
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setShowAdvanced(false);
  };

  const handleSubmitAll = () => {
    if (pendingItems.length === 0) return;
    onAddItem(mealType, pendingItems);
    setJustAdded(true);
    setTimeout(() => resetForm(), 600);
  };

  const pendingCountByName = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of pendingItems) {
      map[item.name] = (map[item.name] ?? 0) + 1;
    }
    return map;
  }, [pendingItems]);

  return (
    <>
      {/* Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group">

        {/* Gradient header */}
        <div className={`bg-linear-to-r ${theme.gradient} p-5 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10 text-6xl flex items-center justify-end pr-4 pointer-events-none select-none">
            {meta.bgPattern}
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/25 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                {meta.emoji}
              </div>
              <div>
                <h4 className="font-bold text-white text-base leading-tight">{mealLabel}</h4>
                <p className="text-white/70 text-xs mt-0.5">{meta.timeHint}</p>
              </div>
            </div>
            <div className="text-right">
              {total > 0 && (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{total}</span>
                  <span className="text-white/70 text-xs font-medium">kcal</span>
                </div>
              )}
              {!isPast && (
                <button
                  onClick={() => setShowModal(true)}
                  className={`mt-1 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all duration-200 backdrop-blur-sm border border-white/20`}
                >
                  <FaPlus className="text-[10px]" />
                  Ekle
                </button>
              )}
              {isPast && (
                <span className="text-xs text-white/60 italic mt-1 block">Geçmiş</span>
              )}
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          {items.length > 0 ? (
            <>
              <ul className="space-y-1 mb-4">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 py-2.5 px-3 rounded-2xl hover:bg-gray-50 transition-colors group/item">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      {(item.protein || item.carbs || item.fat) && (
                        <div className="flex gap-2 mt-1">
                          {item.protein ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-500 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-full">
                              P {item.protein}g
                            </span>
                          ) : null}
                          {item.carbs ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-full">
                              K {item.carbs}g
                            </span>
                          ) : null}
                          {item.fat ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-sky-500 font-semibold bg-sky-50 px-1.5 py-0.5 rounded-full">
                              Y {item.fat}g
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <span className={`shrink-0 flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-xl ${theme.kcalBadge}`}>
                      <FaFire className="text-orange-400 text-[9px]" />
                      {item.calories}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              {(totalProtein > 0 || totalCarbs > 0 || totalFat > 0) && (
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 bg-rose-50 rounded-2xl p-2.5 text-center">
                    <p className="text-[9px] text-rose-400 font-bold uppercase tracking-wide">Protein</p>
                    <p className="text-sm font-black text-rose-600 mt-0.5">{totalProtein}<span className="text-[10px] font-normal">g</span></p>
                  </div>
                  <div className="flex-1 bg-amber-50 rounded-2xl p-2.5 text-center">
                    <p className="text-[9px] text-amber-500 font-bold uppercase tracking-wide">Karb</p>
                    <p className="text-sm font-black text-amber-600 mt-0.5">{totalCarbs}<span className="text-[10px] font-normal">g</span></p>
                  </div>
                  <div className="flex-1 bg-sky-50 rounded-2xl p-2.5 text-center">
                    <p className="text-[9px] text-sky-400 font-bold uppercase tracking-wide">Yağ</p>
                    <p className="text-sm font-black text-sky-600 mt-0.5">{totalFat}<span className="text-[10px] font-normal">g</span></p>
                  </div>
                </div>
              )}

              {/* Satiety */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Tokluk Hissi</p>
                <div className="flex gap-1.5">
                  {satietyOptions.map((opt) => (
                    <button
                      key={opt.level}
                      type="button"
                      onClick={() => onSetSatiety(mealType, opt.level)}
                      title={opt.label}
                      className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl border-2 transition-all duration-200 text-xs gap-1 ${
                        satietyLevel === opt.level
                          ? `${theme.satietySelected} shadow-sm`
                          : "border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <span className="text-lg leading-none">{opt.emoji}</span>
                      <span className={`hidden sm:block text-[9px] leading-none truncate w-full text-center px-0.5 font-medium ${
                        satietyLevel === opt.level ? theme.satietySelectedText : "text-gray-400"
                      }`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
                {satietyLevel && (
                  <p className={`text-[11px] text-center mt-2 font-semibold ${theme.savedText}`}>
                    {satietyOptions.find((o) => o.level === satietyLevel)?.emoji}{" "}
                    {satietyOptions.find((o) => o.level === satietyLevel)?.label} kaydedildi ✓
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-5xl mb-3 opacity-20 select-none">🍽️</div>
              <p className="text-sm font-semibold text-gray-400">Henüz bir şey eklenmedi</p>
              <p className="text-xs text-gray-300 mt-1">Yukarıdaki Ekle butonuna dokun</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">

            {/* Modal gradient header */}
            <div className={`bg-linear-to-r ${theme.gradient} px-6 pt-6 pb-5 shrink-0 relative overflow-hidden`}>
              <div className="absolute -top-4 -right-4 text-8xl opacity-10 select-none pointer-events-none rotate-12">
                {meta.emoji}
              </div>
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Öğüne ekle</p>
                  <h3 className="font-black text-white text-xl">{mealLabel}</h3>
                  <p className="text-white/60 text-xs mt-0.5">{meta.timeHint}</p>
                </div>
                <div className="flex items-center gap-2">
                  {pendingItems.length > 0 && (
                    <span className="flex items-center gap-1 bg-white/25 backdrop-blur-sm border border-white/30 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl">
                      🛒 {pendingItems.length}
                    </span>
                  )}
                  <button
                    onClick={resetForm}
                    className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all backdrop-blur-sm border border-white/20 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable middle area */}
            <div className="flex-1 overflow-y-auto flex flex-col">

            {/* Quick food section */}
            <div className="border-b border-gray-100 bg-gray-50/50">
              <div className="px-5 pt-4 pb-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span>⚡</span> Hızlı Seçim
                  <span className="ml-auto text-gray-300 font-medium normal-case tracking-normal">Tıkla → sepete ekle</span>
                </p>

                {/* Search */}
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setActiveCategory(ALL_KEY); }}
                    placeholder="Yemek ara... (örn: tavuk, elma)"
                    className={`w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-2xl text-sm bg-white focus:outline-none focus:border-transparent focus:ring-2 ${theme.ring} text-gray-900 transition-all`}
                  />
                </div>

                {/* Category pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {[ALL_KEY, ...CATEGORY_KEYS].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setActiveCategory(cat); setSearch(""); }}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                        activeCategory === cat
                          ? `${theme.catActive}`
                          : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food list */}
              <div className="max-h-44 overflow-y-auto px-4 pb-3">
                {displayedFoods.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-2xl mb-1">🔍</p>
                    <p className="text-sm text-gray-400">Sonuç bulunamadı</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {displayedFoods.map((food) => {
                      const count = pendingCountByName[food.name] ?? 0;
                      const isInPending = count > 0;
                      return (
                        <button
                          key={food.name}
                          type="button"
                          onClick={() => selectQuickFood(food)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left transition-all duration-200 group ${
                            isInPending
                              ? `${theme.selectedFood} border-2`
                              : "hover:bg-white border-2 border-transparent"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate ${isInPending ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"}`}>
                              {food.name}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                              P {food.protein}g · K {food.carbs}g · Y {food.fat}g
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className={`shrink-0 text-xs font-black px-2.5 py-1 rounded-xl ${theme.kcalBadge}`}>
                              {food.calories} kcal
                            </span>
                            {isInPending && (
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center ${theme.catActive} text-white text-[10px] font-black`}>
                                {count > 1 ? count : <FaCheck className="text-[8px]" />}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Pending items basket */}
            {pendingItems.length > 0 && (
              <div className={`border-b border-gray-100 ${theme.pendingBg} px-4 py-3`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                    🛒 Sepet
                    <span className="bg-white rounded-full px-1.5 py-0.5 text-gray-600">{pendingItems.length}</span>
                  </p>
                  <span className="text-xs font-black text-gray-600">{pendingTotal} kcal</span>
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {pendingItems.map((item, idx) =>
                    editingIdx === idx ? (
                      /* Edit mode */
                      <div key={idx} className="bg-white rounded-xl px-3 py-2.5 shadow-xs border-2 border-gray-200 space-y-2">
                        <input
                          autoFocus
                          type="text"
                          value={editDraft.name}
                          onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                          placeholder="Yemek adı"
                          className={`w-full text-xs px-2.5 py-1.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${theme.ring} text-gray-900 bg-gray-50 focus:bg-white transition-all`}
                        />
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { key: "calories", placeholder: "kcal", label: "Kal" },
                            { key: "protein", placeholder: "g", label: "P" },
                            { key: "carbs", placeholder: "g", label: "K" },
                            { key: "fat", placeholder: "g", label: "Y" },
                          ].map(({ key, placeholder, label }) => (
                            <div key={key}>
                              <p className="text-[9px] text-gray-400 font-bold text-center mb-0.5">{label}</p>
                              <input
                                type="number"
                                min="0"
                                value={editDraft[key as keyof typeof editDraft]}
                                onChange={(e) => setEditDraft((d) => ({ ...d, [key]: e.target.value }))}
                                placeholder={placeholder}
                                className={`w-full text-xs px-2 py-1.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${theme.ring} text-gray-900 text-center bg-gray-50 focus:bg-white transition-all font-semibold`}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="flex-1 py-1.5 text-xs font-bold text-gray-500 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                          >
                            İptal
                          </button>
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={!editDraft.name || !editDraft.calories}
                            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all disabled:opacity-40 ${theme.catActive}`}
                          >
                            ✓ Kaydet
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal view */
                      <div key={idx} className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 shadow-xs group/pending">
                        <span className="text-xs text-gray-700 flex-1 truncate font-medium">{item.name}</span>
                        <span className="text-xs font-bold text-gray-400 shrink-0">{item.calories} kcal</span>
                        <button
                          type="button"
                          onClick={() => startEdit(idx)}
                          className="text-gray-300 hover:text-gray-600 transition-colors w-5 h-5 flex items-center justify-center shrink-0 text-xs opacity-0 group-hover/pending:opacity-100"
                          title="Düzenle"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => removePendingItem(idx)}
                          className="text-gray-300 hover:text-red-400 transition-colors w-5 h-5 flex items-center justify-center shrink-0 text-sm font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Manual entry form */}
            <form onSubmit={handleAddToPending} className="p-5 space-y-3.5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <span>✏️</span> Manuel Ekle
              </p>

              {/* Name input */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Yemek Adı</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Tavuk göğsü, elma..."
                  className={`w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-transparent focus:ring-2 ${theme.ring} text-gray-900 transition-all bg-gray-50 focus:bg-white`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kalori (kcal)</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="250"
                    min="1"
                    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-transparent focus:ring-2 ${theme.ring} text-gray-900 transition-all bg-gray-50 focus:bg-white`}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`w-full py-3 text-sm border-2 rounded-2xl font-bold transition-all duration-200 ${
                      showAdvanced
                        ? `border-transparent ${theme.catActive}`
                        : "border-gray-200 text-gray-600 hover:border-gray-300 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {showAdvanced ? "✓ Makro" : "+ Makro"}
                  </button>
                </div>
              </div>

              {showAdvanced && (
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: "Protein", emoji: "🥩", val: protein, set: setProtein, ring: "focus:ring-rose-400", color: "text-rose-500", bg: "bg-rose-50" },
                    { label: "Karb", emoji: "🍞", val: carbs, set: setCarbs, ring: "focus:ring-amber-400", color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Yağ", emoji: "🫒", val: fat, set: setFat, ring: "focus:ring-sky-400", color: "text-sky-500", bg: "bg-sky-50" },
                  ].map(({ label, emoji, val, set, ring, color, bg }) => (
                    <div key={label} className={`${bg} rounded-2xl p-3`}>
                      <label className={`block text-[9px] font-black uppercase tracking-widest mb-1.5 ${color}`}>
                        {emoji} {label}
                      </label>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        placeholder="0"
                        min="0"
                        className={`w-full px-2.5 py-2 border-2 border-white rounded-xl text-sm focus:outline-none focus:ring-2 ${ring} text-gray-900 bg-white transition-all font-semibold`}
                      />
                      <p className={`text-[9px] mt-1 font-medium ${color} text-center`}>gram</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={!name || !calories}
                  className={`flex-1 py-3 rounded-2xl text-sm font-black transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed border-2 ${theme.catActive} border-transparent`}
                >
                  + Listeye Ekle
                </button>
              </div>
            </form>

            </div>{/* end scrollable middle area */}

            {/* Submit-all footer */}
            {pendingItems.length > 0 && (
              <div className="shrink-0 px-5 pb-5 pt-3 border-t border-gray-100 bg-white">
                <button
                  onClick={handleSubmitAll}
                  disabled={justAdded}
                  className={`w-full py-4 rounded-2xl text-sm font-black transition-all duration-300 ${
                    justAdded
                      ? "bg-green-500 text-white scale-95"
                      : `${theme.submitBtn}`
                  }`}
                >
                  {justAdded
                    ? "✓ Eklendi!"
                    : `${pendingItems.length} yemeği ekle · ${pendingTotal} kcal`}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
