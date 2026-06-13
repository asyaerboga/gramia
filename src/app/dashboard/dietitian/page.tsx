"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FaUsers,
  FaCalendarAlt,
  FaEnvelope,
  FaTrophy,
  FaArrowRight,
  FaExclamationCircle,
  FaTimes,
  FaMedal,
  FaBell,
  FaBolt,
  FaCrown,
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

interface AppointmentNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
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
  const [notifications, setNotifications] = useState<AppointmentNotification[]>([]);

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

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) setNotifications(await res.json());
    } catch { /* ignore */ }
  }, []);

  const dismissNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {});
  };

  const dismissAll = async () => {
    setNotifications([]);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    setConfirmingId(appointmentId);
    try {
      const res = await fetch("/api/dietitian/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, status: "confirmed" }),
      });
      if (res.ok) fetchStats();
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
    fetchNotifications();
    fetch("/api/user/avatar")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.image && setAvatarImage(d.image))
      .catch(() => {});
  }, [fetchStats, fetchClients, fetchPendingReview, fetchNotifications]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 15_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-56 bg-linear-to-br from-emerald-200 to-teal-200 rounded-3xl" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-36 bg-gray-200 rounded-2xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-72 bg-gray-200 rounded-3xl" />
              <div className="h-72 bg-gray-200 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const timeGreeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Günaydın";
    if (h < 17) return "İyi Günler";
    return "İyi Akşamlar";
  })();

  const notifColors: Record<string, { bg: string; border: string; icon: string }> = {
    appointment_cancelled_by_client: { bg: "bg-red-50",      border: "border-red-400",     icon: "text-red-600" },
    appointment_confirmed:           { bg: "bg-emerald-50",  border: "border-emerald-400", icon: "text-emerald-600" },
    appointment_cancelled:           { bg: "bg-red-50",      border: "border-red-400",     icon: "text-red-600" },
    appointment_completed:           { bg: "bg-blue-50",     border: "border-blue-400",    icon: "text-blue-600" },
    appointment_time_changed:        { bg: "bg-amber-50",    border: "border-amber-400",   icon: "text-amber-600" },
    appointment_deleted:             { bg: "bg-red-50",      border: "border-red-400",     icon: "text-red-600" },
    appointment_status_changed:      { bg: "bg-violet-50",   border: "border-violet-400",  icon: "text-violet-600" },
  };

  const missions = [
    {
      key: "meals" as const,
      icon: "🍽️",
      title: "Öğün Kayıtları",
      count: stats?.todayStats.mealsLogged || 0,
      subtitle: "danışan kayıt etti",
      gradient: "from-orange-400 via-red-400 to-rose-500",
      glowColor: "shadow-orange-300/40",
      badgeBg: "bg-orange-100/90",
      badgeText: "text-orange-700",
    },
    {
      key: "exercises" as const,
      icon: "🏋️",
      title: "Egzersiz Kayıtları",
      count: stats?.todayStats.exercisesLogged || 0,
      subtitle: "danışan egzersiz yaptı",
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      glowColor: "shadow-violet-300/40",
      badgeBg: "bg-violet-100/90",
      badgeText: "text-violet-700",
    },
    {
      key: "measurements" as const,
      icon: "📏",
      title: "Ölçüm Kayıtları",
      count: stats?.todayStats.measurementsTaken || 0,
      subtitle: "danışan ölçüm girdi",
      gradient: "from-cyan-500 via-teal-500 to-emerald-500",
      glowColor: "shadow-cyan-300/40",
      badgeBg: "bg-cyan-100/90",
      badgeText: "text-cyan-700",
    },
  ];

  const topThree = stats?.clientActivity?.slice(0, 3) ?? [];
  const restClients = stats?.clientActivity?.slice(3) ?? [];

  return (
    <>
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* ── Notification Banners ── */}
        {notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const colors = notifColors[notif.type] ?? { bg: "bg-gray-50", border: "border-gray-400", icon: "text-gray-600" };
              return (
                <div
                  key={notif._id}
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl border-l-4 shadow-md animate-in slide-in-from-top-2 duration-300 ${colors.bg} ${colors.border}`}
                >
                  <FaBell className={`mt-0.5 shrink-0 text-lg ${colors.icon}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${colors.icon}`}>{notif.title}</p>
                    <p className="text-gray-700 text-sm mt-0.5">{notif.message}</p>
                  </div>
                  <button
                    onClick={() => dismissNotification(notif._id)}
                    className="shrink-0 text-gray-400 hover:text-gray-600 transition p-1 rounded"
                    aria-label="Kapat"
                  >
                    <FaTimes />
                  </button>
                </div>
              );
            })}
            {notifications.length > 1 && (
              <div className="flex justify-end">
                <button onClick={dismissAll} className="text-xs text-gray-500 hover:text-gray-700 underline">
                  Tümünü kapat
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 via-teal-500 to-cyan-600 p-6 md:p-8 text-white shadow-2xl shadow-emerald-500/25">
          {/* Animated blobs */}
          <div className="absolute -top-10 -left-10 w-80 h-80 bg-teal-400/25 rounded-full filter blur-3xl animate-blob pointer-events-none" />
          <div className="absolute -bottom-16 right-0 w-72 h-72 bg-emerald-300/20 rounded-full filter blur-3xl animate-blob animation-delay-2000 pointer-events-none" />
          <div className="absolute top-8 right-24 w-48 h-48 bg-cyan-300/15 rounded-full filter blur-2xl animate-blob animation-delay-4000 pointer-events-none" />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          />

          <div className="relative z-10">
            {/* Top row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {avatarImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarImage}
                    alt="Profil"
                    className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/30 shadow-xl shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold ring-4 ring-white/20 shadow-xl shrink-0">
                    {session?.user?.name?.charAt(0) || "D"}
                  </div>
                )}
                <div>
                  <p className="text-emerald-100/80 text-sm font-medium">{timeGreeting} ✨</p>
                  <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                    Dr. {session?.user?.name?.split(" ")[0]}
                  </h1>
                  <p className="text-emerald-200/70 text-sm mt-0.5">
                    {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/dietitian/clients"
                className="w-fit flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 px-5 py-2.5 rounded-2xl text-sm font-semibold hover:bg-white/25 transition-all shadow-sm"
              >
                <FaUsers /> Danışanlarım
              </Link>
            </div>

          </div>
        </div>

        {/* ── Soft Stat Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Toplam Danışan — emerald */}
          <Link
            href="/dashboard/dietitian/clients"
            className="bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:shadow-emerald-100 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Toplam Danışan</p>
                <p className="text-4xl font-bold text-emerald-800 mt-1">{stats?.overview.totalClients || 0}</p>
              </div>
              <div className="w-13 h-13 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition shrink-0">
                <FaUsers className="text-emerald-600 text-lg" />
              </div>
            </div>
            <div className="mt-4 text-xs text-emerald-500 font-medium flex items-center justify-between">
              <span>⚡ {stats?.overview.activeToday || 0} aktif bugün</span>
              <FaArrowRight className="opacity-50" />
            </div>
          </Link>

          {/* Bekleyen Randevu — amber */}
          <button
            onClick={() => document.getElementById("upcoming-appointments")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200/70 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:shadow-amber-100 transition-all group text-left w-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Bekleyen Randevu</p>
                <p className="text-4xl font-bold text-amber-800 mt-1">{stats?.overview.pendingAppointments || 0}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition shrink-0">
                <FaCalendarAlt className="text-amber-600 text-lg" />
              </div>
            </div>
            <div className="mt-4 text-xs text-amber-500 font-medium flex items-center justify-between">
              <span>📅 Bu ay: {stats?.overview.monthAppointments || 0} randevu</span>
              <FaArrowRight className="opacity-50" />
            </div>
          </button>

          {/* Okunmamış Mesaj — blue */}
          <Link
            href="/dashboard/dietitian/messages"
            className="bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200/70 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:shadow-blue-100 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Okunmamış Mesaj</p>
                <p className="text-4xl font-bold text-blue-800 mt-1">{stats?.overview.unreadMessages || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition shrink-0">
                <FaEnvelope className="text-blue-600 text-lg" />
              </div>
            </div>
            <div className="mt-4 text-xs text-blue-500 font-medium flex items-center justify-between">
              <span>✉️ Mesajlara git</span>
              <FaArrowRight className="opacity-50" />
            </div>
          </Link>

          {/* Hedefe Ulaşan — violet */}
          <button
            onClick={() => setGoalModal(true)}
            className="bg-linear-to-br from-violet-50 to-purple-50 border border-violet-200/70 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:shadow-violet-100 transition-all group text-left w-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-violet-600">Hedefe Ulaşan</p>
                <p className="text-4xl font-bold text-violet-800 mt-1">{stats?.overview.goalReached || 0}</p>
              </div>
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-200 transition shrink-0">
                <FaTrophy className="text-violet-600 text-lg" />
              </div>
            </div>
            <div className="mt-4 text-xs text-violet-500 font-medium flex items-center justify-between">
              <span>🏆 Listeyi görüntüle</span>
              <FaArrowRight className="opacity-50" />
            </div>
          </button>
        </div>

        {/* ── Daily Missions ── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-linear-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-orange-300/40">
              <FaBolt />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Bugünün Görevleri</h2>
            <span className="ml-auto text-xs text-gray-400 bg-white border border-gray-200 px-3 py-1.5 rounded-full font-medium shadow-sm">
              {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {missions.map((m) => (
              <button
                key={m.key}
                onClick={() => setActivityModal(m.key)}
                className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${m.gradient} p-5 text-left shadow-xl ${m.glowColor} hover:scale-[1.02] active:scale-[0.99] transition-transform group`}
              >
                <div className="absolute -right-5 -top-5 w-28 h-28 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-500" />
                <div className="absolute right-4 bottom-3 w-16 h-16 bg-white/10 rounded-full" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl animate-float">{m.icon}</span>
                    <span className={`${m.badgeBg} ${m.badgeText} text-[11px] font-bold px-2.5 py-1 rounded-full`}>
                      {m.count > 0 ? "✓ Aktif" : "Bekliyor"}
                    </span>
                  </div>
                  <div className="text-5xl font-black text-white leading-none">{m.count}</div>
                  <div className="text-white/80 text-sm font-medium mt-1">{m.subtitle}</div>
                  <div className="flex items-center gap-1 text-white/50 text-xs mt-3 group-hover:text-white/70 transition">
                    <span>{m.title}</span>
                    <FaArrowRight className="text-[10px]" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Pending Review Warning ── */}
        {pendingReview.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <FaExclamationCircle className="text-amber-500 text-xl mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="font-semibold text-amber-900">
                    ⏰ Sonucu Belirsiz Randevular ({pendingReview.length})
                  </h2>
                  <Link href="/dashboard/dietitian/appointments" className="text-xs text-amber-700 hover:text-amber-900 underline whitespace-nowrap">
                    Randevulara Git
                  </Link>
                </div>
                <p className="text-xs text-amber-700 mb-3">
                  Aşağıdaki geçmiş randevular için &quot;Gerçekleşti&quot; veya &quot;Gerçekleşmedi&quot; durumunu giriniz.
                </p>
                <div className="space-y-2">
                  {pendingReview.slice(0, 5).map((apt) => (
                    <div key={apt._id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-amber-100">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{apt.clientName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(apt.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} — {apt.time}
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
                    <p className="text-xs text-amber-600 text-center">+{pendingReview.length - 5} daha var</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Two Column: Appointments + Progress ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <div id="upcoming-appointments" className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                  <FaCalendarAlt className="text-amber-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Yaklaşan Randevular</h2>
              </div>
              <Link href="/dashboard/dietitian/appointments" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium">
                Tümü <FaArrowRight className="text-xs" />
              </Link>
            </div>
            <div className="space-y-3">
              {stats?.upcomingAppointments?.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-3 opacity-40">📭</div>
                  <p className="text-gray-400 text-sm">Yaklaşan randevu bulunmuyor</p>
                </div>
              ) : (
                stats?.upcomingAppointments?.slice(0, 5).map((apt) => {
                  const aptDate = new Date(apt.date);
                  const isToday = aptDate.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={apt._id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition ${
                        isToday ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-transparent hover:border-gray-200"
                      }`}
                    >
                      <Link href={`/dashboard/dietitian/clients/${apt.clientId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                          isToday ? "bg-emerald-500 text-white shadow-lg shadow-emerald-300/40" : "bg-gray-200 text-gray-600"
                        }`}>
                          {isToday ? "⚡" : aptDate.getDate()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{clientNames[apt.clientId] || "Danışan"}</p>
                          <p className="text-xs text-gray-500">
                            {isToday ? "Bugün" : aptDate.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} · {apt.time}
                          </p>
                        </div>
                      </Link>
                      {apt.status === "confirmed" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                          ✓ Onaylı
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConfirmAppointment(apt._id)}
                          disabled={confirmingId === apt._id}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-linear-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition disabled:opacity-60 shadow-md shadow-emerald-300/30 shrink-0"
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
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                  <FaTrophy className="text-violet-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Danışan İlerlemesi</h2>
              </div>
              <Link href="/dashboard/dietitian/clients" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium">
                Tümü <FaArrowRight className="text-xs" />
              </Link>
            </div>
            <div className="space-y-5">
              {stats?.clientProgress?.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-3 opacity-40">🌱</div>
                  <p className="text-gray-400 text-sm">Henüz danışan bulunmuyor</p>
                </div>
              ) : (
                stats?.clientProgress?.slice(0, 5).map((client, i) => (
                  <Link key={client.id} href={`/dashboard/dietitian/clients/${client.id}`} className="flex items-center gap-3 group">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {client.name.charAt(0)}
                      </div>
                      {i < 3 && (
                        <span className="absolute -top-1.5 -right-1.5 text-sm leading-none">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-gray-900 text-sm truncate group-hover:text-emerald-700 transition">
                          {client.name}
                        </span>
                        <span className="text-sm font-bold text-emerald-600 shrink-0 ml-2">{client.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full progress-bar ${
                            client.progress >= 100 ? "bg-linear-to-r from-violet-400 to-purple-500" :
                            client.progress >= 75 ? "bg-linear-to-r from-emerald-400 to-teal-500" :
                            client.progress >= 50 ? "bg-linear-to-r from-amber-400 to-orange-400" :
                            "bg-linear-to-r from-blue-400 to-indigo-400"
                          }`}
                          style={{ width: `${Math.min(client.progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {client.startWeight > client.targetWeight ? `-${client.lostKg}` : `+${client.lostKg}`} kg · Hedef: {client.targetWeight} kg
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Champion Leaderboard ── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-linear-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-300/40">
              <FaCrown />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Bu Haftanın Şampiyonları</h2>
            <span className="ml-auto text-xs text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full font-medium">
              En aktif danışanlar
            </span>
          </div>

          {stats?.clientActivity?.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3 opacity-40">🎯</div>
              <p className="text-gray-400 text-sm">Bu hafta aktif danışan bulunmuyor</p>
            </div>
          ) : (
            <>
              {/* Podium for top 3 */}
              {topThree.length >= 1 && (
                <div className="flex items-end justify-center gap-3 mb-8 px-2 md:px-8">
                  {/* 2nd place */}
                  {topThree[1] && (
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="relative">
                        <div className="w-14 h-14 bg-linear-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg">
                          {topThree[1].name.charAt(0)}
                        </div>
                        <span className="absolute -top-2 -right-2 text-xl leading-none">🥈</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 text-center truncate w-20">{topThree[1].name.split(" ")[0]}</p>
                      <p className="text-xs text-gray-400 font-medium">{topThree[1].activityScore} puan</p>
                      <Link
                        href={`/dashboard/dietitian/clients/${topThree[1].clientId}`}
                        className="w-full h-16 bg-linear-to-t from-slate-200 to-slate-100 rounded-t-2xl flex items-end justify-center pb-2 hover:from-slate-300 transition animate-grow-up"
                      >
                        <span className="text-sm font-black text-slate-500">2</span>
                      </Link>
                    </div>
                  )}

                  {/* 1st place */}
                  {topThree[0] && (
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="text-2xl animate-float">👑</div>
                      <div className="relative">
                        <div className="w-18 h-18 bg-linear-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-amber-300/60 ring-4 ring-amber-200">
                          {topThree[0].name.charAt(0)}
                        </div>
                        <span className="absolute -top-2 -right-2 text-xl leading-none">🥇</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 text-center truncate w-24">{topThree[0].name.split(" ")[0]}</p>
                      <p className="text-xs text-amber-600 font-bold">{topThree[0].activityScore} puan</p>
                      <Link
                        href={`/dashboard/dietitian/clients/${topThree[0].clientId}`}
                        className="w-full h-28 bg-linear-to-t from-amber-300 to-amber-100 rounded-t-2xl flex items-end justify-center pb-2 hover:from-amber-400 transition animate-grow-up"
                      >
                        <span className="text-sm font-black text-amber-700">1</span>
                      </Link>
                    </div>
                  )}

                  {/* 3rd place */}
                  {topThree[2] && (
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="relative">
                        <div className="w-14 h-14 bg-linear-to-br from-orange-300 to-amber-400 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg">
                          {topThree[2].name.charAt(0)}
                        </div>
                        <span className="absolute -top-2 -right-2 text-xl leading-none">🥉</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 text-center truncate w-20">{topThree[2].name.split(" ")[0]}</p>
                      <p className="text-xs text-gray-400 font-medium">{topThree[2].activityScore} puan</p>
                      <Link
                        href={`/dashboard/dietitian/clients/${topThree[2].clientId}`}
                        className="w-full h-10 bg-linear-to-t from-orange-200 to-orange-100 rounded-t-2xl flex items-end justify-center pb-2 hover:from-orange-300 transition animate-grow-up"
                      >
                        <span className="text-sm font-black text-orange-500">3</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Rest of the ranked list */}
              {restClients.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {restClients.map((client, index) => {
                    const rank = topThree.length + index + 1;
                    return (
                      <Link
                        key={client.clientId}
                        href={`/dashboard/dietitian/clients/${client.clientId}`}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-emerald-50 hover:border-emerald-200 transition group"
                      >
                        <div className="w-7 h-7 rounded-full bg-gray-200 group-hover:bg-emerald-200 flex items-center justify-center text-xs font-black text-gray-500 group-hover:text-emerald-700 transition shrink-0">
                          {rank}
                        </div>
                        <div className="w-9 h-9 bg-linear-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                          {client.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
                          <p className="text-xs text-gray-400">{client.activityScore} aktivite</p>
                        </div>
                        <FaArrowRight className="text-gray-300 group-hover:text-emerald-400 text-xs shrink-0 transition" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>

    {/* ── Activity Modal ── */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setActivityModal(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActivityModal(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            <div className={`bg-linear-to-r ${config.gradient} px-6 py-5 flex items-center justify-between shrink-0`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">{config.icon}</div>
                <div>
                  <h2 className="text-white font-bold text-lg">{config.title}</h2>
                  <p className="text-white/70 text-xs">{config.subtitle}</p>
                </div>
              </div>
              <button onClick={() => setActivityModal(null)} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition">
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
                    href={`/dashboard/dietitian/clients/${client.id}${activityModal === "meals" ? "?tab=meals" : activityModal === "exercises" ? "?tab=exercises" : ""}`}
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
                className={`flex items-center justify-center gap-2 w-full py-3 bg-linear-to-r ${config.gradient} text-white rounded-xl font-medium hover:opacity-90 transition text-sm`}
              >
                <FaUsers className="text-sm" />
                Tüm Danışanları Görüntüle
              </Link>
            </div>
          </div>
        </div>
      );
    })()}

    {/* ── Goal Reached Modal ── */}
    {goalModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setGoalModal(false)}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setGoalModal(false)} />
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
          <div className="bg-linear-to-r from-violet-500 to-purple-600 px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FaTrophy className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Hedefe Ulaşanlar</h2>
                <p className="text-violet-200 text-xs">{stats?.goalReachedClients?.length || 0} danışan hedefine ulaştı</p>
              </div>
            </div>
            <button onClick={() => setGoalModal(false)} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition">
              <FaTimes />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-5 space-y-3">
            {!stats?.goalReachedClients?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FaTrophy className="text-5xl mb-3 opacity-30" />
                <p className="text-sm">Henüz hedefe ulaşan danışan yok.</p>
              </div>
            ) : (
              stats.goalReachedClients.map((client, i) => (
                <Link
                  key={client.id}
                  href={`/dashboard/dietitian/clients/${client.id}`}
                  onClick={() => setGoalModal(false)}
                  className="flex items-center gap-4 bg-linear-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4 hover:border-violet-300 hover:shadow-sm transition"
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 bg-linear-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {client.name.charAt(0)}
                    </div>
                    <span className="absolute -top-1 -right-1 text-base leading-none">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">{client.startWeight} kg → {client.currentWeight} kg</span>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {client.direction === "gain" ? `+${client.lostKg} kg aldı` : `-${client.lostKg} kg verdi`}
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-violet-100 rounded-full h-1.5">
                      <div className="bg-linear-to-r from-violet-400 to-purple-500 h-1.5 rounded-full" style={{ width: "100%" }} />
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
          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            <Link
              href="/dashboard/dietitian/clients"
              onClick={() => setGoalModal(false)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-linear-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition text-sm"
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
