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

interface ChatPartner {
  _id: string;
  name: string;
}

export default function ClientMessagesPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [dietitian, setDietitian] = useState<ChatPartner | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const fetchDietitian = useCallback(async () => {
    try {
      const res = await fetch("/api/client/dietitian");
      if (res.ok) {
        const data = await res.json();
        setDietitian(data);
      }
    } catch (error) {
      console.error("Failed to fetch dietitian:", error);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!dietitian) return;
    try {
      const res = await fetch(`/api/messages?partnerId=${dietitian._id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }, [dietitian]);

  // Mark messages as read only when page is visible and chat is active
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

  const fetchTypingStatus = useCallback(async () => {
    if (!dietitian) return;
    try {
      const res = await fetch(
        `/api/messages/typing?partnerId=${dietitian._id}`,
      );
      if (res.ok) {
        const data = await res.json();
        setPartnerTyping(data.typing);
      }
    } catch {
      // ignore
    }
  }, [dietitian]);

  useEffect(() => {
    fetchDietitian();
  }, [fetchDietitian]);

  // Message polling - 2 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Typing status polling - 1.5 seconds
  useEffect(() => {
    if (!dietitian) return;
    fetchTypingStatus();
    const interval = setInterval(fetchTypingStatus, 1500);
    return () => clearInterval(interval);
  }, [dietitian, fetchTypingStatus]);

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
    if (!dietitian) return;
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: dietitian._id,
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
    if (!dietitian) return;
    try {
      await fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: dietitian._id }),
      });
    } catch {
      // ignore
    }
  }, [dietitian]);

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Left panel - Dietitian info */}
      <div className="w-full lg:w-1/4 bg-white border-b lg:border-b-0 lg:border-r border-gray-100 p-4 lg:p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Diyetisyenim</h3>
        {dietitian ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
            <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700 font-bold">
              {dietitian.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{dietitian.name}</p>
              <p className="text-xs text-emerald-600">Diyetisyen</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Henüz bir diyetisyen atanmamış.
          </p>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {dietitian ? (
          <ChatWindow
            messages={messages}
            currentUserId={session?.user?.id || ""}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            partnerName={dietitian.name}
            partnerTyping={partnerTyping}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Mesajlaşmak için bir diyetisyen ataması gerekiyor.
          </div>
        )}
      </div>
    </div>
  );
}
