"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FaUsers,
  FaCalendarAlt,
  FaEnvelope,
  FaChartLine,
  FaTrophy,
  FaClock,
  FaArrowRight,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

interface DietitianStats {
  overview: {
    totalClients: number;
    activeToday: number;
    goalReached: number;
    pendingAppointments: number;
    unreadMessages: number;
    monthAppointments: number;
  };
  todayStats: {
    mealsLogged: number;
    exercisesLogged: number;
    measurementsTaken: number;
  };
  upcomingAppointments: Array<{
    _id: string;
    date: string;
    time: string;
    status: string;
    clientId: string;
  }>;
  clientActivity: Array<{
    clientId: string;
    name: string;
    activityScore: number;
    weight: number;
    targetWeight: number;
    progress: number;
  }>;
  clientProgress: Array<{
    id: string;
    name: string;
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    progress: number;
    lostKg: number;
  }>;
}

export default function DietitianDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DietitianStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dietitian/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/dietitian/clients");
      if (res.ok) {
        const data = await res.json();
        const names: Record<string, string> = {};
        data.forEach((c: { _id: string; name: string }) => {
          names[c._id] = c.name;
        });
        setClientNames(names);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchClients();
  }, [fetchStats, fetchClients]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-2/3 md:w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 rounded-2xl" />
              <div className="h-80 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Hoş Geldin, Dr. {session?.user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">
              {new Date().toLocaleDateString("tr-TR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Link
            href="/dashboard/dietitian/clients"
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition font-medium shadow-lg shadow-emerald-200"
          >
            <FaUsers />
            Danışanları Görüntüle
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Toplam Danışan
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.overview.totalClients || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FaUsers className="text-emerald-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-600 font-medium">
                {stats?.overview.activeToday || 0} aktif bugün
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Bekleyen Randevu
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.overview.pendingAppointments || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <FaClock className="text-amber-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">
                Bu ay: {stats?.overview.monthAppointments || 0} randevu
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Okunmamış Mesaj
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.overview.unreadMessages || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <FaEnvelope className="text-blue-600 text-xl" />
              </div>
            </div>
            <Link
              href="/dashboard/dietitian/messages"
              className="mt-4 flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              Mesajlara git <FaArrowRight className="ml-1 text-xs" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Hedefe Ulaşan
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.overview.goalReached || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <FaTrophy className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <FaCheckCircle className="mr-1" /> Tebrikler!
            </div>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Bugünkü Aktivite
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">
                {stats?.todayStats.mealsLogged || 0}
              </p>
              <p className="text-sm text-orange-700 mt-1">Öğün Kaydı</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">
                {stats?.todayStats.exercisesLogged || 0}
              </p>
              <p className="text-sm text-purple-700 mt-1">Egzersiz Kaydı</p>
            </div>
            <div className="bg-cyan-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-cyan-600">
                {stats?.todayStats.measurementsTaken || 0}
              </p>
              <p className="text-sm text-cyan-700 mt-1">Ölçüm Alındı</p>
            </div>
          </div>
        </div>

        {/* Two Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                📅 Yaklaşan Randevular
              </h2>
              <Link
                href="/dashboard/dietitian/appointments"
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
              >
                Tümü <FaArrowRight className="ml-1 text-xs" />
              </Link>
            </div>
            <div className="space-y-3">
              {stats?.upcomingAppointments?.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  Yaklaşan randevu bulunmuyor
                </p>
              ) : (
                stats?.upcomingAppointments?.slice(0, 5).map((apt) => {
                  const aptDate = new Date(apt.date);
                  const isToday =
                    aptDate.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={apt._id}
                      className={`flex items-center justify-between p-4 rounded-xl ${
                        isToday
                          ? "bg-emerald-50 border border-emerald-100"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isToday
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          <FaCalendarAlt />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {clientNames[apt.clientId] || "Danışan"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {aptDate.toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            - {apt.time}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          apt.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {apt.status === "confirmed" ? "Onaylı" : "Bekliyor"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Client Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                🏆 Danışan İlerleme
              </h2>
              <Link
                href="/dashboard/dietitian/clients"
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
              >
                Tümü <FaArrowRight className="ml-1 text-xs" />
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.clientProgress?.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  Henüz danışan bulunmuyor
                </p>
              ) : (
                stats?.clientProgress?.slice(0, 5).map((client) => (
                  <div key={client.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-sm font-bold">
                          {client.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 text-sm">
                          {client.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-emerald-600">
                          {client.progress}%
                        </span>
                        <span className="text-xs text-gray-400 ml-1">
                          (-{client.lostKg}kg)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full progress-bar"
                        style={{ width: `${Math.min(client.progress, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Most Active Clients */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ⚡ En Aktif Danışanlar (Bu Hafta)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stats?.clientActivity?.length === 0 ? (
              <p className="text-gray-400 text-sm col-span-5 text-center py-8">
                Bu hafta aktif danışan bulunmuyor
              </p>
            ) : (
              stats?.clientActivity?.map((client, index) => (
                <div
                  key={client.clientId}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 text-center border border-gray-100"
                >
                  <div className="relative inline-block mb-2">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-lg font-bold">
                      {client.name.charAt(0)}
                    </div>
                    {index === 0 && (
                      <span className="absolute -top-1 -right-1 text-lg">
                        🥇
                      </span>
                    )}
                    {index === 1 && (
                      <span className="absolute -top-1 -right-1 text-lg">
                        🥈
                      </span>
                    )}
                    {index === 2 && (
                      <span className="absolute -top-1 -right-1 text-lg">
                        🥉
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {client.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {client.activityScore} aktivite
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
