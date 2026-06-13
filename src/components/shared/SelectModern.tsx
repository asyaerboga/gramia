"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function SelectModern({
  value,
  onChange,
  options,
  groups,
  placeholder = "Seçiniz",
  icon,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const allOpts = options ?? groups?.flatMap((g) => g.options) ?? [];
  const selected = allOpts.find((o) => o.value === value);

  const handleOpen = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const panelW = Math.max(r.width, 180);
    const left = Math.min(r.left, window.innerWidth - panelW - 12);
    setPos({ top: r.bottom + 6, left, width: panelW });
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

  const pick = (v: string) => { onChange(v); setOpen(false); };

  const renderOpts = (opts: SelectOption[]) =>
    opts.map((o) => (
      <button
        key={o.value}
        type="button"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); pick(o.value); }}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm rounded-xl transition-colors ${
          o.value === value
            ? "bg-emerald-50 text-emerald-700 font-semibold"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <span className={`w-4 shrink-0 flex items-center justify-center ${o.value === value ? "text-emerald-500" : ""}`}>
          {o.value === value && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        {o.label}
      </button>
    ));

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseDown={(e) => { e.stopPropagation(); if (open) { setOpen(false); } else { handleOpen(); } }}
        className={`dropdown-trigger inline-flex items-center gap-2 px-3.5 py-2 ${open ? "open" : ""} ${className}`}
      >
        {icon && <span className="text-emerald-400 shrink-0">{icon}</span>}
        <span className={`flex-1 text-left truncate ${selected && selected.value !== "" ? "text-gray-800" : "text-gray-400"}`}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-emerald-500 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            style={{ position: "fixed", top: pos.top, left: pos.left, minWidth: pos.width, zIndex: 9999 }}
            className="dropdown-panel py-1.5 max-h-64 overflow-y-auto"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {groups
              ? groups.map((g, i) => (
                  <div key={g.label}>
                    {i > 0 && <div className="h-px bg-gray-100 my-1 mx-3" />}
                    <div className="px-4 pt-2.5 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {g.label}
                    </div>
                    <div className="px-1.5">{renderOpts(g.options)}</div>
                  </div>
                ))
              : <div className="px-1.5">{renderOpts(options ?? [])}</div>
            }
          </div>,
          document.body
        )
      }
    </>
  );
}
