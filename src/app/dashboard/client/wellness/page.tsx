"use client";

import { useState, useEffect, useCallback } from "react";
import DatePickerModern from "@/components/shared/DatePickerModern";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { FaMoon, FaSun, FaCheckCircle } from "react-icons/fa";

function getLocalDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface BloodTestRecord {
  _id: string;
  imageUrl: string;
  originalName: string;
  notes?: string;
  testDate: string;
}

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

const moodConfig = [
  { emoji: "😢", label: "Çok Kötü", activeCls: "border-rose-400 bg-gradient-to-b from-rose-50 to-red-50 ring-2 ring-rose-200" },
  { emoji: "😔", label: "Kötü",     activeCls: "border-orange-400 bg-gradient-to-b from-orange-50 to-amber-50 ring-2 ring-orange-200" },
  { emoji: "😐", label: "Normal",   activeCls: "border-yellow-400 bg-gradient-to-b from-yellow-50 to-amber-50 ring-2 ring-yellow-200" },
  { emoji: "🙂", label: "İyi",      activeCls: "border-emerald-400 bg-gradient-to-b from-emerald-50 to-teal-50 ring-2 ring-emerald-200" },
  { emoji: "😄", label: "Çok İyi",  activeCls: "border-indigo-400 bg-gradient-to-b from-indigo-50 to-violet-50 ring-2 ring-indigo-200" },
];

const moodEmojis = moodConfig.map((m) => m.emoji);

const energyConfig = [
  { emoji: "😴", label: "Yorgun" },
  { emoji: "😪", label: "Az" },
  { emoji: "😊", label: "Normal" },
  { emoji: "⚡", label: "Enerjik" },
  { emoji: "🔥", label: "Süper!" },
];

const stressConfig = [
  { emoji: "😌", label: "Rahat" },
  { emoji: "🙂", label: "Sakin" },
  { emoji: "😐", label: "Orta" },
  { emoji: "😰", label: "Stresli" },
  { emoji: "🤯", label: "Bunaldım" },
];

const hungerConfig = [
  { emoji: "🥱", label: "Tok" },
  { emoji: "😌", label: "İyi" },
  { emoji: "😐", label: "Normal" },
  { emoji: "😋", label: "Açım" },
  { emoji: "🍽️", label: "Çok Açım" },
];

const symptomMap: Record<string, string> = {
  "Baş ağrısı": "🤕",
  "Yorgunluk": "😴",
  "Mide bulantısı": "🤢",
  "Şişkinlik": "😮‍💨",
  "Eklem ağrısı": "🦴",
  "Uykusuzluk": "🌙",
  "Kas ağrısı": "💪",
  "Konsantrasyon güçlüğü": "🧠",
};

const commonSymptoms = Object.keys(symptomMap);

