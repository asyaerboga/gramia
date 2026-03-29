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

export default function AppointmentsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showBooking, setShowBooking] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) return;
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, time: selectedTime }),
      });
      if (res.ok) {
        fetchAppointments();
        setShowBooking(false);
        setSelectedDate("");
        setSelectedTime("");
      }
    } catch (error) {
      console.error("Failed to book appointment:", error);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start with empty days
  const startDay = monthStart.getDay();
  const paddedDays = Array(startDay === 0 ? 6 : startDay - 1)
    .fill(null)
    .concat(days);

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            📅 Randevularım
          </h2>
          <div className="bg-emerald-50 rounded-lg px-4 py-2 border border-emerald-100">
            <p className="text-xs sm:text-sm text-emerald-700">
              🗓️ Takvimden bir gün seçerek randevu alabilirsiniz
            </p>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FaChevronLeft className="text-gray-600" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, "MMMM yyyy", { locale: tr })}
            </h3>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FaChevronRight className="text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-gray-500 py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) {
                return <div key={`empty-${i}`} className="h-16" />;
              }
              const hasAppointment = appointments.some((a) =>
                isSameDay(new Date(a.date), day),
              );
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <div
                  key={day.toISOString()}
                  className={`h-16 p-1 rounded-lg text-sm cursor-pointer transition ${
                    !isCurrentMonth ? "text-gray-300" : "text-gray-700"
                  } ${isToday ? "bg-emerald-50 font-bold" : "hover:bg-gray-50"}`}
                  onClick={() => {
                    setSelectedDate(format(day, "yyyy-MM-dd"));
                    setShowBooking(true);
                  }}
                >
                  <span>{format(day, "d")}</span>
                  {hasAppointment && (
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mx-auto mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointment list */}
        <div className="bg-white rounded-xl p-6 shadow-sm mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Randevu Listesi</h3>
          {appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(apt.date).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-500">⏰ {apt.time}</p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      apt.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-700"
                        : apt.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {apt.status === "confirmed"
                      ? "Onaylandı"
                      : apt.status === "pending"
                        ? "Beklemede"
                        : apt.status === "cancelled"
                          ? "İptal"
                          : "Tamamlandı"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Henüz randevu yok.</p>
          )}
        </div>

        {/* Booking Card */}
        {showBooking && selectedDate && (
          <div className="bg-white rounded-xl p-6 shadow-sm mt-6 max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4">🗓️ Randevu Al</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Seçilen Tarih</p>
                <p className="font-medium text-gray-900">
                  {new Date(selectedDate).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Saat Seçin
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition ${
                        selectedTime === slot
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowBooking(false);
                    setSelectedDate("");
                    setSelectedTime("");
                  }}
                  className="px-4 py-3 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  İptal
                </button>
                <button
                  onClick={handleBookAppointment}
                  disabled={!selectedTime}
                  className="flex-1 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
                >
                  Randevu Al
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
