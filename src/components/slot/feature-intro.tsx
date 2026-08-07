"use client";

import { motion } from "framer-motion";
import { GAME_CONFIG } from "@/lib/game/config";
import type { FeatureType } from "@/lib/game/types";

type Props = {
  type: FeatureType;
  spins: number;
  onDone: () => void;
};

export function FeatureIntro({ type, spins, onDone }: Props) {
  const meta = GAME_CONFIG.featureMeta[type];
  const isOvertime = type === "overtime";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
    >
      <motion.div
        initial={{ scale: 0.85, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        className={[
          "w-full max-w-md rounded-2xl border p-8 text-center shadow-[0_0_60px_rgba(34,211,238,0.2)]",
          isOvertime
            ? "border-amber-400/35 bg-gradient-to-b from-[#1a1408] to-[#07060f]"
            : "border-violet-400/30 bg-gradient-to-b from-[#140a22] to-[#07060f]",
        ].join(" ")}
      >
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">
          {isOvertime ? "Sudden Death" : "Rank Progression"}
        </p>

        {isOvertime ? (
          <div className="mt-6 space-y-3">
            <motion.div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-300/60 bg-amber-500/10 font-mono text-2xl font-bold text-amber-200 shadow-[0_0_28px_rgba(251,191,36,0.35)]"
              animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
              transition={{
                duration: 1.1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              OT
            </motion.div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-100/70">
              Clock hits zero · keep scoring
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-2 font-display text-2xl font-bold tracking-wide text-white sm:text-3xl">
            <div className="text-white/50">{meta.fromRank}</div>
            <motion.div
              animate={{ y: [0, 6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2 }}
              className="text-violet-300"
            >
              ↓
            </motion.div>
            <div className="bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
              {meta.toRank}
            </div>
          </div>
        )}

        <h2
          className={[
            "mt-8 font-display text-xl font-bold tracking-[0.15em] sm:text-2xl",
            isOvertime ? "text-amber-100" : "text-white",
          ].join(" ")}
        >
          {meta.title}
        </h2>
        <p
          className={[
            "mt-3 font-mono text-3xl",
            isOvertime ? "text-amber-200" : "text-cyan-200",
          ].join(" ")}
        >
          {spins} FREE SPINS
        </p>
        <button
          type="button"
          onClick={onDone}
          className={[
            "mt-8 rounded-lg border px-6 py-2 text-xs uppercase tracking-[0.25em] text-white/80",
            isOvertime
              ? "border-amber-400/40 hover:border-amber-300/70"
              : "border-white/20 hover:border-cyan-400/40",
          ].join(" ")}
        >
          {isOvertime ? "Enter Overtime" : "Enter Series"}
        </button>
      </motion.div>
    </motion.div>
  );
}
