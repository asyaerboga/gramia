"use client";

import { useState } from "react";

interface MannequinChartProps {
  regions: {
    neck: number;
    chest: number;
    waist: number;
    hip: number;
    arm: number;
    thigh: number;
    calf: number;
  };
}

type RegionKey = keyof MannequinChartProps["regions"];

interface RegionDot {
  key: RegionKey;
  label: string;
  svgX: number;
  svgY: number;
  side: "left" | "right";
}

export default function MannequinChart({ regions }: MannequinChartProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [view, setView] = useState<"front" | "back">("front");

  const W = 440;
  const H = 640;
  const imgW = 300;
  const dims = view === "front" ? { w: 587, h: 1137 } : { w: 596, h: 1133 };
  const scale = imgW / dims.w;
  const imgH = Math.round(dims.h * scale);
  const imgLeft = Math.round((W - imgW) / 2);
  const imgTop = Math.round((H - imgH) / 2);

  const toX = (svgX: number) => imgLeft + svgX * scale;
  const toY = (svgY: number) => imgTop + svgY * scale;

  const frontDots: RegionDot[] = [
    { key: "neck", label: "Boyun", svgX: 340, svgY: 120, side: "right" },
    { key: "arm", label: "Kol", svgX: 105, svgY: 300, side: "left" },
    { key: "chest", label: "Göğüs", svgX: 390, svgY: 270, side: "right" },
    { key: "waist", label: "Bel", svgX: 200, svgY: 450, side: "left" },
    { key: "hip", label: "Kalça", svgX: 390, svgY: 520, side: "right" },
    { key: "thigh", label: "Uyluk", svgX: 215, svgY: 700, side: "left" },
    { key: "calf", label: "Baldır", svgX: 370, svgY: 920, side: "right" },
  ];

  const backDots: RegionDot[] = [
    { key: "neck", label: "Boyun", svgX: 350, svgY: 115, side: "right" },
    { key: "arm", label: "Kol", svgX: 110, svgY: 300, side: "left" },
    { key: "chest", label: "Göğüs", svgX: 400, svgY: 260, side: "right" },
    { key: "waist", label: "Bel", svgX: 190, svgY: 440, side: "left" },
    { key: "hip", label: "Kalça", svgX: 400, svgY: 520, side: "right" },
    { key: "thigh", label: "Uyluk", svgX: 210, svgY: 700, side: "left" },
    { key: "calf", label: "Baldır", svgX: 380, svgY: 910, side: "right" },
  ];

  const regionConfig = view === "front" ? frontDots : backDots;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500">Vücut Ölçümleri</h3>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView("front")}
            className={`px-3 py-1 text-xs rounded-md transition-all ${
              view === "front"
                ? "bg-white shadow-sm text-emerald-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Ön
          </button>
          <button
            onClick={() => setView("back")}
            className={`px-3 py-1 text-xs rounded-md transition-all ${
              view === "back"
                ? "bg-white shadow-sm text-emerald-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Arka
          </button>
        </div>
      </div>

      <div className="relative mx-auto" style={{ width: W, height: H }}>
        {/* Body image */}
        <img
          src={view === "front" ? "/front.svg" : "/back.svg"}
          alt={view === "front" ? "Ön görünüm" : "Arka görünüm"}
          className="absolute select-none pointer-events-none"
          draggable={false}
          style={{
            left: imgLeft,
            top: imgTop,
            width: imgW,
            height: imgH,
          }}
        />

        {/* SVG overlay for measurement lines and dots */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {regionConfig.map((r) => {
            const dotX = toX(r.svgX);
            const dotY = toY(r.svgY);
            const lineEndX = r.side === "left" ? 95 : W - 95;
            const isHovered = hoveredRegion === r.key;

            return (
              <g key={r.key}>
                <line
                  x1={dotX}
                  y1={dotY}
                  x2={lineEndX}
                  y2={dotY}
                  stroke={isHovered ? "#10b981" : "#d1d5db"}
                  strokeWidth={isHovered ? 1.5 : 1}
                  strokeDasharray={isHovered ? "none" : "4 3"}
                />
                <circle
                  cx={dotX}
                  cy={dotY}
                  r={isHovered ? 4 : 3}
                  fill={isHovered ? "#10b981" : "#9ca3af"}
                  stroke="white"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </svg>

        {/* HTML Labels */}
        {regionConfig.map((r) => {
          const dotY = toY(r.svgY);
          const isHovered = hoveredRegion === r.key;

          return (
            <div
              key={r.key}
              className={`absolute text-xs rounded-lg px-3 py-1.5 shadow-sm transition-all duration-200 cursor-pointer ${
                isHovered
                  ? "bg-emerald-500 text-white shadow-md scale-105"
                  : "bg-white border border-gray-200 text-gray-700"
              }`}
              style={{
                left: r.side === "left" ? 0 : undefined,
                right: r.side === "right" ? 0 : undefined,
                top: dotY - 16,
                minWidth: 85,
                zIndex: 2,
              }}
              onMouseEnter={() => setHoveredRegion(r.key)}
              onMouseLeave={() => setHoveredRegion(null)}
            >
              <div className={`text-[10px] ${isHovered ? "text-emerald-100" : "text-gray-400"}`}>
                {r.label}
              </div>
              <div className="font-bold text-sm">
                {regions[r.key]} cm
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