function LevelRow({
  config, value, onChange, activeCls,
}: {
  config: { emoji: string; label: string }[];
  value: number;
  onChange: (v: number) => void;
  activeCls: string;
}) {
  return (
    <div className="flex gap-2">
      {config.map(({ emoji, label }, i) => {
        const level = i + 1;
        const active = value === level;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all duration-150 ${
              active ? `${activeCls} scale-105 shadow-sm` : "border-gray-100 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <span className={`text-xl transition-transform ${active ? "scale-125 inline-block" : ""}`}>{emoji}</span>
            <span className={`text-[10px] font-semibold leading-tight ${active ? "" : "text-gray-400"}`}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SleepArc({ duration }: { duration: number }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(duration, 0), 12);
  const pct = clamped / 12;
  const dash = pct * circumference;
  const color = clamped >= 7 ? "#818cf8" : clamped >= 6 ? "#c4b5fd" : "#f87171";
  const label = clamped >= 7 ? "Yeterli uyku 🌟" : clamped >= 6 ? "Biraz az 😪" : "Yetersiz 😔";

  return (
    <div className="flex flex-col items-center gap-2 py-6">
      <svg width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx="72" cy="72" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 72 72)"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
        <text x="72" y="66" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="sans-serif">
          {duration}
        </text>
        <text x="72" y="84" textAnchor="middle" fill="rgba(199,210,254,0.8)" fontSize="11" fontFamily="sans-serif">
          saat uyku
        </text>
      </svg>
      <span className="text-indigo-200 text-xs font-medium">{label}</span>
    </div>
  );
}

export default function WellnessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr);
  const [sleep, setSleep] = useState<Sleep | null>(null);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);
  const initialTab = (searchParams.get("tab") as "sleep" | "checkin" | "health") || "checkin";
  const [tab, setTab] = useState<"sleep" | "checkin" | "health">(initialTab);

  const [weeklySleep, setWeeklySleep] = useState<Sleep[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);

  const [chronicDiseases, setChronicDiseases] = useState<string[]>([]);
  const [bloodTests, setBloodTests] = useState<BloodTestRecord[]>([]);
  const [healthLoading, setHealthLoading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const { success, error } = useToast();

  const [sleepForm, setSleepForm] = useState({
    bedTime: "23:00",
    wakeTime: "07:00",
    quality: 3,
    notes: "",
  });

  const [checkInForm, setCheckInForm] = useState({
    mood: 3,
    energyLevel: 3,
    stressLevel: 3,
    hungerLevel: 3,
    symptoms: [] as string[],
    notes: "",
  });

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/client/health");
      if (res.ok) {
        const data = await res.json();
        setChronicDiseases(data.chronicDiseases || []);
        setBloodTests(data.bloodTests || []);
      }
    } catch (err) {
      console.error("Failed to fetch health:", err);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const fetchWeeklySleep = useCallback(async () => {
    try {
      const res = await fetch("/api/sleep");
      if (res.ok) {
        const data: Sleep[] = await res.json();
        setWeeklySleep(data.slice(0, 7));
      }
    } catch { /* ignore */ }
  }, []);

  const fetchRecentCheckIns = useCallback(async () => {
    try {
      const res = await fetch("/api/checkin");
      if (res.ok) {
        const data: CheckIn[] = await res.json();
        setRecentCheckIns(data);
      }
    } catch { /* ignore */ }
  }, []);

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
          setSleepForm({ bedTime: data.bedTime || "23:00", wakeTime: data.wakeTime || "07:00", quality: data.quality || 3, notes: data.notes || "" });
        } else {
          setSleep(null);
          setSleepForm({ bedTime: "23:00", wakeTime: "07:00", quality: 3, notes: "" });
        }
      }

      if (checkInRes.ok) {
        const data = await checkInRes.json();
        if (data) {
          setCheckIn(data);
          setCheckInForm({ mood: data.mood || 3, energyLevel: data.energyLevel || 3, stressLevel: data.stressLevel || 3, hungerLevel: data.hungerLevel || 3, symptoms: data.symptoms || [], notes: data.notes || "" });
        } else {
          setCheckIn(null);
          setCheckInForm({ mood: 3, energyLevel: 3, stressLevel: 3, hungerLevel: 3, symptoms: [], notes: "" });
        }
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchWeeklySleep(); fetchRecentCheckIns(); }, [fetchWeeklySleep, fetchRecentCheckIns]);
  useEffect(() => { if (tab === "health") fetchHealth(); }, [tab, fetchHealth]);

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
        body: JSON.stringify({ date: selectedDate, ...sleepForm, duration }),
      });
      if (res.ok) {
        success("Uyku Kaydedildi", "Uyku bilgileriniz güncellendi.");
        fetchData();
        fetchWeeklySleep();
        router.refresh();
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
        body: JSON.stringify({ date: selectedDate, ...checkInForm }),
      });
      if (res.ok) {
        success("Check-in Tamamlandı", "Günlük check-in kaydedildi.");
        fetchData();
        fetchRecentCheckIns();
        router.refresh();
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

  const isToday = selectedDate === getLocalDateStr();
  const duration = calculateDuration(sleepForm.bedTime, sleepForm.wakeTime);

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: "linear-gradient(150deg,#eef2ff 0%,#faf5ff 55%,#ecfdf5 100%)" }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span className="bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Sağlık & Uyku Takibi
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Günlük durumunuzu ve uykunuzu takip edin</p>
          </div>
          <DatePickerModern value={selectedDate} onChange={setSelectedDate} max={getLocalDateStr()} />
        </div>

        {/* Segment control tabs */}
        <div className="bg-white/60 backdrop-blur-sm border border-white rounded-2xl p-1 flex gap-1 mb-6 shadow-sm">
          {[
            { key: "checkin", icon: "😊", label: "Günlük Check-in", done: !!checkIn },
            { key: "sleep",   icon: "🌙", label: "Uyku Kaydı",      done: !!sleep },
            { key: "health",  icon: "💊", label: "Sağlık",          done: false },
          ].map(({ key, icon, label, done }) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
              className={`flex-1 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-1.5 text-sm ${
                tab === key
                  ? "bg-white text-gray-900 shadow-md"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
              {done && <FaCheckCircle className="text-emerald-500 text-[10px]" />}
            </button>
          ))}
        </div>

        {/* ─── HEALTH TAB ─── */}
        {tab === "health" ? (
          healthLoading ? (
            <div className="bg-white rounded-3xl p-8 shadow-sm animate-pulse space-y-4">
              <div className="h-8 bg-gray-100 rounded w-1/3" />
              <div className="h-32 bg-gray-100 rounded" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Kronik Hastalıklar */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-base">🏥</span>
                  Kronik Hastalıklarım
                </h2>
                {chronicDiseases.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <span className="text-4xl mb-2">🩺</span>
                    <p className="text-sm text-gray-400">Diyetisyeniniz henüz kronik hastalık kaydı eklememiş.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {chronicDiseases.map((d) => (
                      <span key={d} className="px-4 py-2 bg-linear-to-r from-red-50 to-rose-50 text-red-700 border border-red-200 rounded-2xl text-sm font-medium shadow-sm">
                        🔴 {d}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
                  <span>ℹ️</span> Bu bilgiler diyetisyeniniz tarafından girilmektedir.
                </p>
              </div>

              {/* Kan Tahlilleri */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-base">🔬</span>
                  Kan Tahlillerim
                </h2>
                {bloodTests.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <span className="text-4xl mb-2">📋</span>
                    <p className="text-sm text-gray-400">Diyetisyeniniz henüz kan tahlili yüklememiş.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {bloodTests.map((bt) => (
                      <button
                        key={bt._id}
                        onClick={() => setLightboxUrl(bt.imageUrl)}
                        className="group text-left rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={bt.imageUrl} alt={bt.originalName} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-200" />
                        <div className="p-2 bg-gray-50">
                          <p className="text-xs text-gray-600 font-medium">
                            {new Date(bt.testDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          {bt.notes && <p className="text-[10px] text-gray-400 truncate">{bt.notes}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )

        ) : loading ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-100 rounded w-1/3" />
              <div className="h-32 bg-gray-100 rounded" />
              <div className="h-12 bg-gray-100 rounded" />
            </div>
          </div>

        ) : tab === "checkin" ? (
          /* ─── CHECK-IN TAB ─── */
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Mood hero banner */}
            <div
              className="px-6 py-5 flex items-center justify-between"
              style={{
                background: [
                  "linear-gradient(135deg,#ffe4e6,#fff1f2)",
                  "linear-gradient(135deg,#ffedd5,#fff7ed)",
                  "linear-gradient(135deg,#fef9c3,#fffbeb)",
                  "linear-gradient(135deg,#d1fae5,#ecfdf5)",
                  "linear-gradient(135deg,#e0e7ff,#ede9fe)",
                ][checkInForm.mood - 1],
              }}
            >
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-0.5">
                  {isToday ? "Bugün" : new Date(selectedDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                </p>
                <h2 className="text-lg font-bold text-gray-800">
                  {isToday ? "Nasıl Hissediyorsun?" : "Günlük Durum Kaydı"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {checkIn && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">✓ Kaydedildi</span>
                )}
                <span className="text-5xl select-none">{moodEmojis[checkInForm.mood - 1]}</span>
              </div>
            </div>

            <form onSubmit={handleCheckInSubmit} className="p-6 space-y-7">
              {/* Mood */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">😊 Ruh Hali</label>
                <div className="flex gap-2">
                  {moodConfig.map(({ emoji, label, activeCls }, i) => {
                    const level = i + 1;
                    const active = checkInForm.mood === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setCheckInForm({ ...checkInForm, mood: level })}
                        className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all duration-150 ${
                          active ? `${activeCls} scale-105 shadow-md` : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <span className={`text-3xl transition-transform ${active ? "scale-110 inline-block" : ""}`}>{emoji}</span>
                        <span className={`text-[10px] font-bold ${active ? "" : "text-gray-400"}`}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Energy */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">⚡ Enerji Seviyesi</label>
                <LevelRow
                  config={energyConfig}
                  value={checkInForm.energyLevel}
                  onChange={(v) => setCheckInForm({ ...checkInForm, energyLevel: v })}
                  activeCls="border-violet-400 bg-gradient-to-b from-violet-50 to-purple-50 ring-2 ring-violet-200"
                />
              </div>

              {/* Stress */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">🧠 Stres Seviyesi</label>
                <LevelRow
                  config={stressConfig}
                  value={checkInForm.stressLevel}
                  onChange={(v) => setCheckInForm({ ...checkInForm, stressLevel: v })}
                  activeCls="border-red-400 bg-gradient-to-b from-red-50 to-rose-50 ring-2 ring-red-200"
                />
              </div>

              {/* Hunger */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">🍽️ Açlık Seviyesi</label>
                <LevelRow
                  config={hungerConfig}
                  value={checkInForm.hungerLevel}
                  onChange={(v) => setCheckInForm({ ...checkInForm, hungerLevel: v })}
                  activeCls="border-orange-400 bg-gradient-to-b from-orange-50 to-amber-50 ring-2 ring-orange-200"
                />
              </div>

              {/* Symptoms */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">🩹 Belirtiler (varsa)</label>
                <div className="flex flex-wrap gap-2">
                  {commonSymptoms.map((symptom) => {
                    const active = checkInForm.symptoms.includes(symptom);
                    return (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => toggleSymptom(symptom)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-medium transition-all ${
                          active
                            ? "bg-linear-to-r from-red-100 to-rose-100 text-red-700 border-2 border-red-300 shadow-sm scale-105"
                            : "bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        <span>{symptomMap[symptom]}</span>
                        {symptom}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">📝 Notlar <span className="normal-case font-normal text-gray-400">(opsiyonel)</span></label>
                <textarea
                  value={checkInForm.notes}
                  onChange={(e) => setCheckInForm({ ...checkInForm, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none text-sm text-gray-700 placeholder:text-gray-400"
                  rows={2}
                  placeholder="Bugün nasıl geçti? Aklındakini yaz..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-indigo-200"
                style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" }}
              >
                {checkIn ? "✏️ Güncelle" : "🚀 Check-in Yap"}
              </button>
            </form>
          </div>

        ) : (
          /* ─── SLEEP TAB ─── */
          <form onSubmit={handleSleepSubmit} className="space-y-4">
            {/* Dark hero card */}
            <div
              className="rounded-3xl overflow-hidden shadow-xl"
              style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%)" }}
            >
              {/* Stars decoration */}
              <div className="relative px-6 pt-6 pb-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaMoon className="text-indigo-300 text-base" />
                  <h2 className="text-white font-bold text-lg">Uyku Kaydı</h2>
                </div>
                {sleep && (
                  <span className="text-xs bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full font-semibold">
                    ✓ Kaydedildi
                  </span>
                )}
                {/* Decorative stars */}
                <span className="absolute top-3 left-[45%] text-yellow-300 opacity-40 text-xs select-none">✦</span>
                <span className="absolute top-5 right-[30%] text-indigo-300 opacity-30 text-[8px] select-none">✦</span>
                <span className="absolute top-2 right-[20%] text-yellow-200 opacity-25 text-[6px] select-none">✦</span>
              </div>

              {/* Arc ring */}
              <SleepArc duration={duration} />

              {/* Time inputs */}
              <div className="grid grid-cols-2 gap-px border-t border-white/10">
                <div className="bg-white/5 p-5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <FaMoon className="text-indigo-300 text-xs" />
                    <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Yatış</span>
                  </div>
                  <input
                    type="time"
                    value={sleepForm.bedTime}
                    onChange={(e) => setSleepForm({ ...sleepForm, bedTime: e.target.value })}
                    className="bg-transparent text-white text-3xl font-bold w-full focus:outline-none scheme-dark"
                  />
                </div>
                <div className="bg-white/5 p-5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <FaSun className="text-yellow-300 text-xs" />
                    <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Uyanış</span>
                  </div>
                  <input
                    type="time"
                    value={sleepForm.wakeTime}
                    onChange={(e) => setSleepForm({ ...sleepForm, wakeTime: e.target.value })}
                    className="bg-transparent text-white text-3xl font-bold w-full focus:outline-none scheme-dark"
                  />
                </div>
              </div>
            </div>

            {/* Quality + Notes card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">🌛 Uyku Kalitesi</label>
                <div className="flex justify-between gap-2">
                  {(
                    [
                      { star: 1, emoji: "🌑", label: "Çok Kötü" },
                      { star: 2, emoji: "🌒", label: "Kötü" },
                      { star: 3, emoji: "🌓", label: "Normal" },
                      { star: 4, emoji: "🌔", label: "İyi" },
                      { star: 5, emoji: "🌕", label: "Harika" },
                    ] as const
                  ).map(({ star, emoji, label }) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSleepForm({ ...sleepForm, quality: star })}
                      className={`flex-1 flex flex-col items-center py-3.5 rounded-2xl transition-all border-2 ${
                        sleepForm.quality === star
                          ? "border-indigo-400 bg-linear-to-b from-indigo-50 to-violet-50 ring-2 ring-indigo-200 scale-105 shadow-sm"
                          : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <span className={`text-2xl transition-transform ${sleepForm.quality === star ? "scale-110 inline-block" : ""}`}>{emoji}</span>
                      <span className={`text-[10px] mt-1.5 font-bold ${sleepForm.quality === star ? "text-indigo-600" : "text-gray-400"}`}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                  📝 Notlar <span className="normal-case font-normal text-gray-400">(opsiyonel)</span>
                </label>
                <textarea
                  value={sleepForm.notes}
                  onChange={(e) => setSleepForm({ ...sleepForm, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none text-sm text-gray-700 placeholder:text-gray-400"
                  rows={2}
                  placeholder="Uyku hakkında not ekle..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-indigo-200"
                style={{ background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)" }}
              >
                {sleep ? "✏️ Güncelle" : "🌙 Uyku Kaydet"}
              </button>
            </div>
          </form>
        )}

        {/* Lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setLightboxUrl(null)}
          >
            <div className="relative max-w-3xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setLightboxUrl(null)}
                className="absolute -top-10 right-0 text-white text-3xl leading-none hover:text-gray-300"
              >
                ✕
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightboxUrl} alt="Kan tahlili" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
            </div>
          </div>
        )}

        {/* ─── Weekly Sleep Summary ─── */}
        {tab === "sleep" && weeklySleep.length > 0 && (
          <div className="mt-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-sm">Son {weeklySleep.length} Gün Özeti</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 bg-indigo-50 px-3 py-1 rounded-full">
                <span>Ort.</span>
                <span className="font-bold text-indigo-600 ml-0.5">
                  {(weeklySleep.reduce((a, s) => a + s.duration, 0) / weeklySleep.length).toFixed(1)}s
                </span>
              </div>
            </div>
            {/* Target line */}
            <div className="relative" style={{ height: "130px" }}>
              {/* 7-hour target marker */}
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-300 z-10"
                style={{ bottom: `${(7 / 10) * 100}%` }}
              >
                <span className="absolute -top-4 right-0 text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">7s hedef</span>
              </div>
              <div className="flex items-end gap-2 h-full">
                {[...weeklySleep].reverse().map((s, i) => {
                  const pct = Math.min((s.duration / 10) * 100, 100);
                  const isGood = s.duration >= 7;
                  const isOk = s.duration >= 6;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                      <span className="text-xs font-bold text-gray-600 leading-none">{s.duration}s</span>
                      <div className="w-full flex items-end flex-1">
                        <div
                          className="w-full rounded-t-xl transition-all"
                          style={{
                            height: `${pct}%`,
                            minHeight: "6px",
                            background: isGood
                              ? "linear-gradient(180deg,#818cf8 0%,#4f46e5 100%)"
                              : isOk
                              ? "linear-gradient(180deg,#c4b5fd 0%,#a78bfa 100%)"
                              : "linear-gradient(180deg,#fca5a5 0%,#f87171 100%)",
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium leading-none">
                        {new Date(s.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-4 mt-4 pt-3 border-t border-gray-50 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "linear-gradient(135deg,#818cf8,#4f46e5)" }} />
                ≥7s ideal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-violet-400" />
                6–7s
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-400" />
                &lt;6s
              </span>
            </div>
          </div>
        )}

        {/* ─── Recent Check-in History ─── */}
        {tab === "checkin" && recentCheckIns.length > 0 && (
          <div className="mt-5 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center text-sm">📋</span>
              Geçmiş Kayıtlar
            </h3>
            <div className="space-y-3">
              {recentCheckIns.map((ci) => (
                <div
                  key={ci._id}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-100 transition-colors"
                >
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-xs font-bold text-gray-700">
                      {new Date(ci.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(ci.date).toLocaleDateString("tr-TR", { weekday: "short" })}
                    </p>
                  </div>

                  <span className="text-2xl shrink-0">{moodEmojis[ci.mood - 1]}</span>

                  <div className="flex-1 grid grid-cols-3 gap-2">
                    {[
                      { label: "Enerji", val: ci.energyLevel, color: "bg-violet-400" },
                      { label: "Stres",  val: ci.stressLevel,  color: "bg-red-400" },
                      { label: "Açlık", val: ci.hungerLevel,  color: "bg-orange-400" },
                    ].map(({ label, val, color }) => (
                      <div key={label}>
                        <p className="text-[9px] text-gray-400 mb-1 font-semibold">{label}</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((l) => (
                            <div key={l} className={`flex-1 h-1.5 rounded-sm ${val >= l ? color : "bg-gray-200"}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {ci.symptoms && ci.symptoms.length > 0 && (
                    <div className="hidden sm:flex flex-wrap gap-1 max-w-32.5">
                      {ci.symptoms.slice(0, 2).map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 rounded-full border border-red-100 flex items-center gap-0.5">
                          <span>{symptomMap[s] ?? "⚠️"}</span>
                          <span className="truncate max-w-15">{s}</span>
                        </span>
                      ))}
                      {ci.symptoms.length > 2 && (
                        <span className="text-[10px] text-gray-400 font-medium">+{ci.symptoms.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
