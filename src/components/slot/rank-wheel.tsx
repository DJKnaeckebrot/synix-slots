"use client";

import { animate, motion, useMotionValue } from "framer-motion";
import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { GAME_CONFIG } from "@/lib/game/config";
import type { WheelKind, WheelSegment } from "@/lib/game/types";
import { targetRotationDegrees } from "@/lib/game/wheel-math";

type Props = {
  kind: WheelKind;
  segmentId: string;
  turbo?: boolean;
  onComplete?: () => void;
};

function segmentsForKind(kind: WheelKind): WheelSegment[] {
  if (kind === "elite") return [...GAME_CONFIG.eliteWheel.segments];
  if (kind === "rank_up") return [...GAME_CONFIG.rankUpWheel.segments];
  return [...GAME_CONFIG.normalWheel.segments];
}

function sliceColor(
  segment: WheelSegment,
  index: number,
  isElite: boolean,
): string {
  if (segment.kind === "multiply") {
    return isElite ? "#a21caf" : "#6d28d9";
  }
  if (segment.kind === "add") {
    return isElite
      ? index % 2 === 0
        ? "#c026d3"
        : "#7e22ce"
      : index % 2 === 0
        ? "#0891b2"
        : "#1d4ed8";
  }
  if (segment.kind === "feature" || segment.kind === "rank_up") {
    return isElite ? "#db2777" : "#0369a1";
  }
  return isElite ? "#581c87" : "#0f172a";
}

/** Build SVG pie path for a slice from startAngle to endAngle (degrees, 0 = top). */
function slicePath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function RankWheel({
  kind,
  segmentId,
  turbo = false,
  onComplete,
}: Props) {
  const uid = useId();
  const segments = useMemo(() => segmentsForKind(kind), [kind]);
  const slice = 360 / segments.length;
  const targetIndex = Math.max(
    0,
    segments.findIndex((s) => s.id === segmentId),
  );
  const rotation = useMotionValue(0);
  const [landed, setLanded] = useState(false);
  const label = segments[targetIndex]?.label ?? "";
  const isElite = kind === "elite";
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let settled = false;
    setLanded(false);
    rotation.set(0);
    const target = targetRotationDegrees(
      targetIndex,
      segments.length,
      turbo ? 3 : 5,
    );
    const controls = animate(rotation, target, {
      duration: turbo ? 1.1 : 2.6,
      ease: [0.12, 0.7, 0.1, 1],
      onComplete: () => {
        if (settled) return;
        settled = true;
        setLanded(true);
        onCompleteRef.current?.();
      },
    });
    return () => {
      controls.stop();
    };
    // Re-spin only when outcome/turbo changes — not when parent re-renders.
  }, [turbo, targetIndex, segments.length, rotation]);

  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;

  return (
    <div className="relative flex flex-col items-center gap-3">
      <div className="relative h-[min(82vw,360px)] w-[min(82vw,360px)] sm:h-[min(70vw,380px)] sm:w-[min(70vw,380px)]">
        {/* Pointer at top */}
        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
          <div
            className={[
              "h-0 w-0 border-l-[13px] border-r-[13px] border-t-[24px] border-l-transparent border-r-transparent drop-shadow",
              isElite ? "border-t-fuchsia-300" : "border-t-cyan-300",
            ].join(" ")}
          />
        </div>

        <motion.div
          style={{ rotate: rotation }}
          className={[
            "h-full w-full rounded-full p-[3px]",
            isElite
              ? "bg-gradient-to-br from-fuchsia-400 to-violet-700 shadow-[0_0_36px_rgba(217,70,239,0.4)]"
              : "bg-gradient-to-br from-cyan-300 to-blue-700 shadow-[0_0_36px_rgba(34,211,238,0.4)]",
          ].join(" ")}
        >
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="h-full w-full rounded-full bg-[#070b14]"
            role="img"
            aria-label={`${kind} rank wheel`}
          >
            <defs>
              <clipPath id={`${uid}-clip`}>
                <circle cx={cx} cy={cy} r={r} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${uid}-clip)`}>
              {segments.map((segment, i) => {
                const start = i * slice;
                const end = start + slice;
                const mid = start + slice / 2;
                const labelR = r * 0.68;
                const toRad = ((mid - 90) * Math.PI) / 180;
                const lx = cx + labelR * Math.cos(toRad);
                const ly = cy + labelR * Math.sin(toRad);

                return (
                  <g key={segment.id}>
                    <path
                      d={slicePath(cx, cy, r, start, end)}
                      fill={sliceColor(segment, i, isElite)}
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth={1}
                    />
                    <text
                      x={lx}
                      y={ly}
                      fill="white"
                      fontSize={segment.label.length > 6 ? 12 : 14}
                      fontWeight={700}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${mid}, ${lx}, ${ly})`}
                      style={{ pointerEvents: "none" }}
                    >
                      {segment.label}
                    </text>
                  </g>
                );
              })}
            </g>
            <circle
              cx={cx}
              cy={cy}
              r={52}
              fill={isElite ? "#2e1065" : "#0b1220"}
              stroke={isElite ? "#e879f9" : "#67e8f9"}
              strokeWidth={3}
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-[26%] w-[26%]">
              <Image
                src="/ranks/ball.png"
                alt=""
                fill
                sizes="80px"
                className={[
                  "object-contain",
                  isElite ? "hue-rotate-[280deg] saturate-150" : "",
                ].join(" ")}
                draggable={false}
              />
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        key={landed ? label : "spinning"}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={[
          "rounded-lg border px-5 py-2.5 font-mono text-2xl font-bold tracking-wide",
          isElite
            ? "border-fuchsia-400/40 text-fuchsia-100"
            : "border-cyan-400/40 text-cyan-100",
        ].join(" ")}
      >
        {landed ? label : "…"}
      </motion.div>
    </div>
  );
}
