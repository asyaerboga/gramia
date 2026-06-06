"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FaPaperPlane,
  FaPaperclip,
  FaImage,
  FaMicrophone,
  FaStop,
  FaFileAlt,
  FaTimes,
  FaPlay,
  FaPause,
  FaUsers,
} from "react-icons/fa";
import { IoCheckmark, IoCheckmarkDone } from "react-icons/io5";

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
  seenBy?: { id: string; name: string; image?: string | null }[];
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
  partnerImage?: string | null;
  partnerTyping?: boolean;
  partnerOnline?: boolean;
  partnerLastSeen?: number | null;
  onFileUpload?: (file: File) => Promise<UploadResult>;
  isGroup?: boolean;
  groupMemberCount?: number;
}

function AudioPlayer({ src, isMine }: { src: string; isMine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { a.play(); }
    setPlaying(!playing);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const val = Number(e.target.value);
    a.currentTime = (val / 100) * duration;
    setProgress(val);
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => {
      setCurrent(a.currentTime);
      setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    };
    const onEnded = () => { setPlaying(false); setProgress(0); setCurrent(0); };
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
    };
  }, []);

  const trackColor = isMine ? "#059669" : "#10b981";
  const bgColor = isMine ? "#d1fae5" : "#e5e7eb";

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play / Pause button */}
      <button
        onClick={toggle}
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition shadow-sm ${
          isMine
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-emerald-500 hover:bg-emerald-600 text-white"
        }`}
      >
        {playing ? <FaPause className="text-xs" /> : <FaPlay className="text-xs ml-0.5" />}
      </button>

      {/* Waveform + scrubber */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: bgColor }}>
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-100"
            style={{ width: `${progress}%`, background: trackColor }}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={seek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="text-[10px] text-gray-400 tabular-nums">
          {playing || current > 0 ? fmt(current) : fmt(duration)}
        </span>
      </div>

      {/* Mic icon */}
      <FaMicrophone className="shrink-0 text-xs text-gray-400" />
    </div>
  );
}

function StatusIcon({ status }: { status?: string }) {
  if (!status || status === "sent")
    return <IoCheckmark className="inline-block w-4 h-4 text-gray-400" />;
  if (status === "delivered")
    return <IoCheckmarkDone className="inline-block w-4 h-4 text-gray-500" />;
  return <IoCheckmarkDone className="inline-block w-4 h-4 text-blue-500" />;
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
  partnerImage,
  partnerTyping,
  partnerOnline,
  partnerLastSeen,
  onFileUpload,
  isGroup,
  groupMemberCount,
}: ChatWindowProps) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
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

  /* ── Lightbox ──────────────────────────────────── */
  useEffect(() => {
    if (!lightboxSrc) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxSrc(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxSrc]);

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 bg-white flex items-center gap-3">
        <div className="relative shrink-0">
          {isGroup ? (
            <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
              <FaUsers className="text-base" />
            </div>
          ) : partnerImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={partnerImage}
              alt={partnerName}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
              {partnerName.charAt(0)}
            </div>
          )}
          {!isGroup && partnerOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900 leading-tight">{partnerName}</p>
          <p className={`text-xs leading-tight ${isGroup ? "text-gray-400" : partnerOnline ? "text-green-500" : "text-gray-400"}`}>
            {isGroup
              ? `${groupMemberCount ?? 0} üye`
              : partnerTyping
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
          const timeStr = new Date(msg.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
          const seenByOthers = isGroup && isMine && msg.seenBy && msg.seenBy.length > 0 ? msg.seenBy : null;
          return (
            <div key={msg._id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
              {isGroup && !isMine && msg.senderName && (
                <span className="text-[10px] text-gray-400 font-medium mb-0.5 px-1">{msg.senderName}</span>
              )}
              <div
                className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  isMine
                    ? "bg-emerald-100 text-gray-800 rounded-br-md"
                    : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
                }`}
              >
                {/* Image */}
                {msg.type === "image" && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.content}
                      alt="Fotoğraf"
                      className="rounded-lg max-w-full max-h-64 object-contain cursor-zoom-in"
                      onClick={() => setLightboxSrc(msg.content)}
                    />
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-gray-400">{timeStr}</span>
                      {isMine && <StatusIcon status={msg.status} />}
                    </div>
                  </>
                )}

                {/* Audio */}
                {msg.type === "audio" && (
                  <>
                    <AudioPlayer src={msg.content} isMine={isMine} />
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-gray-400">{timeStr}</span>
                      {isMine && <StatusIcon status={msg.status} />}
                    </div>
                  </>
                )}

                {/* Document */}
                {msg.type === "document" && (
                  <>
                    <a
                      href={msg.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:opacity-80 transition text-emerald-700"
                    >
                      <FaFileAlt className="text-lg shrink-0" />
                      <span className="text-sm underline truncate max-w-45">
                        {msg.filename || "Dosya"}
                      </span>
                    </a>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-gray-400">{timeStr}</span>
                      {isMine && <StatusIcon status={msg.status} />}
                    </div>
                  </>
                )}

                {/* Text — time inline on the same row as last line */}
                {msg.type === "text" && (
                  <div className="flex items-end gap-2">
                    <p className="whitespace-pre-wrap wrap-break-word flex-1 min-w-0">{msg.content}</p>
                    <div className="flex items-center gap-0.5 shrink-0 mb-0.5">
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{timeStr}</span>
                      {isMine && <StatusIcon status={msg.status} />}
                    </div>
                  </div>
                )}
              </div>
              {/* Seen by — WhatsApp-style, only on own group messages */}
              {seenByOthers && (
                <div className="flex items-center gap-1 mt-0.5 px-1">
                  <span className="text-[10px] text-gray-400">Görüldü</span>
                  <div className="flex items-center -space-x-1.5">
                    {seenByOthers.slice(0, 5).map((u) => (
                      <div key={u.id} className="relative group">
                        {u.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.image}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm cursor-default"
                          />
                        ) : (
                          <span className="w-7 h-7 bg-emerald-400 text-white rounded-full flex items-center justify-center text-[11px] font-bold leading-none border-2 border-white shadow-sm cursor-default">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-800 text-white text-[11px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          {u.name}
                          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                        </span>
                      </div>
                    ))}
                    {seenByOthers.length > 5 && (
                      <span className="text-[10px] text-gray-400 pl-2">+{seenByOthers.length - 5}</span>
                    )}
                  </div>
                </div>
              )}
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
      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition"
            aria-label="Kapat"
          >
            <FaTimes className="text-xl" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt="Büyük görünüm"
            className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
