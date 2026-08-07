"use client";

import { motion } from "framer-motion";

export type RankUpResultKind = "upgrade" | "spins" | "end";

export type RankUpResultPayload = {
  kind: RankUpResultKind;
  title: string;
  subtitle?: string;
};

type Props = RankUpResultPayload & {
  onDone: () => void;
};

export function RankUpResult({ kind, title, subtitle, onDone }: Props) {
  const tone =
    kind === "upgrade"
      ? {
          border: "border-cyan-400/40",
          glow: "shadow-[0_0_60px_rgba(34,211,238,0.28)]",
          title:
            "bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent",
          accent: "from-cyan-400 to-violet-400",
          eyebrow: "Rank Up",
        }
      : kind === "spins"
        ? {
            border: "border-violet-400/35",
            glow: "shadow-[0_0_50px_rgba(168,85,247,0.25)]",
            title:
              "bg-gradient-to-r from-violet-200 via-white to-cyan-200 bg-clip-text text-transparent",
            accent: "from-violet-400 to-cyan-400",
            eyebrow: "Extra Spins",
          }
        : {
            border: "border-rose-400/35",
            glow: "shadow-[0_0_50px_rgba(244,63,94,0.22)]",
            title:
              "bg-gradient-to-r from-rose-200 via-white to-amber-100 bg-clip-text text-transparent",
            accent: "from-rose-400 to-amber-300",
            eyebrow: "Series Over",
          };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onDone}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[3px]" />
      <motion.div
        initial={{ scale: 0.78, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className={[
          "relative w-full max-w-sm overflow-hidden rounded-3xl border bg-gradient-to-b from-[#10182a] via-[#0a0e18] to-[#06060c] px-7 py-9 text-center",
          tone.border,
          tone.glow,
        ].join(" ")}
      >
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
        />

        <p className="text-[10px] uppercase tracking-[0.4em] text-white/45">
          {tone.eyebrow}
        </p>

        <motion.h2
          className={[
            "mt-3 font-display text-3xl font-extrabold tracking-wide sm:text-4xl",
            tone.title,
          ].join(" ")}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: [0.9, 1.06, 1], opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {title}
        </motion.h2>

        {subtitle ? (
          <p className="mt-3 text-sm text-white/55">{subtitle}</p>
        ) : null}

        <motion.div
          className={[
            "mx-auto mt-6 h-1 w-20 rounded-full bg-gradient-to-r",
            tone.accent,
          ].join(" ")}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.15 }}
        />

        <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-white/35">
          Tap to continue
        </p>
      </motion.div>
    </motion.div>
  );
}
