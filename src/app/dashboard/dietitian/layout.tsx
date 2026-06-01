"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaComments,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaCog,
  FaCommentDots,
} from "react-icons/fa";
import { useToast } from "@/components/providers/ToastProvider";

const dietitianNavItems = [
  { href: "/dashboard/dietitian",              icon: <FaHome />,        label: "Dashboard",  exact: true },
  { href: "/dashboard/dietitian/clients",      icon: <FaUsers />,       label: "Danışanlar" },
  { href: "/dashboard/dietitian/appointments", icon: <FaCalendarAlt />, label: "Randevular" },
  { href: "/dashboard/dietitian/messages",     icon: <FaComments />,    label: "Mesaj" },
  { href: "/dashboard/dietitian/settings",     icon: <FaCog />,         label: "Ayarlar" },
];

interface UnreadSender {
  senderId: string;
  senderName: string;
  count: number;
  lastMessage: string;
}

export default function DietitianLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const prevSendersRef = useRef<Map<string, number>>(new Map());
  const { showToast } = useToast();

  // Heartbeat — keep presence alive every 30s
  useEffect(() => {
    const ping = () => fetch("/api/presence", { method: "POST" }).catch(() => {});
    ping();
    const id = setInterval(ping, 30_000);
    return () => clearInterval(id);
  }, []);

  const fetchUnread = useCallback(async () => {
    try {
      // Total badge
      const countRes = await fetch("/api/messages/unread-count");
      if (countRes.ok) {
        const { count } = await countRes.json();
        setUnreadCount(count);
      }

      // Per-sender — for toast notifications
      const senderRes = await fetch("/api/messages/unread-per-sender");
      if (!senderRes.ok) return;
      const senders: UnreadSender[] = await senderRes.json();

      // Detect new/increased unread from senders
      for (const s of senders) {
        const prev = prevSendersRef.current.get(s.senderId) ?? 0;
        if (s.count > prev) {
          showToast("info", `💬 ${s.senderName}`, s.lastMessage, 7500);
        }
      }

      // Update prev map
      const newMap = new Map<string, number>();
      for (const s of senders) newMap.set(s.senderId, s.count);
      prevSendersRef.current = newMap;
    } catch {
      // ignore
    }
  }, [showToast]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!session || session.user.role !== "dietitian") {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-20 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-emerald-600">🌿 Gramia</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {sidebarOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <nav className={`
        fixed left-0 top-0 h-screen bg-white shadow-md p-6 flex flex-col z-30
        w-64 lg:w-1/5
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-emerald-600">🌿 Gramia</h1>
          <p className="text-xs text-gray-400 mt-1">Dr. {session.user.name}</p>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {dietitianNavItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            const isMessages = item.href === "/dashboard/dietitian/messages";
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
                {isMessages && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-500 transition w-full text-sm"
        >
          <FaSignOutAlt />
          <span>Çıkış Yap</span>
        </button>
      </nav>

      {/* Sidebar spacer */}
      <div className="hidden lg:block lg:w-1/5 shrink-0" />

      {/* Main content */}
      <div className="flex-1 min-h-screen pt-14 lg:pt-0">{children}</div>
    </div>
  );
}
