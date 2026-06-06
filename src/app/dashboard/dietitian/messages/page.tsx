"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ChatWindow from "@/components/shared/ChatWindow";
import { FaExternalLinkAlt, FaUsers, FaPlus, FaTimes, FaCheck } from "react-icons/fa";

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

interface ClientContact {
  _id: string;
  clientDocId: string;
  name: string;
  image?: string | null;
}

interface GroupConversation {
  _id: string;
  name: string;
  members: string[];
  updatedAt: string;
}

interface UnreadSender {
  senderId: string;
  count: number;
}

type SelectedItem =
  | { kind: "client"; data: ClientContact }
  | { kind: "group"; data: GroupConversation };

export default function DietitianMessagesPage() {
  const { data: session } = useSession();

  const [clients, setClients] = useState<ClientContact[]>([]);
  const [groups, setGroups] = useState<GroupConversation[]>([]);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"clients" | "groups">("clients");

  const [partnerTyping, setPartnerTyping] = useState(false);
  const [unreadPerSender, setUnreadPerSender] = useState<Map<string, number>>(new Map());

  const selectedItemRef = useRef<SelectedItem | null>(null);
  selectedItemRef.current = selectedItem;
  const [groupUnreads, setGroupUnreads] = useState<Map<string, number>>(new Map());
  const [partnerPresence, setPartnerPresence] = useState<{ online: boolean; lastSeen: number | null }>({ online: false, lastSeen: null });
  const [clientPresences, setClientPresences] = useState<Map<string, { online: boolean; lastSeen: number | null }>>(new Map());
  const [lastMessageTimes, setLastMessageTimes] = useState<Map<string, number>>(new Map());

  /* ── Group creation modal ─────────────────────── */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

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
          image: c.image || null,
        })));
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

  /* ── Last message times ────────────────────────── */
  const fetchLastMessageTimes = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/last-per-partner");
      if (res.ok) {
        const data: { partnerId: string; lastTimestamp: string }[] = await res.json();
        const map = new Map<string, number>();
        data.forEach((d) => map.set(d.partnerId, new Date(d.lastTimestamp).getTime()));
        setLastMessageTimes(map);
      }
    } catch { /* ignore */ }
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
    if (!selectedItem) return;
    try {
      if (selectedItem.kind === "client") {
        const res = await fetch(`/api/messages?partnerId=${selectedItem.data._id}`);
        if (res.ok) setMessages(await res.json());
      } else {
        const res = await fetch(`/api/conversations/${selectedItem.data._id}/messages`);
        if (res.ok) setMessages(await res.json());
      }
    } catch (e) { console.error(e); }
  }, [selectedItem]);

  /* ── Mark read ─────────────────────────────────── */
  const markAsRead = useCallback((clientId: string) => {
    setUnreadPerSender((prev) => {
      const next = new Map(prev);
      next.delete(clientId);
      return next;
    });
    fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId: clientId }),
    }).catch(() => {});
  }, []);

  /* ── Typing ────────────────────────────────────── */
  const fetchTypingStatus = useCallback(async () => {
    if (selectedItem?.kind !== "client") return;
    try {
      const res = await fetch(`/api/messages/typing?partnerId=${selectedItem.data._id}`);
      if (res.ok) {
        const d = await res.json();
        setPartnerTyping(d.typing);
      }
    } catch { /* ignore */ }
  }, [selectedItem]);

  /* ── Presence (selected) ───────────────────────── */
  const fetchPresence = useCallback(async () => {
    if (selectedItem?.kind !== "client") return;
    try {
      const res = await fetch(`/api/presence?userId=${selectedItem.data._id}`);
      if (res.ok) setPartnerPresence(await res.json());
    } catch { /* ignore */ }
  }, [selectedItem]);

  /* ── Presence (all clients) ────────────────────── */
  const fetchAllPresences = useCallback(async () => {
    if (clients.length === 0) return;
    try {
      const results = await Promise.all(
        clients.map(async (c) => {
          const res = await fetch(`/api/presence?userId=${c._id}`);
          if (res.ok) return { id: c._id, presence: await res.json() };
          return null;
        }),
      );
      setClientPresences((prev) => {
        const next = new Map(prev);
        results.forEach((r) => { if (r) next.set(r.id, r.presence); });
        return next;
      });
    } catch { /* ignore */ }
  }, [clients]);

  /* ── Group unread counts ───────────────────────── */
  const fetchGroupUnreads = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations/unread-groups");
      if (res.ok) {
        const data: { conversationId: string; unreadCount: number }[] = await res.json();
        const map = new Map<string, number>();
        data.forEach((g) => map.set(g.conversationId, g.unreadCount));
        setGroupUnreads(map);
      }
    } catch { /* ignore */ }
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
    fetchClients();
    fetchGroups();
    fetchUnreadPerSender();
    fetchLastMessageTimes();
  }, [fetchClients, fetchGroups, fetchUnreadPerSender, fetchLastMessageTimes]);

  useEffect(() => {
    const id = setInterval(fetchLastMessageTimes, 5000);
    return () => clearInterval(id);
  }, [fetchLastMessageTimes]);

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
    if (selectedItem?.kind !== "client") return;
    fetchTypingStatus();
    const id = setInterval(fetchTypingStatus, 1500);
    return () => clearInterval(id);
  }, [selectedItem, fetchTypingStatus]);

  useEffect(() => {
    if (selectedItem?.kind !== "client") return;
    fetchPresence();
    const id = setInterval(fetchPresence, 15_000);
    return () => clearInterval(id);
  }, [selectedItem, fetchPresence]);

  useEffect(() => {
    if (clients.length === 0) return;
    fetchAllPresences();
    const id = setInterval(fetchAllPresences, 15_000);
    return () => clearInterval(id);
  }, [clients, fetchAllPresences]);

  useEffect(() => { setPartnerTyping(false); }, [selectedItem]);

  useEffect(() => {
    const onFocus = () => {
      const item = selectedItemRef.current;
      if (item?.kind === "client") markAsRead(item.data._id);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [markAsRead]);

  useEffect(() => {
    fetchGroupUnreads();
    const id = setInterval(fetchGroupUnreads, 5000);
    return () => clearInterval(id);
  }, [fetchGroupUnreads]);

  /* ── Refresh groups every 10s ──────────────────── */
  useEffect(() => {
    const id = setInterval(fetchGroups, 10_000);
    return () => clearInterval(id);
  }, [fetchGroups]);

  /* ── Send message ──────────────────────────────── */
  const handleSendMessage = async (
    content: string,
    type: "text" | "image" | "audio" | "document",
    filename?: string,
  ) => {
    if (!selectedItem) return;
    try {
      if (selectedItem.kind === "client") {
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
    if (selectedItem?.kind !== "client") return;
    try {
      await fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: selectedItem.data._id }),
      });
    } catch { /* ignore */ }
  }, [selectedItem]);

  /* ── Create group ──────────────────────────────── */
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedMemberIds.size === 0) return;
    setCreating(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim(), memberIds: Array.from(selectedMemberIds) }),
      });
      if (res.ok) {
        const group = await res.json();
        setGroups((prev) => [group, ...prev]);
        setShowCreateModal(false);
        setNewGroupName("");
        setSelectedMemberIds(new Set());
        setActiveTab("groups");
        setSelectedItem({ kind: "group", data: group });
      }
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredClients = clients
    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const ta = lastMessageTimes.get(a._id) ?? 0;
      const tb = lastMessageTimes.get(b._id) ?? 0;
      return tb - ta;
    });

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ── Render ────────────────────────────────────── */
  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Left panel */}
      <div className="w-full lg:w-1/4 bg-white border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col">
        {/* Search + new group button */}
        <div className="p-4 border-b border-gray-100 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "clients" ? "Danışan ara..." : "Grup ara..."}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
            />
            <button
              onClick={() => setShowCreateModal(true)}
              title="Yeni Grup Oluştur"
              className="shrink-0 p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
            >
              <FaPlus className="text-sm" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            <button
              onClick={() => setActiveTab("clients")}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${
                activeTab === "clients" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Danışanlar
            </button>
            <button
              onClick={() => setActiveTab("groups")}
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
          {/* Clients tab */}
          {activeTab === "clients" && (
            <>
              {filteredClients.map((client) => {
                const unread = unreadPerSender.get(client._id) ?? 0;
                const isSelected = selectedItem?.kind === "client" && selectedItem.data._id === client._id;
                return (
                  <div
                    key={client._id}
                    className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition cursor-pointer ${isSelected ? "bg-emerald-50" : ""}`}
                    onClick={() => { setSelectedItem({ kind: "client", data: client }); markAsRead(client._id); }}
                  >
                    <div className="relative shrink-0">
                      {client.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={client.image} alt={client.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
                          {client.name.charAt(0)}
                        </div>
                      )}
                      {unread > 0 ? (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1 leading-none">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      ) : clientPresences.get(client._id)?.online ? (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${unread > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                        {client.name}
                      </p>
                      {unread > 0 ? (
                        <p className="text-xs text-red-500 font-medium">{unread} yeni mesaj</p>
                      ) : (
                        <p className={`text-xs font-medium ${clientPresences.get(client._id)?.online ? "text-emerald-500" : "text-gray-400"}`}>
                          {clientPresences.get(client._id)?.online ? "Çevrimiçi" : "Çevrimdışı"}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/dietitian/clients/${client.clientDocId}`}
                      onClick={(e) => e.stopPropagation()}
                      title="Profili Gör"
                      className="shrink-0 p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    >
                      <FaExternalLinkAlt className="text-xs" />
                    </Link>
                  </div>
                );
              })}
              {filteredClients.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">Danışan bulunamadı</p>
              )}
            </>
          )}

          {/* Groups tab */}
          {activeTab === "groups" && (
            <>
              {filteredGroups.map((group) => {
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
              {filteredGroups.length === 0 && (
                <div className="text-center py-8 px-4">
                  <FaUsers className="text-3xl text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Henüz grup yok</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-2 text-xs text-emerald-600 hover:underline"
                  >
                    İlk grubu oluştur
                  </button>
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
            onTyping={selectedItem.kind === "client" ? handleTyping : undefined}
            partnerName={selectedItem.kind === "client" ? selectedItem.data.name : selectedItem.data.name}
            partnerImage={selectedItem.kind === "client" ? selectedItem.data.image : null}
            partnerTyping={selectedItem.kind === "client" ? partnerTyping : false}
            partnerOnline={selectedItem.kind === "client" ? partnerPresence.online : false}
            partnerLastSeen={selectedItem.kind === "client" ? partnerPresence.lastSeen : null}
            onFileUpload={handleFileUpload}
            isGroup={selectedItem.kind === "group"}
            groupMemberCount={selectedItem.kind === "group" ? selectedItem.data.members.length : undefined}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Mesajlaşmak için sol panelden bir danışan veya grup seçin.
          </div>
        )}
      </div>

      {/* Create group modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FaUsers className="text-emerald-600" />
                <h2 className="font-semibold text-gray-900">Yeni Grup Oluştur</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* Group name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Grup Adı</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Grup adı girin..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                />
              </div>

              {/* Client multi-select */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Danışanları Seç
                  {selectedMemberIds.size > 0 && (
                    <span className="ml-2 text-emerald-600 font-semibold">{selectedMemberIds.size} seçildi</span>
                  )}
                </label>
                <div className="space-y-1 max-h-64 overflow-y-auto border border-gray-100 rounded-lg p-1">
                  {clients.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Danışan bulunamadı</p>
                  )}
                  {clients.map((client) => {
                    const checked = selectedMemberIds.has(client._id);
                    return (
                      <button
                        key={client._id}
                        type="button"
                        onClick={() => toggleMember(client._id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition text-left ${
                          checked ? "bg-emerald-50 text-emerald-800" : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        {client.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={client.image} alt={client.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                            {client.name.charAt(0)}
                          </div>
                        )}
                        <span className="flex-1 text-sm font-medium">{client.name}</span>
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                          checked ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300"
                        }`}>
                          {checked && <FaCheck className="text-[9px]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                İptal
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || selectedMemberIds.size === 0 || creating}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {creating ? "Oluşturuluyor..." : "Grup Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
