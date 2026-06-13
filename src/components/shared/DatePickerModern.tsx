"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MONTHS = [
  "Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
  "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık",
];
const DAYS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

function pad(n: number) { return String(n).padStart(2, "0"); }

function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseISO(s: string): [number, number, number] | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return [y, m - 1, d];
}

function formatDisplay(s: string): string {
  const p = parseISO(s);
  if (!p) return "";
  const [y, m, d] = p;
  return `${pad(d)} ${MONTHS[m]} ${y}`;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  className?: string;
}

export default function DatePickerModern({ value, onChange, min, max, className = "" }: Props) {
  const today = new Date();
  const parsed = parseISO(value);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [viewYear, setViewYear] = useState(parsed?.[0] ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.[1] ?? today.getMonth());
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const panelW = 292;
    const left = Math.min(r.left, window.innerWidth - panelW - 12);
    setPos({ top: r.bottom + 6, left });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  // Sync calendar view when value changes externally
  useEffect(() => {
    const p = parseISO(value);
    if (p) { setViewYear(p[0]); setViewMonth(p[1]); }
  }, [value]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const rawFirstDay = new Date(viewYear, viewMonth, 1).getDay();
  const firstDay = rawFirstDay === 0 ? 6 : rawFirstDay - 1; // Monday = 0

  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isDisabled = (day: number) => {
    const str = toISO(viewYear, viewMonth, day);
    return !!(min && str < min) || !!(max && str > max);
  };

  const isSelected = (day: number) => toISO(viewYear, viewMonth, day) === value;

  const isToday = (day: number) =>
    viewYear === today.getFullYear() &&
    viewMonth === today.getMonth() &&
    day === today.getDate();

  const handleDay = (day: number) => {
    if (isDisabled(day)) return;
    onChange(toISO(viewYear, viewMonth, day));
    setOpen(false);
  };

  const todayStr = toISO(today.getFullYear(), today.getMonth(), today.getDate());
  const todayDisabled = !!(min && todayStr < min) || !!(max && todayStr > max);

  const handleTodayClick = () => {
    if (!todayDisabled) {
      onChange(todayStr);
      setOpen(false);
    } else {
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseDown={(e) => { e.stopPropagation(); open ? setOpen(false) : handleOpen(); }}
        className={`dropdown-trigger inline-flex items-center gap-2.5 px-3.5 py-2 ${open ? "open" : ""} ${className}`}
      >
        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
        </svg>
        <span className={`flex-1 text-left ${value ? "text-gray-800" : "text-gray-400"}`}>
          {value ? formatDisplay(value) : "Tarih seçin"}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-emerald-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            style={{ position: "fixed", top: pos.top, left: pos.left, width: 292, zIndex: 9999 }}
            className="dropdown-panel p-4"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Month / year header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-gray-800">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day name headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const disabled = isDisabled(day);
                const sel = isSelected(day);
                const tod = isToday(day);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDay(day)}
                    className={`
                      w-9 h-9 mx-auto flex items-center justify-center text-sm rounded-full transition-all duration-150
                      ${sel
                        ? "bg-emerald-500 text-white font-semibold shadow-sm"
                        : disabled
                        ? "text-gray-300 cursor-not-allowed"
                        : tod
                        ? "ring-2 ring-emerald-400 text-emerald-700 font-semibold hover:bg-emerald-50"
                        : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTodayClick}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  todayDisabled
                    ? "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {todayDisabled ? "Bugüne git" : "Bugün"}
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange(""); setOpen(false); }}
                  className="text-xs text-gray-400 hover:text-red-500 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>,
          document.body
        )
      }
    </>
  );
}
