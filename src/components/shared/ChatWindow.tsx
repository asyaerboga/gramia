"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { IoCheckmark, IoCheckmarkDone } from "react-icons/io5";

interface ChatMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  type: "text" | "image" | "audio";
  content: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
}

interface ChatWindowProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string, type: "text" | "image" | "audio") => void;
  onTyping?: () => void;
  partnerName: string;
  partnerTyping?: boolean;
}

function StatusIcon({ status }: { status?: string }) {
  if (!status || status === "sent") {
    return (
      <IoCheckmark className="inline-block w-3.5 h-3.5 text-emerald-200" />
    );
  }
  if (status === "delivered") {
    return (
      <IoCheckmarkDone className="inline-block w-3.5 h-3.5 text-emerald-200" />
    );
  }
  // read
  return <IoCheckmarkDone className="inline-block w-3.5 h-3.5 text-blue-300" />;
}

export default function ChatWindow({
  messages,
  currentUserId,
  onSendMessage,
  onTyping,
  partnerName,
  partnerTyping,
}: ChatWindowProps) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerTyping, scrollToBottom]);

  const handleSend = () => {
    if (text.trim()) {
      onSendMessage(text.trim(), "text");
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (onTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping();
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white">
        <h3 className="font-semibold text-gray-900">{partnerName}</h3>
        {partnerTyping && (
          <p className="text-xs text-emerald-500 mt-0.5 animate-pulse">
            yazıyor...
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50/30">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Henüz mesaj yok. Bir mesaj göndererek başlayın.
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div
              key={msg._id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                  isMine
                    ? "bg-emerald-500 text-white rounded-br-md"
                    : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100"
                }`}
              >
                {msg.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={msg.content}
                    alt="Gönderilen resim"
                    className="rounded-lg max-w-full"
                  />
                ) : msg.type === "audio" ? (
                  <audio controls src={msg.content} className="max-w-full" />
                ) : (
                  <p className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                )}
                <div
                  className={`flex items-center justify-end gap-1 mt-1 ${
                    isMine ? "text-emerald-100" : "text-gray-400"
                  }`}
                >
                  <span className="text-[10px]">
                    {new Date(msg.timestamp).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isMine && <StatusIcon status={msg.status} />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator bubble */}
        {partnerTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-500 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
              <div className="flex gap-1 items-center">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white">
        <input
          type="text"
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Mesaj yaz..."
          className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FaPaperPlane className="text-sm" />
        </button>
      </div>
    </div>
  );
}
