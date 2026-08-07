"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import {
  isPaySymbol,
  isScatterSymbol,
  SCATTERS,
  SYMBOLS,
} from "@/lib/game/symbols";
import type { PaySymbolId, ScatterSymbolId, SymbolId } from "@/lib/game/types";

type Props = {
  symbol: SymbolId;
  highlighted?: boolean;
  compact?: boolean;
};

function sheenDelay(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return 2 + (n % 40) / 10;
}

function RankPlaceholder({ id }: { id: PaySymbolId }) {
  const def = SYMBOLS[id];
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-1"
      style={{
        background: `radial-gradient(circle at 35% 28%, ${def.color}66, #080d16 68%)`,
      }}
    >
      <span
        className="text-[10px] font-bold uppercase tracking-[0.18em] sm:text-xs"
        style={{ color: def.color, textShadow: `0 0 12px ${def.color}88` }}
      >
        {def.label.split(" ")[0]}
      </span>
      <span
        className="h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5"
        style={{
          backgroundColor: def.color,
          boxShadow: `0 0 12px ${def.color}`,
        }}
      />
    </div>
  );
}

function RankIcon({
  id,
  highlighted,
}: {
  id: PaySymbolId;
  highlighted: boolean;
}) {
  const def = SYMBOLS[id];
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Rank-tinted arena floor */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 70% at 50% 38%, ${def.color}33 0%, transparent 55%),
            linear-gradient(165deg, #121a28 0%, #070b14 55%, #05070e 100%)
          `,
        }}
      />

      {/* Soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

      {/* Top metallic edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

      {/* Diagonal sheen */}
      <motion.div
        className="pointer-events-none absolute -inset-[40%] rotate-12 opacity-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.14) 50%, transparent 60%)",
        }}
        animate={
          highlighted
            ? { opacity: [0, 0.9, 0], x: ["-30%", "30%"] }
            : { opacity: [0, 0.35, 0], x: ["-40%", "40%"] }
        }
        transition={
          highlighted
            ? {
                duration: 0.9,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 0.4,
              }
            : {
                duration: 4.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: sheenDelay(id),
                ease: "easeInOut",
              }
        }
      />

      {failed ? (
        <RankPlaceholder id={id} />
      ) : (
        <motion.div
          className="absolute inset-0"
          animate={
            highlighted
              ? {
                  scale: [1, 1.06, 1],
                  filter: [
                    "brightness(1)",
                    "brightness(1.25)",
                    "brightness(1)",
                  ],
                }
              : { scale: 1 }
          }
          transition={
            highlighted
              ? {
                  duration: 0.85,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }
              : { duration: 0.2 }
          }
        >
          <Image
            src={def.assetPath}
            alt={def.label}
            fill
            sizes="(max-width: 640px) 18vw, 96px"
            className="object-contain p-[12%] drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)]"
            style={{
              filter: highlighted
                ? `drop-shadow(0 0 10px ${def.color}aa)`
                : `drop-shadow(0 0 6px ${def.color}55)`,
            }}
            draggable={false}
            onError={() => setFailed(true)}
          />
        </motion.div>
      )}

      {/* Bottom rank accent bar */}
      <div
        className="pointer-events-none absolute inset-x-[18%] bottom-[6%] h-[2px] rounded-full opacity-70"
        style={{
          background: `linear-gradient(90deg, transparent, ${def.color}, transparent)`,
          boxShadow: `0 0 8px ${def.color}88`,
        }}
      />
    </div>
  );
}

function WheelCell({ elite }: { elite: boolean }) {
  return (
    <div
      className={[
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        elite
          ? "bg-[radial-gradient(circle_at_40%_30%,rgba(232,121,249,0.35),#1a0b24_70%)]"
          : "bg-[radial-gradient(circle_at_40%_30%,rgba(34,211,238,0.3),#0a1520_70%)]",
      ].join(" ")}
    >
      <motion.div
        className={[
          "absolute h-[78%] w-[78%] rounded-full border",
          elite
            ? "border-fuchsia-300/40 shadow-[0_0_18px_rgba(232,121,249,0.4)]"
            : "border-cyan-300/40 shadow-[0_0_18px_rgba(34,211,238,0.4)]",
        ].join(" ")}
        animate={{ rotate: 360 }}
        transition={{
          duration: elite ? 6 : 9,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        style={{
          background: elite
            ? "conic-gradient(from 0deg, transparent 0%, rgba(232,121,249,0.28) 18%, transparent 36%)"
            : "conic-gradient(from 0deg, transparent 0%, rgba(34,211,238,0.28) 18%, transparent 36%)",
        }}
      />

      <motion.div
        className="relative z-[1] h-[68%] w-[68%]"
        animate={{ rotate: elite ? -360 : 360, scale: [1, 1.05, 1] }}
        transition={{
          rotate: {
            duration: elite ? 10 : 14,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          },
          scale: {
            duration: 2.2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          },
        }}
      >
        <Image
          src="/ranks/ball.png"
          alt={elite ? "Elite Rank Wheel" : "Rank Wheel"}
          fill
          sizes="96px"
          className={[
            "object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.7)]",
            elite ? "hue-rotate-[280deg] saturate-150 brightness-110" : "",
          ].join(" ")}
          draggable={false}
          priority={false}
        />
      </motion.div>
    </div>
  );
}

function ScatterPlaceholder({ id }: { id: ScatterSymbolId }) {
  const def = SCATTERS[id];
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-1"
      style={{
        background: `radial-gradient(circle at 35% 28%, ${def.color}55, #080d16 68%)`,
      }}
    >
      <span
        className="text-[9px] font-bold uppercase tracking-[0.14em] sm:text-[10px]"
        style={{ color: def.color }}
      >
        {def.label}
      </span>
      <span className="text-[8px] uppercase tracking-wider text-white/45">
        {def.role === "free_games" ? "Free" : "Combo"}
      </span>
    </div>
  );
}

