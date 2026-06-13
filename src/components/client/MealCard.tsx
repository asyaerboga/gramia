"use client";

import { useState, useMemo } from "react";
import { FaPlus, FaFire, FaSearch, FaCheck } from "react-icons/fa";

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
  satietyLevel?: number;
  onSetSatiety: (mealType: string, level: number) => void;
  isPast?: boolean;
}

type QuickFood = { name: string; calories: number; protein: number; carbs: number; fat: number };

const quickFoodCategories: Record<string, QuickFood[]> = {
  "🥣 Kahvaltı": [
    { name: "Yumurta (haşlanmış, 1 adet)", calories: 78, protein: 6, carbs: 1, fat: 5 },
    { name: "Yumurta (sahanda, 1 adet)", calories: 90, protein: 6, carbs: 1, fat: 7 },
    { name: "Menemen (1 porsiyon)", calories: 200, protein: 10, carbs: 8, fat: 14 },
    { name: "Ekmek (tam buğday, 1 dilim)", calories: 80, protein: 4, carbs: 15, fat: 1 },
    { name: "Ekmek (beyaz, 1 dilim)", calories: 70, protein: 2, carbs: 13, fat: 1 },
    { name: "Simit (1 adet)", calories: 230, protein: 7, carbs: 46, fat: 2 },
    { name: "Poğaça (1 adet)", calories: 250, protein: 6, carbs: 30, fat: 12 },
    { name: "Peynir (beyaz, 30g)", calories: 75, protein: 5, carbs: 1, fat: 6 },
    { name: "Peynir (kaşar, 30g)", calories: 110, protein: 7, carbs: 0, fat: 9 },
    { name: "Peynir (lor, 50g)", calories: 60, protein: 7, carbs: 2, fat: 3 },
    { name: "Zeytin (10 adet)", calories: 60, protein: 0, carbs: 1, fat: 6 },
    { name: "Domates (1 orta boy)", calories: 25, protein: 1, carbs: 5, fat: 0 },
    { name: "Salatalık (1 adet)", calories: 15, protein: 1, carbs: 3, fat: 0 },
    { name: "Bal (1 yemek kaşığı)", calories: 64, protein: 0, carbs: 17, fat: 0 },
    { name: "Tereyağı (1 tatlı kaşığı)", calories: 72, protein: 0, carbs: 0, fat: 8 },
    { name: "Reçel (1 yemek kaşığı)", calories: 56, protein: 0, carbs: 14, fat: 0 },
    { name: "Tahin (1 yemek kaşığı)", calories: 89, protein: 3, carbs: 4, fat: 8 },
    { name: "Sucuk (2 dilim)", calories: 160, protein: 7, carbs: 1, fat: 14 },
  ],
  "🍗 Et & Protein": [
    { name: "Tavuk göğsü (100g)", calories: 165, protein: 31, carbs: 0, fat: 4 },
    { name: "Tavuk but (100g, deri yok)", calories: 175, protein: 28, carbs: 0, fat: 7 },
    { name: "Tavuk çorba (1 kase)", calories: 120, protein: 12, carbs: 10, fat: 4 },
    { name: "Izgara tavuk (1 porsiyon)", calories: 200, protein: 38, carbs: 0, fat: 5 },
    { name: "Kırmızı et (100g, yağsız)", calories: 190, protein: 26, carbs: 0, fat: 10 },
    { name: "Köfte (3 adet)", calories: 180, protein: 18, carbs: 5, fat: 10 },
    { name: "Izgara köfte (1 porsiyon)", calories: 220, protein: 24, carbs: 5, fat: 12 },
    { name: "Balık (levrek, 100g ızgara)", calories: 97, protein: 19, carbs: 0, fat: 2 },
    { name: "Balık (somon, 100g)", calories: 208, protein: 20, carbs: 0, fat: 13 },
    { name: "Balık (hamsi, 100g)", calories: 130, protein: 20, carbs: 0, fat: 5 },
    { name: "Ton balığı (1 kutu, su ile)", calories: 120, protein: 28, carbs: 0, fat: 1 },
    { name: "Karides (100g)", calories: 85, protein: 18, carbs: 1, fat: 1 },
    { name: "Hindi (100g)", calories: 135, protein: 30, carbs: 0, fat: 1 },
    { name: "Sosis (1 adet)", calories: 100, protein: 5, carbs: 2, fat: 9 },
    { name: "Yumurta (haşlanmış, 2 adet)", calories: 156, protein: 12, carbs: 2, fat: 10 },
  ],
  "🥗 Sebze & Salata": [
    { name: "Yeşil salata (1 porsiyon)", calories: 30, protein: 2, carbs: 5, fat: 0 },
    { name: "Çoban salatası (1 porsiyon)", calories: 65, protein: 2, carbs: 10, fat: 2 },
    { name: "Sezar salata (1 porsiyon)", calories: 180, protein: 7, carbs: 10, fat: 14 },
    { name: "Mercimek çorbası (1 kase)", calories: 150, protein: 8, carbs: 25, fat: 3 },
    { name: "Domates çorbası (1 kase)", calories: 100, protein: 3, carbs: 15, fat: 4 },
    { name: "Sebze çorbası (1 kase)", calories: 80, protein: 3, carbs: 12, fat: 2 },
    { name: "Brokoli (100g, buharda)", calories: 34, protein: 3, carbs: 7, fat: 0 },
    { name: "Havuç (1 orta boy)", calories: 30, protein: 1, carbs: 7, fat: 0 },
    { name: "Ispanak (100g, pişmiş)", calories: 41, protein: 5, carbs: 4, fat: 0 },
    { name: "Patates (1 orta boy, haşlanmış)", calories: 130, protein: 3, carbs: 30, fat: 0 },
    { name: "Tatlı patates (100g)", calories: 90, protein: 2, carbs: 21, fat: 0 },
    { name: "Biber dolması (2 adet)", calories: 180, protein: 8, carbs: 22, fat: 7 },
    { name: "Zeytinyağlı fasulye (1 porsiyon)", calories: 160, protein: 5, carbs: 20, fat: 7 },
    { name: "Karnıyarık (1 porsiyon)", calories: 250, protein: 12, carbs: 18, fat: 15 },
    { name: "İmam bayıldı (1 porsiyon)", calories: 180, protein: 3, carbs: 15, fat: 12 },
    { name: "Türlü (1 porsiyon)", calories: 120, protein: 4, carbs: 18, fat: 5 },
    { name: "Bezelye (100g)", calories: 80, protein: 5, carbs: 15, fat: 0 },
    { name: "Mısır (1 koçan)", calories: 130, protein: 5, carbs: 27, fat: 2 },
  ],
  "🍚 Karbonhidrat": [
    { name: "Pilav (1 porsiyon, 200g)", calories: 200, protein: 4, carbs: 45, fat: 1 },
    { name: "Bulgur pilavı (1 porsiyon)", calories: 180, protein: 5, carbs: 38, fat: 2 },
    { name: "Makarna (1 porsiyon, 200g)", calories: 220, protein: 8, carbs: 44, fat: 2 },
    { name: "Makarna (tam buğday, 200g)", calories: 200, protein: 8, carbs: 40, fat: 2 },
    { name: "Lazanya (1 porsiyon)", calories: 350, protein: 15, carbs: 40, fat: 15 },
    { name: "Börek (ıspanaklı, 1 dilim)", calories: 280, protein: 8, carbs: 25, fat: 17 },
    { name: "Börek (peynirli, 1 dilim)", calories: 300, protein: 10, carbs: 25, fat: 18 },
    { name: "Su böreği (1 dilim)", calories: 260, protein: 10, carbs: 28, fat: 13 },
    { name: "Gözleme (peynirli, 1 adet)", calories: 320, protein: 12, carbs: 35, fat: 16 },
    { name: "Gözleme (ıspanaklı, 1 adet)", calories: 280, protein: 10, carbs: 33, fat: 13 },
    { name: "Pide (1 dilim)", calories: 250, protein: 8, carbs: 40, fat: 8 },
    { name: "Lahmacun (1 adet)", calories: 200, protein: 10, carbs: 30, fat: 6 },
    { name: "Döner (et, 1 porsiyon)", calories: 400, protein: 30, carbs: 10, fat: 26 },
    { name: "Sandviç (tam buğday)", calories: 280, protein: 15, carbs: 35, fat: 8 },
    { name: "Ekmek (2 dilim)", calories: 160, protein: 6, carbs: 30, fat: 2 },
    { name: "Baklava (2 dilim)", calories: 450, protein: 5, carbs: 55, fat: 25 },
  ],
  "🥛 Süt & Yoğurt": [
    { name: "Yoğurt (sade, 150g)", calories: 90, protein: 8, carbs: 10, fat: 2 },
    { name: "Yoğurt (tam yağlı, 150g)", calories: 130, protein: 7, carbs: 9, fat: 7 },
    { name: "Yoğurt (meyveli, 125g)", calories: 120, protein: 5, carbs: 20, fat: 2 },
    { name: "Süzme yoğurt (100g)", calories: 100, protein: 10, carbs: 5, fat: 4 },
    { name: "Ayran (1 bardak, 250ml)", calories: 60, protein: 4, carbs: 5, fat: 2 },
    { name: "Süt (yarım yağlı, 1 bardak)", calories: 100, protein: 8, carbs: 12, fat: 3 },
    { name: "Süt (tam yağlı, 1 bardak)", calories: 150, protein: 8, carbs: 11, fat: 8 },
    { name: "Kefir (1 bardak)", calories: 100, protein: 8, carbs: 10, fat: 3 },
    { name: "Sütlaç (1 porsiyon)", calories: 200, protein: 6, carbs: 38, fat: 4 },
    { name: "Muhallebi (1 porsiyon)", calories: 190, protein: 5, carbs: 35, fat: 4 },
    { name: "Kazandibi (1 porsiyon)", calories: 220, protein: 6, carbs: 40, fat: 5 },
  ],
  "🍎 Meyve": [
    { name: "Elma (1 orta boy)", calories: 95, protein: 0, carbs: 25, fat: 0 },
    { name: "Muz (1 adet)", calories: 105, protein: 1, carbs: 27, fat: 0 },
    { name: "Portakal (1 adet)", calories: 65, protein: 1, carbs: 16, fat: 0 },
    { name: "Mandalina (2 adet)", calories: 70, protein: 1, carbs: 18, fat: 0 },
    { name: "Üzüm (1 küçük salkım, 100g)", calories: 70, protein: 1, carbs: 18, fat: 0 },
    { name: "Çilek (100g)", calories: 32, protein: 1, carbs: 8, fat: 0 },
    { name: "Karpuz (2 dilim, 200g)", calories: 60, protein: 1, carbs: 15, fat: 0 },
    { name: "Kavun (2 dilim, 200g)", calories: 55, protein: 1, carbs: 13, fat: 0 },
    { name: "Armut (1 adet)", calories: 100, protein: 1, carbs: 27, fat: 0 },
    { name: "Şeftali (1 adet)", calories: 60, protein: 1, carbs: 14, fat: 0 },
    { name: "Kiraz (10 adet)", calories: 50, protein: 1, carbs: 12, fat: 0 },
    { name: "Kivi (1 adet)", calories: 50, protein: 1, carbs: 12, fat: 0 },
    { name: "Ananas (2 dilim)", calories: 80, protein: 1, carbs: 20, fat: 0 },
    { name: "Nar (1 adet)", calories: 130, protein: 2, carbs: 31, fat: 1 },
    { name: "İncir (2 adet)", calories: 80, protein: 1, carbs: 20, fat: 0 },
    { name: "Hurma (3 adet)", calories: 100, protein: 1, carbs: 25, fat: 0 },
  ],
  "🌰 Kuruyemiş & Atıştırmalık": [
    { name: "Badem (10 adet)", calories: 70, protein: 3, carbs: 3, fat: 6 },
    { name: "Ceviz (4 yarım)", calories: 100, protein: 2, carbs: 2, fat: 10 },
    { name: "Fıstık (1 avuç, 30g)", calories: 170, protein: 7, carbs: 6, fat: 14 },
    { name: "Fındık (10 adet)", calories: 90, protein: 2, carbs: 2, fat: 9 },
    { name: "Antep fıstığı (1 avuç)", calories: 160, protein: 6, carbs: 8, fat: 13 },
    { name: "Leblebi (1 avuç, 30g)", calories: 120, protein: 6, carbs: 20, fat: 2 },
    { name: "Kaju (10 adet)", calories: 90, protein: 2, carbs: 5, fat: 7 },
    { name: "Kuru incir (3 adet)", calories: 110, protein: 1, carbs: 28, fat: 0 },
    { name: "Kuru kayısı (5 adet)", calories: 80, protein: 1, carbs: 21, fat: 0 },
    { name: "Kuru üzüm (1 avuç)", calories: 90, protein: 1, carbs: 23, fat: 0 },
    { name: "Bisküvi (petit beurre, 3 adet)", calories: 90, protein: 1, carbs: 15, fat: 3 },
    { name: "Gofret (1 adet)", calories: 130, protein: 2, carbs: 18, fat: 6 },
    { name: "Çikolata (sütlü, 2 kare)", calories: 100, protein: 1, carbs: 11, fat: 6 },
    { name: "Çikolata (bitter, 2 kare)", calories: 90, protein: 1, carbs: 9, fat: 6 },
    { name: "Kraker (5 adet)", calories: 80, protein: 2, carbs: 14, fat: 2 },
    { name: "Mısır cipsi (küçük paket)", calories: 150, protein: 2, carbs: 20, fat: 7 },
    { name: "Granola bar (1 adet)", calories: 200, protein: 4, carbs: 30, fat: 7 },
  ],
  "🥤 İçecek": [
    { name: "Su (1 bardak)", calories: 0, protein: 0, carbs: 0, fat: 0 },
    { name: "Çay (şekersiz)", calories: 2, protein: 0, carbs: 0, fat: 0 },
    { name: "Çay (1 şekerli)", calories: 30, protein: 0, carbs: 8, fat: 0 },
    { name: "Türk kahvesi (sade)", calories: 5, protein: 0, carbs: 0, fat: 0 },
    { name: "Türk kahvesi (orta şekerli)", calories: 30, protein: 0, carbs: 7, fat: 0 },
    { name: "Filtre kahve (sütlü)", calories: 50, protein: 2, carbs: 5, fat: 2 },
    { name: "Latte (orta boy)", calories: 150, protein: 8, carbs: 15, fat: 6 },
    { name: "Taze sıkılmış portakal suyu (1 bardak)", calories: 110, protein: 2, carbs: 26, fat: 0 },
    { name: "Meyve suyu (hazır, 1 kutu)", calories: 130, protein: 0, carbs: 32, fat: 0 },
    { name: "Kola (1 kutu, 330ml)", calories: 140, protein: 0, carbs: 39, fat: 0 },
    { name: "Kola (light, 1 kutu)", calories: 2, protein: 0, carbs: 0, fat: 0 },
    { name: "Limonata (1 bardak)", calories: 100, protein: 0, carbs: 25, fat: 0 },
    { name: "Protein shake (1 porsiyon)", calories: 150, protein: 25, carbs: 8, fat: 3 },
  ],
};

