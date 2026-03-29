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
  clientName: string;
  notes?: string;
}

export default function DietitianAppointmentsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/dietitian/appointments");
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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddedDays = Array(startDay === 0 ? 6 : startDay - 1)
    .fill(null)
    .concat(days);

  const getAppointmentsForDay = (day: Date) =>
    appointments.filter((a) => isSameDay(new Date(a.date), day));

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="w-full lg:w-3/4 bg-green-50 min-h-screen p-4 md:p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📅 Randevular</h2>

        <div className="bg-white rounded-xl p-6 shadow-sm">
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

          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="h-24" />;

              const dayAppointments = getAppointmentsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <div
                  key={day.toISOString()}
                  className={`h-24 p-1 rounded-lg text-sm border ${
                    !isCurrentMonth
                      ? "text-gray-300 border-transparent"
                      : "text-gray-700 border-gray-50"
                  } ${isToday ? "bg-emerald-50 border-emerald-200" : "hover:bg-gray-50"}`}
                >
                  <span className="text-xs">{format(day, "d")}</span>
                  {dayAppointments.slice(0, 2).map((apt) => (
                    <div
                      key={apt._id}
                      onClick={() => setSelectedAppointment(apt)}
                      className="text-[10px] bg-emerald-100 text-emerald-700 rounded px-1 py-0.5 mt-0.5 truncate cursor-pointer hover:bg-emerald-200"
                    >
                      {apt.time} - {apt.clientName}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      +{dayAppointments.length - 2} daha
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel - Appointment detail */}
      <aside className="w-full lg:w-1/4 bg-white lg:min-h-screen p-4 md:p-6 border-t lg:border-t-0 lg:border-l shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">📋 Randevu Detayı</h3>
        {selectedAppointment ? (
          <div className="space-y-3">
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900">
                {selectedAppointment.clientName}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                📅{" "}
                {new Date(selectedAppointment.date).toLocaleDateString(
                  "tr-TR",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  },
                )}
              </p>
              <p className="text-sm text-gray-600">
                ⏰ {selectedAppointment.time}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Durum:{" "}
                <span className="font-medium">
                  {selectedAppointment.status === "confirmed"
                    ? "Onaylandı"
                    : selectedAppointment.status === "pending"
                      ? "Beklemede"
                      : selectedAppointment.status}
                </span>
              </p>
              {selectedAppointment.notes && (
                <p className="text-xs text-gray-500 mt-2">
                  Not: {selectedAppointment.notes}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Detay görmek için takvimden bir randevu seçin.
          </p>
        )}
      </aside>
    </div>
  );
}
