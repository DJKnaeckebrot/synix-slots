"use client";

import { GAME_CONFIG } from "@/lib/game/config";
import type { FeatureType } from "@/lib/game/types";

type Props = {
  type: FeatureType;
  spinsRemaining: number;
  spinsTotal: number;
  featureWin: number;
  multiplier: number;
};

export function FeatureHud({
  type,
  spinsRemaining,
  spinsTotal,
  featureWin,
  multiplier,
}: Props) {
  const title = GAME_CONFIG.featureMeta[type].title;

  return (
    <div className="grid w-full max-w-3xl grid-cols-2 gap-2 rounded-2xl border border-violet-400/25 bg-violet-950/30 px-3 py-3 sm:grid-cols-4 sm:gap-3 sm:px-5">
      <div>
        <p className="text-[9px] uppercase tracking-[0.25em] text-violet-200/50">
          Series
        </p>
        <p className="mt-1 text-xs font-semibold text-violet-100 sm:text-sm">
          {title}
        </p>
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-[0.25em] text-violet-200/50">
          Spins
        </p>
        <p className="mt-1 font-mono text-lg text-white">
          {spinsRemaining} <span className="text-white/40">/ {spinsTotal}</span>
        </p>
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-[0.25em] text-violet-200/50">
          Feature Win
        </p>
        <p className="mt-1 font-mono text-lg text-cyan-100">
          {featureWin.toLocaleString()}
        </p>
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-[0.25em] text-violet-200/50">
          Multiplier
        </p>
        <p className="mt-1 font-mono text-lg text-fuchsia-100">{multiplier}x</p>
      </div>
    </div>
  );
}
