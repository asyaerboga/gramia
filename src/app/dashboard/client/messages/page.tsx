"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import ChatWindow from "@/components/shared/ChatWindow";

interface ChatMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  type: "text" | "image" | "audio" | "document";
  content: string;
  filename?: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
}

interface ChatPartner {
  _id: string;
  name: string;
}

export default function ClientMessagesPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [dietitian, setDietitian] = useState<ChatPartner | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerPresence, setPartnerPresence] = useState<{
    online: boolean;
    lastSeen: number | null;
  }>({ online: false, lastSeen: null });

  /* ── Fetch dietitian ───────────────────────────── */
  const fetchDietitian = useCallback(async () => {
    try {
      const res = await fetch("/api/client/dietitian");
      if (res.ok) setDietitian(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  /* ── Messages ──────────────────────────────────── */
  const fetchMessages = useCallback(async () => {
    if (!dietitian) return;
    try {
      const res = await fetch(`/api/messages?partnerId=${dietitian._id}`);
      if (res.ok) setMessages(await res.json());
    } catch (e) { console.error(e); }
  }, [dietitian]);

  /* ── Mark read ─────────────────────────────────── */
  const markAsRead = useCallback(() => {
    if (!dietitian || !document.hasFocus()) return;
    const hasUnread = messages.some(
      (m) => m.senderId === dietitian._id && m.status !== "read",
    );
    if (hasUnread) {
      fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: dietitian._id }),
      }).catch(() => {});
    }
  }, [dietitian, messages]);

  /* ── Typing ────────────────────────────────────── */
  const fetchTypingStatus = useCallback(async () => {
    if (!dietitian) return;
    try {
      const res = await fetch(`/api/messages/typing?partnerId=${dietitian._id}`);
      if (res.ok) {
        const d = await res.json();
        setPartnerTyping(d.typing);
      }
    } catch { /* ignore */ }
  }, [dietitian]);

  /* ── Presence ──────────────────────────────────── */
  const fetchPresence = useCallback(async () => {
    if (!dietitian) return;
    try {
      const res = await fetch(`/api/presence?userId=${dietitian._id}`);
      if (res.ok) setPartnerPresence(await res.json());
    } catch { /* ignore */ }
  }, [dietitian]);

  /* ── File upload ───────────────────────────────── */
  const handleFileUpload = useCallback(async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/message", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  }, []);

  /* ── Effects ───────────────────────────────────── */
  useEffect(() => { fetchDietitian(); }, [fetchDietitian]);

  useEffect(() => {
    fetchMessages();
    const id = setInterval(fetchMessages, 2000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  useEffect(() => {
    if (!dietitian) return;
    fetchTypingStatus();
    const id = setInterval(fetchTypingStatus, 1500);
    return () => clearInterval(id);
  }, [dietitian, fetchTypingStatus]);

  useEffect(() => {
    if (!dietitian) return;
    fetchPresence();
    const id = setInterval(fetchPresence, 15_000);
    return () => clearInterval(id);
  }, [dietitian, fetchPresence]);

  useEffect(() => {
    markAsRead();
    const onFocus = () => markAsRead();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [markAsRead]);

  /* ── Send ──────────────────────────────────────── */
  const handleSendMessage = async (
    content: string,
    type: "text" | "image" | "audio" | "document",
    filename?: string,
  ) => {
    if (!dietitian) return;
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: dietitian._id, type, content, filename }),
      });
      if (res.ok) fetchMessages();
    } catch (e) { console.error(e); }
  };

  const handleTyping = useCallback(async () => {
    if (!dietitian) return;
    try {
      await fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: dietitian._id }),
      });
    } catch { /* ignore */ }
  }, [dietitian]);

  /* ── Render ────────────────────────────────────── */
  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Left panel — dietitian info */}
      <div className="w-full lg:w-1/4 bg-white border-b lg:border-b-0 lg:border-r border-gray-100 p-4 lg:p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Diyetisyenim</h3>
        {dietitian ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="relative shrink-0">
              <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700 font-bold">
                {dietitian.name.charAt(0)}
              </div>
              {partnerPresence.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{dietitian.name}</p>
              <p className="text-xs text-emerald-600">Diyetisyen</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {partnerPresence.online
                  ? "Çevrim içi"
                  : partnerPresence.lastSeen
                  ? `Son görülme: ${new Date(partnerPresence.lastSeen).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`
                  : ""}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Henüz bir diyetisyen atanmamış.</p>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {dietitian ? (
          <ChatWindow
            messages={messages}
            currentUserId={session?.user?.id || ""}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            partnerName={dietitian.name}
            partnerTyping={partnerTyping}
            partnerOnline={partnerPresence.online}
            partnerLastSeen={partnerPresence.lastSeen}
            onFileUpload={handleFileUpload}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Mesajlaşmak için bir diyetisyen ataması gerekiyor.
          </div>
        )}
      </div>
    </div>
  );
}
