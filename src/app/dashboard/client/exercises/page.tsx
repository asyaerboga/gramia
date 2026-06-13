"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import DatePickerModern from "@/components/shared/DatePickerModern";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import {
  FaDumbbell, FaFire, FaClock, FaPlus, FaTrash,
  FaRunning, FaBicycle, FaSwimmer, FaWalking,
  FaSearch, FaCheckCircle, FaEdit, FaCalendarCheck, FaTimes,
} from "react-icons/fa";

/* ── Types ──────────────────────────────────────────────── */
interface Exercise {
  _id: string;
  date: string;
  type: ExerciseCategory;
  name: string;
  duration: number;
  caloriesBurned: number;
  notes?: string;
}

interface ProgramExercise {
  type: ExerciseCategory;
  name: string;
  duration: number;
  caloriesBurned?: number;
  notes?: string;
}

interface DayProgram {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  exercises: ProgramExercise[];
}

interface ExerciseProgram {
  _id: string;
  name: string;
  days: DayProgram[];
  completions: string[];
}

type ExerciseCategory = "cardio" | "strength" | "flexibility" | "other";

interface QuickExercise {
  name: string;
  type: ExerciseCategory;
  calPerMin: number;
}

/* ── Statik veriler ─────────────────────────────────────── */
const WEEK_DAYS = [
  { label: "Pzt", dayOfWeek: 1 as const, fullName: "Pazartesi" },
  { label: "Sal", dayOfWeek: 2 as const, fullName: "Salı" },
  { label: "Çar", dayOfWeek: 3 as const, fullName: "Çarşamba" },
  { label: "Per", dayOfWeek: 4 as const, fullName: "Perşembe" },
  { label: "Cum", dayOfWeek: 5 as const, fullName: "Cuma" },
  { label: "Cmt", dayOfWeek: 6 as const, fullName: "Cumartesi" },
  { label: "Paz", dayOfWeek: 0 as const, fullName: "Pazar" },
];

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
  cardio: "Kardiyo", strength: "Kuvvet", flexibility: "Esneklik", other: "Diğer",
};

const categoryConfig: Record<ExerciseCategory, {
  bg: string; text: string; borderLeft: string; iconBg: string; emoji: string; pill: string;
}> = {
  cardio:      { bg: "bg-orange-50",   text: "text-orange-600",  borderLeft: "border-l-orange-400",  iconBg: "bg-orange-100",  emoji: "🏃",  pill: "bg-orange-100 text-orange-700" },
  strength:    { bg: "bg-violet-50",   text: "text-violet-600",  borderLeft: "border-l-violet-500",  iconBg: "bg-violet-100",  emoji: "💪",  pill: "bg-violet-100 text-violet-700" },
  flexibility: { bg: "bg-teal-50",     text: "text-teal-600",    borderLeft: "border-l-teal-400",    iconBg: "bg-teal-100",    emoji: "🧘",  pill: "bg-teal-100 text-teal-700"    },
  other:       { bg: "bg-emerald-50",  text: "text-emerald-600", borderLeft: "border-l-emerald-400", iconBg: "bg-emerald-100", emoji: "⚽",  pill: "bg-emerald-100 text-emerald-700" },
};

/* ── Yardımcı fonksiyonlar ──────────────────────────────── */
function getLocalDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function computeWeekDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const daysToMon = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMon);
  const todayStr = getLocalDateStr(today);

  return WEEK_DAYS.map(({ label, dayOfWeek, fullName }) => {
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset);
    const dateStr = getLocalDateStr(d);
    return { label, dayOfWeek, fullName, dateStr, dayNum: d.getDate(), isToday: dateStr === todayStr };
  });
}

function ExerciseIcon({ type, className }: { type: ExerciseCategory; className?: string }) {
  if (type === "cardio") return <FaRunning className={className} />;
  if (type === "strength") return <FaDumbbell className={className} />;
  if (type === "flexibility") return <FaSwimmer className={className} />;
  return <FaBicycle className={className} />;
}

function emptyEditDays(): DayProgram[] {
  return WEEK_DAYS.map((d) => ({ dayOfWeek: d.dayOfWeek, exercises: [] }));
}

