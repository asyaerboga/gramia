"use client";

import { useState, useEffect, useCallback } from "react";
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
  startOfDay,
  differenceInDays,
  differenceInHours,
} from "date-fns";
import { tr } from "date-fns/locale";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface Appointment {
  _id: string;
  date: string;
  time: string;
  status: string;
  dietitianName?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:   { label: "Beklemede",     color: "bg-amber-100 text-amber-700 border border-amber-200" },
  confirmed: { label: "Onaylandı",     color: "bg-violet-100 text-violet-700 border border-violet-200" },
  completed: { label: "Gerçekleşti",   color: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  no_show:   { label: "Gerçekleşmedi", color: "bg-red-100 text-red-700 border border-red-200" },
  cancelled: { label: "İptal",         color: "bg-gray-100 text-gray-500 border border-gray-200" },
};

function CountdownBadge({ date, time }: { date: string; time: string }) {
  const aptDate = new Date(`${date}T${time}:00`);
  const hours = differenceInHours(aptDate, new Date());
  const days  = differenceInDays(aptDate, new Date());
  if (hours < 0) return null;
  if (hours < 24) return (
    <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full animate-pulse">{hours}s sonra</span>
  );
  return (
    <span className="text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">{days} gün sonra</span>
  );
}

export default function AppointmentsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [datesWithSlots, setDatesWithSlots] = useState<Set<string>>(new Set());
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [booked, setBooked] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) setAppointments(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  const fetchDatesWithSlots = useCallback(async () => {
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end   = format(endOfMonth(currentMonth),   "yyyy-MM-dd");
    try {
      const res = await fetch(`/api/slots/month?from=${start}&to=${end}`);
      if (res.ok) setDatesWithSlots(new Set(await res.json()));
    } catch { setDatesWithSlots(new Set()); }
  }, [currentMonth]);

  useEffect(() => { fetchAppointments(); },   [fetchAppointments]);
  useEffect(() => { fetchDatesWithSlots(); }, [fetchDatesWithSlots]);

  const fetchSlotsForDate = async (date: string) => {
    setSlotsLoading(true);
    setAvailableSlots([]);
    setSelectedTime("");
    try {
      const res = await fetch(`/api/slots?date=${date}`);
      if (res.ok) setAvailableSlots((await res.json()).slots ?? []);
    } catch (e) { console.error(e); }
    finally { setSlotsLoading(false); }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddedDays = Array(startDay === 0 ? 6 : startDay - 1).fill(null).concat(days);

  const getDayType = (day: Date) => {
    const today   = isSameDay(day, new Date());
    const pastDay = isPast(startOfDay(day)) && !today;
    const dateStr = format(day, "yyyy-MM-dd");
    const hasSlot = datesWithSlots.has(dateStr);
    const hasMyApt = appointments.some((a) => isSameDay(new Date(a.date), day));
    if (pastDay) return "past";
    if (today) return hasSlot || hasMyApt ? "today-slot" : "today-no-slot";
    return hasSlot ? "future-slot" : "future-no-slot";
  };

  const handleDayClick = (day: Date) => {
    const type = getDayType(day);
    if (type === "past" || type === "future-no-slot" || type === "today-no-slot") return;
    const dateStr = format(day, "yyyy-MM-dd");
    setSelectedDate(dateStr);
    setShowBooking(true);
    setBooked(false);
    setBookingError("");
    fetchSlotsForDate(dateStr);
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) return;
    setBooking(true);
    setBookingError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, time: selectedTime }),
      });
      if (res.ok) {
        await fetchAppointments();
        await fetchDatesWithSlots();
        setBooked(true);
        setTimeout(() => {
          setShowBooking(false);
          setSelectedDate("");
          setSelectedTime("");
          setAvailableSlots([]);
          setBooked(false);
        }, 2000);
      } else {
        const data = await res.json();
        setBookingError(data.error || "Randevu alınamadı, lütfen tekrar deneyin.");
        if (res.status === 409) { await fetchSlotsForDate(selectedDate); setSelectedTime(""); }
      }
    } finally { setBooking(false); }
  };

  const doCancel = async () => {
    if (!confirmCancelId) return;
    setCancelling(true);
    await fetch("/api/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: confirmCancelId, status: "cancelled" }),
    });
    setCancelling(false);
    setConfirmCancelId(null);
    fetchAppointments();
  };

  const upcomingApts = appointments
    .filter((a) => !isPast(new Date(a.date)) || isSameDay(new Date(a.date), new Date()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastApts = appointments
    .filter((a) => isPast(new Date(a.date)) && !isSameDay(new Date(a.date), new Date()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const nextApt = upcomingApts[0];

  return (
    <div className="min-h-screen bg-[#f4f6fb] p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Hero ─────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-violet-600 via-purple-600 to-teal-400 p-6 md:p-8 text-white shadow-xl shadow-violet-200">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-white/70 text-sm font-medium mb-1">Hoş geldin 👋</p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Randevularım</h1>
              <p className="text-white/80 text-sm mt-1.5">
                {nextApt
                  ? `Sonraki randevun: ${new Date(nextApt.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} - ${nextApt.time}`
                  : "Takvimden yeşil bir güne tıklayarak randevu al"}
              </p>
              {nextApt && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 text-sm font-semibold">
                    ⏰ {nextApt.time}
                  </span>
                  {nextApt.dietitianName && (
                    <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 text-sm font-semibold">
                      📍 Dr. {nextApt.dietitianName}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl shadow-lg border border-white/20">
              📅
            </div>
          </div>
        </div>

        {/* ── Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Calendar ── 3 cols */}
          <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition"
              >
                <FaChevronLeft size={11} />
              </button>
              <h3 className="font-bold text-gray-900 capitalize text-base tracking-tight">
                {format(currentMonth, "MMMM yyyy", { locale: tr })}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition"
              >
                <FaChevronRight size={11} />
              </button>
            </div>

            <div className="px-4 pb-6">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-400 py-3">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1.5">
                {paddedDays.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />;

                  const inMonth  = isSameMonth(day, currentMonth);
                  const type     = getDayType(day);
                  const dateStr  = format(day, "yyyy-MM-dd");
                  const todayDay = isSameDay(day, new Date());
                  const hasMyApt = appointments.some((a) => isSameDay(new Date(a.date), day));
                  const canClick = type === "future-slot" || type === "today-slot";

                  if (!inMonth) return <div key={dateStr} className="h-16" />;

                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleDayClick(day)}
                      className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-150 select-none ${
                        todayDay
                          ? "bg-linear-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-200 cursor-pointer"
                          : canClick
                          ? "bg-emerald-50 cursor-pointer hover:bg-emerald-100 hover:scale-105"
                          : type === "past"
                          ? "cursor-default"
                          : "cursor-default"
                      }`}
                    >
                      <span className={`text-sm font-bold leading-none ${
                        todayDay ? "text-white" : canClick ? "text-emerald-700" : "text-gray-300"
                      }`}>
                        {format(day, "d")}
                      </span>
                      <div className="flex gap-0.5">
                        {hasMyApt && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        {canClick && !hasMyApt && (
                          <span className={`w-1.5 h-1.5 rounded-full ${todayDay ? "bg-white/70" : "bg-emerald-400"}`} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Side panel ── 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {showBooking && selectedDate ? (
              /* Booking panel */
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden flex-1">
                <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Seçili tarih</p>
                    <p className="font-bold text-gray-800 text-sm mt-0.5">
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowBooking(false); setSelectedDate(""); setAvailableSlots([]); setBookingError(""); setBooked(false); }}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-5">
                  {booked ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                      <div className="text-5xl animate-bounce">🎉</div>
                      <p className="font-bold text-emerald-600 text-lg">Randevu Alındı!</p>
                      <p className="text-xs text-gray-400">Yönlendiriliyor...</p>
                    </div>
                  ) : slotsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-8 h-8 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin" />
                      <p className="text-xs text-gray-400">Yükleniyor...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                      <span className="text-4xl">😔</span>
                      <p className="text-sm font-semibold text-gray-600">Müsait saat yok</p>
                      <p className="text-xs text-gray-400">Başka bir gün deneyin</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Saat Seçin</p>
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2.5 rounded-2xl text-xs font-bold transition-all duration-150 ${
                              selectedTime === slot
                                ? "bg-linear-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-200 scale-105"
                                : "bg-gray-50 text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                      {bookingError && (
                        <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 flex gap-2">
                          <span>⚠️</span> {bookingError}
                        </p>
                      )}
                      <button
                        onClick={handleBook}
                        disabled={!selectedTime || booking}
                        className="w-full py-3 bg-linear-to-r from-violet-500 to-purple-600 text-white font-bold rounded-2xl hover:opacity-90 transition disabled:opacity-40 shadow-md shadow-violet-200 text-sm"
                      >
                        {booking ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                            Alınıyor...
                          </span>
                        ) : "✨ Randevu Al"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Hint card */
              <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl">🗓️</div>
                <div>
                  <p className="font-bold text-gray-800">Randevu Almak İçin</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Takvimde <span className="text-emerald-500 font-semibold">yeşil renkli</span> bir güne tıkla
                  </p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-3xl shadow-sm p-5 text-center">
                <p className="text-3xl font-bold text-violet-600">{upcomingApts.length}</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Yaklaşan</p>
              </div>
              <div className="bg-white rounded-3xl shadow-sm p-5 text-center">
                <p className="text-3xl font-bold text-emerald-500">
                  {pastApts.filter((a) => a.status === "completed").length}
                </p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Tamamlanan</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Upcoming ─────────────────────────────── */}
        {upcomingApts.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
              <span className="text-lg">🚀</span>
              <h3 className="font-bold text-gray-800">Yaklaşan Randevularım</h3>
              <span className="ml-auto bg-violet-100 text-violet-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {upcomingApts.length}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingApts.map((apt, idx) => (
                <div key={apt._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group">
                  <div className={`shrink-0 w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-white shadow-md text-xs font-bold leading-tight ${
                    idx === 0 ? "bg-linear-to-br from-violet-500 to-purple-600 shadow-violet-200" : "bg-linear-to-br from-slate-400 to-slate-500"
                  }`}>
                    <span>{new Date(apt.date).toLocaleDateString("tr-TR", { day: "numeric" })}</span>
                    <span className="opacity-80 font-medium">{new Date(apt.date).toLocaleDateString("tr-TR", { month: "short" })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 text-sm">
                        {new Date(apt.date).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                      <CountdownBadge date={apt.date} time={apt.time} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      <span>⏰ {apt.time}</span>
                      {apt.dietitianName && <span>👤 Dr. {apt.dietitianName}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_MAP[apt.status]?.color || "bg-gray-100 text-gray-600"}`}>
                      {STATUS_MAP[apt.status]?.label || apt.status}
                    </span>
                    {(apt.status === "pending" || apt.status === "confirmed") && (
                      <button
                        onClick={() => setConfirmCancelId(apt._id)}
                        className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                      >
                        İptal
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Past ─────────────────────────────────── */}
        {pastApts.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
              <span className="text-lg">📁</span>
              <h3 className="font-bold text-gray-800">Geçmiş Randevular</h3>
              <span className="ml-auto bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {pastApts.length}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {pastApts.map((apt) => (
                <div key={apt._id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50/60 transition-colors">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex flex-col items-center justify-center text-[10px] font-bold text-gray-500 leading-tight">
                    <span>{new Date(apt.date).toLocaleDateString("tr-TR", { day: "numeric" })}</span>
                    <span className="opacity-70">{new Date(apt.date).toLocaleDateString("tr-TR", { month: "short" })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-600">
                      {new Date(apt.date).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-xs text-gray-400">⏰ {apt.time}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_MAP[apt.status]?.color || "bg-gray-100 text-gray-600"}`}>
                    {STATUS_MAP[apt.status]?.label || apt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty ────────────────────────────────── */}
        {appointments.length === 0 && !showBooking && (
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center flex flex-col items-center gap-4">
            <div className="text-6xl">🌟</div>
            <div>
              <p className="font-bold text-gray-700 text-lg">Henüz randevunuz yok</p>
              <p className="text-gray-400 text-sm mt-1">Takvimden yeşil bir güne tıklayarak başlayın!</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Cancel modal ─────────────────────────── */}
      {confirmCancelId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-linear-to-r from-red-50 to-orange-50 px-6 py-5 border-b border-red-100">
              <div className="text-3xl mb-2">⚠️</div>
              <h3 className="font-bold text-gray-900">Randevuyu İptal Et</h3>
              <p className="text-sm text-gray-500 mt-1">Bu işlem geri alınamaz.</p>
            </div>
            <div className="p-5 flex gap-3">
              <button
                onClick={() => setConfirmCancelId(null)}
                disabled={cancelling}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={doCancel}
                disabled={cancelling}
                className="flex-1 py-3 bg-linear-to-r from-red-500 to-rose-500 text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-md shadow-red-200"
              >
                {cancelling ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    İptal ediliyor...
                  </span>
                ) : "Evet, İptal Et"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
