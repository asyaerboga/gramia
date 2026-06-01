"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import {
  FaDumbbell,
  FaFire,
  FaClock,
  FaPlus,
  FaTrash,
  FaRunning,
  FaBicycle,
  FaSwimmer,
  FaWalking,
  FaSearch,
} from "react-icons/fa";

interface Exercise {
  _id: string;
  date: string;
  type: "cardio" | "strength" | "flexibility" | "other";
  name: string;
  duration: number;
  caloriesBurned: number;
  notes?: string;
}

type ExerciseCategory = "cardio" | "strength" | "flexibility" | "other";

interface QuickExercise {
  name: string;
  type: ExerciseCategory;
  calPerMin: number; // kcal per minute
}

/* ── Quick exercise database ─────────────────────────────── */
const QUICK_EXERCISES: Record<string, QuickExercise[]> = {
  "🏃 Kardiyo": [
    { name: "Yürüyüş (normal)", type: "cardio", calPerMin: 4 },
    { name: "Yürüyüş (hızlı)", type: "cardio", calPerMin: 5.5 },
    { name: "Koşu (orta)", type: "cardio", calPerMin: 9 },
    { name: "Koşu (hızlı)", type: "cardio", calPerMin: 13 },
    { name: "Bisiklet (hafif)", type: "cardio", calPerMin: 5 },
    { name: "Bisiklet (orta)", type: "cardio", calPerMin: 8 },
    { name: "Bisiklet (yoğun)", type: "cardio", calPerMin: 12 },
    { name: "Yüzme", type: "cardio", calPerMin: 8 },
    { name: "Atlama İpi", type: "cardio", calPerMin: 13 },
    { name: "HIIT", type: "cardio", calPerMin: 12 },
    { name: "Zumba", type: "cardio", calPerMin: 7 },
    { name: "Aerobik", type: "cardio", calPerMin: 7 },
    { name: "Kickboks", type: "cardio", calPerMin: 11 },
    { name: "Dans", type: "cardio", calPerMin: 6 },
    { name: "Eliptik", type: "cardio", calPerMin: 8 },
    { name: "Kürek Makinesi", type: "cardio", calPerMin: 9 },
    { name: "Tırmanış (dağ)", type: "cardio", calPerMin: 10 },
    { name: "Step Aerobik", type: "cardio", calPerMin: 9 },
  ],
  "💪 Kuvvet": [
    { name: "Squat", type: "strength", calPerMin: 6 },
    { name: "Deadlift", type: "strength", calPerMin: 7 },
    { name: "Bench Press", type: "strength", calPerMin: 5 },
    { name: "Shoulder Press", type: "strength", calPerMin: 5 },
    { name: "Pull-up", type: "strength", calPerMin: 6 },
    { name: "Barbell Row", type: "strength", calPerMin: 6 },
    { name: "Lunge", type: "strength", calPerMin: 6 },
    { name: "Burpee", type: "strength", calPerMin: 10 },
    { name: "Plank", type: "strength", calPerMin: 3 },
    { name: "Karın Kasları", type: "strength", calPerMin: 4 },
    { name: "Push-up", type: "strength", calPerMin: 5 },
    { name: "Ağırlık Antrenmanı", type: "strength", calPerMin: 5 },
    { name: "Kettlebell", type: "strength", calPerMin: 13 },
    { name: "Hip Thrust", type: "strength", calPerMin: 5 },
    { name: "Leg Press", type: "strength", calPerMin: 5 },
  ],
  "🧘 Esneklik": [
    { name: "Yoga", type: "flexibility", calPerMin: 3 },
    { name: "Pilates", type: "flexibility", calPerMin: 4 },
    { name: "Esneme (Stretching)", type: "flexibility", calPerMin: 2 },
    { name: "Foam Rolling", type: "flexibility", calPerMin: 2 },
    { name: "Tai Chi", type: "flexibility", calPerMin: 3 },
    { name: "Meditasyon", type: "flexibility", calPerMin: 1.5 },
  ],
  "⚽ Spor": [
    { name: "Futbol", type: "other", calPerMin: 9 },
    { name: "Basketbol", type: "other", calPerMin: 10 },
    { name: "Tenis", type: "other", calPerMin: 8 },
    { name: "Voleybol", type: "other", calPerMin: 6 },
    { name: "Badminton", type: "other", calPerMin: 7 },
    { name: "Yüzme (yavaş)", type: "other", calPerMin: 6 },
    { name: "Masa Tenisi", type: "other", calPerMin: 4 },
    { name: "Boks", type: "other", calPerMin: 12 },
    { name: "Güreş", type: "other", calPerMin: 11 },
    { name: "Bisiklet (dışarıda)", type: "other", calPerMin: 8 },
  ],
};

