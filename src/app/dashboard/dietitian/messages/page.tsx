"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ChatWindow from "@/components/shared/ChatWindow";
import { FaExternalLinkAlt } from "react-icons/fa";

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

interface ClientContact {
  _id: string;       // User ID (for messaging)
  clientDocId: string; // Client document ID (for profile link)
  name: string;
}

interface UnreadSender {
  senderId: string;
  count: number;
}

export default function DietitianMessagesPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<ClientContact[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [unreadPerSender, setUnreadPerSender] = useState<Map<string, number>>(new Map());
  const [partnerPresence, setPartnerPresence] = useState<{ online: boolean; lastSeen: number | null }>({ online: false, lastSeen: null });

  /* ── Fetch clients ─────────────────────────────── */
  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/dietitian/clients");
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setClients(data.map((c: any) => ({
          _id: typeof c.userId === "object" ? c.userId._id ?? c.userId : c.userId,
          clientDocId: c._id,
          name: c.name,
        })));
      }
    } catch (e) { console.error(e); }
  }, []);

  /* ── Unread per sender ─────────────────────────── */
  const fetchUnreadPerSender = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/unread-per-sender");
      if (res.ok) {
        const data: UnreadSender[] = await res.json();
        const map = new Map<string, number>();
        data.forEach((s) => map.set(s.senderId, s.count));
        setUnreadPerSender(map);
      }
    } catch { /* ignore */ }
  }, []);

  /* ── Messages ──────────────────────────────────── */
  const fetchMessages = useCallback(async () => {
    if (!selectedClient) return;
    try {
      const res = await fetch(`/api/messages?partnerId=${selectedClient._id}`);
      if (res.ok) setMessages(await res.json());
    } catch (e) { console.error(e); }
  }, [selectedClient]);

  /* ── Mark read ─────────────────────────────────── */
  const markAsRead = useCallback(() => {
    if (!selectedClient || !document.hasFocus()) return;
    const hasUnread = messages.some(
      (m) => m.senderId === selectedClient._id && m.status !== "read",
    );
    if (hasUnread) {
      fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: selectedClient._id }),
      }).catch(() => {});
      setUnreadPerSender((prev) => {
        const next = new Map(prev);
        next.delete(selectedClient._id);
        return next;
      });
    }
  }, [selectedClient, messages]);

  /* ── Typing ────────────────────────────────────── */
  const fetchTypingStatus = useCallback(async () => {
    if (!selectedClient) return;
    try {
      const res = await fetch(`/api/messages/typing?partnerId=${selectedClient._id}`);
      if (res.ok) {
        const d = await res.json();
        setPartnerTyping(d.typing);
      }
    } catch { /* ignore */ }
  }, [selectedClient]);

  /* ── Presence ──────────────────────────────────── */
  const fetchPresence = useCallback(async () => {
    if (!selectedClient) return;
    try {
      const res = await fetch(`/api/presence?userId=${selectedClient._id}`);
      if (res.ok) setPartnerPresence(await res.json());
    } catch { /* ignore */ }
  }, [selectedClient]);

  /* ── File upload ───────────────────────────────── */
  const handleFileUpload = useCallback(async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/message", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    return res.json() as Promise<{ url: string; msgType: "image" | "audio" | "document"; filename: string }>;
  }, []);

  /* ── Effects ───────────────────────────────────── */
  useEffect(() => { fetchClients(); fetchUnreadPerSender(); }, [fetchClients, fetchUnreadPerSender]);

  useEffect(() => {
    fetchMessages();
    const id = setInterval(fetchMessages, 2000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  useEffect(() => {
    fetchUnreadPerSender();
    const id = setInterval(fetchUnreadPerSender, 5000);
    return () => clearInterval(id);
  }, [fetchUnreadPerSender]);

  useEffect(() => {
    if (!selectedClient) return;
    fetchTypingStatus();
    const id = setInterval(fetchTypingStatus, 1500);
    return () => clearInterval(id);
  }, [selectedClient, fetchTypingStatus]);

  useEffect(() => {
    if (!selectedClient) return;
    fetchPresence();
    const id = setInterval(fetchPresence, 15_000);
    return () => clearInterval(id);
  }, [selectedClient, fetchPresence]);

  useEffect(() => { setPartnerTyping(false); }, [selectedClient]);

  useEffect(() => {
    markAsRead();
    const onFocus = () => markAsRead();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [markAsRead]);

  /* ── Send message ──────────────────────────────── */
  const handleSendMessage = async (
    content: string,
    type: "text" | "image" | "audio" | "document",
    filename?: string,
  ) => {
    if (!selectedClient) return;
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: selectedClient._id, type, content, filename }),
      });
      if (res.ok) fetchMessages();
    } catch (e) { console.error(e); }
  };

  const handleTyping = useCallback(async () => {
    if (!selectedClient) return;
    try {
      await fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: selectedClient._id }),
      });
    } catch { /* ignore */ }
  }, [selectedClient]);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  /* ── Render ────────────────────────────────────── */
  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Left panel — client list */}
      <div className="w-full lg:w-1/4 bg-white border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Danışan ara..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredClients.map((client) => {
            const unread = unreadPerSender.get(client._id) ?? 0;
            const isSelected = selectedClient?._id === client._id;
            return (
              <div
                key={client._id}
                className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition cursor-pointer ${
                  isSelected ? "bg-emerald-50" : ""
                }`}
                onClick={() => setSelectedClient(client)}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
                    {client.name.charAt(0)}
                  </div>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>

                {/* Name + last indicator */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${unread > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                    {client.name}
                  </p>
                  {unread > 0 && (
                    <p className="text-xs text-red-500 font-medium">{unread} yeni mesaj</p>
                  )}
                </div>

                {/* Profile shortcut */}
                <Link
                  href={`/dashboard/dietitian/clients/${client.clientDocId}`}
                  onClick={(e) => e.stopPropagation()}
                  title="Profili Gör"
                  className="flex-shrink-0 p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                >
                  <FaExternalLinkAlt className="text-xs" />
                </Link>
              </div>
            );
          })}
          {filteredClients.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">Danışan bulunamadı</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedClient ? (
          <ChatWindow
            messages={messages}
            currentUserId={session?.user?.id || ""}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            partnerName={selectedClient.name}
            partnerTyping={partnerTyping}
            partnerOnline={partnerPresence.online}
            partnerLastSeen={partnerPresence.lastSeen}
            onFileUpload={handleFileUpload}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Mesajlaşmak için sol panelden bir danışan seçin.
          </div>
        )}
      </div>
    </div>
  );
}
