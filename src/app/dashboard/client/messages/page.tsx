"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import ChatWindow from "@/components/shared/ChatWindow";
import { FaUsers } from "react-icons/fa";

interface ChatMessage {
  _id: string;
  senderId: string;
  receiverId?: string;
  senderName?: string;
  type: "text" | "image" | "audio" | "document";
  content: string;
  filename?: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  editedAt?: string | null;
  isDeleted?: boolean;
  reactions?: { emoji: string; users: string[] }[];
}

interface ChatPartner {
  _id: string;
  name: string;
  image?: string | null;
}

interface GroupConversation {
  _id: string;
  name: string;
  members: string[];
  updatedAt: string;
}

type SelectedItem =
  | { kind: "dietitian"; data: ChatPartner }
  | { kind: "group"; data: GroupConversation };

export default function ClientMessagesPage() {
  const { data: session } = useSession();

  const [dietitian, setDietitian] = useState<ChatPartner | null>(null);
  const [groups, setGroups] = useState<GroupConversation[]>([]);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<"dietitian" | "groups">("dietitian");

  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerPresence, setPartnerPresence] = useState<{ online: boolean; lastSeen: number | null }>({
    online: false,
    lastSeen: null,
  });
  const [unreadFromDietitian, setUnreadFromDietitian] = useState(0);
  const [groupUnreads, setGroupUnreads] = useState<Map<string, number>>(new Map());

  const selectedItemRef = useRef<SelectedItem | null>(null);
  selectedItemRef.current = selectedItem;
  const dietitianRef = useRef<ChatPartner | null>(null);
  dietitianRef.current = dietitian;

  /* ── Fetch dietitian ───────────────────────────── */
  const fetchDietitian = useCallback(async () => {
    try {
      const res = await fetch("/api/client/dietitian");
      if (res.ok) {
        const data = await res.json();
        setDietitian(data);
        setSelectedItem((prev) => prev ?? { kind: "dietitian", data });
      }
    } catch (e) { console.error(e); }
  }, []);

  /* ── Fetch groups ──────────────────────────────── */
  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) setGroups(await res.json());
    } catch { /* ignore */ }
  }, []);

  /* ── Messages ──────────────────────────────────── */
  const fetchMessages = useCallback(async () => {
    if (!selectedItem) return;
    try {
      if (selectedItem.kind === "dietitian") {
        const res = await fetch(`/api/messages?partnerId=${selectedItem.data._id}`);
        if (res.ok) setMessages(await res.json());
      } else {
        const res = await fetch(`/api/conversations/${selectedItem.data._id}/messages`);
        if (res.ok) setMessages(await res.json());
      }
    } catch (e) { console.error(e); }
  }, [selectedItem]);

  /* ── Unread counts ─────────────────────────────── */
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const [senderRes, groupRes] = await Promise.all([
        fetch("/api/messages/unread-per-sender"),
        fetch("/api/conversations/unread-groups"),
      ]);
      if (senderRes.ok) {
        const senders: { senderId: string; count: number }[] = await senderRes.json();
        if (dietitian) {
          const entry = senders.find((s) => s.senderId === dietitian._id);
          setUnreadFromDietitian(entry?.count ?? 0);
        }
      }
      if (groupRes.ok) {
        const data: { conversationId: string; unreadCount: number }[] = await groupRes.json();
        const map = new Map<string, number>();
        data.forEach((g) => map.set(g.conversationId, g.unreadCount));
        setGroupUnreads(map);
      }
    } catch { /* ignore */ }
  }, [dietitian]);

  /* ── Mark read ─────────────────────────────────── */
  const markAsRead = useCallback((partnerId: string) => {
    setUnreadFromDietitian(0);
    fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId }),
    }).catch(() => {});
  }, []);

  /* ── Typing ────────────────────────────────────── */
  const fetchTypingStatus = useCallback(async () => {
    if (selectedItem?.kind !== "dietitian") return;
    try {
      const res = await fetch(`/api/messages/typing?partnerId=${selectedItem.data._id}`);
      if (res.ok) {
        const d = await res.json();
        setPartnerTyping(d.typing);
      }
    } catch { /* ignore */ }
  }, [selectedItem]);

  /* ── Presence ──────────────────────────────────── */
  const fetchPresence = useCallback(async () => {
    if (selectedItem?.kind !== "dietitian") return;
    try {
      const res = await fetch(`/api/presence?userId=${selectedItem.data._id}`);
      if (res.ok) setPartnerPresence(await res.json());
    } catch { /* ignore */ }
  }, [selectedItem]);

  /* ── File upload ───────────────────────────────── */
  const handleFileUpload = useCallback(async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/message", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    return res.json() as Promise<{ url: string; msgType: "image" | "audio" | "document"; filename: string }>;
  }, []);

  /* ── Effects ───────────────────────────────────── */
  useEffect(() => {
    fetchDietitian();
    fetchGroups();
  }, [fetchDietitian, fetchGroups]);

  useEffect(() => {
    if (!dietitian) return;
    fetchUnreadCounts();
    const id = setInterval(fetchUnreadCounts, 5000);
    return () => clearInterval(id);
  }, [fetchUnreadCounts, dietitian]);

  useEffect(() => {
    const id = setInterval(fetchGroups, 10_000);
    return () => clearInterval(id);
  }, [fetchGroups]);

  useEffect(() => {
    fetchMessages();
    const id = setInterval(fetchMessages, 2000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  useEffect(() => {
    if (selectedItem?.kind !== "dietitian") return;
    fetchTypingStatus();
    const id = setInterval(fetchTypingStatus, 1500);
    return () => clearInterval(id);
  }, [selectedItem, fetchTypingStatus]);

  useEffect(() => {
    if (selectedItem?.kind !== "dietitian") return;
    fetchPresence();
    const id = setInterval(fetchPresence, 15_000);
    return () => clearInterval(id);
  }, [selectedItem, fetchPresence]);

  useEffect(() => { setPartnerTyping(false); }, [selectedItem]);

  useEffect(() => {
    const onFocus = () => {
      const item = selectedItemRef.current;
      const d = dietitianRef.current;
      if (item?.kind === "dietitian" && d) markAsRead(d._id);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [markAsRead]);

  /* ── Send message ──────────────────────────────── */
  const handleSendMessage = async (
    content: string,
    type: "text" | "image" | "audio" | "document",
    filename?: string,
  ) => {
    if (!selectedItem) return;
    try {
      if (selectedItem.kind === "dietitian") {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiverId: selectedItem.data._id, type, content, filename }),
        });
      } else {
        await fetch(`/api/conversations/${selectedItem.data._id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, type, filename }),
        });
        fetchGroups();
      }
      fetchMessages();
    } catch (e) { console.error(e); }
  };

  const handleTyping = useCallback(async () => {
    if (selectedItem?.kind !== "dietitian" || !dietitian) return;
    try {
      await fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: dietitian._id }),
      });
    } catch { /* ignore */ }
  }, [selectedItem, dietitian]);

  /* ── Edit / Delete message ─────────────────────── */
  const handleEditMessage = useCallback(async (id: string, newContent: string) => {
    if (!selectedItem) return;
    try {
      if (selectedItem.kind === "dietitian") {
        await fetch(`/api/messages/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newContent }),
        });
      } else {
        await fetch(`/api/conversations/${selectedItem.data._id}/messages/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newContent }),
        });
      }
      setMessages((prev) =>
        prev.map((m) => m._id === id ? { ...m, content: newContent, editedAt: new Date().toISOString() } : m)
      );
    } catch (e) { console.error(e); }
  }, [selectedItem]);

  const handleDeleteMessage = useCallback(async (id: string) => {
    if (!selectedItem) return;
    try {
      if (selectedItem.kind === "dietitian") {
        await fetch(`/api/messages/${id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/conversations/${selectedItem.data._id}/messages/${id}`, { method: "DELETE" });
      }
      setMessages((prev) =>
        prev.map((m) => m._id === id ? { ...m, isDeleted: true, content: "Bu mesaj geri alındı" } : m)
      );
    } catch (e) { console.error(e); }
  }, [selectedItem]);

  const handleReact = useCallback(async (msgId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/messages/${msgId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const { reactions } = await res.json();
        setMessages((prev) => prev.map((m) => m._id === msgId ? { ...m, reactions } : m));
      }
    } catch (e) { console.error(e); }
  }, []);

  /* ── Mark group read ───────────────────────────── */
  const markGroupRead = useCallback((groupId: string) => {
    fetch(`/api/conversations/${groupId}/mark-read`, { method: "POST" }).catch(() => {});
    setGroupUnreads((prev) => {
      const next = new Map(prev);
      next.delete(groupId);
      return next;
    });
  }, []);

  /* ── Tab switch helpers ────────────────────────── */
  const handleTabDietitian = () => {
    setActiveTab("dietitian");
    if (dietitian) {
      setSelectedItem({ kind: "dietitian", data: dietitian });
      markAsRead(dietitian._id);
    }
  };

  const handleTabGroups = () => {
    setActiveTab("groups");
    setSelectedItem(null);
  };

  /* ── Render ────────────────────────────────────── */
  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Left panel */}
      <div className="w-full lg:w-1/4 flex flex-col" style={{ background: "linear-gradient(160deg, #7c3aed 0%, #6d28d9 55%, #0d9488 100%)" }}>
        {/* Panel header */}
        <div className="px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 bg-white/20 rounded-2xl flex items-center justify-center text-xl backdrop-blur-sm">
              💬
            </div>
            <h1 className="text-white font-bold text-xl tracking-tight">Mesajlar</h1>
          </div>
          <p className="text-violet-200 text-xs leading-snug pl-0.5">Diyetisyeninizle bağlantıda kalın</p>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-4 shrink-0">
          <div className="flex rounded-2xl p-1" style={{ background: "rgba(0,0,0,0.2)" }}>
            <button
              onClick={handleTabDietitian}
              className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-all duration-200 ${
                activeTab === "dietitian"
                  ? "bg-white text-violet-700 shadow-md"
                  : "text-violet-100 hover:text-white hover:bg-white/10"
              }`}
            >
              👨‍⚕️ Diyetisyenim
            </button>
            <button
              onClick={handleTabGroups}
              className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === "groups"
                  ? "bg-white text-violet-700 shadow-md"
                  : "text-violet-100 hover:text-white hover:bg-white/10"
              }`}
            >
              <FaUsers className="text-[11px]" />
              Gruplar
              {groupUnreads.size > 0 ? (
                <span className="bg-red-400 text-white text-[9px] font-bold rounded-full min-w-3.5 h-3.5 flex items-center justify-center px-1 leading-none">
                  {groupUnreads.size}
                </span>
              ) : groups.length > 0 && (
                <span className="bg-white/25 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {groups.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content list — white card */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">
          <div className="flex-1 overflow-y-auto">
            {/* Dietitian tab */}
            {activeTab === "dietitian" && (
              <>
                {dietitian ? (
                  <div
                    className={`flex items-center gap-3.5 p-4 hover:bg-violet-50/70 transition-all cursor-pointer border-b border-gray-50 ${
                      selectedItem?.kind === "dietitian" ? "bg-violet-50" : ""
                    }`}
                    onClick={() => { setSelectedItem({ kind: "dietitian", data: dietitian }); markAsRead(dietitian._id); }}
                  >
                    <div className="relative shrink-0">
                      <div className={`p-0.5 rounded-full ${unreadFromDietitian > 0 ? "bg-linear-to-br from-rose-200 to-red-300" : "bg-linear-to-br from-emerald-200 to-teal-300"}`}>
                        {dietitian.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={dietitian.image} alt={dietitian.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-white" />
                        ) : (
                          <div className="w-11 h-11 bg-linear-to-br from-emerald-300 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-base ring-2 ring-white">
                            {dietitian.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      {unreadFromDietitian > 0 ? (
                        <span className="absolute -top-1 -right-1 bg-rose-400 text-white text-[9px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1 leading-none shadow-sm">
                          {unreadFromDietitian > 99 ? "99+" : unreadFromDietitian}
                        </span>
                      ) : partnerPresence.online && selectedItem?.kind === "dietitian" ? (
                        <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-300 border-2 border-white rounded-full shadow-sm" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${unreadFromDietitian > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                        {dietitian.name}
                      </p>
                      {unreadFromDietitian > 0 ? (
                        <p className="text-xs text-rose-400 font-semibold mt-0.5 flex items-center gap-1">
                          🔔 {unreadFromDietitian} yeni mesaj
                        </p>
                      ) : (
                        <p className="text-xs text-emerald-500 font-medium mt-0.5 flex items-center gap-1">
                          ✨ Diyetisyen
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-14 px-4">
                    <div className="text-5xl mb-3">👨‍⚕️</div>
                    <p className="text-sm font-semibold text-gray-500">Henüz bir diyetisyen atanmamış.</p>
                    <p className="text-xs text-gray-400 mt-1">Yakında bağlanacaksınız!</p>
                  </div>
                )}
              </>
            )}

            {/* Groups tab */}
            {activeTab === "groups" && (
              <>
                {[...groups]
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .map((group) => {
                  const isSelected = selectedItem?.kind === "group" && selectedItem.data._id === group._id;
                  const unread = groupUnreads.get(group._id) ?? 0;
                  return (
                    <div
                      key={group._id}
                      className={`flex items-center gap-3.5 p-4 hover:bg-emerald-50/60 transition-all cursor-pointer border-b border-gray-50 ${isSelected ? "bg-emerald-50" : ""}`}
                      onClick={() => {
                        setSelectedItem({ kind: "group", data: group });
                        markGroupRead(group._id);
                      }}
                    >
                      <div className="relative shrink-0">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shadow-sm ${unread > 0 ? "bg-rose-100 text-rose-400" : "bg-emerald-100 text-emerald-500"}`}>
                          👥
                        </div>
                        {unread > 0 && (
                          <span className="absolute -top-1 -right-1 bg-rose-400 text-white text-[9px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1 leading-none shadow-sm">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${unread > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                          {group.name}
                        </p>
                        {unread > 0 ? (
                          <p className="text-xs text-rose-400 font-semibold mt-0.5 flex items-center gap-1">
                            🔔 {unread} yeni mesaj
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">{group.members.length} üye</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {groups.length === 0 && (
                  <div className="text-center py-14 px-4">
                    <div className="text-5xl mb-3">🤝</div>
                    <p className="text-sm font-semibold text-gray-500">Henüz bir gruba dahil değilsiniz.</p>
                    <p className="text-xs text-gray-400 mt-1">Diyetisyeniniz sizi ekleyecektir.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedItem ? (
          <ChatWindow
            key={selectedItem.data._id}
            messages={messages}
            currentUserId={session?.user?.id || ""}
            onSendMessage={handleSendMessage}
            onTyping={selectedItem.kind === "dietitian" ? handleTyping : undefined}
            partnerName={selectedItem.kind === "dietitian" ? selectedItem.data.name : selectedItem.data.name}
            partnerImage={selectedItem.kind === "dietitian" ? selectedItem.data.image : null}
            partnerTyping={selectedItem.kind === "dietitian" ? partnerTyping : false}
            partnerOnline={selectedItem.kind === "dietitian" ? partnerPresence.online : false}
            partnerLastSeen={selectedItem.kind === "dietitian" ? partnerPresence.lastSeen : null}
            onFileUpload={handleFileUpload}
            isGroup={selectedItem.kind === "group"}
            groupMemberCount={selectedItem.kind === "group" ? selectedItem.data.members.length : undefined}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onReact={handleReact}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 select-none" style={{ background: "radial-gradient(ellipse at center, #f0fdf4 0%, #f8fafc 70%)" }}>
            <div className="text-6xl animate-bounce" style={{ animationDuration: "2.5s" }}>
              {activeTab === "groups" ? "👥" : "💬"}
            </div>
            <div className="text-center">
              <p className="text-gray-600 font-semibold text-base">
                {activeTab === "groups" ? "Bir grup seçin" : "Sohbete başlayın"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {activeTab === "groups" ? "Sol panelden bir grubu seçin." : "Diyetisyeninizle mesajlaşmaya başlayın."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
