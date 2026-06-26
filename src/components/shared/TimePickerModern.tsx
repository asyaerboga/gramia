"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const ACCENTS = {
  indigo: { bg: "bg-indigo-500/30", text: "text-indigo-300", ring: "ring-indigo-400" },
  amber: { bg: "bg-amber-500/25", text: "text-amber-300", ring: "ring-amber-400" },
} as const;

interface Props {
  value: string;
  onChange: (value: string) => void;
  accent?: keyof typeof ACCENTS;
}

export default function TimePickerModern({ value, onChange, accent = "indigo" }: Props) {
  const [hh, mm] = (value || "00:00").split(":");
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  const a = ACCENTS[accent];

  const handleOpen = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const panelW = 220;
    const left = Math.min(r.left, window.innerWidth - panelW - 12);
    setPos({ top: r.bottom + 6, left });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    // scrollIntoView (below) fires its own scroll events on the panel's lists —
    // only treat scroll/clicks outside the trigger+panel as a request to close.
    const isInside = (target: EventTarget | null) =>
      target instanceof Node &&
      ((panelRef.current?.contains(target) ?? false) || (triggerRef.current?.contains(target) ?? false));
    const handleOutside = (e: Event) => { if (!isInside(e.target)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", handleOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", handleOutside, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const scrollToSelected = (container: HTMLDivElement | null, selected: string) => {
      const el = container?.querySelector<HTMLButtonElement>(`[data-value="${selected}"]`);
      el?.scrollIntoView({ block: "center" });
    };
    scrollToSelected(hourListRef.current, hh);
    scrollToSelected(minuteListRef.current, mm);
  }, [open, hh, mm]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseDown={(e) => { e.stopPropagation(); if (open) setOpen(false); else handleOpen(); }}
        className="text-white text-3xl font-bold w-full text-left focus:outline-none hover:opacity-80 transition-opacity"
      >
        {hh}:{mm}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: 220,
              zIndex: 9999,
              background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 55%,#4c1d95 100%)",
            }}
            className="rounded-2xl border border-white/10 shadow-2xl p-3"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-center text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Saat</div>
                <div ref={hourListRef} className="h-44 overflow-y-auto rounded-xl bg-white/5 py-1 scrollbar-dark">
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      data-value={h}
                      onClick={() => onChange(`${h}:${mm}`)}
                      className={`w-full text-center py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                        h === hh ? `${a.bg} ${a.text} ring-1 ${a.ring}` : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-center text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Dakika</div>
                <div ref={minuteListRef} className="h-44 overflow-y-auto rounded-xl bg-white/5 py-1 scrollbar-dark">
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      data-value={m}
                      onClick={() => onChange(`${hh}:${m}`)}
                      className={`w-full text-center py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                        m === mm ? `${a.bg} ${a.text} ring-1 ${a.ring}` : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`mt-2.5 w-full text-center text-xs font-bold py-1.5 rounded-lg ${a.bg} ${a.text} hover:opacity-80 transition-opacity`}
            >
              Tamam
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