const ALL_CATEGORY = "⭐ Tümü";
const CATEGORY_KEYS = Object.keys(QUICK_EXERCISES);

const exerciseTypeLabels: Record<ExerciseCategory, string> = {
  cardio: "Kardiyo",
  strength: "Kuvvet",
  flexibility: "Esneklik",
  other: "Diğer",
};

/* ── Component ───────────────────────────────────────────── */
export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [exType, setExType] = useState<ExerciseCategory>("cardio");
  const [exName, setExName] = useState("");
  const [duration, setDuration] = useState(30);
  const [calBurned, setCalBurned] = useState(0);
  const [notes, setNotes] = useState("");

  // Quick-select state
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [search, setSearch] = useState("");
  // Tracks kcal/min of the selected quick exercise so duration changes auto-update calories
  const calRateRef = useRef<number | null>(null);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const { success, error } = useToast();

  /* ── Data fetching ─────────────────────────────── */
  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exercises?date=${selectedDate}`);
      if (res.ok) setExercises(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchExercises(); }, [fetchExercises]);

  /* ── Quick exercise select ─────────────────────── */
  const allExercises: QuickExercise[] = CATEGORY_KEYS.flatMap(
    (k) => QUICK_EXERCISES[k],
  );

  const displayedExercises = (() => {
    const base = activeCategory === ALL_CATEGORY
      ? allExercises
      : QUICK_EXERCISES[activeCategory] ?? [];
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((e) => e.name.toLowerCase().includes(q));
  })();

  const selectQuickExercise = (ex: QuickExercise) => {
    calRateRef.current = ex.calPerMin;
    setExName(ex.name);
    setExType(ex.type);
    setCalBurned(Math.round(ex.calPerMin * duration));
  };

  /* ── Duration change: auto-recalculate ────────── */
  const handleDurationChange = (val: number) => {
    setDuration(val);
    if (calRateRef.current !== null && val > 0) {
      setCalBurned(Math.round(calRateRef.current * val));
    }
  };

  /* ── Submit ────────────────────────────────────── */
  const resetForm = () => {
    setExType("cardio");
    setExName("");
    setDuration(30);
    setCalBurned(0);
    setNotes("");
    setSearch("");
    setActiveCategory(ALL_CATEGORY);
    calRateRef.current = null;
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: exType,
          name: exName,
          duration,
          caloriesBurned: calBurned,
          notes,
          date: selectedDate,
        }),
      });
      if (res.ok) {
        success("Egzersiz Kaydedildi", "Egzersiziniz başarıyla eklendi.");
        resetForm();
        fetchExercises();
      } else {
        error("Hata", "Egzersiz eklenirken bir hata oluştu.");
      }
    } catch (err) {
      console.error(err);
      error("Hata", "Egzersiz eklenirken bir hata oluştu.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/exercises?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        success("Silindi", "Egzersiz kaydı silindi.");
        fetchExercises();
      }
    } catch (err) { console.error(err); }
  };

  const totalCalories = exercises.reduce((a, e) => a + (e.caloriesBurned || 0), 0);
  const totalDuration = exercises.reduce((a, e) => a + e.duration, 0);

  /* ── Render ────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaDumbbell className="text-purple-500" />
              Egzersiz Takibi
            </h1>
            <p className="text-gray-500 text-sm mt-1">Günlük egzersizlerinizi kaydedin</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm"
            >
              <FaPlus /> <span className="hidden sm:inline">Egzersiz</span> Ekle
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaFire className="text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Yakılan Kalori</p>
              <p className="text-xl font-bold text-gray-900">{totalCalories} <span className="text-sm font-normal text-gray-400">kcal</span></p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaClock className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Toplam Süre</p>
              <p className="text-xl font-bold text-gray-900">{totalDuration} <span className="text-sm font-normal text-gray-400">dk</span></p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaDumbbell className="text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Egzersiz Sayısı</p>
              <p className="text-xl font-bold text-gray-900">{exercises.length}</p>
            </div>
          </div>
        </div>

        {/* Exercise list */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">
            {new Date(selectedDate).toLocaleDateString("tr-TR", { day:"numeric", month:"long", year:"numeric" })} Egzersizleri
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-12">
              <FaWalking className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Bu tarihte egzersiz kaydı yok</p>
              <button onClick={() => setShowForm(true)} className="mt-4 text-purple-500 hover:text-purple-600 text-sm">
                + Egzersiz Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((ex) => (
                <div key={ex._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      {ex.type === "cardio" && <FaRunning className="text-purple-500 text-xl" />}
                      {ex.type === "strength" && <FaDumbbell className="text-purple-500 text-xl" />}
                      {ex.type === "flexibility" && <FaSwimmer className="text-purple-500 text-xl" />}
                      {ex.type === "other" && <FaBicycle className="text-purple-500 text-xl" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{ex.name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaClock className="text-xs" /> {ex.duration} dk
                        </span>
                        {ex.caloriesBurned > 0 && (
                          <span className="flex items-center gap-1">
                            <FaFire className="text-xs text-orange-400" /> {ex.caloriesBurned} kcal
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                          {exerciseTypeLabels[ex.type]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(ex._id)} className="p-2 text-gray-400 hover:text-red-500 transition">
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Exercise Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Egzersiz Ekle</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {/* Quick select */}
            <div className="bg-gray-50 border-b border-gray-100 px-4 pt-3 pb-2">
              <p className="text-xs font-medium text-gray-500 mb-2">⚡ Hızlı Seçim</p>

              {/* Search */}
              <div className="relative mb-2">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Egzersiz ara..."
                  className="w-full pl-8 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Category tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {[ALL_CATEGORY, ...CATEGORY_KEYS].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setSearch(""); }}
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${
                      activeCategory === cat
                        ? "bg-purple-500 text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise buttons */}
            <div className="px-4 pb-2 pt-2 max-h-40 overflow-y-auto bg-gray-50 border-b border-gray-100">
              {displayedExercises.length === 0 ? (
                <p className="text-xs text-gray-400 py-2 text-center">Sonuç bulunamadı</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {displayedExercises.map((ex) => (
                    <button
                      key={ex.name}
                      type="button"
                      onClick={() => selectQuickExercise(ex)}
                      title={`~${ex.calPerMin} kcal/dk`}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition ${
                        exName === ex.name
                          ? "bg-purple-500 text-white border-purple-500"
                          : "bg-white text-gray-700 border-gray-200 hover:border-purple-400 hover:bg-purple-50"
                      }`}
                    >
                      {ex.name}
                      <span className="ml-1 opacity-60">{ex.calPerMin}k/dk</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">

              {/* Name */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">Egzersiz Adı</label>
                <input
                  type="text"
                  value={exName}
                  onChange={(e) => { setExName(e.target.value); calRateRef.current = null; }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                  placeholder="Örn: Koşu, Yürüyüş, Squat..."
                />
              </div>

              {/* Duration + Calories */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Süre (dakika)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Yakılan Kalori (kcal)
                    {calRateRef.current && (
                      <span className="ml-1 text-xs text-purple-500">otomatik</span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={calBurned}
                    onChange={(e) => { calRateRef.current = null; setCalBurned(parseInt(e.target.value) || 0); }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    min="0"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">Notlar (Opsiyonel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  rows={2}
                  placeholder="Egzersiz hakkında not..."
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={resetForm}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                  İptal
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm font-medium">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
