"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: "Beklemede",     color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Onaylandı",     color: "bg-blue-100 text-blue-700" },
  completed: { label: "Gerçekleşti",   color: "bg-emerald-100 text-emerald-700" },
  no_show:   { label: "Gerçekleşmedi", color: "bg-red-100 text-red-700" },
  cancelled: { label: "İptal",         color: "bg-gray-100 text-gray-500" },
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

  // Weekly schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedule, setSchedule] = useState<WeeklyScheduleData>(DEFAULT_SCHEDULE);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  // Manual override modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideType, setOverrideType] = useState<"extra" | "blocked">("blocked");
  const [overrideStartDate, setOverrideStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [overrideEndDate, setOverrideEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [overrideTimes, setOverrideTimes] = useState<string[]>([]);
  const [overrideSaving, setOverrideSaving] = useState(false);

  // Appointment edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);

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

  // Auto-open the appointment passed via ?appointmentId= once appointments are loaded
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
      if (res.ok) {
        setShowScheduleModal(false);
        fetchMonthSlots();
      }
    } finally {
      setScheduleSaving(false);
    }
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
        body: JSON.stringify({
          startDate: overrideStartDate,
          endDate: overrideEndDate,
          times: overrideTimes,
          type: overrideType,
        }),
      });
      if (res.ok) {
        setShowOverrideModal(false);
        setOverrideTimes([]);
        fetchMonthSlots();
      }
    } finally {
      setOverrideSaving(false);
    }
  };

  const handleDeleteOverride = async (slotId: string) => {
    await fetch(`/api/dietitian/slots?id=${slotId}`, { method: "DELETE" });
    fetchMonthSlots();
    setSelectedDaySlots(null);
  };

  /* ─── Appointment actions ────────────────────────── */
  const handleStatusChange = async (id: string, status: string) => {
    await fetch("/api/dietitian/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: id, status }),
    });
    await fetchAppointments();
    setSelectedAppointment((prev) => prev ? { ...prev, status } : null);
  };

  const openEditModal = (apt: Appointment) => {
    setEditDate(format(new Date(apt.date), "yyyy-MM-dd"));
    setEditTime(apt.time);
    setEditNotes(apt.notes || "");
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!selectedAppointment) return;
    setEditSaving(true);
    try {
      const res = await fetch("/api/dietitian/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppointment._id,
          date: editDate,
          time: editTime,
          notes: editNotes,
        }),
      });
      if (res.ok) {
        setShowEditModal(false);
        await fetchAppointments();
        setSelectedAppointment((prev) =>
          prev ? { ...prev, date: new Date(editDate).toISOString(), time: editTime, notes: editNotes } : null,
        );
      }
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm("Randevuyu silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/appointments?id=${id}`, { method: "DELETE" });
    setSelectedAppointment(null);
    fetchAppointments();
  };

  /* ─── Render ─────────────────────────────────────── */
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">

      {/* ── Left: Calendar ── */}
      <div className="w-full lg:w-3/4 bg-emerald-50 p-4 md:p-6">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <h2 className="text-2xl font-bold text-gray-900 mr-auto">📅 Randevular</h2>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            <FaCalendarAlt /> Haftalık Program
          </button>
          <button
            onClick={() => { setOverrideType("extra"); setShowOverrideModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
          >
            <FaPlus /> Ekstra Slot
          </button>
          <button
            onClick={() => { setOverrideType("blocked"); setShowOverrideModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
          >
            Slot Bloke Et
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> Müsait (program)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-400 inline-block" /> Ekstra slot</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Bloke / Dolu</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Randevu</span>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <FaChevronLeft className="text-gray-600" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, "MMMM yyyy", { locale: tr })}
            </h3>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <FaChevronRight className="text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="h-24" />;
              const dayApts  = getDayAppointments(day);
              const daySlots = getDaySlots(day);
              const today    = isToday(day);
              const inMonth  = isSameMonth(day, currentMonth);
              const hasExtra   = daySlots.some((s) => s.source === "extra" && !s.isBlocked);
              const hasFree    = daySlots.some((s) => !s.isBooked && !s.isBlocked);
              const hasBlocked = daySlots.some((s) => s.isBlocked);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`h-24 p-1 rounded-lg text-sm border cursor-pointer transition
                    ${!inMonth ? "text-gray-300 border-transparent" : "text-gray-700 border-gray-100 hover:border-emerald-300"}
                    ${today ? "bg-emerald-50 border-emerald-200" : ""}`}
                >
                  <span className={`text-xs font-medium ${today ? "text-emerald-700" : ""}`}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayApts.slice(0, 2).map((apt) => (
                      <div
                        key={apt._id}
                        onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); setSelectedDaySlots(null); }}
                        className="text-[9px] bg-blue-100 text-blue-700 rounded px-1 py-0.5 truncate cursor-pointer hover:bg-blue-200"
                      >
                        {apt.time} {apt.clientName.split(" ")[0]}
                      </div>
                    ))}
                    {dayApts.length > 2 && (
                      <div className="text-[9px] text-gray-400">+{dayApts.length - 2}</div>
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

      {/* ── Right: Detail panel ── */}
      <aside className="w-full lg:w-1/4 bg-white lg:min-h-screen p-4 md:p-6 border-t lg:border-t-0 lg:border-l shadow-sm overflow-y-auto">

        {selectedAppointment ? (
          /* ── Appointment detail ── */
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">📋 Randevu</h3>
              <button onClick={() => setSelectedAppointment(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
              <p className="font-semibold text-gray-900">{selectedAppointment.clientName}</p>
              <p className="text-sm text-gray-600">
                📅 {new Date(selectedAppointment.date).toLocaleDateString("tr-TR", { day:"numeric", month:"long", year:"numeric" })}
              </p>
              <p className="text-sm text-gray-600">⏰ {selectedAppointment.time}</p>
              {selectedAppointment.notes && (
                <p className="text-xs text-gray-400 italic">Not: {selectedAppointment.notes}</p>
              )}
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[selectedAppointment.status]?.color || "bg-gray-100 text-gray-600"}`}>
                {STATUS_CONFIG[selectedAppointment.status]?.label || selectedAppointment.status}
              </span>
            </div>

            <p className="text-xs text-gray-500 font-medium mb-2">Durum Güncelle</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { key:"confirmed", label:"Onaylandı",     icon:<FaClock /> },
                { key:"completed", label:"Gerçekleşti",   icon:<FaCheckCircle /> },
                { key:"no_show",   label:"Gelmedi",       icon:<FaTimesCircle /> },
                { key:"cancelled", label:"İptal",         icon:null },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(selectedAppointment._id, key)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                    selectedAppointment.status === key
                      ? key === "confirmed" ? "bg-blue-500 text-white"
                      : key === "completed" ? "bg-emerald-500 text-white"
                      : key === "no_show"   ? "bg-red-500 text-white"
                      : "bg-gray-400 text-white"
                      : key === "confirmed" ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : key === "completed" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : key === "no_show"   ? "bg-red-50 text-red-700 hover:bg-red-100"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => openEditModal(selectedAppointment)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition">
                <FaEdit /> Düzenle
              </button>
              <button onClick={() => handleDeleteAppointment(selectedAppointment._id)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                <FaTrash />
              </button>
            </div>
          </div>

        ) : selectedDaySlots ? (
          /* ── Day slots ── */
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                🕐 {format(selectedDaySlots.date, "d MMMM", { locale: tr })}
              </h3>
              <button onClick={() => setSelectedDaySlots(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="space-y-1.5">
              {selectedDaySlots.slots.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      s.isBlocked ? "bg-red-400" : s.isBooked ? "bg-orange-400" : s.source === "extra" ? "bg-purple-400" : "bg-emerald-400"
                    }`} />
                    <span className="text-sm font-medium text-gray-800">{s.time}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      s.isBlocked ? "bg-red-50 text-red-600"
                      : s.isBooked ? "bg-orange-50 text-orange-600"
                      : s.source === "extra" ? "bg-purple-50 text-purple-600"
                      : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {s.isBlocked ? "Bloke" : s.isBooked ? "Dolu" : s.source === "extra" ? "Ekstra" : "Program"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        ) : (
          /* ── Default: upcoming list ── */
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📋 Randevu Detayı</h3>
            <p className="text-sm text-gray-400 mb-5">Takvimden bir güne tıklayın.</p>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Yaklaşan</h4>
            <div className="space-y-2">
              {appointments
                .filter((a) => (!isPast(new Date(a.date)) || isToday(new Date(a.date))) && a.status !== "cancelled")
                .slice(0, 6)
                .map((a) => (
                  <div key={a._id} onClick={() => setSelectedAppointment(a)}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-emerald-50 transition">
                    <p className="text-sm font-medium text-gray-900">{a.clientName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(a.date).toLocaleDateString("tr-TR", { day:"numeric", month:"short" })} — {a.time}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </aside>

      {/* ══════════════════════════════════════════════
          MODAL: Haftalık Program
      ══════════════════════════════════════════════ */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">🗓️ Haftalık Çalışma Programı</h3>
                <p className="text-xs text-gray-400 mt-0.5">Günlük çalışma saatlerinizi belirleyin; sistem otomatik olarak müsaitlik oluşturur.</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

              {/* Slot duration */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Randevu Süresi</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map((min) => (
                    <button key={min} type="button"
                      onClick={() => setSchedule((p) => ({ ...p, slotDuration: min }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                        schedule.slotDuration === min
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                      }`}>
                      {min} dk
                    </button>
                  ))}
                </div>
              </div>

              {/* Public holidays toggle */}
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">Resmi Tatillerde Kapat</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {TURKISH_FIXED_HOLIDAYS.map((h) => h.name).join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSchedule((p) => ({ ...p, excludePublicHolidays: !p.excludePublicHolidays }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${schedule.excludePublicHolidays ? "bg-indigo-600" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${schedule.excludePublicHolidays ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <div>
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  💡 Dini tatiller (Ramazan, Kurban Bayramı vb.) otomatik tespit edilemez. Bu günler için &quot;Slot Bloke Et&quot; özelliğini kullanın.
                </p>
              </div>

              {/* Day rows */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 block">Gün & Saat Aralığı</label>
                {/* Order: Mon→Sun (Tr convention) */}
                {[1,2,3,4,5,6,0].map((dow) => {
                  const dayConf = schedule.days.find((d) => d.dayOfWeek === dow)!;
                  return (
                    <div key={dow} className={`flex items-center gap-3 p-3 rounded-xl border transition ${dayConf.enabled ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-200"}`}>
                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() => updateDay(dow, { enabled: !dayConf.enabled })}
                        className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${dayConf.enabled ? "bg-indigo-600" : "bg-gray-300"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${dayConf.enabled ? "translate-x-5" : "translate-x-0"}`} />
                      </button>

                      {/* Day name */}
                      <span className={`w-24 text-sm font-medium ${dayConf.enabled ? "text-indigo-800" : "text-gray-400"}`}>
                        {DAY_NAMES[dow]}
                      </span>

                      {/* Time selects */}
                      {dayConf.enabled ? (
                        <div className="flex items-center gap-2 flex-1">
                          <select
                            value={dayConf.startTime}
                            onChange={(e) => updateDay(dow, { startTime: e.target.value })}
                            className="select-modern flex-1"
                          >
                            {ALL_TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span className="text-gray-400 text-sm">—</span>
                          <select
                            value={dayConf.endTime}
                            onChange={(e) => updateDay(dow, { endTime: e.target.value })}
                            className="select-modern flex-1"
                          >
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

            <div className="px-6 pb-6 flex gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                İptal
              </button>
              <button onClick={handleSaveSchedule} disabled={scheduleSaving}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
                {scheduleSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MODAL: Manuel Override (Ekstra / Bloke)
      ══════════════════════════════════════════════ */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {overrideType === "extra" ? "➕ Ekstra Slot Ekle" : "🚫 Slot Bloke Et"}
              </h3>
              <button onClick={() => setShowOverrideModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Type toggle */}
              <div className="flex gap-2">
                <button type="button" onClick={() => setOverrideType("extra")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${overrideType === "extra" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  ➕ Ekstra Slot
                </button>
                <button type="button" onClick={() => setOverrideType("blocked")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${overrideType === "blocked" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  🚫 Bloke Et
                </button>
              </div>

              <p className="text-xs text-gray-400">
                {overrideType === "extra"
                  ? "Program dışı ek saatler açmak için kullanın."
                  : "Programda olan ama müsait olmamasını istediğiniz saatleri kapatmak için kullanın."}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Başlangıç</label>
                  <input type="date" value={overrideStartDate} onChange={(e) => setOverrideStartDate(e.target.value)}
                    className="date-modern w-full" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Bitiş</label>
                  <input type="date" value={overrideEndDate} onChange={(e) => setOverrideEndDate(e.target.value)}
                    min={overrideStartDate}
                    className="date-modern w-full" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-2">
                  Saatler <span className="text-gray-400">({overrideTimes.length} seçili)</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {ALL_TIME_SLOTS.map((t) => (
                    <button key={t} type="button" onClick={() => toggleOverrideTime(t)}
                      className={`py-1.5 rounded-lg text-xs font-medium transition border ${
                        overrideTimes.includes(t)
                          ? overrideType === "extra" ? "bg-emerald-500 text-white border-emerald-500" : "bg-red-500 text-white border-red-500"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => setShowOverrideModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                İptal
              </button>
              <button onClick={handleSaveOverride} disabled={!overrideTimes.length || overrideSaving}
                className={`flex-1 py-2.5 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 ${overrideType === "extra" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}>
                {overrideSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MODAL: Randevu Düzenle
      ══════════════════════════════════════════════ */}
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">✏️ Randevu Düzenle</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Tarih</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                  className="date-modern w-full" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-2">Saat</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {ALL_TIME_SLOTS.map((t) => (
                    <button key={t} type="button" onClick={() => setEditTime(t)}
                      className={`py-1.5 rounded-lg text-xs font-medium border transition ${editTime === t ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Not</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Opsiyonel..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                  İptal
                </button>
                <button onClick={handleEditSave} disabled={editSaving}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50">
                  {editSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
