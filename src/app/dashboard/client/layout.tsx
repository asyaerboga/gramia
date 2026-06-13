"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHome,
  FaRulerCombined,
  FaUtensils,
  FaCalendarAlt,
  FaComments,
  FaSignOutAlt,
  FaDumbbell,
  FaHeart,
  FaTrophy,
  FaCog,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useToast } from "@/components/providers/ToastProvider";

const clientNavItems = [
  { href: "/dashboard/client",              icon: <FaHome />,          label: "Ana Sayfa",            exact: true },
  { href: "/dashboard/client/measurements", icon: <FaRulerCombined />, label: "Vücut Ölçüm Takibi" },
  { href: "/dashboard/client/meals",        icon: <FaUtensils />,      label: "Yemek Ekleme" },
  { href: "/dashboard/client/exercises",    icon: <FaDumbbell />,      label: "Egzersiz" },
  { href: "/dashboard/client/wellness",     icon: <FaHeart />,         label: "Sağlık & Uyku" },
  { href: "/dashboard/client/achievements", icon: <FaTrophy />,        label: "Rozetler" },
  { href: "/dashboard/client/appointments", icon: <FaCalendarAlt />,   label: "Randevularım" },
  { href: "/dashboard/client/messages",     icon: <FaComments />,      label: "Mesaj" },
  { href: "/dashboard/client/settings",     icon: <FaCog />,           label: "Ayarlar" },
];

interface UnreadSender {
  senderId: string;
  senderName: string;
  count: number;
  lastMessage: string;
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const prevSendersRef = useRef<Map<string, number>>(new Map());
  const { showToast } = useToast();

  useEffect(() => {
    const ping = () => fetch("/api/presence", { method: "POST" }).catch(() => {});
    ping();
    const id = setInterval(ping, 30_000);
    return () => clearInterval(id);
  }, []);

  const prevNotifCountRef = useRef(0);

  const fetchAppointmentNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const notifs: { _id: string; title: string; message: string }[] = await res.json();
      if (notifs.length > prevNotifCountRef.current) {
        const newest = notifs[0];
        showToast("info", `🔔 ${newest.title}`, newest.message, 8000);
      }
      prevNotifCountRef.current = notifs.length;
    } catch { /* ignore */ }
  }, [showToast]);

  useEffect(() => {
    fetchAppointmentNotifications();
    const interval = setInterval(fetchAppointmentNotifications, 15_000);
    return () => clearInterval(interval);
  }, [fetchAppointmentNotifications]);

  const fetchUnread = useCallback(async () => {
    try {
      const [countRes, groupRes, senderRes] = await Promise.all([
        fetch("/api/messages/unread-count"),
        fetch("/api/conversations/unread-groups"),
        fetch("/api/messages/unread-per-sender"),
      ]);
      let total = 0;
      if (countRes.ok) {
        const { count } = await countRes.json();
        total += count;
      }
      if (groupRes.ok) {
        const groups: { conversationId: string; unreadCount: number }[] = await groupRes.json();
        total += groups.reduce((sum, g) => sum + g.unreadCount, 0);
      }
      setUnreadCount(total);
      if (!senderRes.ok) return;
      const senders: UnreadSender[] = await senderRes.json();
      for (const s of senders) {
        const prev = prevSendersRef.current.get(s.senderId) ?? 0;
        if (s.count > prev) showToast("info", `💬 ${s.senderName}`, s.lastMessage, 7500);
      }
      const newMap = new Map<string, number>();
      for (const s of senders) newMap.set(s.senderId, s.count);
      prevSendersRef.current = newMap;
    } catch { /* ignore */ }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-emerald-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!session || session.user.role !== "client") redirect("/auth/login");

  return (
    <div className="flex min-h-screen">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-emerald-100 shadow-sm z-20 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-emerald-600 tracking-tight">🌿 Gramia</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
        >
          {sidebarOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <nav className={`
        fixed left-0 top-0 h-screen flex flex-col z-30
        w-64 lg:w-1/5
        transition-transform duration-300 ease-in-out
        bg-linear-to-b from-emerald-50 via-teal-50/60 to-emerald-50/40
        border-r border-emerald-100/80 shadow-md
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="px-6 py-7 border-b border-emerald-100/70">
          <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">🌿 Gramia</h1>
          <p className="text-xs text-emerald-500/80 mt-1 font-medium">{session.user.name}</p>
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-0.5 flex-1 px-3 py-4 overflow-y-auto">
          {clientNavItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            const isMessages = item.href === "/dashboard/client/messages";
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? "bg-emerald-200/60 text-emerald-800 shadow-sm"
                    : "text-gray-600 hover:bg-emerald-100/80 hover:text-emerald-700"
                }`}
              >
                <span className={`text-base shrink-0 ${isActive ? "text-emerald-700" : "text-emerald-400"}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {isMessages && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1 shrink-0">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sign out */}
        <div className="px-3 pb-6 border-t border-emerald-100/70 pt-4">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition text-sm font-medium"
          >
            <FaSignOutAlt className="shrink-0" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </nav>

      {/* Sidebar spacer */}
      <div className="hidden lg:block lg:w-1/5 shrink-0" />

      {/* Main content */}
      <div className="flex-1 min-h-screen pt-14 lg:pt-0 bg-slate-50">{children}</div>
    </div>
  );
}