function ScatterIcon({
  id,
  highlighted,
}: {
  id: ScatterSymbolId;
  highlighted: boolean;
}) {
  const def = SCATTERS[id];
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 70% at 50% 38%, ${def.color}40 0%, transparent 55%),
            linear-gradient(165deg, #121a28 0%, #070b14 55%, #05070e 100%)
          `,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div
        className="absolute left-1/2 top-1.5 z-[2] -translate-x-1/2 rounded px-1 py-px text-[7px] font-bold uppercase tracking-wider text-black/80 sm:text-[8px]"
        style={{ backgroundColor: def.color }}
      >
        SCATTER
      </div>
      {failed ? (
        <ScatterPlaceholder id={id} />
      ) : (
        <motion.div
          className="absolute inset-0"
          animate={highlighted ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={
            highlighted
              ? {
                  duration: 0.85,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }
              : { duration: 0.2 }
          }
        >
          <Image
            src={def.assetPath}
            alt={def.label}
            fill
            sizes="(max-width: 640px) 18vw, 96px"
            className="object-contain p-[10%] drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)]"
            style={{
              filter: highlighted
                ? `drop-shadow(0 0 12px ${def.color}cc)`
                : `drop-shadow(0 0 6px ${def.color}66)`,
            }}
            draggable={false}
            onError={() => setFailed(true)}
          />
        </motion.div>
      )}
    </div>
  );
}

export function SymbolCell({
  symbol,
  highlighted = false,
  compact = false,
}: Props) {
  const isWheel = symbol === "rank_wheel" || symbol === "elite_rank_wheel";
  const pay = isPaySymbol(symbol) ? SYMBOLS[symbol] : null;
  const scatter = isScatterSymbol(symbol) ? SCATTERS[symbol] : null;
  const borderColor =
    pay?.color ??
    scatter?.color ??
    (symbol === "elite_rank_wheel" ? "#e879f9" : "#22d3ee");

  return (
    <motion.div
      className={[
        "relative overflow-hidden rounded-lg",
        compact ? "h-full w-full" : "aspect-square w-full",
      ].join(" ")}
      animate={
        highlighted
          ? {
              boxShadow: [
                `0 0 0 1px ${borderColor}66, 0 0 12px ${borderColor}44`,
                `0 0 0 2px ${borderColor}cc, 0 0 22px ${borderColor}88`,
                `0 0 0 1px ${borderColor}66, 0 0 12px ${borderColor}44`,
              ],
            }
          : {
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(255,255,255,0.08), 0 6px 14px rgba(0,0,0,0.45)`,
            }
      }
      transition={
        highlighted
          ? {
              duration: 0.9,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }
          : { duration: 0.25 }
      }
      style={{
        background: "#080c14",
      }}
    >
      <div
        className="pointer-events-none absolute inset-[1px] z-[2] rounded-[7px]"
        style={{
          boxShadow: highlighted
            ? `inset 0 0 0 1px ${borderColor}55`
            : "inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      />

      {isWheel ? (
        <WheelCell elite={symbol === "elite_rank_wheel"} />
      ) : isPaySymbol(symbol) ? (
        <RankIcon id={symbol} highlighted={highlighted} />
      ) : isScatterSymbol(symbol) ? (
        <ScatterIcon id={symbol} highlighted={highlighted} />
      ) : (
        <div className="h-full w-full bg-zinc-800" />
      )}
    </motion.div>
  );
}
