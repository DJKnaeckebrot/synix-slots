"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import { GAME_CONFIG } from "@/lib/game/config";
import type { BigWinTierId } from "@/lib/game/types";

export type WinDialogPayload = {
  payout: number;
  baseWin?: number;
  multiplier?: number;
  tier?: BigWinTierId;
  maxWin?: boolean;
};

type Props = WinDialogPayload & {
  onDone: () => void;
};

function BurstRays({ intense }: { intense: boolean }) {
  const rays = intense
    ? [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
    : [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {rays.map((deg, i) => (
        <motion.div
          key={deg}
          className="absolute h-[140%] w-[2px] origin-bottom bg-gradient-to-t from-transparent via-cyan-300/35 to-transparent"
          style={{ rotate: deg }}
          initial={{ opacity: 0, scaleY: 0.4 }}
          animate={{ opacity: [0, 0.85, 0.25], scaleY: [0.4, 1.05, 0.9] }}
          transition={{ duration: 0.7, delay: i * 0.02 }}
        />
      ))}
    </div>
  );
}

function CountUp({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) =>
    Math.round(v).toLocaleString("en-US"),
  );

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: Math.min(1.4, 0.45 + value / 8000),
      ease: [0.16, 0.84, 0.24, 1],
    });
    return () => controls.stop();
  }, [mv, value]);

  return <motion.span className={className}>{display}</motion.span>;
}

export function WinDialog({
  payout,
  baseWin,
  multiplier,
  tier,
  maxWin,
  onDone,
}: Props) {
  const intense = Boolean(maxWin || tier);
  const label = maxWin
    ? "MAX WIN"
    : (GAME_CONFIG.bigWinThresholds.find((t) => t.id === tier)?.label ??
      "YOU WON");

  const showBreakdown =
    typeof baseWin === "number" &&
    baseWin > 0 &&
    typeof multiplier === "number" &&
    multiplier > 1;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px]" />
      <div
        className={[
          "pointer-events-none absolute inset-0",
          maxWin
            ? "bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.22),transparent_50%)]"
            : intense
              ? "bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.22),transparent_52%)]"
              : "bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.2),transparent_55%)]",
        ].join(" ")}
      />

      <BurstRays intense={intense} />

      <motion.div
        initial={{ scale: 0.72, y: 28, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className={[
          "relative w-full max-w-md overflow-hidden rounded-3xl border px-6 py-8 text-center shadow-[0_0_80px_rgba(34,211,238,0.25)] sm:px-10 sm:py-10",
          maxWin
            ? "border-amber-300/40 bg-gradient-to-b from-[#2a1f08] via-[#120e08] to-[#06060c]"
            : intense
              ? "border-fuchsia-400/35 bg-gradient-to-b from-[#1a0b28] via-[#0c0a14] to-[#06060c]"
              : "border-cyan-400/35 bg-gradient-to-b from-[#0b1a28] via-[#080e18] to-[#06060c]",
        ].join(" ")}
      >
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />

        <motion.p
          className="text-[10px] uppercase tracking-[0.45em] text-white/45"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          Rank Rush
        </motion.p>

        <motion.h2
          className={[
            "mt-3 font-display text-3xl font-extrabold tracking-[0.08em] sm:text-5xl",
            maxWin
              ? "bg-gradient-to-r from-amber-200 via-white to-amber-300 bg-clip-text text-transparent"
              : intense
                ? "bg-gradient-to-r from-fuchsia-300 via-white to-cyan-300 bg-clip-text text-transparent"
                : "bg-gradient-to-r from-cyan-300 via-white to-sky-300 bg-clip-text text-transparent",
          ].join(" ")}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: [0.9, 1.06, 1] }}
          transition={{ duration: 0.55, delay: 0.12 }}
        >
          {label}
        </motion.h2>

        {showBreakdown ? (
          <motion.p
            className="mt-4 font-mono text-xs text-white/45 sm:text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {baseWin.toLocaleString()} × {Number(multiplier.toFixed(2))}
          </motion.p>
        ) : null}

        <motion.div
          className="mt-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">
            Win
          </p>
          <p
            className={[
              "mt-1 font-mono text-4xl font-bold tabular-nums sm:text-5xl",
              maxWin
                ? "text-amber-100"
                : intense
                  ? "text-fuchsia-100"
                  : "text-cyan-100",
            ].join(" ")}
          >
            +
            <CountUp value={payout} />
            <span className="ml-1 text-2xl opacity-70 sm:text-3xl">€</span>
          </p>
        </motion.div>

        <motion.div
          className={[
            "mx-auto mt-6 h-1 w-24 rounded-full",
            maxWin
              ? "bg-gradient-to-r from-amber-400 to-yellow-200"
              : intense
                ? "bg-gradient-to-r from-fuchsia-400 to-cyan-300"
                : "bg-gradient-to-r from-cyan-400 to-blue-400",
          ].join(" ")}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        />

        <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-white/35">
          Tap to continue
        </p>
      </motion.div>
    </motion.div>
  );
}
