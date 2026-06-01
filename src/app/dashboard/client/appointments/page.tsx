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
} from "date-fns";
import { tr } from "date-fns/locale";
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from "react-icons/fa";

interface Appointment {
  _id: string;
  date: string;
  time: string;
  status: string;
  dietitianName?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:   { label: "Beklemede",     color: "bg-amber-100 text-amber-700 border border-amber-200" },
  confirmed: { label: "Onaylandı",     color: "bg-blue-100 text-blue-700 border border-blue-200" },
  completed: { label: "Gerçekleşti",   color: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  no_show:   { label: "Gerçekleşmedi", color: "bg-red-100 text-red-700 border border-red-200" },
  cancelled: { label: "İptal",         color: "bg-gray-100 text-gray-500 border border-gray-200" },
};

export default function AppointmentsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [datesWithSlots, setDatesWithSlots] = useState<Set<string>>(new Set());

  /* ── Data fetching ─────────────────────────────── */
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
      if (res.ok) {
        const dates: string[] = await res.json();
        setDatesWithSlots(new Set(dates));
      }
    } catch {
      setDatesWithSlots(new Set());
    }
  }, [currentMonth]);

  useEffect(() => { fetchAppointments(); },       [fetchAppointments]);
  useEffect(() => { fetchDatesWithSlots(); },     [fetchDatesWithSlots]);

  const fetchSlotsForDate = async (date: string) => {
    setSlotsLoading(true);
    setAvailableSlots([]);
    setSelectedTime("");
    try {
      const res = await fetch(`/api/slots?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots ?? []);
      }
    } catch (e) { console.error(e); }
    finally { setSlotsLoading(false); }
  };

  /* ── Calendar helpers ──────────────────────────── */
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddedDays = Array(startDay === 0 ? 6 : startDay - 1).fill(null).concat(days);

  const getDayType = (day: Date): "past" | "today-slot" | "today-no-slot" | "future-slot" | "future-no-slot" => {
    const today    = isSameDay(day, new Date());
    const pastDay  = isPast(startOfDay(day)) && !today;
    const dateStr  = format(day, "yyyy-MM-dd");
    const hasSlot  = datesWithSlots.has(dateStr);
    const hasMyApt = appointments.some((a) => isSameDay(new Date(a.date), day));

    if (pastDay) return "past";
    if (today) return hasSlot || hasMyApt ? "today-slot" : "today-no-slot";
    return hasSlot ? "future-slot" : "future-no-slot";
  };

  const handleDayClick = (day: Date) => {
    const type = getDayType(day);
    // Only allow opening booking form on days with slots
    if (type === "past" || type === "future-no-slot" || type === "today-no-slot") return;
    const dateStr = format(day, "yyyy-MM-dd");
    setSelectedDate(dateStr);
    setShowBooking(true);
    fetchSlotsForDate(dateStr);
  };

  /* ── Booking ───────────────────────────────────── */
  const handleBook = async () => {
    if (!selectedDate || !selectedTime) return;
    setBooking(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, time: selectedTime }),
      });
      if (res.ok) {
        await fetchAppointments();
        await fetchDatesWithSlots();
        setShowBooking(false);
        setSelectedDate("");
        setSelectedTime("");
        setAvailableSlots([]);
      }
    } finally { setBooking(false); }
  };

  const handleCancel = async (id: string) => {
    await fetch("/api/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: id, status: "cancelled" }),
    });
    fetchAppointments();
  };

  /* ── Partition appointments ─────────────────────── */
  const upcomingApts = appointments.filter(
    (a) => !isPast(new Date(a.date)) || isSameDay(new Date(a.date), new Date()),
  );
  const pastApts = appointments
    .filter((a) => isPast(new Date(a.date)) && !isSameDay(new Date(a.date), new Date()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  /* ── Render ────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">📅 Randevularım</h2>
          <div className="bg-emerald-50 rounded-lg px-4 py-2 border border-emerald-100 text-xs sm:text-sm text-emerald-700">
            🟢 Yeşil günler müsait — tıklayarak randevu alabilirsiniz
          </div>
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

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="h-16" />;

              const inMonth = isSameMonth(day, currentMonth);
              const type    = getDayType(day);
              const dateStr = format(day, "yyyy-MM-dd");
              const hasMyApt = appointments.some((a) => isSameDay(new Date(a.date), day));

              // Determine appearance
              let cellClass = "h-16 p-1 rounded-lg text-sm border transition select-none ";
              let numClass  = "text-xs font-medium ";

              if (!inMonth) {
                cellClass += "border-transparent text-gray-200";
                numClass  += "text-gray-300";
              } else if (type === "past") {
                cellClass += "bg-gray-50 border-gray-100 cursor-not-allowed";
                numClass  += "text-gray-300";
              } else if (type === "future-no-slot" || type === "today-no-slot") {
                cellClass += "bg-white border-gray-100 cursor-not-allowed";
                numClass  += "text-gray-400";
              } else if (type === "future-slot" || type === "today-slot") {
                cellClass += "bg-green-50 border-green-200 cursor-pointer hover:bg-green-100";
                numClass  += type === "today-slot" ? "text-emerald-700 font-bold" : "text-gray-700";
              }

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayClick(day)}
                  className={cellClass}
                >
                  <span className={numClass}>{format(day, "d")}</span>
                  <div className="flex gap-0.5 mt-1 flex-wrap">
                    {hasMyApt && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                    )}
                    {(type === "future-slot" || type === "today-slot") && !hasMyApt && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-50 border border-green-200 inline-block" />
              Randevu alınabilir
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Randevunuz var
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gray-50 border border-gray-100 inline-block" />
              Müsait değil / Geçmiş
            </span>
          </div>
        </div>

        {/* Booking card */}
        {showBooking && selectedDate && (
          <div className="bg-white rounded-xl p-6 shadow-sm max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FaCalendarAlt className="text-emerald-500" />
                {new Date(selectedDate).toLocaleDateString("tr-TR", { day:"numeric", month:"long", year:"numeric" })}
              </h3>
              <button
                onClick={() => { setShowBooking(false); setSelectedDate(""); setAvailableSlots([]); }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                Bu tarihte müsait randevu saati kalmamış.
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Müsait saatlerden birini seçin:</p>
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2.5 rounded-lg text-sm font-medium transition border ${
                        selectedTime === slot
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleBook}
                  disabled={!selectedTime || booking}
                  className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
                >
                  {booking ? "Alınıyor..." : "Randevu Al"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upcoming appointments */}
        {upcomingApts.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">📋 Yaklaşan Randevularım</h3>
            <div className="space-y-3">
              {upcomingApts.map((apt) => (
                <div key={apt._id} className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(apt.date).toLocaleDateString("tr-TR", { day:"numeric", month:"long", year:"numeric" })}
                    </p>
                    <p className="text-sm text-gray-500">⏰ {apt.time}</p>
                    {apt.dietitianName && <p className="text-xs text-gray-400 mt-0.5">Dr. {apt.dietitianName}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_MAP[apt.status]?.color || "bg-gray-100 text-gray-600"}`}>
                      {STATUS_MAP[apt.status]?.label || apt.status}
                    </span>
                    {(apt.status === "pending" || apt.status === "confirmed") && (
                      <button
                        onClick={() => handleCancel(apt._id)}
                        className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded-lg transition"
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

        {/* Past appointments */}
        {pastApts.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">📁 Geçmiş Randevular</h3>
            <div className="space-y-2">
              {pastApts.map((apt) => (
                <div key={apt._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(apt.date).toLocaleDateString("tr-TR", { day:"numeric", month:"long", year:"numeric" })}
                    </p>
                    <p className="text-xs text-gray-400">⏰ {apt.time}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_MAP[apt.status]?.color || "bg-gray-100 text-gray-600"}`}>
                    {STATUS_MAP[apt.status]?.label || apt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {appointments.length === 0 && !showBooking && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center text-gray-400">
            Henüz randevunuz bulunmuyor. Takvimden yeşil bir güne tıklayarak randevu alabilirsiniz.
          </div>
        )}
      </div>
    </div>
  );
}
