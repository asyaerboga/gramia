"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FaPaperPlane, FaPaperclip, FaImage, FaMicrophone, FaStop,
  FaFileAlt, FaTimes, FaPlay, FaPause, FaUsers, FaPencilAlt,
  FaUndoAlt, FaChevronDown, FaEllipsisV, FaArrowLeft, FaLink,
  FaDownload, FaSmile, FaSearch, FaPlus, FaChevronLeft,
} from "react-icons/fa";
import { IoCheckmark, IoCheckmarkDone } from "react-icons/io5";

/* ── Emoji data ─────────────────────────────────────────── */
const EMOJI_CATEGORIES = [
  { icon: "😀", label: "Yüzler", emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","😋","😛","😜","🤪","😝","🤑","🤗","🤔","😐","😑","😶","😏","😒","🙄","😬","😌","😔","😪","😴","😷","🤒","🤕","🤢","🥺","😮","😲","😳","😦","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","😤","😡","😠","🤬","😈","👿","💩","🤡"] },
  { icon: "👋", label: "El & Vücut", emojis: ["👋","🤚","🖐","✋","🖖","👌","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👍","👎","✊","👊","👏","🙌","🤲","🙏","💪","🤝","🫶","💅","🤳"] },
  { icon: "❤️", label: "Kalplar", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💕","💞","💓","💗","💖","💘","💝","💔","❣️","❤️‍🔥","💯","✅","❌","🔥","⭐","💫","✨","🌟","💥","🎉","🎊","🥳","⚡"] },
  { icon: "🐶", label: "Hayvanlar", emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🦆","🦅","🦉","🐺","🐴","🦄","🐝","🦋","🐞","🐟","🐬","🐳","🦈","🐊","🦒","🐘","🦏","🐇","🦝","🐿"] },
  { icon: "🍎", label: "Yiyecek", emojis: ["🍎","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍒","🍑","🥝","🍅","🍆","🥑","🌽","🥕","🍔","🍟","🍕","🌮","🌯","🍜","🍣","🍱","🍰","🎂","🍫","🍿","🍩","🍪","☕","🍺","🍹","🍷"] },
  { icon: "⚽", label: "Etkinlik", emojis: ["⚽","🏀","🏈","⚾","🎾","🎱","⛳","🎮","🎲","🎭","🎨","🎬","🎤","🎧","🎵","🎶","🎷","🎺","🎸","🥁","🏆","🥇","🎀","🎁","🎉","🎈"] },
  { icon: "💡", label: "Nesneler", emojis: ["📱","💻","📷","📸","📺","⏰","💡","🔦","🔑","🔧","🔬","💊","🩹","🧹","🧼","🎁","🛍","🧸","🪆","🎊","💈","📚","✏️","🖊","📌","📎","✂️","🗑","🔒","🔓"] },
];

const QUICK_REACTIONS = ["👍","❤️","😂","😮","😢","👏","🔥","✅"];

const GIF_CATEGORIES = [
  { icon: "🔥", label: "Trend",      query: "__trending__" },
  { icon: "😂", label: "Komik",      query: "funny" },
  { icon: "❤️", label: "Aşk",        query: "love" },
  { icon: "🎉", label: "Kutlama",    query: "celebrate" },
  { icon: "🤣", label: "Tepki",      query: "reaction" },
  { icon: "😠", label: "Kızgın",     query: "angry" },
  { icon: "🐾", label: "Hayvan",     query: "cute animals" },
  { icon: "👋", label: "Selamlama",  query: "hello" },
];

const STICKER_EMOJIS = [
  "😊","😂","🥰","😎","🤔","😤","🥳","😭",
  "❤️","🔥","💯","✅","🎉","🎊","⭐","💫",
  "👍","👎","👏","🙏","💪","🤝","✌️","👋",
  "🐱","🐶","🦄","🌸","🌈","🦋","🌟","🍀",
];

const CREATOR_EMOJIS = [
  "😊","😂","🥰","😎","🤔","😤","🥳","😭",
  "❤️","🔥","💯","✅","🎉","🎊","⭐","💫",
  "👍","👏","🙏","💪","🦋","🌸","🐱","🦄",
];

const STICKER_BG_COLORS = [
  { value: "transparent", label: "Şeffaf", cls: "bg-white border-2 border-dashed border-gray-300" },
  { value: "#10b981",     label: "Yeşil",  cls: "bg-emerald-500" },
  { value: "#3b82f6",     label: "Mavi",   cls: "bg-blue-500" },
  { value: "#8b5cf6",     label: "Mor",    cls: "bg-violet-500" },
  { value: "#f59e0b",     label: "Sarı",   cls: "bg-amber-400" },
  { value: "#ec4899",     label: "Pembe",  cls: "bg-pink-500" },
];

/* ── Canvas sticker helper ──────────────────────────────── */
async function createStickerBlob(emoji: string, text: string, bgColor: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const size = 320;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) { reject(new Error("canvas desteklenmiyor")); return; }

    if (bgColor !== "transparent") {
      ctx.fillStyle = bgColor;
      const r = 32;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(size - r, 0);
      ctx.quadraticCurveTo(size, 0, size, r);
      ctx.lineTo(size, size - r);
      ctx.quadraticCurveTo(size, size, size - r, size);
      ctx.lineTo(r, size);
      ctx.quadraticCurveTo(0, size, 0, size - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fill();
    }

    const hasText = text.trim().length > 0;
    const emojiSize = hasText ? 170 : 210;
    const emojiY = hasText ? size * 0.42 : size / 2;
    ctx.font = `${emojiSize}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, size / 2, emojiY);

    if (hasText) {
      ctx.font = "bold 34px Arial, sans-serif";
      ctx.fillStyle = bgColor === "transparent" ? "#1f2937" : "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text.slice(0, 16), size / 2, size * 0.84);
    }

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("blob oluşturulamadı"));
    }, "image/png", 0.92);
  });
}

/* ── Types ──────────────────────────────────────────────── */
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
  editedAt?: string | null;
  isDeleted?: boolean;
  reactions?: { emoji: string; users: string[] }[];
}

interface UploadResult {
  url: string;
  msgType: "image" | "audio" | "document";
  filename: string;
}

interface GifResult {
  id: string;
  url: string;
  preview: string;
  title: string;
}

interface ChatWindowProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string, type: "text" | "image" | "audio" | "document", filename?: string) => void;
  onTyping?: () => void;
  partnerName: string;
  partnerImage?: string | null;
  partnerTyping?: boolean;
  partnerOnline?: boolean;
  partnerLastSeen?: number | null;
  onFileUpload?: (file: File) => Promise<UploadResult>;
  isGroup?: boolean;
  groupMemberCount?: number;
  onEditMessage?: (id: string, newContent: string) => Promise<void>;
  onDeleteMessage?: (id: string) => Promise<void>;
  onReact?: (msgId: string, emoji: string) => Promise<void>;
}

/* ── Sub-components ─────────────────────────────────────── */
function AudioPlayer({ src, isMine }: { src: string; isMine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  const toggle = () => { const a = audioRef.current; if (!a) return; playing ? a.pause() : a.play(); setPlaying(!playing); };
  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current; if (!a || !duration) return;
    a.currentTime = (Number(e.target.value) / 100) * duration; setProgress(Number(e.target.value));
  };
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => { setCurrent(a.currentTime); setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0); };
    const onEnded = () => { setPlaying(false); setProgress(0); setCurrent(0); };
    a.addEventListener("loadedmetadata", onLoaded); a.addEventListener("timeupdate", onTime); a.addEventListener("ended", onEnded);
    return () => { a.removeEventListener("loadedmetadata", onLoaded); a.removeEventListener("timeupdate", onTime); a.removeEventListener("ended", onEnded); };
  }, []);
  return (
    <div className="flex items-center gap-3 min-w-50">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={toggle} className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition shadow-sm ${isMine ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}>
        {playing ? <FaPause className="text-xs" /> : <FaPlay className="text-xs ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: isMine ? "rgba(16,185,129,0.25)" : "#e5e7eb" }}>
          <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-100" style={{ width: `${progress}%`, background: isMine ? "#059669" : "#10b981" }} />
          <input type="range" min={0} max={100} value={progress} onChange={seek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </div>
        <span className={`text-[10px] tabular-nums ${isMine ? "text-emerald-600/70" : "text-gray-400"}`}>{playing || current > 0 ? fmt(current) : fmt(duration)}</span>
      </div>
      <FaMicrophone className={`shrink-0 text-xs ${isMine ? "text-emerald-500/60" : "text-gray-400"}`} />
    </div>
  );
}

function StatusIcon({ status, isMine }: { status?: string; isMine?: boolean }) {
  if (!status || status === "sent") return <IoCheckmark className={`inline-block w-4 h-4 ${isMine ? "text-emerald-400" : "text-gray-400"}`} />;
  if (status === "delivered") return <IoCheckmarkDone className={`inline-block w-4 h-4 ${isMine ? "text-emerald-500" : "text-gray-500"}`} />;
  return <IoCheckmarkDone className={`inline-block w-4 h-4 ${isMine ? "text-emerald-700" : "text-blue-500"}`} />;
}

function formatLastSeen(ts: number): string {
  const diffMin = Math.floor((Date.now() - ts) / 60_000);
  if (diffMin < 1) return "az önce aktifti";
  if (diffMin < 60) return `${diffMin} dk önce aktifti`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `son görülme: ${new Date(ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
  return `son görülme: ${new Date(ts).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}`;
}

const TEN_MINUTES = 10 * 60 * 1000;
function isWithin10Min(timestamp: string) { return Date.now() - new Date(timestamp).getTime() < TEN_MINUTES; }

/* ── Main component ─────────────────────────────────────── */
export default function ChatWindow({
  messages, currentUserId, onSendMessage, onTyping,
  partnerName, partnerImage, partnerTyping, partnerOnline, partnerLastSeen,
  onFileUpload, isGroup, groupMemberCount,
  onEditMessage, onDeleteMessage, onReact,
}: ChatWindowProps) {

  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<"media" | "links" | "docs">("media");

  /* ── Emoji picker ──────────────────────────────────────── */
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);

  /* ── GIF + Sticker panel ───────────────────────────────── */
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [gifPanelTab, setGifPanelTab] = useState<"gif" | "sticker">("gif");

  /* GIF state */
  const [gifCategory, setGifCategory] = useState(0);           // index into GIF_CATEGORIES
  const [gifSearchText, setGifSearchText] = useState("");
  const [gifSearchActive, setGifSearchActive] = useState(false);
  const [gifResults, setGifResults] = useState<GifResult[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const gifDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Sticker state */
  const [stickerView, setStickerView] = useState<"pack" | "creator">("pack");
  const [stickerEmoji, setStickerEmoji] = useState("😊");
  const [stickerText, setStickerText] = useState("");
  const [stickerBg, setStickerBg] = useState("transparent");
  const [stickerUploading, setStickerUploading] = useState(false);

  /* ── Reaction picker ───────────────────────────────────── */
  const [reactionMenu, setReactionMenu] = useState<{ x: number; y: number; msgId: string } | null>(null);

  /* ── Context menu ──────────────────────────────────────── */
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msg: ChatMessage } | null>(null);

  /* ── Inline edit ───────────────────────────────────────── */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const endRef       = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const prevMsgCountRef = useRef(messages.length);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef   = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editInputRef  = useRef<HTMLTextAreaElement>(null);
  const emojiPanelRef = useRef<HTMLDivElement>(null);
  const gifPanelRef   = useRef<HTMLDivElement>(null);
  const gifSearchRef  = useRef<HTMLInputElement>(null);

  /* ── Media panel data ──────────────────────────────────── */
  const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const mediaImages = messages.filter((m) => !m.isDeleted && m.type === "image");
  const mediaDocs   = messages.filter((m) => !m.isDeleted && m.type === "document");
  const mediaLinks  = [...new Set(messages.filter((m) => !m.isDeleted && m.type === "text").flatMap((m) => Array.from(m.content.matchAll(URL_REGEX), (x) => x[0])))];

  /* ── Scroll helpers ─────────────────────────────────────── */
  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollAreaRef.current; if (!el) return;
    if (smooth) endRef.current?.scrollIntoView({ behavior: "smooth" });
    else el.scrollTop = el.scrollHeight;
    isAtBottomRef.current = true; setShowScrollBtn(false);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current; if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    isAtBottomRef.current = atBottom; setShowScrollBtn(!atBottom);
  }, []);

  useEffect(() => { scrollToBottom(false); }, []); // eslint-disable-line

  useEffect(() => {
    const newCount = messages.length, prevCount = prevMsgCountRef.current;
    prevMsgCountRef.current = newCount;
    if (newCount > prevCount) {
      const last = messages[newCount - 1];
      if (last?.senderId === currentUserId || isAtBottomRef.current) scrollToBottom();
    }
  }, [messages, currentUserId, scrollToBottom]);

  useEffect(() => { if (partnerTyping && isAtBottomRef.current) scrollToBottom(); }, [partnerTyping, scrollToBottom]);
  useEffect(() => { if (editingId) setTimeout(() => editInputRef.current?.focus(), 0); }, [editingId]);

  /* ── Close all overlays on outside click / Esc ─────────── */
  useEffect(() => {
    const hasOverlay = contextMenu || reactionMenu || showEmojiPicker || showGifPanel;
    if (!hasOverlay) return;
    const close = (e: MouseEvent) => {
      if (emojiPanelRef.current?.contains(e.target as Node)) return;
      if (gifPanelRef.current?.contains(e.target as Node)) return;
      setContextMenu(null); setReactionMenu(null);
      setShowEmojiPicker(false); setShowGifPanel(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setContextMenu(null); setReactionMenu(null); setShowEmojiPicker(false); setShowGifPanel(false); }
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("mousedown", close); window.removeEventListener("keydown", onKey); };
  }, [contextMenu, reactionMenu, showEmojiPicker, showGifPanel]);

  useEffect(() => {
    if (!editingId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setEditingId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingId]);

  /* ── Context menu ───────────────────────────────────────── */
  const openContextMenu = useCallback((e: { clientX: number; clientY: number; preventDefault?: () => void }, msg: ChatMessage) => {
    if (msg.senderId !== currentUserId || msg.isDeleted || !isWithin10Min(msg.timestamp)) return;
    e.preventDefault?.();
    const x = Math.min(e.clientX, window.innerWidth - 168);
    const y = Math.min(e.clientY, window.innerHeight - 100);
    setContextMenu({ x, y, msg });
  }, [currentUserId]);

  const handleContextMenu = useCallback((e: React.MouseEvent, msg: ChatMessage) => openContextMenu(e, msg), [openContextMenu]);

  const handleTouchStart = useCallback((e: React.TouchEvent, msg: ChatMessage) => {
    if (msg.senderId !== currentUserId || msg.isDeleted || !isWithin10Min(msg.timestamp)) return;
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => openContextMenu({ clientX: touch.clientX, clientY: touch.clientY }, msg), 500);
  }, [currentUserId, openContextMenu]);

  const cancelLongPress = useCallback(() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }, []);

  /* ── Edit / Send ────────────────────────────────────────── */
  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editValue.trim() || !onEditMessage) return;
    await onEditMessage(editingId, editValue.trim()); setEditingId(null);
  }, [editingId, editValue, onEditMessage]);

  const handleSend = () => { if (text.trim()) { onSendMessage(text.trim(), "text"); setText(""); } };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (onTyping) { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); onTyping(); typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000); }
  };

  /* ── Emoji insert ───────────────────────────────────────── */
  const insertEmoji = (emoji: string) => setText((prev) => prev + emoji);

  /* ── GIF fetch ──────────────────────────────────────────── */
  const fetchGifs = useCallback(async (query: string) => {
    setGifLoading(true);
    try {
      const q = query || GIF_CATEGORIES[gifCategory].query;
      const res = await fetch(`/api/gif/search?q=${encodeURIComponent(q)}&limit=21`);
      if (res.ok) { const data = await res.json(); setGifResults(data.results || []); }
    } catch { /* ignore */ }
    finally { setGifLoading(false); }
  }, [gifCategory]);

  // Fetch when panel opens
  useEffect(() => {
    if (!showGifPanel || gifPanelTab !== "gif") return;
    if (!gifSearchActive) fetchGifs(GIF_CATEGORIES[gifCategory].query);
  }, [showGifPanel, gifPanelTab, gifCategory]); // eslint-disable-line

  // Debounced search
  useEffect(() => {
    if (!showGifPanel || gifPanelTab !== "gif" || !gifSearchActive) return;
    if (gifDebounceRef.current) clearTimeout(gifDebounceRef.current);
    gifDebounceRef.current = setTimeout(() => fetchGifs(gifSearchText || GIF_CATEGORIES[gifCategory].query), 450);
    return () => { if (gifDebounceRef.current) clearTimeout(gifDebounceRef.current); };
  }, [gifSearchText, showGifPanel, gifPanelTab, gifSearchActive, gifCategory, fetchGifs]);

  const handleSendGif = (url: string) => {
    onSendMessage(url, "image");
    setShowGifPanel(false);
    setGifSearchText(""); setGifSearchActive(false);
  };

  /* ── Sticker send ───────────────────────────────────────── */
  const handleSendSticker = useCallback(async (emoji: string, text: string, bg: string) => {
    setStickerUploading(true);
    try {
      const blob = await createStickerBlob(emoji, text, bg);
      const file = new File([blob], `sticker-${Date.now()}.png`, { type: "image/png" });
      if (onFileUpload) {
        const result = await onFileUpload(file);
        onSendMessage(result.url, "image");
      } else {
        const reader = new FileReader();
        reader.onload = () => onSendMessage(reader.result as string, "image");
        reader.readAsDataURL(blob);
      }
      setShowGifPanel(false);
      setStickerView("pack");
      setStickerText("");
    } catch (err) { console.error("Sticker gönderilemedi:", err); }
    finally { setStickerUploading(false); }
  }, [onFileUpload, onSendMessage]);

  /* ── File upload ────────────────────────────────────────── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !onFileUpload) return;
    e.target.value = ""; setUploading(true);
    try { const r = await onFileUpload(file); onSendMessage(r.url, r.msgType, r.filename); }
    catch { alert("Dosya yüklenemedi."); }
    finally { setUploading(false); }
  };

  /* ── Audio recording ────────────────────────────────────── */
  const startRecording = async () => {
    if (!onFileUpload) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder; audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `kayit-${Date.now()}.webm`, { type: "audio/webm" });
        setUploading(true);
        try { const r = await onFileUpload(file); onSendMessage(r.url, "audio", r.filename); }
        catch { alert("Ses yüklenemedi."); }
        finally { setUploading(false); }
      };
      recorder.start(); setIsRecording(true);
    } catch { alert("Mikrofon erişimi reddedildi."); }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

  /* ── Lightbox ───────────────────────────────────────────── */
  useEffect(() => {
    if (!lightboxSrc) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxSrc(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxSrc]);

  /* ── Sticker preview ────────────────────────────────────── */
  const stickerPreviewStyle: React.CSSProperties = {
    background: stickerBg === "transparent" ? "repeating-conic-gradient(#e5e7eb 0% 25%, #f9fafb 0% 50%) 0 0 / 16px 16px" : stickerBg,
    borderRadius: 16,
    width: 120,
    height: 120,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="relative flex flex-col h-full bg-white overflow-hidden">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="px-5 py-3.5 border-b border-emerald-100/60 bg-linear-to-r from-white via-emerald-50/30 to-white flex items-center gap-3 shrink-0">
        <div className="relative shrink-0">
          {isGroup ? (
            <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700"><FaUsers className="text-base" /></div>
          ) : partnerImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={partnerImage} alt={partnerName} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">{partnerName.charAt(0)}</div>
          )}
          {!isGroup && partnerOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />}
        </div>
        <div>
          <p className="font-semibold text-gray-900 leading-tight">{partnerName}</p>
          <p className={`text-xs leading-tight ${isGroup ? "text-gray-400" : partnerOnline ? "text-green-500" : "text-gray-400"}`}>
            {isGroup ? `${groupMemberCount ?? 0} üye` : partnerTyping ? "yazıyor..." : partnerOnline ? "çevrim içi" : partnerLastSeen ? formatLastSeen(partnerLastSeen) : ""}
          </p>
        </div>
        <button onClick={() => { setShowMediaPanel(true); setActiveMediaTab("media"); }} className="ml-auto p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition" title="Medya ve dosyalar">
          <FaEllipsisV />
        </button>
      </div>

      {/* ── Messages ─────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={scrollAreaRef} onScroll={handleScroll} className="h-full overflow-y-auto p-5 space-y-3" style={{ background: "radial-gradient(circle at 20% 50%, #ecfdf5 0%, transparent 60%), radial-gradient(circle at 80% 20%, #f0fdf4 0%, transparent 50%), #f8fafc" }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
              <div className="text-5xl animate-bounce" style={{ animationDuration: "2s" }}>👋</div>
              <div className="text-center">
                <p className="text-gray-600 font-semibold">Merhaba!</p>
                <p className="text-gray-400 text-sm mt-1">Bir mesaj göndererek sohbete başlayın.</p>
              </div>
            </div>
          )}
          {messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
            const seenByOthers = isGroup && isMine && msg.seenBy && msg.seenBy.length > 0 ? msg.seenBy : null;
            const canInteract = isMine && !msg.isDeleted && isWithin10Min(msg.timestamp) && (onEditMessage || onDeleteMessage);

            return (
              <div key={msg._id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                {isGroup && !isMine && msg.senderName && (
                  <span className="text-[10px] text-gray-400 font-medium mb-0.5 px-1">{msg.senderName}</span>
                )}

                <div className="group relative max-w-[72%]">
                  <div
                    onContextMenu={canInteract ? (e) => handleContextMenu(e, msg) : undefined}
                    onTouchStart={canInteract ? (e) => handleTouchStart(e, msg) : undefined}
                    onTouchEnd={cancelLongPress} onTouchMove={cancelLongPress}
                    className={`px-4 py-2.5 rounded-2xl text-sm ${isMine ? "bg-linear-to-br from-emerald-100 to-teal-100 text-emerald-950 rounded-br-md shadow-sm shadow-emerald-100/80 border border-emerald-200/50" : "bg-white text-gray-800 rounded-bl-md border border-gray-100 shadow-sm"} ${canInteract ? "cursor-context-menu select-none" : ""}`}
                  >
                    {msg.isDeleted ? (
                      <div className="flex items-end gap-2">
                        <p className={`text-xs italic flex-1 ${isMine ? "text-emerald-600/70" : "text-gray-400"}`}>Bu mesaj geri alındı</p>
                        <span className={`text-[10px] whitespace-nowrap shrink-0 mb-0.5 ${isMine ? "text-emerald-500/50" : "text-gray-300"}`}>{timeStr}</span>
                      </div>
                    ) : (
                      <>
                        {msg.type === "image" && (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={msg.content} alt="Fotoğraf" className="rounded-lg max-w-full max-h-64 object-contain cursor-zoom-in" onClick={() => setLightboxSrc(msg.content)} />
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className={`text-[10px] ${isMine ? "text-emerald-600/60" : "text-gray-400"}`}>{timeStr}</span>
                              {isMine && <StatusIcon status={msg.status} isMine={isMine} />}
                            </div>
                          </>
                        )}
                        {msg.type === "audio" && (
                          <>
                            <AudioPlayer src={msg.content} isMine={isMine} />
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className={`text-[10px] ${isMine ? "text-emerald-600/60" : "text-gray-400"}`}>{timeStr}</span>
                              {isMine && <StatusIcon status={msg.status} isMine={isMine} />}
                            </div>
                          </>
                        )}
                        {msg.type === "document" && (
                          <>
                            <a href={msg.content} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 hover:opacity-80 transition ${isMine ? "text-emerald-800" : "text-emerald-700"}`}>
                              <FaFileAlt className="text-lg shrink-0" />
                              <span className="text-sm underline truncate max-w-45">{msg.filename || "Dosya"}</span>
                            </a>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className={`text-[10px] ${isMine ? "text-emerald-600/60" : "text-gray-400"}`}>{timeStr}</span>
                              {isMine && <StatusIcon status={msg.status} isMine={isMine} />}
                            </div>
                          </>
                        )}
                        {msg.type === "text" && (
                          editingId === msg._id ? (
                            <div onClick={(e) => e.stopPropagation()}>
                              <textarea ref={editInputRef} value={editValue} onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } }}
                                rows={2} className="w-full text-sm bg-white/70 border border-emerald-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-300 resize-none text-gray-800" />
                              <div className="flex items-center gap-3 mt-1.5 justify-end">
                                <button onClick={() => setEditingId(null)} className={`text-[11px] ${isMine ? "text-emerald-600/60 hover:text-emerald-700" : "text-gray-400 hover:text-gray-600"}`}>İptal</button>
                                <button onClick={handleSaveEdit} disabled={!editValue.trim()} className={`text-[11px] font-medium ${isMine ? "text-emerald-700 hover:text-emerald-800" : "text-emerald-600 hover:text-emerald-700"} disabled:opacity-40`}>Kaydet</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-end gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                                {msg.editedAt && <span className={`text-[10px] italic ${isMine ? "text-emerald-600/50" : "text-gray-400"}`}>düzenlendi</span>}
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0 mb-0.5">
                                <span className={`text-[10px] whitespace-nowrap ${isMine ? "text-emerald-600/60" : "text-gray-400"}`}>{timeStr}</span>
                                {isMine && <StatusIcon status={msg.status} isMine={isMine} />}
                              </div>
                            </div>
                          )
                        )}
                      </>
                    )}
                  </div>

                  {/* Reaction button on hover */}
                  {!msg.isDeleted && onReact && (
                    <button
                      className={`absolute bottom-0 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm leading-none z-10 bg-white rounded-full border border-gray-100 shadow-sm p-0.5 ${isMine ? "right-2" : "left-2"}`}
                      onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setReactionMenu({ x: r.left, y: r.top, msgId: msg._id }); }}
                      title="Tepki ekle"
                    >
                      😊
                    </button>
                  )}
                </div>

                {/* Reactions display */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1 px-1 ${isMine ? "justify-end" : "justify-start"}`}>
                    {msg.reactions.map((r) => (
                      <button key={r.emoji} onClick={() => onReact?.(msg._id, r.emoji)}
                        className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition ${r.users.includes(currentUserId) ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50"}`}
                      >
                        <span>{r.emoji}</span>
                        <span className="font-medium">{r.users.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Seen by (group) */}
                {seenByOthers && (
                  <div className="flex items-center gap-1 mt-0.5 px-1">
                    <span className="text-[10px] text-gray-400">Görüldü</span>
                    <div className="flex items-center -space-x-1.5">
                      {seenByOthers.slice(0, 5).map((u) => (
                        <div key={u.id} className="relative group/seen">
                          {u.image
                            ? <img src={u.image} alt={u.name} className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm cursor-default" /> // eslint-disable-line @next/next/no-img-element
                            : <span className="w-7 h-7 bg-emerald-400 text-white rounded-full flex items-center justify-center text-[11px] font-bold leading-none border-2 border-white shadow-sm cursor-default">{u.name.charAt(0).toUpperCase()}</span>
                          }
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-800 text-white text-[11px] rounded-md whitespace-nowrap opacity-0 group-hover/seen:opacity-100 transition-opacity pointer-events-none z-10">
                            {u.name}
                          </span>
                        </div>
                      ))}
                      {seenByOthers.length > 5 && <span className="text-[10px] text-gray-400 pl-2">+{seenByOthers.length - 5}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {partnerTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 px-4 py-3.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                {[0,160,320].map((d) => (
                  <span key={d} className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ animationDelay: `${d}ms`, background: `hsl(${152 + d / 16}, 68%, 52%)` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {showScrollBtn && (
          <button onClick={() => scrollToBottom()} className="absolute bottom-4 right-4 z-10 w-9 h-9 bg-white border border-gray-200 shadow-md rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-emerald-600 transition" aria-label="En alta in">
            <FaChevronDown className="text-sm" />
          </button>
        )}
      </div>

      {/* ── Input area wrapper ─────────────────────────────── */}
      <div className="relative shrink-0">

        {/* ── Emoji Picker Panel ─────────────────────────── */}
        {showEmojiPicker && (
          <div ref={emojiPanelRef} className="absolute bottom-full left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-0.5 px-3 pt-2 border-b border-gray-100">
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button key={i} onClick={() => setEmojiCategory(i)} title={cat.label}
                  className={`text-lg px-2 py-1 rounded-lg transition ${emojiCategory === i ? "bg-emerald-100" : "hover:bg-gray-100"}`}
                >{cat.icon}</button>
              ))}
            </div>
            <div className="h-44 overflow-y-auto p-2">
              <div className="grid grid-cols-9 gap-0.5">
                {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji) => (
                  <button key={emoji} onClick={() => insertEmoji(emoji)}
                    className="text-xl p-1.5 rounded-lg hover:bg-emerald-50 transition hover:scale-110"
                  >{emoji}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GIF + Sticker Panel ────────────────────────── */}
        {showGifPanel && (
          <div ref={gifPanelRef} className="absolute bottom-full left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl flex flex-col" style={{ height: 380 }} onMouseDown={(e) => e.stopPropagation()}>

            {/* Panel header with tabs */}
            <div className="flex items-center border-b border-gray-100 shrink-0">
              <button
                onClick={() => setGifPanelTab("gif")}
                className={`flex-1 py-2.5 text-sm font-semibold transition border-b-2 ${gifPanelTab === "gif" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >GIF</button>
              <button
                onClick={() => { setGifPanelTab("sticker"); setStickerView("pack"); }}
                className={`flex-1 py-2.5 text-sm font-semibold transition border-b-2 ${gifPanelTab === "sticker" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >Sticker</button>
            </div>

            {/* ── GIF Tab ─────────────────────────────────── */}
            {gifPanelTab === "gif" && (
              <>
                {/* Search bar */}
                <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2 shrink-0">
                  <FaSearch className="text-gray-400 text-xs shrink-0" />
                  <input ref={gifSearchRef} type="text" value={gifSearchText}
                    onChange={(e) => { setGifSearchText(e.target.value); setGifSearchActive(true); }}
                    onFocus={() => setGifSearchActive(true)}
                    placeholder="GIF ara..."
                    className="flex-1 text-sm focus:outline-none text-gray-900 bg-transparent"
                  />
                  {gifSearchActive && (
                    <button onClick={() => { setGifSearchText(""); setGifSearchActive(false); }} className="text-gray-400 hover:text-gray-600"><FaTimes className="text-xs" /></button>
                  )}
                </div>

                {/* Category pills (only when not searching) */}
                {!gifSearchActive && (
                  <div className="flex gap-1.5 px-3 py-2 overflow-x-auto shrink-0 border-b border-gray-50">
                    {GIF_CATEGORIES.map((cat, i) => (
                      <button key={i} onClick={() => setGifCategory(i)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition shrink-0 ${gifCategory === i ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* GIF grid */}
                <div className="flex-1 overflow-y-auto p-2">
                  {gifLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : gifResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                      <span className="text-3xl">🎬</span>
                      <p className="text-sm">GIF bulunamadı</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {gifResults.map((gif) => (
                        <button key={gif.id} onClick={() => handleSendGif(gif.url)}
                          className="aspect-video overflow-hidden rounded-xl bg-gray-100 hover:opacity-90 transition hover:ring-2 hover:ring-emerald-400 hover:scale-[1.02]"
                          title={gif.title}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={gif.preview} alt={gif.title} className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-gray-300 text-right px-3 pb-1.5 shrink-0">Powered by Tenor</p>
              </>
            )}

            {/* ── Sticker Tab ─────────────────────────────── */}
            {gifPanelTab === "sticker" && (
              <>
                {stickerView === "pack" && (
                  <>
                    {/* Create sticker button */}
                    <button
                      onClick={() => setStickerView("creator")}
                      className="mx-3 mt-2.5 mb-2 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition text-emerald-700 font-medium text-sm shrink-0"
                    >
                      <FaPlus className="text-xs" />
                      Sticker Oluştur
                    </button>

                    {/* Pre-made emoji sticker grid */}
                    <p className="px-3 text-[10px] text-gray-400 font-medium mb-1.5 shrink-0">EMOJİ STİCKER PAKETİ</p>
                    <div className="flex-1 overflow-y-auto px-3 pb-3">
                      <div className="grid grid-cols-8 gap-2">
                        {STICKER_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleSendSticker(emoji, "", "transparent")}
                            disabled={stickerUploading}
                            className="aspect-square rounded-xl hover:bg-emerald-50 hover:scale-110 transition flex items-center justify-center text-3xl disabled:opacity-40"
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {stickerView === "creator" && (
                  <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Creator header */}
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 shrink-0">
                      <button onClick={() => setStickerView("pack")} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><FaChevronLeft className="text-xs" /></button>
                      <span className="text-sm font-semibold text-gray-800">Sticker Oluştur</span>
                    </div>

                    <div className="flex gap-4 flex-1 overflow-hidden p-3">
                      {/* Preview */}
                      <div className="shrink-0 flex flex-col items-center gap-2">
                        <div style={stickerPreviewStyle}>
                          <span style={{ fontSize: stickerText ? 54 : 72, lineHeight: 1 }}>{stickerEmoji}</span>
                          {stickerText && <span style={{ fontSize: 12, fontWeight: 700, color: stickerBg === "transparent" ? "#1f2937" : "#fff", textAlign: "center", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stickerText}</span>}
                        </div>
                        <button
                          onClick={() => handleSendSticker(stickerEmoji, stickerText, stickerBg)}
                          disabled={stickerUploading}
                          className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                          {stickerUploading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaPaperPlane className="text-xs" />}
                          Gönder
                        </button>
                      </div>

                      {/* Controls */}
                      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                        {/* Emoji picker */}
                        <div>
                          <p className="text-[10px] font-medium text-gray-500 mb-1.5">EMOJİ</p>
                          <div className="grid grid-cols-8 gap-1">
                            {CREATOR_EMOJIS.map((em) => (
                              <button key={em} onClick={() => setStickerEmoji(em)}
                                className={`aspect-square rounded-lg text-xl flex items-center justify-center transition ${stickerEmoji === em ? "bg-emerald-100 ring-2 ring-emerald-400" : "hover:bg-gray-100"}`}
                              >{em}</button>
                            ))}
                          </div>
                        </div>

                        {/* Text */}
                        <div>
                          <p className="text-[10px] font-medium text-gray-500 mb-1.5">METİN (isteğe bağlı)</p>
                          <input
                            type="text"
                            value={stickerText}
                            onChange={(e) => setStickerText(e.target.value.slice(0, 16))}
                            placeholder="Metin ekle..."
                            maxLength={16}
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800"
                          />
                        </div>

                        {/* Background color */}
                        <div>
                          <p className="text-[10px] font-medium text-gray-500 mb-1.5">ARKA PLAN</p>
                          <div className="flex gap-2 flex-wrap">
                            {STICKER_BG_COLORS.map((c) => (
                              <button key={c.value} onClick={() => setStickerBg(c.value)} title={c.label}
                                className={`w-8 h-8 rounded-full ${c.cls} transition ${stickerBg === c.value ? "ring-2 ring-offset-2 ring-emerald-500 scale-110" : "hover:scale-105"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Input row ──────────────────────────────────── */}
        <div className="px-3 py-2.5 border-t border-gray-100 bg-white">
          {uploading && <p className="text-xs text-emerald-600 text-center mb-1.5 animate-pulse">Dosya yükleniyor...</p>}

          <div className="flex items-center gap-2">
            {onFileUpload && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploading || isRecording} title="Fotoğraf gönder"
                  className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition disabled:opacity-40"
                ><FaImage className="text-base" /></button>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                <button type="button" onClick={() => docInputRef.current?.click()} disabled={uploading || isRecording} title="Dosya gönder"
                  className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition disabled:opacity-40"
                ><FaPaperclip className="text-base" /></button>
                <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,application/*,text/plain" className="hidden" onChange={handleFileChange} />

                {/* GIF/Sticker button */}
                <button type="button" disabled={uploading || isRecording} title="GIF ve Sticker"
                  onClick={() => { setShowGifPanel((p) => !p); setShowEmojiPicker(false); }}
                  className={`px-2 py-1 text-xs font-bold rounded-full transition disabled:opacity-40 ${showGifPanel ? "bg-emerald-500 text-white" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
                >GIF</button>

                <button type="button" onPointerDown={startRecording} onPointerUp={stopRecording} onPointerLeave={stopRecording} disabled={uploading} title={isRecording ? "Bırak — gönder" : "Bas-konuş"}
                  className={`p-2 rounded-full transition ${isRecording ? "bg-red-500 text-white animate-pulse" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"} disabled:opacity-40`}
                >{isRecording ? <FaStop className="text-base" /> : <FaMicrophone className="text-base" />}</button>
              </div>
            )}

            <input type="text" value={text} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Mesaj yaz..."
              disabled={isRecording || uploading}
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 disabled:opacity-50"
            />

            {/* Emoji button */}
            <button type="button" onClick={() => { setShowEmojiPicker((p) => !p); setShowGifPanel(false); }} disabled={isRecording || uploading} title="Emoji ekle"
              className={`p-2 rounded-full transition disabled:opacity-40 ${showEmojiPicker ? "bg-emerald-100 text-emerald-600" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
            ><FaSmile className="text-base" /></button>

            <button onClick={handleSend} disabled={!text.trim() || isRecording || uploading}
              className="p-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            ><FaPaperPlane className="text-sm" /></button>
          </div>
        </div>
      </div>

      {/* ── Reaction quick-pick (fixed) ───────────────────── */}
      {reactionMenu && (
        <div
          className="fixed z-50 bg-white rounded-2xl shadow-xl border border-gray-100 px-3 py-2 flex gap-1.5"
          style={{ left: Math.max(8, Math.min(reactionMenu.x - 16, window.innerWidth - 256)), top: Math.max(8, reactionMenu.y - 60) }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button key={emoji} className="text-2xl hover:scale-125 transition-transform leading-none"
              onClick={() => { onReact?.(reactionMenu.msgId, emoji); setReactionMenu(null); }}
            >{emoji}</button>
          ))}
        </div>
      )}

      {/* ── Context menu (fixed) ─────────────────────────── */}
      {contextMenu && (
        <div className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 min-w-37.5 overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.msg.type === "text" && onEditMessage && (
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
              onClick={() => { setEditingId(contextMenu.msg._id); setEditValue(contextMenu.msg.content); setContextMenu(null); }}
            ><FaPencilAlt className="text-gray-400 text-xs shrink-0" />Düzenle</button>
          )}
          {onDeleteMessage && (
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
              onClick={async () => { const id = contextMenu.msg._id; setContextMenu(null); await onDeleteMessage(id); }}
            ><FaUndoAlt className="text-red-400 text-xs shrink-0" />Geri Al</button>
          )}
        </div>
      )}

      {/* ── Media Panel ───────────────────────────────────── */}
      {showMediaPanel && (
        <div className="absolute inset-0 z-20 flex flex-col bg-white">
          <div className="px-4 py-3.5 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0">
            <button onClick={() => setShowMediaPanel(false)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"><FaArrowLeft className="text-sm" /></button>
            <h2 className="font-semibold text-gray-900">Medya ve Dosyalar</h2>
          </div>
          <div className="flex border-b border-gray-100 shrink-0">
            {(["media","links","docs"] as const).map((tab) => {
              const labels = { media: `Medya (${mediaImages.length})`, links: `Bağlantılar (${mediaLinks.length})`, docs: `Belgeler (${mediaDocs.length})` };
              return (
                <button key={tab} onClick={() => setActiveMediaTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium transition border-b-2 ${activeMediaTab === tab ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >{labels[tab]}</button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeMediaTab === "media" && (mediaImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400"><FaImage className="text-3xl" /><p className="text-sm">Henüz paylaşılan medya yok</p></div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 p-0.5">
                {mediaImages.map((msg) => (
                  <div key={msg._id} className="aspect-square cursor-pointer overflow-hidden bg-gray-100" onClick={() => { setShowMediaPanel(false); setLightboxSrc(msg.content); }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={msg.content} alt="" className="w-full h-full object-cover hover:opacity-90 transition" />
                  </div>
                ))}
              </div>
            ))}
            {activeMediaTab === "links" && (mediaLinks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400"><FaLink className="text-3xl" /><p className="text-sm">Henüz paylaşılan bağlantı yok</p></div>
            ) : (
              <div className="divide-y divide-gray-100">
                {mediaLinks.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0"><FaLink className="text-emerald-500 text-sm" /></div>
                    <span className="text-sm text-blue-600 underline truncate">{url}</span>
                  </a>
                ))}
              </div>
            ))}
            {activeMediaTab === "docs" && (mediaDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400"><FaFileAlt className="text-3xl" /><p className="text-sm">Henüz paylaşılan belge yok</p></div>
            ) : (
              <div className="divide-y divide-gray-100">
                {mediaDocs.map((msg) => (
                  <a key={msg._id} href={msg.content} target="_blank" rel="noopener noreferrer" download={msg.filename} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0"><FaFileAlt className="text-emerald-500 text-lg" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{msg.filename || "Dosya"}</p>
                      <p className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                    <FaDownload className="text-gray-400 shrink-0" />
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────── */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setLightboxSrc(null)}>
          <button onClick={() => setLightboxSrc(null)} className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition"><FaTimes className="text-xl" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxSrc} alt="Büyük görünüm" className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
