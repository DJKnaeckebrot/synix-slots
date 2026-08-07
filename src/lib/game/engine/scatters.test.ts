import { describe, expect, it } from "vitest";
import type { SymbolId } from "../types";
import { evaluateScatters } from "./scatters";

function gridWith(
  placements: { reel: number; row: number; id: SymbolId }[],
): SymbolId[][] {
  const grid: SymbolId[][] = Array.from({ length: 5 }, () =>
    Array.from({ length: 4 }, () => "bronze" as SymbolId),
  );
  for (const p of placements) {
    grid[p.reel][p.row] = p.id;
  }
  return grid;
}

describe("evaluateScatters", () => {
  it("pays Fennec combo for 3 anywhere", () => {
    const grid = gridWith([
      { reel: 0, row: 0, id: "fennec" },
      { reel: 2, row: 1, id: "fennec" },
      { reel: 4, row: 3, id: "fennec" },
    ]);
    const result = evaluateScatters(grid, 10);
    expect(result.fennecCount).toBe(3);
    expect(result.wins).toHaveLength(1);
    expect(result.wins[0].symbol).toBe("fennec");
    expect(result.totalWin).toBe(Math.round(10 * 0.8));
    expect(result.freeGames).toBe(false);
  });

  it("triggers free games on 3+ Octane", () => {
    const grid = gridWith([
      { reel: 0, row: 0, id: "octane" },
      { reel: 1, row: 0, id: "octane" },
      { reel: 3, row: 2, id: "octane" },
    ]);
    const result = evaluateScatters(grid, 10);
    expect(result.octaneCount).toBe(3);
    expect(result.freeGames).toBe(true);
    expect(result.totalWin).toBe(0);
  });
});
