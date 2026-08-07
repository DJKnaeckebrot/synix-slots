import { GAME_CONFIG } from "../config";
import { PAYLINES } from "../paylines";
import { isPaySymbol } from "../symbols";
import type { PaySymbolId, SymbolId, WinningPayline } from "../types";

/**
 * Evaluate fixed paylines left-to-right.
 * Wheel / non-pay symbols break a streak.
 * Awards 3 / 4 / 5 of a kind using config payouts × bet (rounded to credits).
 */
export function evaluatePaylines(
  grid: SymbolId[][],
  bet: number,
): WinningPayline[] {
  const wins: WinningPayline[] = [];

  for (const line of PAYLINES) {
    const symbolsOnLine: SymbolId[] = line.rows.map(
      (row, reel) => grid[reel][row],
    );

    const first = symbolsOnLine[0];
    if (!isPaySymbol(first)) {
      continue;
    }

    let count = 1;
    for (let reel = 1; reel < symbolsOnLine.length; reel++) {
      if (symbolsOnLine[reel] === first) {
        count += 1;
      } else {
        break;
      }
    }

    if (count < 3) {
      continue;
    }

    const matchCount = Math.min(count, 5) as 3 | 4 | 5;
    const payoutMultiple = GAME_CONFIG.symbols[first].payouts[matchCount];
    const winCredits = Math.round(bet * payoutMultiple);

    if (winCredits <= 0) {
      continue;
    }

    const positions: [number, number][] = [];
    for (let reel = 0; reel < matchCount; reel++) {
      positions.push([reel, line.rows[reel]]);
    }

    wins.push({
      paylineId: line.id,
      symbol: first as PaySymbolId,
      count: matchCount,
      positions,
      win: winCredits,
    });
  }

  return wins;
}

export function sumBaseWin(paylines: WinningPayline[]): number {
  return paylines.reduce((sum, line) => sum + line.win, 0);
}
