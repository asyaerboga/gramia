"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FaPaperPlane,
  FaPaperclip,
  FaImage,
  FaMicrophone,
  FaStop,
  FaFileAlt,
} from "react-icons/fa";
import { IoCheckmark, IoCheckmarkDone } from "react-icons/io5";

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

interface UploadResult {
  url: string;
  msgType: "image" | "audio" | "document";
  filename: string;
}

interface ChatWindowProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (
    content: string,
    type: "text" | "image" | "audio" | "document",
    filename?: string,
  ) => void;
  onTyping?: () => void;
  partnerName: string;
  partnerTyping?: boolean;
  partnerOnline?: boolean;
  partnerLastSeen?: number | null;
  onFileUpload?: (file: File) => Promise<UploadResult>;
}

function StatusIcon({ status }: { status?: string }) {
  if (!status || status === "sent")
    return <IoCheckmark className="inline-block w-3.5 h-3.5 text-emerald-200" />;
  if (status === "delivered")
    return <IoCheckmarkDone className="inline-block w-3.5 h-3.5 text-emerald-200" />;
  return <IoCheckmarkDone className="inline-block w-3.5 h-3.5 text-blue-300" />;
}

function formatLastSeen(ts: number): string {
  const now = Date.now();
  const diffMin = Math.floor((now - ts) / 60_000);
  if (diffMin < 1) return "az önce aktifti";
  if (diffMin < 60) return `${diffMin} dk önce aktifti`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) {
    const time = new Date(ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    return `son görülme: ${time}`;
  }
  return `son görülme: ${new Date(ts).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}`;
}

export default function ChatWindow({
  messages,
  currentUserId,
  onSendMessage,
  onTyping,
  partnerName,
  partnerTyping,
  partnerOnline,
  partnerLastSeen,
  onFileUpload,
}: ChatWindowProps) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, partnerTyping, scrollToBottom]);

  /* ── Text send ─────────────────────────────────── */
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
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTyping();
      typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
    }
  };

  /* ── File upload (image / document) ───────────── */
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !onFileUpload) return;
    e.target.value = "";
    setUploading(true);
    try {
      const result = await onFileUpload(file);
      onSendMessage(result.url, result.msgType, result.filename);
    } catch {
      alert("Dosya yüklenemedi.");
    } finally {
      setUploading(false);
    }
  };

  /* ── Audio recording ───────────────────────────── */
  const startRecording = async () => {
    if (!onFileUpload) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `kayit-${Date.now()}.webm`, { type: "audio/webm" });
        setUploading(true);
        try {
          const result = await onFileUpload(file);
          onSendMessage(result.url, "audio", result.filename);
        } catch {
          alert("Ses yüklenemedi.");
        } finally {
          setUploading(false);
        }
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      alert("Mikrofon erişimi reddedildi.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 bg-white flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
            {partnerName.charAt(0)}
          </div>
          {partnerOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900 leading-tight">{partnerName}</p>
          <p className={`text-xs leading-tight ${partnerOnline ? "text-green-500" : "text-gray-400"}`}>
            {partnerTyping
              ? "yazıyor..."
              : partnerOnline
              ? "çevrim içi"
              : partnerLastSeen
              ? formatLastSeen(partnerLastSeen)
              : ""}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/40">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Henüz mesaj yok. Bir mesaj göndererek başlayın.
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  isMine
                    ? "bg-emerald-500 text-white rounded-br-md"
                    : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
                }`}
              >
                {/* Image */}
                {msg.type === "image" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.content} alt="Fotoğraf" className="rounded-lg max-w-full max-h-64 object-contain" />
                )}

                {/* Audio */}
                {msg.type === "audio" && (
                  <audio controls src={msg.content} className="max-w-full" />
                )}

                {/* Document */}
                {msg.type === "document" && (
                  <a
                    href={msg.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 hover:opacity-80 transition ${isMine ? "text-white" : "text-emerald-700"}`}
                  >
                    <FaFileAlt className="text-lg shrink-0" />
                    <span className="text-sm underline truncate max-w-[180px]">
                      {msg.filename || "Dosya"}
                    </span>
                  </a>
                )}

                {/* Text */}
                {msg.type === "text" && (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                )}

                {/* Timestamp + status */}
                <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? "text-emerald-100" : "text-gray-400"}`}>
                  <span className="text-[10px]">
                    {new Date(msg.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {isMine && <StatusIcon status={msg.status} />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {partnerTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input row */}
      <div className="px-3 py-2.5 border-t border-gray-100 bg-white">
        {uploading && (
          <p className="text-xs text-emerald-600 text-center mb-1.5 animate-pulse">Dosya yükleniyor...</p>
        )}

        <div className="flex items-center gap-2">
          {/* Attachment buttons */}
          {onFileUpload && (
            <div className="flex items-center gap-1">
              {/* Image */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading || isRecording}
                title="Fotoğraf gönder"
                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition disabled:opacity-40"
              >
                <FaImage className="text-base" />
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Document */}
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={uploading || isRecording}
                title="Dosya gönder"
                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition disabled:opacity-40"
              >
                <FaPaperclip className="text-base" />
              </button>
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,application/*,text/plain"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Audio record */}
              <button
                type="button"
                onPointerDown={startRecording}
                onPointerUp={stopRecording}
                onPointerLeave={stopRecording}
                disabled={uploading}
                title={isRecording ? "Bırak — gönder" : "Bas-konuş"}
                className={`p-2 rounded-full transition ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                } disabled:opacity-40`}
              >
                {isRecording ? <FaStop className="text-base" /> : <FaMicrophone className="text-base" />}
              </button>
            </div>
          )}

          {/* Text input */}
          <input
            type="text"
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Mesaj yaz..."
            disabled={isRecording || uploading}
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 disabled:opacity-50"
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!text.trim() || isRecording || uploading}
            className="p-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <FaPaperPlane className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
