import { SCATTERS } from "../symbols";
import type {
  ScatterResult,
  ScatterSymbolId,
  ScatterWin,
  SymbolId,
} from "../types";

function collectPositions(
  grid: SymbolId[][],
  symbol: ScatterSymbolId,
): [number, number][] {
  const positions: [number, number][] = [];
  for (let reel = 0; reel < grid.length; reel++) {
    for (let row = 0; row < grid[reel].length; row++) {
      if (grid[reel][row] === symbol) {
        positions.push([reel, row]);
      }
    }
  }
  return positions;
}

/**
 * Evaluate scatter symbols anywhere on the grid (not payline-bound).
 * Fennec pays for 3 / 4 / 5. Octane triggers free games at threshold.
 */
export function evaluateScatters(
  grid: SymbolId[][],
  bet: number,
): ScatterResult {
  const fennecPositions = collectPositions(grid, "fennec");
  const octanePositions = collectPositions(grid, "octane");
  const fennecCount = fennecPositions.length;
  const octaneCount = octanePositions.length;

  const wins: ScatterWin[] = [];
  const fennecDef = SCATTERS.fennec;
  if (fennecDef.payouts && fennecCount >= 3) {
    const count = Math.min(fennecCount, 5) as 3 | 4 | 5;
    const multiple = fennecDef.payouts[count];
    const win = Math.round(bet * multiple);
    if (win > 0) {
      wins.push({
        symbol: "fennec",
        count,
        positions: fennecPositions,
        win,
      });
    }
  }

  const totalWin = wins.reduce((sum, w) => sum + w.win, 0);
  const freeAt = SCATTERS.octane.freeGamesAt ?? 3;
  const freeGames = octaneCount >= freeAt;

  return {
    wins,
    totalWin,
    fennecCount,
    octaneCount,
    freeGames,
    positions: [...fennecPositions, ...octanePositions],
  };
}
