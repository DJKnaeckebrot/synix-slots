"use client";

import { motion } from "framer-motion";
import { GAME_CONFIG } from "@/lib/game/config";
import type { FeatureType } from "@/lib/game/types";

type Props = {
  current: FeatureType;
  onKeep: () => void;
  onTry: () => void;
  busy?: boolean;
};

const NEXT: Partial<Record<FeatureType, FeatureType>> = {
  overtime: "champion",
  champion: "grand_champion",
  grand_champion: "road_to_ssl",
};

export function RankUpOffer({ current, onKeep, onTry, busy }: Props) {
  const next = NEXT[current];
  if (!next) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
        <div className="max-w-sm rounded-2xl border border-white/15 bg-[#0a0e18] p-6 text-center">
          <p className="text-white/70">You&apos;re already on Road to SSL.</p>
          <button
            type="button"
            onClick={onKeep}
            className="mt-4 rounded-lg bg-cyan-500 px-5 py-2 text-sm font-bold text-slate-950"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-md rounded-2xl border border-cyan-400/25 bg-gradient-to-b from-[#0b1524] to-[#06080f] p-7 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/60">
          Rank Up
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold text-white">
          Try for a higher series?
        </h2>
        <p className="mt-3 text-sm text-white/55">
          {GAME_CONFIG.featureMeta[current].title} →{" "}
          {GAME_CONFIG.featureMeta[next].title}
        </p>
        <p className="mt-2 text-xs text-white/40">
          Virtual credits only. Outcome is determined server-side.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled={busy}
            onClick={onKeep}
            className="rounded-lg bg-gradient-to-b from-cyan-400 to-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-950 disabled:opacity-50"
          >
            Collect & Exit
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onTry}
            className="rounded-lg border border-violet-400/40 bg-violet-500/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-100 disabled:opacity-50"
          >
            Try Rank Up
          </button>
        </div>
        <p className="mt-4 text-[10px] text-white/35">
          Try can rank up, add spins, or end the series.
        </p>
      </div>
    </motion.div>
  );
}
