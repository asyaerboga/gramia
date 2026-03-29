"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import ChatWindow from "@/components/shared/ChatWindow";

interface ChatMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  type: "text" | "image" | "audio";
  content: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
}

interface ClientContact {
  _id: string;
  name: string;
}

export default function DietitianMessagesPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<ClientContact[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientContact | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [partnerTyping, setPartnerTyping] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/dietitian/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.map((c: any) => ({
            _id: typeof c.userId === "object" ? c.userId._id : c.userId,
            name: c.name,
          })),
        );
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!selectedClient) return;
    try {
      const res = await fetch(`/api/messages?partnerId=${selectedClient._id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }, [selectedClient]);

  // Mark messages as read only when page is visible and chat is active
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
    }
  }, [selectedClient, messages]);

  const fetchTypingStatus = useCallback(async () => {
    if (!selectedClient) return;
    try {
      const res = await fetch(
        `/api/messages/typing?partnerId=${selectedClient._id}`,
      );
      if (res.ok) {
        const data = await res.json();
        setPartnerTyping(data.typing);
      }
    } catch {
      // ignore
    }
  }, [selectedClient]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Message polling - 2 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Typing status polling - 1.5 seconds
  useEffect(() => {
    if (!selectedClient) return;
    fetchTypingStatus();
    const interval = setInterval(fetchTypingStatus, 1500);
    return () => clearInterval(interval);
  }, [selectedClient, fetchTypingStatus]);

  // Reset typing when switching clients
  useEffect(() => {
    setPartnerTyping(false);
  }, [selectedClient]);

  // Mark as read when page is focused and has unread messages
  useEffect(() => {
    markAsRead();
    const handleFocus = () => markAsRead();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [markAsRead]);

  const handleSendMessage = async (
    content: string,
    type: "text" | "image" | "audio",
  ) => {
    if (!selectedClient) return;
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedClient._id,
          type,
          content,
        }),
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleTyping = useCallback(async () => {
    if (!selectedClient) return;
    try {
      await fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: selectedClient._id }),
      });
    } catch {
      // ignore
    }
  }, [selectedClient]);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Left panel - Client list */}
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
          {filteredClients.map((client) => (
            <button
              key={client._id}
              onClick={() => setSelectedClient(client)}
              className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition ${
                selectedClient?._id === client._id ? "bg-emerald-50" : ""
              }`}
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                {client.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {client.name}
                </p>
              </div>
            </button>
          ))}
          {filteredClients.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              Danışan bulunamadı
            </p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedClient ? (
          <ChatWindow
            messages={messages}
            currentUserId={session?.user?.id || ""}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            partnerName={selectedClient.name}
            partnerTyping={partnerTyping}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Mesajlaşmak için sol panelden bir danışan seçin.
          </div>
        )}
      </div>
    </div>
  );
}