function getMotivationalMessage(exerciseCount: number): string {
  if (exerciseCount === 0) return "Bugün harekete geçmeye hazır mısın? 🚀";
  if (exerciseCount === 1) return "Harika başlangıç! Devam et! ⚡";
  if (exerciseCount === 2) return "İki egzersiz tamamlandı, süper gidiyorsun! 🌟";
  return `${exerciseCount} egzersiz — bugün tam anlamıyla yaktın! 🔥`;
}

/* ── Bileşen ────────────────────────────────────────────── */
export default function ExercisesPage() {
  const weekDates = useMemo(() => computeWeekDates(), []);
  const todayDayIdx = useMemo(() => {
    const todayDow = new Date().getDay();
    const idx = WEEK_DAYS.findIndex((d) => d.dayOfWeek === todayDow);
    return idx >= 0 ? idx : 0;
  }, []);

  /* Daily exercises */
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => weekDates[todayDayIdx].dateStr);

  /* Program */
  const [program, setProgram] = useState<ExerciseProgram | null>(null);
  const [programLoading, setProgramLoading] = useState(true);
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayDayIdx);
  const [loggingDay, setLoggingDay] = useState(false);

  /* Program edit modal */
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [programName, setProgramName] = useState("Haftalık Programım");
  const [editDays, setEditDays] = useState<DayProgram[]>(emptyEditDays);
  const [modalDayIdx, setModalDayIdx] = useState(0);
  const [savingProgram, setSavingProgram] = useState(false);
  const [progSearch, setProgSearch] = useState("");
  const [progCategory, setProgCategory] = useState(ALL_CATEGORY);

  /* Add exercise form */
  const [showForm, setShowForm] = useState(false);
  const [exType, setExType] = useState<ExerciseCategory>("cardio");
  const [exName, setExName] = useState("");
  const [duration, setDuration] = useState(30);
  const [calBurned, setCalBurned] = useState(0);
  const [notes, setNotes] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [search, setSearch] = useState("");
  const calRateRef = useRef<number | null>(null);

  const router = useRouter();
  const { success, error } = useToast();

  const allExercises = useMemo(
    () => CATEGORY_KEYS.flatMap((k) => QUICK_EXERCISES[k]),
    [],
  );

  /* ── Veri çekme ─────────────────────────────────── */
  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exercises?date=${selectedDate}`);
      if (res.ok) setExercises(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [selectedDate]);

  const fetchProgram = useCallback(async () => {
    setProgramLoading(true);
    try {
      const res = await fetch("/api/exercise-programs");
      if (res.ok) setProgram(await res.json());
    } catch (err) { console.error(err); }
    finally { setProgramLoading(false); }
  }, []);

  useEffect(() => { fetchExercises(); }, [fetchExercises]);
  useEffect(() => { fetchProgram(); }, [fetchProgram]);

  /* ── Gün seçimi (tab) ───────────────────────────── */
  const handleDayTabClick = (idx: number) => {
    setSelectedDayIdx(idx);
    setSelectedDate(weekDates[idx].dateStr);
  };

  /* ── Günü tamamla ───────────────────────────────── */
  const handleCompleteDay = async (justMark = false) => {
    const { dayOfWeek, dateStr } = weekDates[selectedDayIdx];
    setLoggingDay(true);
    try {
      const res = await fetch("/api/exercise-programs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, dayOfWeek, justMark }),
      });
      if (res.ok) {
        const updated: ExerciseProgram = await res.json();
        setProgram(updated);
        fetchExercises();
        router.refresh();
        success("Harika!", `${WEEK_DAYS[selectedDayIdx].fullName} programı tamamlandı!`);
      } else {
        const data = await res.json();
        error("Hata", data.error ?? "Tamamlanamadı.");
      }
    } catch (err) { console.error(err); error("Hata", "Bir hata oluştu."); }
    finally { setLoggingDay(false); }
  };

  /* ── Program düzenleme ──────────────────────────── */
  const openProgramModal = () => {
    if (program) {
      setProgramName(program.name);
      const base = emptyEditDays();
      program.days.forEach((d) => {
        const idx = base.findIndex((b) => b.dayOfWeek === d.dayOfWeek);
        if (idx >= 0) base[idx].exercises = d.exercises.map((e) => ({ ...e }));
      });
      setEditDays(base);
    } else {
      setProgramName("Haftalık Programım");
      setEditDays(emptyEditDays());
    }
    setModalDayIdx(todayDayIdx);
    setProgSearch("");
    setProgCategory(ALL_CATEGORY);
    setShowProgramModal(true);
  };

  const addToEditDay = (ex: QuickExercise) => {
    const dow = WEEK_DAYS[modalDayIdx].dayOfWeek;
    setEditDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek !== dow ? d
          : d.exercises.some((e) => e.name === ex.name) ? d
          : { ...d, exercises: [...d.exercises, { type: ex.type, name: ex.name, duration: 30, caloriesBurned: Math.round(ex.calPerMin * 30) }] },
      ),
    );
  };

  const removeFromEditDay = (exIdx: number) => {
    const dow = WEEK_DAYS[modalDayIdx].dayOfWeek;
    setEditDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek !== dow ? d : { ...d, exercises: d.exercises.filter((_, i) => i !== exIdx) },
      ),
    );
  };

  const updateEditDuration = (exIdx: number, val: number) => {
    const dow = WEEK_DAYS[modalDayIdx].dayOfWeek;
    setEditDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dow) return d;
        return {
          ...d,
          exercises: d.exercises.map((e, i) => {
            if (i !== exIdx) return e;
            const found = allExercises.find((a) => a.name === e.name);
            return { ...e, duration: val, caloriesBurned: found ? Math.round(found.calPerMin * val) : e.caloriesBurned };
          }),
        };
      }),
    );
  };

  const handleSaveProgram = async () => {
    const hasAny = editDays.some((d) => d.exercises.length > 0);
    if (!hasAny) { error("Hata", "En az bir güne egzersiz ekleyin."); return; }
    setSavingProgram(true);
    try {
      const res = await fetch("/api/exercise-programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: programName, days: editDays }),
      });
      if (res.ok) {
        success("Kaydedildi", "Haftalık programınız güncellendi.");
        setShowProgramModal(false);
        fetchProgram();
      } else {
        error("Hata", "Program kaydedilemedi.");
      }
    } catch (err) { console.error(err); error("Hata", "Program kaydedilemedi."); }
    finally { setSavingProgram(false); }
  };

  const handleDeleteProgram = async () => {
    if (!confirm("Haftalık programınız silinecek. Emin misiniz?")) return;
    try {
      await fetch("/api/exercise-programs", { method: "DELETE" });
      setProgram(null);
      setShowProgramModal(false);
      success("Silindi", "Haftalık program silindi.");
    } catch (err) { console.error(err); }
  };

  /* ── Günlük form ────────────────────────────────── */
  const resetForm = () => {
    setExType("cardio"); setExName(""); setDuration(30); setCalBurned(0); setNotes("");
    setSearch(""); setActiveCategory(ALL_CATEGORY); calRateRef.current = null; setShowForm(false);
  };

  const selectQuickExercise = (ex: QuickExercise) => {
    calRateRef.current = ex.calPerMin;
    setExName(ex.name); setExType(ex.type); setCalBurned(Math.round(ex.calPerMin * duration));
  };

  const handleDurationChange = (val: number) => {
    setDuration(val);
    if (calRateRef.current !== null && val > 0) setCalBurned(Math.round(calRateRef.current * val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: exType, name: exName, duration, caloriesBurned: calBurned, notes, date: selectedDate }),
      });
      if (res.ok) { success("Eklendi", "Egzersiz kaydedildi."); resetForm(); fetchExercises(); router.refresh(); }
      else error("Hata", "Egzersiz eklenemedi.");
    } catch (err) { console.error(err); error("Hata", "Egzersiz eklenemedi."); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/exercises?id=${id}`, { method: "DELETE" });
      if (res.ok) { success("Silindi", "Egzersiz kaydı silindi."); fetchExercises(); router.refresh(); }
    } catch (err) { console.error(err); }
  };

  /* ── Türetilmiş değerler ────────────────────────── */
  const totalCalories = exercises.reduce((a, e) => a + (e.caloriesBurned || 0), 0);
  const totalDuration = exercises.reduce((a, e) => a + e.duration, 0);

  const displayedExercises = useMemo(() => {
    const base = activeCategory === ALL_CATEGORY ? allExercises : QUICK_EXERCISES[activeCategory] ?? [];
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((e) => e.name.toLowerCase().includes(q));
  }, [activeCategory, search, allExercises]);

  const progDisplayedExercises = useMemo(() => {
    const base = progCategory === ALL_CATEGORY ? allExercises : QUICK_EXERCISES[progCategory] ?? [];
    if (!progSearch.trim()) return base;
    const q = progSearch.toLowerCase();
    return base.filter((e) => e.name.toLowerCase().includes(q));
  }, [progCategory, progSearch, allExercises]);

  const selectedDayDow = weekDates[selectedDayIdx].dayOfWeek;
  const selectedDayProgram = program?.days.find((d) => d.dayOfWeek === selectedDayDow);
  const selectedDateStr = weekDates[selectedDayIdx].dateStr;
  const isDayCompleted = program?.completions.includes(selectedDateStr) ?? false;

  const modalDayDow = WEEK_DAYS[modalDayIdx].dayOfWeek;
  const modalDayExercises = editDays.find((d) => d.dayOfWeek === modalDayDow)?.exercises ?? [];

  const completedCount = weekDates.filter((wd) => program?.completions.includes(wd.dateStr)).length;
  const programDaysCount = WEEK_DAYS.filter((wd) =>
    program?.days.find((d) => d.dayOfWeek === wd.dayOfWeek && d.exercises.length > 0),
  ).length;

  const weekProgress = programDaysCount > 0 ? Math.round((completedCount / programDaysCount) * 100) : 0;

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-purple-50/40 to-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-purple-200">
          {/* Dekoratif daireler */}
          <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-sm" />
          <div className="absolute -bottom-10 -left-6 w-40 h-40 bg-white/10 rounded-full blur-sm" />
          <div className="absolute top-4 right-32 w-6 h-6 bg-white/20 rounded-full" />
          <div className="absolute bottom-6 right-16 w-3 h-3 bg-white/30 rounded-full" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-4xl drop-shadow-lg">💪</span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Egzersiz Takibi</h1>
              </div>
              <p className="text-purple-200 text-sm mt-1 font-medium">
                {getMotivationalMessage(exercises.length)}
              </p>
            </div>

            {/* Hızlı istatistikler - banner içi */}
            {!loading && exercises.length > 0 && (
              <div className="flex gap-3">
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center border border-white/20">
                  <p className="text-2xl font-bold">{totalCalories}</p>
                  <p className="text-xs text-purple-200 font-medium">kcal</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center border border-white/20">
                  <p className="text-2xl font-bold">{totalDuration}</p>
                  <p className="text-xs text-purple-200 font-medium">dakika</p>
                </div>
              </div>
            )}
          </div>

          {/* Aksiyon bar */}
          <div className="relative z-10 mt-5 flex flex-wrap gap-2 items-center">
            <DatePickerModern value={selectedDate} onChange={setSelectedDate} />
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2 bg-white text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-all text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <FaPlus className="text-purple-500" />
              <span>Egzersiz Ekle</span>
            </button>
          </div>
        </div>

        {/* ── Özet Kartları ── */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {/* Kalori */}
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-orange-400 to-red-500 p-4 text-white shadow-lg shadow-orange-100">
            <div className="absolute -top-3 -right-3 text-6xl opacity-15 select-none">🔥</div>
            <p className="text-xs text-orange-100 font-semibold uppercase tracking-wide">Yakılan</p>
            <p className="text-3xl font-extrabold mt-1">{totalCalories}</p>
            <p className="text-xs text-orange-200 font-medium">kcal</p>
          </div>
          {/* Süre */}
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-400 to-indigo-600 p-4 text-white shadow-lg shadow-blue-100">
            <div className="absolute -top-3 -right-3 text-6xl opacity-15 select-none">⏱️</div>
            <p className="text-xs text-blue-100 font-semibold uppercase tracking-wide">Süre</p>
            <p className="text-3xl font-extrabold mt-1">{totalDuration}</p>
            <p className="text-xs text-blue-200 font-medium">dakika</p>
          </div>
          {/* Sayı */}
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-violet-500 to-purple-700 p-4 text-white shadow-lg shadow-violet-100">
            <div className="absolute -top-3 -right-3 text-6xl opacity-15 select-none">🏋️</div>
            <p className="text-xs text-violet-200 font-semibold uppercase tracking-wide">Egzersiz</p>
            <p className="text-3xl font-extrabold mt-1">{exercises.length}</p>
            <p className="text-xs text-violet-300 font-medium">adet</p>
          </div>
        </div>

        {/* ── Haftalık Program Kartı ── */}
        {programLoading ? (
          <div className="h-52 bg-white rounded-3xl animate-pulse border border-gray-100 shadow-sm" />
        ) : program ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Başlık */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-emerald-400 to-green-600 flex items-center justify-center text-xl shadow-md shadow-green-100">
                  📅
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-base">{program.name}</p>
                  {programDaysCount > 0 && (
                    <p className="text-xs text-gray-400">Bu hafta {completedCount}/{programDaysCount} tamamlandı</p>
                  )}
                </div>
              </div>
              <button
                onClick={openProgramModal}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-600 bg-gray-50 hover:bg-purple-50 px-3 py-1.5 rounded-xl transition-all font-medium"
              >
                <FaEdit /> Düzenle
              </button>
            </div>

            {/* Haftalık ilerleme */}
            {programDaysCount > 0 && (
              <div className="px-5 pb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Haftalık ilerleme</span>
                  <span className="font-semibold text-purple-500">{weekProgress}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-violet-400 to-fuchsia-500 rounded-full transition-all duration-700"
                    style={{ width: `${weekProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Gün sekmeleri */}
            <div className="px-4 pb-2">
              <div className="grid grid-cols-7 gap-1">
                {weekDates.map((wd, idx) => {
                  const dayProg = program.days.find((d) => d.dayOfWeek === wd.dayOfWeek);
                  const hasExercises = (dayProg?.exercises.length ?? 0) > 0;
                  const completed = program.completions.includes(wd.dateStr);
                  const isSelected = idx === selectedDayIdx;

                  return (
                    <button
                      key={wd.dayOfWeek}
                      onClick={() => handleDayTabClick(idx)}
                      className={`flex flex-col items-center py-3 px-1 rounded-2xl transition-all duration-200 ${
                        isSelected
                          ? "bg-linear-to-b from-violet-500 to-purple-700 text-white shadow-lg shadow-purple-200 scale-105"
                          : "hover:bg-purple-50 text-gray-600 hover:scale-105"
                      }`}
                    >
                      <span className={`text-xs font-semibold ${isSelected ? "text-purple-200" : wd.isToday ? "text-purple-500" : "text-gray-400"}`}>
                        {wd.label}
                      </span>
                      <span className={`text-sm font-extrabold mt-0.5 ${isSelected ? "text-white" : wd.isToday ? "text-purple-600" : "text-gray-700"}`}>
                        {wd.dayNum}
                      </span>
                      <div className="mt-1.5 h-5 flex items-center justify-center">
                        {completed ? (
                          <span className="text-base leading-none">🔥</span>
                        ) : hasExercises ? (
                          <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-purple-200" : "bg-purple-300"}`} />
                        ) : (
                          <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-purple-400/40" : "bg-gray-200"}`} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seçili günün içeriği */}
            <div className="px-5 py-4 border-t border-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-800">{weekDates[selectedDayIdx].fullName}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(selectedDateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                    {weekDates[selectedDayIdx].isToday && (
                      <span className="ml-1.5 font-semibold text-purple-500">· Bugün</span>
                    )}
                  </p>
                </div>
                {isDayCompleted && (
                  <span className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                    🔥 Tamamlandı
                  </span>
                )}
              </div>

              {!selectedDayProgram || selectedDayProgram.exercises.length === 0 ? (
                isDayCompleted ? (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">Dinlenme günü · Manuel egzersizler kaydedildi</p>
                  </div>
                ) : exercises.length > 0 ? (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">{exercises.length} egzersiz kaydedildi · Haftalık programda yok</p>
                    <button
                      onClick={() => handleCompleteDay(true)}
                      disabled={loggingDay}
                      className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-400 to-green-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-100 transition-all text-sm disabled:opacity-60"
                    >
                      {loggingDay ? "⏳" : "✅"} Tamamladım
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-2xl">
                    🛌 Dinlenme günü — iyi dinlenmeler!
                  </div>
                )
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {selectedDayProgram.exercises.map((ex, i) => {
                      const cfg = categoryConfig[ex.type];
                      return (
                        <div key={i} className={`flex items-center gap-3 p-3 ${isDayCompleted ? "bg-emerald-50" : cfg.bg} rounded-2xl border-l-4 ${isDayCompleted ? "border-l-emerald-400" : cfg.borderLeft} transition-all`}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isDayCompleted ? "bg-emerald-100" : cfg.iconBg} text-base`}>
                            {cfg.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{ex.name}</p>
                            <p className="text-xs text-gray-400">{ex.duration} dk · {ex.caloriesBurned ?? 0} kcal</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${isDayCompleted ? "bg-emerald-100 text-emerald-700" : cfg.pill}`}>
                            {exerciseTypeLabels[ex.type]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 font-medium">
                      {selectedDayProgram.exercises.length} egzersiz ·{" "}
                      {selectedDayProgram.exercises.reduce((a, e) => a + e.duration, 0)} dk ·{" "}
                      {selectedDayProgram.exercises.reduce((a, e) => a + (e.caloriesBurned ?? 0), 0)} kcal
                    </p>
                    {!isDayCompleted ? (
                      <button
                        onClick={() => handleCompleteDay()}
                        disabled={loggingDay}
                        className="flex items-center gap-2 px-5 py-2 bg-linear-to-r from-emerald-400 to-green-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-100 transition-all text-sm disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0"
                      >
                        {loggingDay ? "⏳" : "✅"} Programımı Yaptım!
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Egzersizler kaydedildi</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Program yok - boş durum */
          <div className="relative overflow-hidden bg-linear-to-br from-violet-50 to-purple-100/60 rounded-3xl p-6 border-2 border-dashed border-violet-200 flex items-center justify-between gap-4">
            <div className="absolute -bottom-4 -right-4 text-8xl opacity-10 select-none">🗓️</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">📅</span>
                <span className="text-sm font-bold text-gray-700">Haftalık Program Yok</span>
              </div>
              <p className="text-xs text-gray-500">
                Günlere göre egzersiz programı oluşturun. Her gün tek tıkla kaydedin.
              </p>
            </div>
            <button
              onClick={openProgramModal}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-violet-500 to-purple-700 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-purple-200 transition-all hover:-translate-y-0.5"
            >
              <FaPlus /> Program Oluştur
            </button>
          </div>
        )}

        {/* ── Günlük Egzersiz Listesi ── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl">📋</span>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
            </h3>
            {exercises.length > 0 && (
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                {exercises.length} egzersiz
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-4 animate-bounce">🏃‍♂️</div>
              <h3 className="text-lg font-bold text-gray-700 mb-1">Henüz egzersiz yok!</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                Bugün harekete geç, küçük adımlar büyük değişimlere yol açar 💫
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-violet-500 to-purple-700 text-white rounded-2xl font-bold text-sm hover:shadow-lg hover:shadow-purple-200 transition-all hover:-translate-y-1"
              >
                <FaPlus /> İlk Egzersizini Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((ex) => {
                const cfg = categoryConfig[ex.type];
                return (
                  <div
                    key={ex._id}
                    className={`flex items-center justify-between p-4 ${cfg.bg} rounded-2xl border-l-4 ${cfg.borderLeft} hover:shadow-md transition-all duration-200 group`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${cfg.iconBg} rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform`}>
                        {cfg.emoji}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{ex.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <FaClock className="text-xs" /> {ex.duration} dk
                          </span>
                          {ex.caloriesBurned > 0 && (
                            <span className="text-sm text-orange-500 font-medium">
                              🔥 {ex.caloriesBurned} kcal
                            </span>
                          )}
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${cfg.pill}`}>
                            {exerciseTypeLabels[ex.type]}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(ex._id)}
                      className="p-2.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <FaTrash />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Egzersiz Ekle Modalı ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <span>💪</span> Egzersiz Ekle
              </h2>
              <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
                <FaTimes />
              </button>
            </div>

            <div className="bg-gray-50/80 border-b border-gray-100 px-4 pt-3 pb-2">
              <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">⚡ Hızlı Seçim</p>
              <div className="relative mb-2">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Egzersiz ara..."
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {[ALL_CATEGORY, ...CATEGORY_KEYS].map((cat) => (
                  <button key={cat} onClick={() => { setActiveCategory(cat); setSearch(""); }}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                      activeCategory === cat ? "bg-violet-500 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-violet-300"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-2 max-h-40 overflow-y-auto bg-gray-50/80 border-b border-gray-100">
              {displayedExercises.length === 0 ? (
                <p className="text-xs text-gray-400 py-2 text-center">Sonuç bulunamadı</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {displayedExercises.map((ex) => (
                    <button key={ex.name} type="button" onClick={() => selectQuickExercise(ex)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition ${
                        exName === ex.name
                          ? "bg-violet-500 text-white border-violet-500 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-violet-400 hover:bg-violet-50"}`}>
                      {ex.name} <span className="opacity-50">{ex.calPerMin}k/dk</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Egzersiz Adı</label>
                <input type="text" value={exName} onChange={(e) => { setExName(e.target.value); calRateRef.current = null; }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm font-medium"
                  required placeholder="Örn: Koşu, Yürüyüş, Squat..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Süre (dk)</label>
                  <input type="number" value={duration} onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm font-medium" required min="1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Kalori {calRateRef.current && <span className="ml-1 text-violet-400 normal-case font-normal">(otomatik)</span>}
                  </label>
                  <input type="number" value={calBurned} onChange={(e) => { calRateRef.current = null; setCalBurned(parseInt(e.target.value) || 0); }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm font-medium" min="0" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Notlar</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm" rows={2}
                  placeholder="İsteğe bağlı..." />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={resetForm}
                  className="flex-1 py-3 border border-gray-200 rounded-2xl hover:bg-gray-50 transition text-sm font-bold text-gray-600">İptal</button>
                <button type="submit"
                  className="flex-1 py-3 bg-linear-to-r from-violet-500 to-purple-700 text-white rounded-2xl font-bold text-sm hover:shadow-lg hover:shadow-purple-200 transition-all hover:-translate-y-0.5">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Haftalık Program Düzenleme Modalı ── */}
      {showProgramModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">

            {/* Başlık */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <span>📅</span> Haftalık Program Düzenle
              </h2>
              <button onClick={() => setShowProgramModal(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Program adı */}
              <div className="px-6 pt-5 pb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Program Adı</label>
                <input type="text" value={programName} onChange={(e) => setProgramName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-medium"
                  placeholder="Haftalık Programım" />
              </div>

              {/* Gün sekmeleri */}
              <div className="px-6 pb-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Gün Seç</p>
                <div className="grid grid-cols-7 gap-1">
                  {WEEK_DAYS.map((wd, idx) => {
                    const dayEx = editDays.find((d) => d.dayOfWeek === wd.dayOfWeek)?.exercises ?? [];
                    const isSelected = idx === modalDayIdx;
                    return (
                      <button key={wd.dayOfWeek} onClick={() => setModalDayIdx(idx)}
                        className={`flex flex-col items-center py-2.5 rounded-2xl text-xs transition-all ${
                          isSelected
                            ? "bg-linear-to-b from-emerald-400 to-green-600 text-white shadow-md shadow-green-100 scale-105"
                            : "bg-gray-50 hover:bg-gray-100 text-gray-600 hover:scale-105"}`}>
                        <span className="font-bold">{wd.label}</span>
                        <span className={`mt-0.5 text-xs font-medium ${isSelected ? "text-green-100" : "text-gray-400"}`}>
                          {dayEx.length > 0 ? `${dayEx.length} ex` : "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seçili günün başlığı */}
              <div className="px-6 py-3 bg-gray-50/80 border-y border-gray-100">
                <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <span>📌</span>
                  {WEEK_DAYS[modalDayIdx].fullName}
                  <span className="font-normal text-xs text-gray-400">
                    {modalDayExercises.length > 0
                      ? `· ${modalDayExercises.length} egzersiz · ${modalDayExercises.reduce((a, e) => a + e.duration, 0)} dk`
                      : "· Dinlenme günü"}
                  </span>
                </p>
              </div>

              {/* Egzersiz seçici */}
              <div className="bg-gray-50/80 border-b border-gray-100 px-4 pt-3 pb-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">+ Egzersiz Ekle</p>
                <div className="relative mb-2">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input type="text" value={progSearch} onChange={(e) => setProgSearch(e.target.value)}
                    placeholder="Egzersiz ara..."
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {[ALL_CATEGORY, ...CATEGORY_KEYS].map((cat) => (
                    <button key={cat} onClick={() => { setProgCategory(cat); setProgSearch(""); }}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                        progCategory === cat ? "bg-emerald-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300"}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 py-2 max-h-32 overflow-y-auto bg-gray-50/80 border-b border-gray-100">
                {progDisplayedExercises.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2 text-center">Sonuç bulunamadı</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {progDisplayedExercises.map((ex) => {
                      const added = modalDayExercises.some((e) => e.name === ex.name);
                      return (
                        <button key={ex.name} type="button" onClick={() => addToEditDay(ex)} disabled={added}
                          className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition ${
                            added
                              ? "bg-emerald-100 text-emerald-700 border-emerald-300 cursor-default"
                              : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50"}`}>
                          {added ? "✓ " : "+ "}{ex.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seçili günün egzersiz listesi */}
              <div className="px-6 py-4">
                {modalDayExercises.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-2xl">
                    <div className="text-4xl mb-2">👆</div>
                    Yukarıdan egzersiz seçin
                  </div>
                ) : (
                  <div className="space-y-2">
                    {modalDayExercises.map((ex, idx) => {
                      const cfg = categoryConfig[ex.type];
                      return (
                        <div key={idx} className={`flex items-center gap-3 p-3 ${cfg.bg} rounded-2xl border-l-4 ${cfg.borderLeft}`}>
                          <div className={`w-8 h-8 ${cfg.iconBg} rounded-xl flex items-center justify-center shrink-0 text-base`}>
                            {cfg.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">{ex.name}</p>
                            <p className={`text-xs font-medium ${cfg.text}`}>{exerciseTypeLabels[ex.type]}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <input type="number" value={ex.duration}
                              onChange={(e) => updateEditDuration(idx, parseInt(e.target.value) || 1)}
                              className="w-14 px-2 py-1 border border-gray-200 rounded-xl text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                              min="1" />
                            <span className="text-xs text-gray-400">dk</span>
                          </div>
                          {(ex.caloriesBurned ?? 0) > 0 && (
                            <span className="text-xs text-orange-500 font-semibold shrink-0">🔥{ex.caloriesBurned}</span>
                          )}
                          <button type="button" onClick={() => removeFromEditDay(idx)}
                            className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition shrink-0">
                            <FaTimes />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
              {program && (
                <button type="button" onClick={handleDeleteProgram}
                  className="px-4 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition">
                  Programı Sil
                </button>
              )}
              <div className="flex-1" />
              <button type="button" onClick={() => setShowProgramModal(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-2xl hover:bg-gray-50 transition text-sm font-bold text-gray-600">
                İptal
              </button>
              <button type="button" onClick={handleSaveProgram} disabled={savingProgram}
                className="px-6 py-2.5 bg-linear-to-r from-emerald-400 to-green-600 text-white rounded-2xl font-bold text-sm hover:shadow-lg hover:shadow-green-100 transition-all disabled:opacity-50 hover:-translate-y-0.5">
                {savingProgram ? "Kaydediliyor..." : "💾 Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
