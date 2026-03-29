"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "react-icons/fa";

interface Exercise {
  _id: string;
  date: string;
  type: "cardio" | "strength" | "flexibility" | "other";
  name: string;
  duration: number;
  caloriesBurned: number;
  intensity: "low" | "medium" | "high";
  notes?: string;
}

const exerciseTypes = [
  { value: "cardio", label: "Kardiyo", icon: <FaRunning /> },
  { value: "strength", label: "Kuvvet", icon: <FaDumbbell /> },
  { value: "flexibility", label: "Esneklik", icon: <FaSwimmer /> },
  { value: "other", label: "Diğer", icon: <FaBicycle /> },
];

const commonExercises = [
  { name: "Yürüyüş", type: "cardio", caloriesPer30Min: 120 },
  { name: "Koşu", type: "cardio", caloriesPer30Min: 300 },
  { name: "Bisiklet", type: "cardio", caloriesPer30Min: 200 },
  { name: "Yüzme", type: "cardio", caloriesPer30Min: 250 },
  { name: "Squat", type: "strength", caloriesPer30Min: 180 },
  { name: "Deadlift", type: "strength", caloriesPer30Min: 200 },
  { name: "Bench Press", type: "strength", caloriesPer30Min: 150 },
  { name: "Yoga", type: "flexibility", caloriesPer30Min: 80 },
  { name: "Pilates", type: "flexibility", caloriesPer30Min: 120 },
  { name: "Stretching", type: "flexibility", caloriesPer30Min: 50 },
];

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "cardio" as "cardio" | "strength" | "flexibility" | "other",
    name: "",
    duration: 30,
    caloriesBurned: 0,
    intensity: "medium" as "low" | "medium" | "high",
    notes: "",
  });
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const { success, error } = useToast();

  const fetchExercises = useCallback(async () => {
    try {
      const res = await fetch(`/api/exercises?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setExercises(data);
      }
    } catch (err) {
      console.error("Failed to fetch exercises:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          date: selectedDate,
        }),
      });
      if (res.ok) {
        success("Egzersiz Kaydedildi", "Egzersiziniz başarıyla eklendi.");
        setShowForm(false);
        setFormData({
          type: "cardio",
          name: "",
          duration: 30,
          caloriesBurned: 0,
          intensity: "medium",
          notes: "",
        });
        fetchExercises();
      } else {
        error("Hata", "Egzersiz eklenirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Failed to add exercise:", err);
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
    } catch (err) {
      console.error("Failed to delete exercise:", err);
    }
  };

  const selectCommonExercise = (exercise: (typeof commonExercises)[0]) => {
    const estimated = Math.round(
      (exercise.caloriesPer30Min / 30) * formData.duration,
    );
    setFormData({
      ...formData,
      name: exercise.name,
      type: exercise.type as "cardio" | "strength" | "flexibility" | "other",
      caloriesBurned: estimated,
    });
  };

  const totalCalories = exercises.reduce((acc, e) => acc + e.caloriesBurned, 0);
  const totalDuration = exercises.reduce((acc, e) => acc + e.duration, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaDumbbell className="text-purple-500" />
              Egzersiz Takibi
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Günlük egzersizlerinizi kaydedin
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 md:px-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm md:text-base"
            >
              <FaPlus /> <span className="hidden sm:inline">Egzersiz</span> Ekle
            </button>
          </div>
        </div>

        {/* Daily Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaFire className="text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Yakılan Kalori</p>
                <p className="text-xl font-bold text-gray-900">
                  {totalCalories}
                  <span className="text-sm font-normal text-gray-400">
                    {" "}
                    kcal
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaClock className="text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Toplam Süre</p>
                <p className="text-xl font-bold text-gray-900">
                  {totalDuration}
                  <span className="text-sm font-normal text-gray-400"> dk</span>
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaDumbbell className="text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Egzersiz Sayısı</p>
                <p className="text-xl font-bold text-gray-900">
                  {exercises.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Exercise Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Egzersiz Ekle
              </h2>

              {/* Quick Select */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Hızlı Seçim</p>
                <div className="flex flex-wrap gap-2">
                  {commonExercises.slice(0, 6).map((ex) => (
                    <button
                      key={ex.name}
                      type="button"
                      onClick={() => selectCommonExercise(ex)}
                      className="px-3 py-1 bg-gray-100 hover:bg-purple-100 text-gray-700 rounded-full text-sm transition"
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="text-sm text-gray-600 block mb-2">
                    Tür
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {exerciseTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            type: type.value as Exercise["type"],
                          })
                        }
                        className={`flex flex-col items-center p-3 rounded-lg border-2 transition ${
                          formData.type === type.value
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <span className="text-xl text-purple-500">
                          {type.icon}
                        </span>
                        <span className="text-xs mt-1">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Egzersiz Adı
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    placeholder="Örn: Koşu, Yürüyüş, Squat..."
                  />
                </div>

                {/* Duration & Calories */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Süre (dk)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Yakılan Kalori (kcal)
                    </label>
                    <input
                      type="number"
                      value={formData.caloriesBurned}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          caloriesBurned: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                    />
                  </div>
                </div>

                {/* Intensity */}
                <div>
                  <label className="text-sm text-gray-600 block mb-2">
                    Yoğunluk
                  </label>
                  <div className="flex gap-3">
                    {[
                      { value: "low", label: "Düşük", color: "green" },
                      { value: "medium", label: "Orta", color: "yellow" },
                      { value: "high", label: "Yüksek", color: "red" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            intensity: opt.value as Exercise["intensity"],
                          })
                        }
                        className={`flex-1 py-2 rounded-lg border-2 transition ${
                          formData.intensity === opt.value
                            ? `border-${opt.color}-500 bg-${opt.color}-50`
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Notlar (Opsiyonel)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={2}
                    placeholder="Egzersiz hakkında not..."
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Exercise List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">
            {new Date(selectedDate).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            Egzersizleri
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-12">
              <FaWalking className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Bu tarihte egzersiz kaydı yok</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-purple-500 hover:text-purple-600"
              >
                + Egzersiz Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((exercise) => (
                <div
                  key={exercise._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      {exercise.type === "cardio" && (
                        <FaRunning className="text-purple-500 text-xl" />
                      )}
                      {exercise.type === "strength" && (
                        <FaDumbbell className="text-purple-500 text-xl" />
                      )}
                      {exercise.type === "flexibility" && (
                        <FaSwimmer className="text-purple-500 text-xl" />
                      )}
                      {exercise.type === "other" && (
                        <FaBicycle className="text-purple-500 text-xl" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {exercise.name}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaClock className="text-xs" /> {exercise.duration} dk
                        </span>
                        <span className="flex items-center gap-1">
                          <FaFire className="text-xs text-orange-400" />{" "}
                          {exercise.caloriesBurned} kcal
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            exercise.intensity === "low"
                              ? "bg-green-100 text-green-600"
                              : exercise.intensity === "medium"
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-red-100 text-red-600"
                          }`}
                        >
                          {exercise.intensity === "low"
                            ? "Düşük"
                            : exercise.intensity === "medium"
                              ? "Orta"
                              : "Yüksek"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(exercise._id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
