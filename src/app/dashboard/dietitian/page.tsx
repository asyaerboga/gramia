"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FaUsers,
  FaCalendarAlt,
  FaEnvelope,
  FaTrophy,
  FaClock,
  FaArrowRight,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimes,
  FaMedal,
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
    mealClients: Array<{ id: string; name: string }>;
    exerciseClients: Array<{ id: string; name: string }>;
    measurementClients: Array<{ id: string; name: string }>;
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
  goalReachedClients: Array<{
    id: string;
    name: string;
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    progress: number;
    lostKg: number;
    direction: "loss" | "gain";
  }>;
}

interface PendingReviewApt {
  _id: string;
  date: string;
  time: string;
  status: string;
  clientName: string;
}

export default function DietitianDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DietitianStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [pendingReview, setPendingReview] = useState<PendingReviewApt[]>([]);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [goalModal, setGoalModal] = useState(false);
  const [activityModal, setActivityModal] = useState<"meals" | "exercises" | "measurements" | null>(null);

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

  const fetchPendingReview = useCallback(async () => {
    try {
      const res = await fetch("/api/dietitian/appointments?pendingReview=true");
      if (res.ok) setPendingReview(await res.json());
    } catch {
      // ignore
    }
  }, []);

  const handleConfirmAppointment = async (appointmentId: string) => {
    setConfirmingId(appointmentId);
    try {
      const res = await fetch("/api/dietitian/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, status: "confirmed" }),
      });
      if (res.ok) {
        fetchStats();
      }
    } catch {
      // ignore
    } finally {
      setConfirmingId(null);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchClients();
    fetchPendingReview();
    fetch("/api/user/avatar")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.image && setAvatarImage(d.image))
      .catch(() => {});
  }, [fetchStats, fetchClients, fetchPendingReview]);

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
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-emerald-50/60 to-teal-50/40 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {avatarImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarImage}
                alt="Profil"
                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-200 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl border-2 border-emerald-200 shrink-0">
                {session?.user?.name?.charAt(0) || "D"}
              </div>
            )}
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
          </div>
          <Link
            href="/dashboard/dietitian/clients"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition font-medium shadow-lg shadow-emerald-300/40"
          >
            <FaUsers />
            Danışanları Görüntüle
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Toplam Danışan */}
          <Link
            href="/dashboard/dietitian/clients"
            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-lg shadow-emerald-200/50 card-hover cursor-pointer group block transition-transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-100">Toplam Danışan</p>
                <p className="text-4xl font-bold text-white mt-1">{stats?.overview.totalClients || 0}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition">
                <FaUsers className="text-white text-xl" />
              </div>
            </div>
            <div className="mt-4 text-sm text-emerald-100 font-medium flex items-center justify-between">
              <span>⚡ {stats?.overview.activeToday || 0} aktif bugün</span>
              <FaArrowRight className="text-xs opacity-70" />
            </div>
          </Link>

          {/* Bekleyen Randevu */}
          <button
            onClick={() => {
              const el = document.getElementById("upcoming-appointments");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 shadow-lg shadow-amber-200/50 card-hover cursor-pointer group text-left transition-transform hover:-translate-y-1 w-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-100">Bekleyen Randevu</p>
                <p className="text-4xl font-bold text-white mt-1">{stats?.overview.pendingAppointments || 0}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition">
                <FaClock className="text-white text-xl" />
              </div>
            </div>
            <div className="mt-4 text-sm text-amber-100 flex items-center justify-between">
              <span>📅 Bu ay: {stats?.overview.monthAppointments || 0} randevu</span>
              <FaArrowRight className="text-xs opacity-70" />
            </div>
          </button>

          {/* Okunmamış Mesaj */}
          <Link
            href="/dashboard/dietitian/messages"
            className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg shadow-blue-200/50 card-hover cursor-pointer group block transition-transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Okunmamış Mesaj</p>
                <p className="text-4xl font-bold text-white mt-1">{stats?.overview.unreadMessages || 0}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition">
                <FaEnvelope className="text-white text-xl" />
              </div>
            </div>
            <div className="mt-4 text-sm text-blue-100 flex items-center justify-between">
              <span>✉️ Mesajlara git</span>
              <FaArrowRight className="text-xs opacity-70" />
            </div>
          </Link>

          {/* Hedefe Ulaşan */}
          <button
            onClick={() => setGoalModal(true)}
            className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 shadow-lg shadow-violet-200/50 card-hover cursor-pointer group text-left transition-transform hover:-translate-y-1 w-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-violet-100">Hedefe Ulaşan</p>
                <p className="text-4xl font-bold text-white mt-1">{stats?.overview.goalReached || 0}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition">
                <FaTrophy className="text-white text-xl" />
              </div>
            </div>
            <div className="mt-4 text-sm text-violet-100 flex items-center justify-between">
              <span><FaCheckCircle className="inline mr-1" /> Listeyi görüntüle</span>
              <FaArrowRight className="text-xs opacity-70" />
            </div>
          </button>
        </div>

        {/* Today's Activity */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Bugünkü Aktivite
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setActivityModal("meals")}
              className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-4 text-center shadow-md shadow-orange-300/30 hover:opacity-90 transition-opacity cursor-pointer w-full"
            >
              <p className="text-3xl font-bold text-white">
                {stats?.todayStats.mealsLogged || 0}
              </p>
              <p className="text-sm text-orange-100 mt-1 font-medium">Öğün Kaydı</p>
              <p className="text-xs text-orange-200 mt-0.5">Listeyi görüntüle →</p>
            </button>
            <button
              onClick={() => setActivityModal("exercises")}
              className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-4 text-center shadow-md shadow-violet-300/30 hover:opacity-90 transition-opacity cursor-pointer w-full"
            >
              <p className="text-3xl font-bold text-white">
                {stats?.todayStats.exercisesLogged || 0}
              </p>
              <p className="text-sm text-violet-100 mt-1 font-medium">Egzersiz Kaydı</p>
              <p className="text-xs text-violet-200 mt-0.5">Listeyi görüntüle →</p>
            </button>
            <button
              onClick={() => setActivityModal("measurements")}
              className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl p-4 text-center shadow-md shadow-cyan-300/30 hover:opacity-90 transition-opacity cursor-pointer w-full"
            >
              <p className="text-3xl font-bold text-white">
                {stats?.todayStats.measurementsTaken || 0}
              </p>
              <p className="text-sm text-cyan-100 mt-1 font-medium">Ölçüm Alındı</p>
              <p className="text-xs text-cyan-200 mt-0.5">Listeyi görüntüle →</p>
            </button>
          </div>
        </div>

        {/* Pending Review Reminder */}
        {pendingReview.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <FaExclamationCircle className="text-amber-500 text-xl mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="font-semibold text-amber-900">
                    ⏰ Sonucu Belirsiz Randevular ({pendingReview.length})
                  </h2>
                  <Link
                    href="/dashboard/dietitian/appointments"
                    className="text-xs text-amber-700 hover:text-amber-900 underline whitespace-nowrap"
                  >
                    Randevulara Git
                  </Link>
                </div>
                <p className="text-xs text-amber-700 mb-3">
                  Aşağıdaki geçmiş randevular için &quot;Gerçekleşti&quot; veya &quot;Gerçekleşmedi&quot; durumunu giriniz.
                </p>
                <div className="space-y-2">
                  {pendingReview.slice(0, 5).map((apt) => (
                    <div
                      key={apt._id}
                      className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-amber-100"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{apt.clientName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(apt.date).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}{" "}
                          — {apt.time}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/dietitian/appointments?appointmentId=${apt._id}&date=${apt.date.slice(0, 10)}`}
                        className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                      >
                        Güncelle
                      </Link>
                    </div>
                  ))}
                  {pendingReview.length > 5 && (
                    <p className="text-xs text-amber-600 text-center">
                      +{pendingReview.length - 5} daha var
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <div id="upcoming-appointments" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
                      <Link
                        href={`/dashboard/dietitian/clients/${apt.clientId}`}
                        className="flex items-center gap-3 hover:opacity-75 transition-opacity"
                      >
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
                      </Link>
                      {apt.status === "confirmed" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          Onaylı
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConfirmAppointment(apt._id)}
                          disabled={confirmingId === apt._id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {confirmingId === apt._id ? "..." : "Onayla"}
                        </button>
                      )}
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
                      <Link
                        href={`/dashboard/dietitian/clients/${client.id}`}
                        className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                      >
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-sm font-bold">
                          {client.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 text-sm">
                          {client.name}
                        </span>
                      </Link>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-emerald-600">
                          {client.progress}%
                        </span>
                        <span className="text-xs text-gray-400 ml-1">
                          ({client.startWeight > client.targetWeight ? `-${client.lostKg}` : `+${client.lostKg}`}kg)
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
                <Link
                  key={client.clientId}
                  href={`/dashboard/dietitian/clients/${client.clientId}`}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 text-center border border-gray-100 block hover:shadow-md hover:border-emerald-200 transition"
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
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Activity Modal */}
    {activityModal && (() => {
      const config = {
        meals: {
          title: "Öğün Kaydı",
          subtitle: "Bugün öğün kaydeden danışanlar",
          clients: stats?.todayStats.mealClients || [],
          gradient: "from-orange-400 to-red-500",
          icon: "🍽️",
          emptyText: "Bugün öğün kaydeden danışan yok.",
        },
        exercises: {
          title: "Egzersiz Kaydı",
          subtitle: "Bugün egzersiz kaydeden danışanlar",
          clients: stats?.todayStats.exerciseClients || [],
          gradient: "from-violet-500 to-purple-600",
          icon: "🏋️",
          emptyText: "Bugün egzersiz kaydeden danışan yok.",
        },
        measurements: {
          title: "Ölçüm Alındı",
          subtitle: "Bugün ölçüm giren danışanlar",
          clients: stats?.todayStats.measurementClients || [],
          gradient: "from-cyan-500 to-teal-600",
          icon: "📏",
          emptyText: "Bugün ölçüm giren danışan yok.",
        },
      }[activityModal];

      return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setActivityModal(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActivityModal(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            <div className={`bg-gradient-to-r ${config.gradient} px-6 py-5 flex items-center justify-between shrink-0`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                  {config.icon}
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">{config.title}</h2>
                  <p className="text-white/70 text-xs">{config.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setActivityModal(null)}
                className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition"
              >
                <FaTimes />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-2">
              {config.clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="text-5xl mb-3 opacity-30">{config.icon}</span>
                  <p className="text-sm">{config.emptyText}</p>
                </div>
              ) : (
                config.clients.map((client, i) => (
                  <Link
                    key={client.id}
                    href={`/dashboard/dietitian/clients/${client.id}`}
                    onClick={() => setActivityModal(null)}
                    className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 hover:bg-emerald-50 hover:border-emerald-200 transition"
                  >
                    <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold shrink-0">
                      {client.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900 text-sm">{client.name}</span>
                    <span className="ml-auto text-xs text-gray-400">#{i + 1}</span>
                  </Link>
                ))
              )}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 shrink-0">
              <Link
                href="/dashboard/dietitian/clients"
                onClick={() => setActivityModal(null)}
                className={`flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r ${config.gradient} text-white rounded-xl font-medium hover:opacity-90 transition text-sm`}
              >
                <FaUsers className="text-sm" />
                Tüm Danışanları Görüntüle
              </Link>
            </div>
          </div>
        </div>
      );
    })()}

    {/* Goal Reached Modal */}
    {goalModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && setGoalModal(false)}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setGoalModal(false)} />
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FaTrophy className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Hedefe Ulaşanlar</h2>
                <p className="text-violet-200 text-xs">
                  {stats?.goalReachedClients?.length || 0} danışan hedefine ulaştı
                </p>
              </div>
            </div>
            <button
              onClick={() => setGoalModal(false)}
              className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition"
            >
              <FaTimes />
            </button>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto flex-1 p-5 space-y-3">
            {!stats?.goalReachedClients?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FaTrophy className="text-5xl mb-3 opacity-30" />
                <p className="text-sm">Henüz hedefe ulaşan danışan yok.</p>
              </div>
            ) : (
              stats.goalReachedClients
                .map((client, i) => (
                  <Link
                    key={client.id}
                    href={`/dashboard/dietitian/clients/${client.id}`}
                    onClick={() => setGoalModal(false)}
                    className="flex items-center gap-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4 hover:border-violet-300 hover:shadow-sm transition"
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {client.name.charAt(0)}
                      </div>
                      <span className="absolute -top-1 -right-1 text-base">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500">
                          {client.startWeight} kg → {client.currentWeight} kg
                        </span>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {client.direction === "gain" ? `+${client.lostKg} kg aldı` : `-${client.lostKg} kg verdi`}
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-violet-100 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-violet-400 to-purple-500 h-1.5 rounded-full"
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-violet-600">
                        <FaMedal className="text-sm" />
                        <span className="font-bold text-sm">{client.progress}%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">tamamlandı</p>
                    </div>
                  </Link>
                ))
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            <Link
              href="/dashboard/dietitian/clients"
              onClick={() => setGoalModal(false)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition text-sm"
            >
              <FaUsers className="text-sm" />
              Tüm Danışanları Görüntüle
            </Link>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
