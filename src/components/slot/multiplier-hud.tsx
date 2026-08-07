"use client";

import { motion } from "framer-motion";

type Props = {
  multiplier: number;
  /** Visual mode for the last applied wheel effect. */
  effect?: "add" | "multiply" | null;
  /** Shown during add/multiply impact e.g. "10x × 3". */
  equation?: string | null;
};

export function MultiplierHud({
  multiplier,
  effect = null,
  equation = null,
}: Props) {
  const display = multiplier > 0 ? `${multiplier}x` : "0x";
  const accent =
    effect === "multiply"
      ? "border-violet-400/50 text-violet-100 shadow-[0_0_28px_rgba(167,139,250,0.35)]"
      : effect === "add"
        ? "border-cyan-400/50 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.35)]"
        : "border-cyan-400/30 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.2)]";

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase tracking-[0.35em] text-cyan-200/60">
        Multiplier
      </span>
      {equation ? (
        <motion.div
          key={equation}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="font-mono text-xs text-white/50"
        >
          {equation}
        </motion.div>
      ) : null}
      <motion.div
        key={`${display}-${effect ?? "none"}`}
        initial={{ scale: 0.75, opacity: 0.5 }}
        animate={{ scale: [0.75, 1.12, 1], opacity: 1 }}
        transition={{ duration: 0.45 }}
        className={[
          "min-w-[7rem] rounded-lg border bg-black/50 px-5 py-2 text-center font-mono text-3xl font-bold tracking-tight sm:text-4xl",
          accent,
        ].join(" ")}
      >
        {display}
      </motion.div>
    </div>
  );
}
