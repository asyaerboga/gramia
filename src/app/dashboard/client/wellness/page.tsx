"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import {
  FaMoon,
  FaSun,
  FaSmile,
  FaBolt,
  FaBrain,
  FaUtensils,
  FaCheckCircle,
  FaChartLine,
} from "react-icons/fa";

interface Sleep {
  _id?: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  duration: number;
  quality: number;
  notes?: string;
}

interface CheckIn {
  _id?: string;
  date: string;
  mood: number;
  energyLevel: number;
  stressLevel: number;
  hungerLevel: number;
  symptoms: string[];
  notes?: string;
}

const moodEmojis = ["😢", "😔", "😐", "🙂", "😄"];
const moodLabels = ["Çok Kötü", "Kötü", "Normal", "İyi", "Çok İyi"];

const commonSymptoms = [
  "Baş ağrısı",
  "Yorgunluk",
  "Mide bulantısı",
  "Şişkinlik",
  "Eklem ağrısı",
  "Uykusuzluk",
  "Kas ağrısı",
  "Konsantrasyon güçlüğü",
];

export default function WellnessPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [sleep, setSleep] = useState<Sleep | null>(null);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"sleep" | "checkin">("checkin");
  const { success, error } = useToast();

  // Sleep form
  const [sleepForm, setSleepForm] = useState({
    bedTime: "23:00",
    wakeTime: "07:00",
    quality: 3,
    notes: "",
  });

  // CheckIn form
  const [checkInForm, setCheckInForm] = useState({
    mood: 3,
    energyLevel: 3,
    stressLevel: 3,
    hungerLevel: 3,
    symptoms: [] as string[],
    notes: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sleepRes, checkInRes] = await Promise.all([
        fetch(`/api/sleep?date=${selectedDate}`),
        fetch(`/api/checkin?date=${selectedDate}`),
      ]);

      if (sleepRes.ok) {
        const data = await sleepRes.json();
        if (data) {
          setSleep(data);
          setSleepForm({
            bedTime: data.bedTime || "23:00",
            wakeTime: data.wakeTime || "07:00",
            quality: data.quality || 3,
            notes: data.notes || "",
          });
        } else {
          setSleep(null);
        }
      }

      if (checkInRes.ok) {
        const data = await checkInRes.json();
        if (data) {
          setCheckIn(data);
          setCheckInForm({
            mood: data.mood || 3,
            energyLevel: data.energyLevel || 3,
            stressLevel: data.stressLevel || 3,
            hungerLevel: data.hungerLevel || 3,
            symptoms: data.symptoms || [],
            notes: data.notes || "",
          });
        } else {
          setCheckIn(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateDuration = (bed: string, wake: string): number => {
    const [bedH, bedM] = bed.split(":").map(Number);
    const [wakeH, wakeM] = wake.split(":").map(Number);
    let duration = wakeH + wakeM / 60 - (bedH + bedM / 60);
    if (duration < 0) duration += 24;
    return Math.round(duration * 10) / 10;
  };

  const handleSleepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const duration = calculateDuration(sleepForm.bedTime, sleepForm.wakeTime);
      const res = await fetch("/api/sleep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          ...sleepForm,
          duration,
        }),
      });
      if (res.ok) {
        success("Uyku Kaydedildi", "Uyku bilgileriniz güncellendi.");
        fetchData();
      } else {
        error("Hata", "Uyku kaydedilirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Failed to save sleep:", err);
      error("Hata", "Uyku kaydedilirken bir hata oluştu.");
    }
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          ...checkInForm,
        }),
      });
      if (res.ok) {
        success("Check-in Tamamlandı", "Günlük check-in kaydedildi.");
        fetchData();
      } else {
        error("Hata", "Check-in kaydedilirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Failed to save check-in:", err);
      error("Hata", "Check-in kaydedilirken bir hata oluştu.");
    }
  };

  const toggleSymptom = (symptom: string) => {
    setCheckInForm((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaSmile className="text-indigo-500" />
              Sağlık & Uyku Takibi
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Günlük durumunuzu ve uykunuzu takip edin
            </p>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("checkin")}
            className={`flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
              tab === "checkin"
                ? "bg-indigo-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
            }`}
          >
            <FaSmile /> Günlük Check-in
            {checkIn && <FaCheckCircle className="text-green-300" />}
          </button>
          <button
            onClick={() => setTab("sleep")}
            className={`flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
              tab === "sleep"
                ? "bg-indigo-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
            }`}
          >
            <FaMoon /> Uyku Kaydı
            {sleep && <FaCheckCircle className="text-green-300" />}
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>
          </div>
        ) : tab === "checkin" ? (
          /* Check-in Form */
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {isToday ? "Bugün Nasıl Hissediyorsun?" : "Günlük Durum Kaydı"}
              </h2>
              {checkIn && (
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                  Kaydedildi
                </span>
              )}
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-6">
              {/* Mood */}
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                  <FaSmile className="text-yellow-500" /> Ruh Hali
                </label>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setCheckInForm({ ...checkInForm, mood: level })
                      }
                      className={`flex-1 py-3 rounded-xl text-center transition border-2 ${
                        checkInForm.mood === level
                          ? "border-yellow-400 bg-yellow-50"
                          : "border-gray-200 hover:border-yellow-300"
                      }`}
                    >
                      <span className="text-2xl">{moodEmojis[level - 1]}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {moodLabels[level - 1]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Level */}
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                  <FaBolt className="text-purple-500" /> Enerji Seviyesi
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">Düşük</span>
                  <div className="flex-1 flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() =>
                          setCheckInForm({ ...checkInForm, energyLevel: level })
                        }
                        className={`flex-1 h-10 rounded-lg transition ${
                          checkInForm.energyLevel >= level
                            ? "bg-purple-500"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">Yüksek</span>
                </div>
              </div>

              {/* Stress Level */}
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                  <FaBrain className="text-red-500" /> Stres Seviyesi
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">Düşük</span>
                  <div className="flex-1 flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() =>
                          setCheckInForm({ ...checkInForm, stressLevel: level })
                        }
                        className={`flex-1 h-10 rounded-lg transition ${
                          checkInForm.stressLevel >= level
                            ? "bg-red-500"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">Yüksek</span>
                </div>
              </div>

              {/* Hunger Level */}
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                  <FaUtensils className="text-orange-500" /> Açlık Seviyesi
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">Tok</span>
                  <div className="flex-1 flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() =>
                          setCheckInForm({ ...checkInForm, hungerLevel: level })
                        }
                        className={`flex-1 h-10 rounded-lg transition ${
                          checkInForm.hungerLevel >= level
                            ? "bg-orange-500"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">Çok Aç</span>
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <label className="text-sm text-gray-600 block mb-3">
                  Belirtiler (varsa)
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonSymptoms.map((symptom) => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-3 py-1.5 rounded-full text-sm transition ${
                        checkInForm.symptoms.includes(symptom)
                          ? "bg-red-100 text-red-600 border border-red-300"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm text-gray-600 block mb-2">
                  Notlar (opsiyonel)
                </label>
                <textarea
                  value={checkInForm.notes}
                  onChange={(e) =>
                    setCheckInForm({ ...checkInForm, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="Bugün nasıl geçti? Not ekle..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition font-medium"
              >
                {checkIn ? "Güncelle" : "Check-in Yap"}
              </button>
            </form>
          </div>
        ) : (
          /* Sleep Form */
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaMoon className="text-indigo-500" /> Uyku Kaydı
              </h2>
              {sleep && (
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                  Kaydedildi
                </span>
              )}
            </div>

            <form onSubmit={handleSleepSubmit} className="space-y-6">
              {/* Time Inputs */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                    <FaMoon className="text-indigo-400" /> Yatış Saati
                  </label>
                  <input
                    type="time"
                    value={sleepForm.bedTime}
                    onChange={(e) =>
                      setSleepForm({ ...sleepForm, bedTime: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                    <FaSun className="text-yellow-400" /> Uyanış Saati
                  </label>
                  <input
                    type="time"
                    value={sleepForm.wakeTime}
                    onChange={(e) =>
                      setSleepForm({ ...sleepForm, wakeTime: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                  />
                </div>
              </div>

              {/* Duration Preview */}
              <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-center gap-4">
                <FaChartLine className="text-indigo-500 text-xl" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">
                    {calculateDuration(sleepForm.bedTime, sleepForm.wakeTime)}
                  </p>
                  <p className="text-sm text-indigo-500">saat uyku</p>
                </div>
              </div>

              {/* Quality */}
              <div>
                <label className="text-sm text-gray-600 block mb-3">
                  Uyku Kalitesi
                </label>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setSleepForm({ ...sleepForm, quality: star })
                      }
                      className={`flex-1 py-4 rounded-xl text-center transition border-2 ${
                        sleepForm.quality >= star
                          ? "border-yellow-400 bg-yellow-50"
                          : "border-gray-200 hover:border-yellow-300"
                      }`}
                    >
                      <span
                        className={`text-2xl ${
                          sleepForm.quality >= star
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  {sleepForm.quality === 1 && "Çok kötü uyudum"}
                  {sleepForm.quality === 2 && "Kötü uyudum"}
                  {sleepForm.quality === 3 && "Fena değil"}
                  {sleepForm.quality === 4 && "İyi uyudum"}
                  {sleepForm.quality === 5 && "Harika uyudum!"}
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm text-gray-600 block mb-2">
                  Notlar (opsiyonel)
                </label>
                <textarea
                  value={sleepForm.notes}
                  onChange={(e) =>
                    setSleepForm({ ...sleepForm, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="Uyku hakkında not..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition font-medium"
              >
                {sleep ? "Güncelle" : "Uyku Kaydet"}
              </button>
            </form>
          </div>
        )}

        {/* Weekly Summary (if viewing today) */}
        {isToday && (
          <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📊 Bu Hafta Özeti
            </h3>
            <p className="text-sm text-gray-500 text-center py-8">
              Haftalık trend verileri yakında burada!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
