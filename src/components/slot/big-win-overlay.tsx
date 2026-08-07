"use client";

import { motion } from "framer-motion";
import { GAME_CONFIG } from "@/lib/game/config";
import type { BigWinTierId } from "@/lib/game/types";

type Props = {
  tier?: BigWinTierId;
  payout: number;
  maxWin?: boolean;
  onDone: () => void;
};

export function BigWinOverlay({ tier, payout, maxWin, onDone }: Props) {
  const label = maxWin
    ? "MAX WIN"
    : (GAME_CONFIG.bigWinThresholds.find((t) => t.id === tier)?.label ?? "WIN");

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/75 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onDone}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.2),transparent_55%)]" />
      <motion.div
        initial={{ scale: 0.6, rotate: -4 }}
        animate={{ scale: [0.6, 1.08, 1], rotate: [-4, 2, 0] }}
        transition={{ duration: 0.55 }}
        className="relative text-center"
      >
        <p className="font-display text-4xl font-extrabold tracking-[0.12em] text-transparent sm:text-6xl bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text">
          {label}
        </p>
        <p className="mt-4 font-mono text-3xl text-cyan-100 sm:text-4xl">
          {payout.toLocaleString()}
        </p>
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/40">
          Tap to continue
        </p>
      </motion.div>
    </motion.div>
  );
}
