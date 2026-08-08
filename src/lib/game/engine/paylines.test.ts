import { describe, expect, it } from "vitest";
import { GAME_CONFIG } from "../config";
import type { SymbolId } from "../types";
import { evaluatePaylines, sumBaseWin } from "./paylines";

function gridFromRows(rows: SymbolId[][]): SymbolId[][] {
  // Input as [row][reel] convenience → convert to [reel][row]
  const reels = rows[0].length;
  return Array.from({ length: reels }, (_, reel) =>
    rows.map((row) => row[reel]),
  );
}

describe("evaluatePaylines", () => {
  it("awards a 5-oak on the top horizontal", () => {
    const grid = gridFromRows([
      ["gold", "gold", "gold", "gold", "gold"],
      ["bronze", "bronze", "bronze", "bronze", "bronze"],
      ["silver", "silver", "silver", "silver", "silver"],
      ["platinum", "platinum", "platinum", "platinum", "platinum"],
    ]);

    const wins = evaluatePaylines(grid, 10);
    const top = wins.find((w) => w.paylineId === 0);
    expect(top).toBeDefined();
    expect(top?.symbol).toBe("gold");
    expect(top?.count).toBe(5);
    expect(top?.win).toBe(
      Math.round(
        10 * GAME_CONFIG.symbols.gold.payouts[5] * GAME_CONFIG.payoutScale,
      ),
    );
  });

  it("stops streak on wheel symbol", () => {
    const grid = gridFromRows([
      ["ssl", "ssl", "rank_wheel", "ssl", "ssl"],
      ["bronze", "bronze", "bronze", "bronze", "bronze"],
      ["bronze", "bronze", "bronze", "bronze", "bronze"],
      ["bronze", "bronze", "bronze", "bronze", "bronze"],
    ]);

    const wins = evaluatePaylines(grid, 10);
    expect(wins.find((w) => w.paylineId === 0)).toBeUndefined();
  });

  it("awards 3-oak and ignores shorter", () => {
    const grid = gridFromRows([
      ["diamond", "diamond", "diamond", "bronze", "bronze"],
      ["bronze", "bronze", "bronze", "bronze", "bronze"],
      ["bronze", "bronze", "bronze", "bronze", "bronze"],
      ["bronze", "bronze", "bronze", "bronze", "bronze"],
    ]);

    const wins = evaluatePaylines(grid, 10);
    const top = wins.find((w) => w.paylineId === 0);
    expect(top?.count).toBe(3);
    expect(top?.win).toBe(
      Math.round(
        10 * GAME_CONFIG.symbols.diamond.payouts[3] * GAME_CONFIG.payoutScale,
      ),
    );
    expect(sumBaseWin(wins)).toBeGreaterThanOrEqual(top?.win ?? 0);
  });
});
