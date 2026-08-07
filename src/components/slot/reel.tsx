"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { PAY_SYMBOL_IDS } from "@/lib/game/symbols";
import type { SymbolId } from "@/lib/game/types";
import { SymbolCell } from "./symbol-cell";

type Props = {
  reelIndex: number;
  symbols: SymbolId[];
  idle?: boolean;
  spinning?: boolean;
  highlightedRows?: number[];
};

const ROW_COUNT = 4;
const STRIP_LEN = 16;

function fakeSymbols(seed: number): { symbol: SymbolId; key: string }[] {
  return Array.from({ length: STRIP_LEN }, (_, slot) => {
    const symbol = PAY_SYMBOL_IDS[(seed + slot * 3) % PAY_SYMBOL_IDS.length];
    return {
      symbol,
      key: `strip-${seed}-${symbol}-slot${String(slot).padStart(2, "0")}`,
    };
  });
}

/**
 * Each reel is a fixed 4-row viewport. Spinning scrolls a long strip
 * inside overflow:hidden so the grid never grows vertically.
 */
export function Reel({
  reelIndex,
  symbols,
  idle = true,
  spinning = false,
  highlightedRows = [],
}: Props) {
  const strip = useMemo(() => fakeSymbols(reelIndex * 7 + 3), [reelIndex]);

  return (
    <div
      className="relative min-w-0 flex-1 overflow-hidden"
      style={{ aspectRatio: `1 / ${ROW_COUNT}` }}
    >
      {spinning ? (
        <motion.div
          className="absolute inset-x-0 top-0 flex flex-col gap-[3%] will-change-transform"
          style={{ height: `${(STRIP_LEN / ROW_COUNT) * 100}%` }}
          animate={{
            y: ["0%", `-${((STRIP_LEN - ROW_COUNT) / STRIP_LEN) * 100}%`],
          }}
          transition={{
            duration: 0.28,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          {strip.map((cell) => (
            <div
              key={cell.key}
              className="w-full shrink-0"
              style={{ height: `${100 / STRIP_LEN}%` }}
            >
              <div className="h-full w-full p-[4%]">
                <SymbolCell symbol={cell.symbol} compact />
              </div>
            </div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="absolute inset-0 grid grid-rows-4 gap-[3%]"
          initial={false}
          animate={idle ? { y: [0, -1.5, 0, 1.5, 0] } : { y: [6, -3, 0] }}
          transition={
            idle
              ? {
                  duration: 3.2 + reelIndex * 0.15,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }
              : { duration: 0.32, ease: "easeOut" }
          }
        >
          {symbols.map((symbol, row) => (
            <div
              key={`${reelIndex}-${row}-${symbol}`}
              className="min-h-0 p-[4%]"
            >
              <SymbolCell
                symbol={symbol}
                highlighted={highlightedRows.includes(row)}
                compact
              />
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
