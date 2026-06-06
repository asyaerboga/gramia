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
      <div className="w-full lg:w-1/4 bg-white border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col">
        {/* Tabs */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            <button
              onClick={handleTabDietitian}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${
                activeTab === "dietitian" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Diyetisyenim
            </button>
            <button
              onClick={handleTabGroups}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition flex items-center justify-center gap-1 ${
                activeTab === "groups" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaUsers className="text-[11px]" />
              Gruplar
              {groupUnreads.size > 0 ? (
                <span className="bg-red-500 text-white text-[9px] font-bold rounded-full min-w-3.5 h-3.5 flex items-center justify-center px-1 leading-none">
                  {groupUnreads.size}
                </span>
              ) : groups.length > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {groups.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Dietitian tab */}
          {activeTab === "dietitian" && (
            <>
              {dietitian ? (
                <div
                  className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition cursor-pointer ${
                    selectedItem?.kind === "dietitian" ? "bg-emerald-50" : ""
                  }`}
                  onClick={() => { setSelectedItem({ kind: "dietitian", data: dietitian }); markAsRead(dietitian._id); }}
                >
                  <div className="relative shrink-0">
                    {dietitian.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={dietitian.image} alt={dietitian.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
                        {dietitian.name.charAt(0)}
                      </div>
                    )}
                    {unreadFromDietitian > 0 ? (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1 leading-none">
                        {unreadFromDietitian > 99 ? "99+" : unreadFromDietitian}
                      </span>
                    ) : partnerPresence.online && selectedItem?.kind === "dietitian" ? (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                    ) : null}
                  </div>
                  <div>
                    <p className={`text-sm truncate ${unreadFromDietitian > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-900"}`}>
                      {dietitian.name}
                    </p>
                    {unreadFromDietitian > 0 ? (
                      <p className="text-xs text-red-500 font-medium">{unreadFromDietitian} yeni mesaj</p>
                    ) : (
                      <p className="text-xs text-emerald-600">Diyetisyen</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 p-4">Henüz bir diyetisyen atanmamış.</p>
              )}
            </>
          )}

          {/* Groups tab */}
          {activeTab === "groups" && (
            <>
              {groups.map((group) => {
                const isSelected = selectedItem?.kind === "group" && selectedItem.data._id === group._id;
                const unread = groupUnreads.get(group._id) ?? 0;
                return (
                  <div
                    key={group._id}
                    className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition cursor-pointer ${isSelected ? "bg-emerald-50" : ""}`}
                    onClick={() => {
                      setSelectedItem({ kind: "group", data: group });
                      markGroupRead(group._id);
                    }}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <FaUsers className="text-base" />
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1 leading-none">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${unread > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                        {group.name}
                      </p>
                      {unread > 0 ? (
                        <p className="text-xs text-red-500 font-medium">{unread} yeni mesaj</p>
                      ) : (
                        <p className="text-xs text-gray-400">{group.members.length} üye</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {groups.length === 0 && (
                <div className="text-center py-8 px-4">
                  <FaUsers className="text-3xl text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Henüz bir gruba dahil değilsiniz.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedItem ? (
          <ChatWindow
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
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            {activeTab === "groups" ? "Sol panelden bir grup seçin." : "Mesajlaşmak için bir diyetisyen ataması gerekiyor."}
          </div>
        )}
      </div>
    </div>
  );
}
