"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isPast,
  isToday,
} from "date-fns";
import { tr } from "date-fns/locale";
import DatePickerModern from "@/components/shared/DatePickerModern";
import {
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaTrash,
  FaCalendarAlt,
} from "react-icons/fa";
import { TURKISH_FIXED_HOLIDAYS } from "@/lib/slotUtils";

/* ─── Types ─────────────────────────────────────────── */
interface Appointment {
  _id: string;
  date: string;
  time: string;
  status: string;
  clientName: string;
  notes?: string;
}

interface SlotEntry {
  time: string;
  source: "schedule" | "extra";
  isBooked: boolean;
  isBlocked: boolean;
}

interface DaySlots {
  date: string;
  slots: SlotEntry[];
}

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => Promise<void>;
}

interface DaySchedule {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface WeeklyScheduleData {
  days: DaySchedule[];
  slotDuration: number;
  excludePublicHolidays: boolean;
}

/* ─── Constants ──────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:   { label: "Beklemede",     color: "bg-amber-100 text-amber-700 border border-amber-200",      dot: "bg-amber-400" },
  confirmed: { label: "Onaylandı",     color: "bg-indigo-100 text-indigo-700 border border-indigo-200",   dot: "bg-indigo-500" },
  completed: { label: "Gerçekleşti",   color: "bg-emerald-100 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  no_show:   { label: "Gerçekleşmedi", color: "bg-red-100 text-red-700 border border-red-200",            dot: "bg-red-400" },
  cancelled: { label: "İptal",         color: "bg-gray-100 text-gray-500 border border-gray-200",         dot: "bg-gray-400" },
};

const ALL_TIME_SLOTS = [
  "07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00",
];

const DAY_NAMES = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];

const DEFAULT_SCHEDULE: WeeklyScheduleData = {
  days: [0, 1, 2, 3, 4, 5, 6].map((dow) => ({
    dayOfWeek: dow,
    enabled: dow >= 1 && dow <= 5,
    startTime: "09:00",
    endTime: "17:00",
  })),
  slotDuration: 30,
  excludePublicHolidays: true,
};

/* ─── Component ──────────────────────────────────────── */
export default function DietitianAppointmentsPage() {
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date");
  const initialAptId = searchParams.get("appointmentId");
  const parsedInitial = initialDate ? new Date(initialDate) : new Date();

  const [currentMonth, setCurrentMonth] = useState(parsedInitial);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [monthSlots, setMonthSlots] = useState<DaySlots[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDaySlots, setSelectedDaySlots] = useState<{ date: Date; slots: SlotEntry[] } | null>(null);
  const pendingAutoSelectRef = useRef(initialAptId);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedule, setSchedule] = useState<WeeklyScheduleData>(DEFAULT_SCHEDULE);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideType, setOverrideType] = useState<"extra" | "blocked">("blocked");
  const [overrideStartDate, setOverrideStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [overrideEndDate, setOverrideEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [overrideTimes, setOverrideTimes] = useState<string[]>([]);
  const [overrideSaving, setOverrideSaving] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [confirmModal, setConfirmModal] = useState<ConfirmState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  /* ─── Fetch ─────────────────────────────────────── */
  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/dietitian/appointments");
      if (res.ok) setAppointments(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  const fetchMonthSlots = useCallback(async () => {
    const from = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const to   = format(endOfMonth(currentMonth),   "yyyy-MM-dd");
    try {
      const res = await fetch(`/api/dietitian/slots?from=${from}&to=${to}`);
      if (res.ok) setMonthSlots(await res.json());
    } catch (e) { console.error(e); }
  }, [currentMonth]);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch("/api/dietitian/schedule");
      if (res.ok) {
        const data = await res.json();
        setSchedule({
          days: data.days ?? DEFAULT_SCHEDULE.days,
          slotDuration: data.slotDuration ?? 30,
          excludePublicHolidays: data.excludePublicHolidays ?? true,
        });
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchAppointments(); fetchSchedule(); }, [fetchAppointments, fetchSchedule]);
  useEffect(() => { fetchMonthSlots(); }, [fetchMonthSlots]);

  useEffect(() => {
    const id = pendingAutoSelectRef.current;
    if (!id || appointments.length === 0) return;
    const apt = appointments.find((a) => a._id === id);
    if (!apt) return;
    setSelectedAppointment(apt);
    setSelectedDaySlots(null);
    pendingAutoSelectRef.current = null;
  }, [appointments]);

  /* ─── Calendar helpers ───────────────────────────── */
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddedDays = Array(startDay === 0 ? 6 : startDay - 1).fill(null).concat(days);

  const getDayAppointments = (day: Date) =>
    appointments.filter((a) => isSameDay(new Date(a.date), day));

  const getDaySlots = (day: Date): SlotEntry[] => {
    const key = format(day, "yyyy-MM-dd");
    return monthSlots.find((d) => d.date === key)?.slots ?? [];
  };

  const handleDayClick = (day: Date) => {
    setSelectedAppointment(null);
    const slots = getDaySlots(day);
    setSelectedDaySlots(slots.length > 0 ? { date: day, slots } : null);
  };

  /* ─── Schedule save ──────────────────────────────── */
  const handleSaveSchedule = async () => {
    setScheduleSaving(true);
    try {
      const res = await fetch("/api/dietitian/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      if (res.ok) { setShowScheduleModal(false); fetchMonthSlots(); }
    } finally { setScheduleSaving(false); }
  };

  const updateDay = (dow: number, patch: Partial<DaySchedule>) => {
    setSchedule((prev) => ({
      ...prev,
      days: prev.days.map((d) => d.dayOfWeek === dow ? { ...d, ...patch } : d),
    }));
  };

  /* ─── Manual override ────────────────────────────── */
  const toggleOverrideTime = (t: string) =>
    setOverrideTimes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const handleSaveOverride = async () => {
    if (!overrideTimes.length) return;
    setOverrideSaving(true);
    try {
      const res = await fetch("/api/dietitian/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: overrideStartDate, endDate: overrideEndDate, times: overrideTimes, type: overrideType }),
      });
      if (res.ok) { setShowOverrideModal(false); setOverrideTimes([]); fetchMonthSlots(); }
    } finally { setOverrideSaving(false); }
  };

  /* ─── Confirm modal ──────────────────────────────── */
  const runConfirm = async () => {
    if (!confirmModal) return;
    setConfirmLoading(true);
    try { await confirmModal.onConfirm(); }
    finally { setConfirmLoading(false); setConfirmModal(null); }
  };

  /* ─── Appointment actions ────────────────────────── */
  const doStatusChange = async (id: string, status: string) => {
    await fetch("/api/dietitian/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: id, status }),
    });
    await fetchAppointments();
    setSelectedAppointment((prev) => prev ? { ...prev, status } : null);
  };

  const handleStatusChange = (id: string, status: string) => {
    if (status === "cancelled") {
      setConfirmModal({
        title: "Randevuyu İptal Et",
        message: "Bu randevuyu iptal etmek istediğinize emin misiniz? Danışana bildirim gönderilecektir.",
        confirmLabel: "Evet, İptal Et",
        confirmClass: "bg-red-500 hover:bg-red-600",
        onConfirm: () => doStatusChange(id, status),
      });
      return;
    }
    if (status === "no_show") {
      setConfirmModal({
        title: "Gelmedi Olarak İşaretle",
        message: "Danışanın randevuya gelmediğini onaylamak istediğinize emin misiniz?",
        confirmLabel: "Evet, Onayla",
        confirmClass: "bg-orange-500 hover:bg-orange-600",
        onConfirm: () => doStatusChange(id, status),
      });
      return;
    }
    doStatusChange(id, status);
  };

  const openEditModal = (apt: Appointment) => {
    setEditDate(format(new Date(apt.date), "yyyy-MM-dd"));
    setEditTime(apt.time);
    setEditNotes(apt.notes || "");
    setShowEditModal(true);
  };

  const doEditSave = async () => {
    if (!selectedAppointment) return;
    setEditSaving(true);
    try {
      const res = await fetch("/api/dietitian/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: selectedAppointment._id, date: editDate, time: editTime, notes: editNotes }),
      });
      if (res.ok) {
        setShowEditModal(false);
        await fetchAppointments();
        setSelectedAppointment((prev) =>
          prev ? { ...prev, date: new Date(editDate).toISOString(), time: editTime, notes: editNotes } : null,
        );
      }
    } finally { setEditSaving(false); }
  };

  const handleEditSave = () => {
    if (!selectedAppointment) return;
    const dateChanged = editDate !== format(new Date(selectedAppointment.date), "yyyy-MM-dd");
    const timeChanged = editTime !== selectedAppointment.time;
    if (dateChanged || timeChanged) {
      setConfirmModal({
        title: "Randevu Tarihini Değiştir",
        message: "Randevunun tarih veya saatini değiştirmek istediğinize emin misiniz? Danışana bildirim gönderilecektir.",
        confirmLabel: "Evet, Güncelle",
        confirmClass: "bg-emerald-500 hover:bg-emerald-600",
        onConfirm: doEditSave,
      });
      return;
    }
    doEditSave();
  };

  const handleDeleteAppointment = (id: string) => {
    setConfirmModal({
      title: "Randevuyu Sil",
      message: "Bu randevuyu silmek istediğinize emin misiniz? Danışana bildirim gönderilecektir.",
      confirmLabel: "Evet, Sil",
      confirmClass: "bg-red-500 hover:bg-red-600",
      onConfirm: async () => {
        await fetch(`/api/appointments?id=${id}`, { method: "DELETE" });
        setSelectedAppointment(null);
        fetchAppointments();
      },
    });
  };

  /* ─── Stats ──────────────────────────────────────── */
  const upcomingCount = appointments.filter(
    (a) => (!isPast(new Date(a.date)) || isToday(new Date(a.date))) && a.status !== "cancelled",
  ).length;
  const todayApts = appointments.filter((a) => isToday(new Date(a.date)) && a.status !== "cancelled");
  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  /* ─── Render ─────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f4f6fb] p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">

      {/* ── Hero Banner ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-600 via-blue-600 to-teal-500 px-6 py-6 md:px-8 text-white shadow-xl shadow-indigo-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">Yönetim Paneli</p>
              <h1 className="text-2xl md:text-3xl font-bold">Randevular</h1>
            </div>
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-semibold hover:bg-white/30 transition border border-white/20"
              >
                <FaCalendarAlt size={12} /> Haftalık Program
              </button>
              <button
                onClick={() => { setOverrideType("extra"); setShowOverrideModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-400 backdrop-blur-sm text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition"
              >
                <FaPlus size={10} /> Ekstra Saat
              </button>
              <button
                onClick={() => { setOverrideType("blocked"); setShowOverrideModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-red-400 backdrop-blur-sm text-white rounded-xl text-sm font-semibold hover:bg-red-500 transition"
              >
                🚫 Bloke Et
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 flex items-center gap-3 border border-white/20">
              <span className="text-2xl font-bold">{todayApts.length}</span>
              <span className="text-white/80 text-xs font-medium leading-tight">Bugünkü<br/>Randevu</span>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 flex items-center gap-3 border border-white/20">
              <span className="text-2xl font-bold">{upcomingCount}</span>
              <span className="text-white/80 text-xs font-medium leading-tight">Yaklaşan<br/>Randevu</span>
            </div>
            {pendingCount > 0 && (
              <Link
                href="/dashboard/dietitian#upcoming-appointments"
                className="bg-amber-400/80 backdrop-blur-sm rounded-2xl px-4 py-2.5 flex items-center gap-3 border border-amber-300/40 animate-pulse hover:bg-amber-400 transition cursor-pointer"
              >
                <span className="text-2xl font-bold">{pendingCount}</span>
                <span className="text-white/90 text-xs font-medium leading-tight">Onay<br/>Bekliyor</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-0">

        {/* ── Left: Calendar ── */}
        <div className="flex-1 space-y-4">

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 shadow-sm border border-gray-100">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Müsait
            </span>
            <span className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 shadow-sm border border-gray-100">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> Ekstra saat
            </span>
            <span className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 shadow-sm border border-gray-100">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Bloke / Dolu
            </span>
            <span className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 shadow-sm border border-gray-100">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Randevu
            </span>
          </div>

          {/* Calendar card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Month nav */}
            <div className="bg-linear-to-r from-indigo-50 to-teal-50 px-5 py-4 flex items-center justify-between border-b border-gray-100">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-800"
              >
                <FaChevronLeft size={12} />
              </button>
              <h3 className="font-bold text-gray-800 capitalize text-base">
                {format(currentMonth, "MMMM yyyy", { locale: tr })}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-800"
              >
                <FaChevronRight size={12} />
              </button>
            </div>

            <div className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {paddedDays.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} className="h-24" />;
                  const dayApts    = getDayAppointments(day);
                  const daySlots   = getDaySlots(day);
                  const todayDay   = isToday(day);
                  const inMonth    = isSameMonth(day, currentMonth);
                  const hasExtra   = daySlots.some((s) => s.source === "extra" && !s.isBlocked);
                  const hasFree    = daySlots.some((s) => !s.isBooked && !s.isBlocked);
                  const hasBlocked = daySlots.some((s) => s.isBlocked);
                  const isSelected = selectedAppointment && isSameDay(new Date(selectedAppointment.date), day);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={`h-24 p-1.5 rounded-xl text-sm cursor-pointer transition-all border ${
                        !inMonth
                          ? "border-transparent text-gray-200 pointer-events-none"
                          : isSelected
                          ? "bg-indigo-50 border-indigo-300 shadow-sm"
                          : todayDay
                          ? "bg-linear-to-br from-indigo-50 to-blue-50 border-indigo-200"
                          : "bg-white border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30"
                      }`}
                    >
                      <span className={`text-xs font-bold leading-none ${
                        todayDay ? "text-indigo-600" : inMonth ? "text-gray-700" : "text-gray-200"
                      }`}>
                        {format(day, "d")}
                        {todayDay && <span className="ml-1 text-[8px] font-bold text-indigo-400">bugün</span>}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayApts.slice(0, 2).map((apt) => (
                          <div
                            key={apt._id}
                            onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); setSelectedDaySlots(null); }}
                            className="text-[9px] bg-indigo-100 text-indigo-700 rounded-md px-1 py-0.5 truncate cursor-pointer hover:bg-indigo-200 font-medium"
                          >
                            {apt.time} {apt.clientName.split(" ")[0]}
                          </div>
                        ))}
                        {dayApts.length > 2 && (
                          <div className="text-[9px] text-indigo-400 font-bold">+{dayApts.length - 2} daha</div>
                        )}
                        {(hasFree || hasExtra || hasBlocked) && (
                          <div className="flex gap-0.5 mt-0.5">
                            {hasFree    && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            {hasExtra   && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                            {hasBlocked && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Detail panel ── */}
        <aside className="w-full lg:w-80 xl:w-96 lg:pl-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">

            {selectedAppointment ? (
              /* ── Appointment detail ── */
              <div>
                <div className="bg-linear-to-r from-indigo-50 to-blue-50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Randevu Detayı</p>
                    <p className="font-bold text-gray-800">{selectedAppointment.clientName}</p>
                  </div>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Info card */}
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-base">📅</span>
                      {new Date(selectedAppointment.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-base">⏰</span> {selectedAppointment.time}
                    </div>
                    {selectedAppointment.notes && (
                      <div className="flex items-start gap-2 text-xs text-gray-400 italic">
                        <span className="text-base">📝</span> {selectedAppointment.notes}
                      </div>
                    )}
                    <div className="pt-1">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_CONFIG[selectedAppointment.status]?.color || "bg-gray-100 text-gray-600"}`}>
                        {STATUS_CONFIG[selectedAppointment.status]?.label || selectedAppointment.status}
                      </span>
                    </div>
                  </div>

                  {/* Status buttons */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Durum Güncelle</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "confirmed", label: "Onaylandı",   icon: <FaClock size={10} />,       active: "bg-indigo-500 text-white shadow-sm shadow-indigo-200",   inactive: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100" },
                        { key: "completed", label: "Gerçekleşti", icon: <FaCheckCircle size={10} />, active: "bg-emerald-500 text-white shadow-sm shadow-emerald-200", inactive: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100" },
                        { key: "no_show",   label: "Gelmedi",     icon: <FaTimesCircle size={10} />, active: "bg-red-500 text-white shadow-sm shadow-red-200",         inactive: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-100" },
                        { key: "cancelled", label: "İptal",       icon: null,                        active: "bg-gray-500 text-white",                                 inactive: "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200" },
                      ].map(({ key, label, icon, active, inactive }) => (
                        <button
                          key={key}
                          onClick={() => handleStatusChange(selectedAppointment._id, key)}
                          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            selectedAppointment.status === key ? active : inactive
                          }`}
                        >
                          {icon} {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Edit / Delete */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => openEditModal(selectedAppointment)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition border border-indigo-100"
                    >
                      <FaEdit size={12} /> Düzenle
                    </button>
                    <button
                      onClick={() => handleDeleteAppointment(selectedAppointment._id)}
                      className="w-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition border border-red-100"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              </div>

            ) : selectedDaySlots ? (
              /* ── Day slots ── */
              <div>
                <div className="bg-linear-to-r from-purple-50 to-indigo-50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Günlük Saatler</p>
                    <p className="font-bold text-gray-800 capitalize">
                      {format(selectedDaySlots.date, "d MMMM yyyy", { locale: tr })}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDaySlots(null)}
                    className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all text-sm"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-5 space-y-2">
                  {selectedDaySlots.slots.map((s, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${
                      s.isBlocked ? "bg-red-50 border-red-100" : s.isBooked ? "bg-orange-50 border-orange-100" : s.source === "extra" ? "bg-purple-50 border-purple-100" : "bg-emerald-50 border-emerald-100"
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${
                          s.isBlocked ? "bg-red-400" : s.isBooked ? "bg-orange-400" : s.source === "extra" ? "bg-purple-400" : "bg-emerald-400"
                        }`} />
                        <span className="text-sm font-bold text-gray-800">{s.time}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        s.isBlocked ? "text-red-600 bg-red-100"
                        : s.isBooked ? "text-orange-600 bg-orange-100"
                        : s.source === "extra" ? "text-purple-600 bg-purple-100"
                        : "text-emerald-600 bg-emerald-100"
                      }`}>
                        {s.isBlocked ? "Bloke" : s.isBooked ? "Dolu" : s.source === "extra" ? "Ekstra" : "Program"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            ) : (
              /* ── Default: upcoming list ── */
              <div>
                <div className="bg-linear-to-r from-indigo-50 to-teal-50 px-5 py-4 border-b border-gray-100">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Yaklaşan</p>
                  <p className="font-bold text-gray-800">Randevular</p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
                    <span>👆</span> Takvimden bir güne veya randevuya tıklayın
                  </p>
                  <div className="space-y-2">
                    {appointments
                      .filter((a) => (!isPast(new Date(a.date)) || isToday(new Date(a.date))) && a.status !== "cancelled")
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .slice(0, 6)
                      .map((a) => (
                        <div
                          key={a._id}
                          onClick={() => setSelectedAppointment(a)}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-100 border border-transparent transition-all group"
                        >
                          <div className={`shrink-0 w-9 h-9 rounded-xl flex flex-col items-center justify-center text-white text-[10px] font-bold leading-tight ${
                            isToday(new Date(a.date)) ? "bg-linear-to-br from-indigo-500 to-blue-600" : "bg-linear-to-br from-slate-400 to-slate-500"
                          }`}>
                            <span>{new Date(a.date).toLocaleDateString("tr-TR", { day: "numeric" })}</span>
                            <span className="opacity-80">{new Date(a.date).toLocaleDateString("tr-TR", { month: "short" })}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-700">{a.clientName}</p>
                            <p className="text-xs text-gray-400">⏰ {a.time}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${STATUS_CONFIG[a.status]?.color || "bg-gray-100 text-gray-600"}`}>
                            {STATUS_CONFIG[a.status]?.label}
                          </span>
                        </div>
                      ))}
                    {appointments.filter((a) => (!isPast(new Date(a.date)) || isToday(new Date(a.date))) && a.status !== "cancelled").length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🗓️</div>
                        <p className="text-sm text-gray-400">Yaklaşan randevu yok</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ══ MODAL: Haftalık Program ══ */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
            <div className="bg-linear-to-r from-indigo-50 to-blue-50 flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">🗓️ Haftalık Çalışma Programı</h3>
                <p className="text-xs text-gray-400 mt-0.5">Günlük çalışma saatlerinizi belirleyin; sistem otomatik olarak müsaitlik oluşturur.</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Slot duration */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Randevu Süresi</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map((min) => (
                    <button key={min} type="button"
                      onClick={() => setSchedule((p) => ({ ...p, slotDuration: min }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                        schedule.slotDuration === min
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                          : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                      }`}>
                      {min} dk
                    </button>
                  ))}
                </div>
              </div>

              {/* Public holidays */}
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Resmi Tatillerde Kapat</p>
                  <p className="text-xs text-gray-400 mt-0.5">{TURKISH_FIXED_HOLIDAYS.map((h) => h.name).join(" · ")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSchedule((p) => ({ ...p, excludePublicHolidays: !p.excludePublicHolidays }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${schedule.excludePublicHolidays ? "bg-indigo-600" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${schedule.excludePublicHolidays ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                💡 Dini tatiller otomatik tespit edilemez. Bu günler için &quot;Bloke Et&quot; özelliğini kullanın.
              </div>

              {/* Day rows */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Gün & Saat Aralığı</label>
                {[1,2,3,4,5,6,0].map((dow) => {
                  const dayConf = schedule.days.find((d) => d.dayOfWeek === dow)!;
                  return (
                    <div key={dow} className={`flex items-center gap-3 p-3 rounded-xl border transition ${dayConf.enabled ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-200"}`}>
                      <button
                        type="button"
                        onClick={() => updateDay(dow, { enabled: !dayConf.enabled })}
                        className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${dayConf.enabled ? "bg-indigo-600" : "bg-gray-300"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${dayConf.enabled ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                      <span className={`w-24 text-sm font-semibold ${dayConf.enabled ? "text-indigo-800" : "text-gray-400"}`}>
                        {DAY_NAMES[dow]}
                      </span>
                      {dayConf.enabled ? (
                        <div className="flex items-center gap-2 flex-1">
                          <select value={dayConf.startTime} onChange={(e) => updateDay(dow, { startTime: e.target.value })} className="select-modern flex-1">
                            {ALL_TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span className="text-gray-400">—</span>
                          <select value={dayConf.endTime} onChange={(e) => updateDay(dow, { endTime: e.target.value })} className="select-modern flex-1">
                            {ALL_TIME_SLOTS.filter((t) => t > dayConf.startTime).map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 flex-1">Kapalı</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 pb-6 pt-4 flex gap-3 border-t border-gray-100">
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                İptal
              </button>
              <button onClick={handleSaveSchedule} disabled={scheduleSaving}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm shadow-indigo-200">
                {scheduleSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Manuel Override ══ */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl ${overrideType === "extra" ? "bg-linear-to-r from-emerald-50 to-teal-50" : "bg-linear-to-r from-red-50 to-orange-50"}`}>
              <div>
                <h3 className="font-bold text-gray-900">
                  {overrideType === "extra" ? "➕ Ekstra Zaman Aralığı Ekle" : "🚫 Zaman Aralığı Bloke Et"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {overrideType === "extra" ? "Program dışı ek saatler açın" : "Seçili saatleri kapatın"}
                </p>
              </div>
              <button onClick={() => setShowOverrideModal(false)} className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              <div className="flex gap-2">
                <button type="button" onClick={() => setOverrideType("extra")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${overrideType === "extra" ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  ➕ Ekstra Saat
                </button>
                <button type="button" onClick={() => setOverrideType("blocked")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${overrideType === "blocked" ? "bg-red-500 text-white shadow-sm shadow-red-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  🚫 Bloke Et
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1.5">Başlangıç</label>
                  <DatePickerModern value={overrideStartDate} onChange={setOverrideStartDate} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1.5">Bitiş</label>
                  <DatePickerModern value={overrideEndDate} onChange={setOverrideEndDate} min={overrideStartDate} />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Saatler <span className="text-gray-400 font-normal">({overrideTimes.length} seçili)</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {ALL_TIME_SLOTS.map((t) => (
                    <button key={t} type="button" onClick={() => toggleOverrideTime(t)}
                      className={`py-2 rounded-xl text-xs font-semibold transition border ${
                        overrideTimes.includes(t)
                          ? overrideType === "extra" ? "bg-emerald-500 text-white border-emerald-500" : "bg-red-500 text-white border-red-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-4 flex gap-3 border-t border-gray-100">
              <button onClick={() => setShowOverrideModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                İptal
              </button>
              <button onClick={handleSaveOverride} disabled={!overrideTimes.length || overrideSaving}
                className={`flex-1 py-3 text-white rounded-xl text-sm font-semibold transition disabled:opacity-40 shadow-sm ${overrideType === "extra" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200" : "bg-red-500 hover:bg-red-600 shadow-red-200"}`}>
                {overrideSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Onay ══ */}
      {confirmModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-linear-to-r from-red-50 to-orange-50 px-6 py-5 border-b border-red-100">
              <div className="text-3xl mb-2">⚠️</div>
              <h3 className="font-bold text-gray-900">{confirmModal.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{confirmModal.message}</p>
            </div>
            <div className="p-5 flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={confirmLoading}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={runConfirm}
                disabled={confirmLoading}
                className={`flex-1 py-3 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 ${confirmModal.confirmClass}`}
              >
                {confirmLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    İşleniyor...
                  </span>
                ) : confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Randevu Düzenle ══ */}
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="bg-linear-to-r from-indigo-50 to-blue-50 flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl">
              <h3 className="font-bold text-gray-900">✏️ Randevu Düzenle</h3>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1.5">Tarih</label>
                <DatePickerModern value={editDate} onChange={setEditDate} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-2">Saat</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {ALL_TIME_SLOTS.map((t) => (
                    <button key={t} type="button" onClick={() => setEditTime(t)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition ${editTime === t ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1.5">Not</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  placeholder="Opsiyonel..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                  İptal
                </button>
                <button onClick={handleEditSave} disabled={editSaving}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm shadow-indigo-200">
                  {editSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