const ALL_KEY = "⭐ Tümü";
const CATEGORY_KEYS = Object.keys(quickFoodCategories);

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
  const [selectedFood, setSelectedFood] = useState<QuickFood | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const theme = mealThemes[mealType as keyof typeof mealThemes] ?? mealThemes.lunch;
  const meta = mealMeta[mealType] ?? mealMeta.lunch;

  const total = items.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = items.reduce((sum, item) => sum + (item.protein || 0), 0);
  const totalCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const totalFat = items.reduce((sum, item) => sum + (item.fat || 0), 0);

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
      setJustAdded(true);
      setTimeout(() => {
        setJustAdded(false);
        resetForm();
      }, 800);
    }
  };

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
    setSelectedFood(null);
    setJustAdded(false);
  };

  const selectQuickFood = (food: QuickFood) => {
    setSelectedFood(food);
    setName(food.name);
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFat(food.fat.toString());
    setShowAdvanced(true);
  };

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
                <button
                  onClick={resetForm}
                  className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all backdrop-blur-sm border border-white/20 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick food section */}
            <div className="shrink-0 border-b border-gray-100 bg-gray-50/50">
              <div className="px-5 pt-4 pb-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span>⚡</span> Hızlı Seçim
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
                      const isSelected = selectedFood?.name === food.name;
                      return (
                        <button
                          key={food.name}
                          type="button"
                          onClick={() => selectQuickFood(food)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left transition-all duration-200 group ${
                            isSelected
                              ? `${theme.selectedFood} border-2`
                              : "hover:bg-white border-2 border-transparent"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate ${isSelected ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"}`}>
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
                            {isSelected && (
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center ${theme.catActive} text-white`}>
                                <FaCheck className="text-[8px]" />
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1">

              {/* Selected food preview chip */}
              {selectedFood && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 ${theme.selectedFood}`}>
                  <div className={`w-8 h-8 rounded-xl ${theme.iconBg} flex items-center justify-center text-base`}>
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Seçilen yemek</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{selectedFood.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedFood(null); setName(""); setCalories(""); setProtein(""); setCarbs(""); setFat(""); setShowAdvanced(false); }}
                    className="text-gray-400 hover:text-gray-600 text-xs p-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Name input */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Yemek Adı</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Tavuk göğsü, elma..."
                  required
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
                    required
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
                  disabled={justAdded}
                  className={`flex-1 py-3 rounded-2xl text-sm font-black transition-all duration-300 ${
                    justAdded
                      ? "bg-green-500 text-white scale-95"
                      : `${theme.submitBtn}`
                  }`}
                >
                  {justAdded ? "✓ Eklendi!" : "Kaydet"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
