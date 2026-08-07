"use client";

import type { SymbolId } from "@/lib/game/types";
import { Reel } from "./reel";

type Props = {
  grid: SymbolId[][];
  idle?: boolean;
  /** Per-reel spinning flags. */
  spinningReels?: boolean[];
  /** Highlighted [reel, row] cells from winning paylines. */
  highlightedPositions?: [number, number][];
};

export function SlotGrid({
  grid,
  idle = true,
  spinningReels,
  highlightedPositions = [],
}: Props) {
  return (
    <div className="relative w-full max-w-3xl">
      <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.12),transparent_65%)] blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/25 bg-gradient-to-b from-[#101929] via-[#0b1220] to-[#05080f] p-2.5 shadow-[0_0_40px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-3.5">
        {/* Cabinet lip */}
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] bg-size-[28px_28px] opacity-50" />
        <div className="relative z-[1] flex aspect-[5/4] w-full gap-1 sm:gap-1.5">
          {grid.map((reelSymbols, reelIndex) => {
            const highlightedRows = highlightedPositions
              .filter(([reel]) => reel === reelIndex)
              .map(([, row]) => row);

            return (
              <Reel
                key={`reel-col-${["a", "b", "c", "d", "e"][reelIndex]}`}
                reelIndex={reelIndex}
                symbols={reelSymbols}
                idle={idle && !spinningReels?.some(Boolean)}
                spinning={spinningReels?.[reelIndex] ?? false}
                highlightedRows={highlightedRows}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
