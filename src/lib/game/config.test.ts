import { describe, expect, it } from "vitest";
import {
  applyWheelToMultiplier,
  GAME_CONFIG,
  getNormalWheelWeighted,
  getSymbolWeights,
  isValidBet,
  resolveBigWinTier,
} from "./config";
import { PAYLINES, REEL_COUNT, ROW_COUNT } from "./paylines";
import { chance, weightedRandom } from "./rng";

describe("config", () => {
  it("has matching segment and weight lengths for wheels", () => {
    expect(GAME_CONFIG.normalWheel.segments.length).toBe(
      GAME_CONFIG.normalWheel.weights.length,
    );
    expect(GAME_CONFIG.eliteWheel.segments.length).toBe(
      GAME_CONFIG.eliteWheel.weights.length,
    );
    expect(GAME_CONFIG.rankUpWheel.segments.length).toBe(
      GAME_CONFIG.rankUpWheel.weights.length,
    );
  });

  it("validates bets against config", () => {
    expect(isValidBet(1)).toBe(true);
    expect(isValidBet(7)).toBe(false);
  });

  it("resolves big win tiers by multiple", () => {
    expect(resolveBigWinTier(9, 1)?.id).toBeUndefined();
    expect(resolveBigWinTier(10, 1)?.id).toBe("nice");
    expect(resolveBigWinTier(500, 1)?.id).toBe("supersonic");
  });
});

describe("paylines", () => {
  it("defines 14 paylines on a 5×4 grid", () => {
    expect(PAYLINES).toHaveLength(14);
    expect(REEL_COUNT).toBe(5);
    expect(ROW_COUNT).toBe(4);
    for (const line of PAYLINES) {
      expect(line.rows).toHaveLength(5);
      for (const row of line.rows) {
        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThan(ROW_COUNT);
      }
    }
  });
});

describe("multipliers", () => {
  it("applies add and multiply in order", () => {
    let m = 0;
    m = applyWheelToMultiplier(m, {
      id: "a",
      kind: "add",
      value: 10,
      label: "+10x",
    });
    expect(m).toBe(10);
    m = applyWheelToMultiplier(m, {
      id: "b",
      kind: "multiply",
      value: 3,
      label: "×3",
    });
    expect(m).toBe(30);
    m = applyWheelToMultiplier(m, {
      id: "c",
      kind: "add",
      value: 20,
      label: "+20x",
    });
    expect(m).toBe(50);
  });

  it("handles 10 + 20 then ×5 = 150", () => {
    let m = 0;
    m = applyWheelToMultiplier(m, {
      id: "a",
      kind: "add",
      value: 10,
      label: "+10x",
    });
    m = applyWheelToMultiplier(m, {
      id: "b",
      kind: "add",
      value: 20,
      label: "+20x",
    });
    m = applyWheelToMultiplier(m, {
      id: "c",
      kind: "multiply",
      value: 5,
      label: "×5",
    });
    expect(m).toBe(150);
  });
});

describe("rng", () => {
  it("rejects empty and invalid weights", () => {
    expect(() => weightedRandom([])).toThrow();
    expect(() => weightedRandom([{ item: "a", weight: -1 }])).toThrow();
  });

  it("respects forced random for chance", () => {
    expect(chance(0, () => 0)).toBe(false);
    expect(chance(1, () => 0)).toBe(true);
    expect(chance(0.5, () => 0)).toBe(true);
    expect(chance(0.5, () => 999_999)).toBe(false);
  });

  it("exports positive symbol and wheel weight totals", () => {
    const symbols = getSymbolWeights();
    const wheels = getNormalWheelWeighted();
    expect(symbols.reduce((s, w) => s + w.weight, 0)).toBeGreaterThan(0);
    expect(wheels.reduce((s, w) => s + w.weight, 0)).toBeGreaterThan(0);
  });
});
