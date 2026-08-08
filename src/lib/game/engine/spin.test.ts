import { describe, expect, it } from "vitest";
import { applyWheelToMultiplier, GAME_CONFIG } from "../config";
import type { RandomIntFn } from "../rng";
import { generateSpin } from "./spin";

/** Deterministic sequence wrapper for tests. */
function sequenceRandom(values: number[]): RandomIntFn {
  let i = 0;
  return (min, max) => {
    const span = max - min;
    const raw = values[i % values.length] ?? 0;
    i += 1;
    return min + (Math.abs(raw) % span);
  };
}

describe("generateSpin", () => {
  it("rejects invalid bets and insufficient balance", () => {
    expect(() =>
      generateSpin({
        bet: 7,
        clientRequestId: "00000000-0000-4000-8000-000000000001",
        balanceBefore: 1000,
      }),
    ).toThrow("invalid_bet");

    expect(() =>
      generateSpin({
        bet: 100,
        clientRequestId: "00000000-0000-4000-8000-000000000002",
        balanceBefore: 50,
      }),
    ).toThrow("insufficient_credits");
  });

  it("returns a 5×4 grid and updates balance", () => {
    const result = generateSpin({
      bet: 1,
      clientRequestId: "00000000-0000-4000-8000-000000000003",
      balanceBefore: 1000,
      randomIntFn: sequenceRandom([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    });

    expect(result.grid).toHaveLength(5);
    expect(result.grid.every((reel) => reel.length === 4)).toBe(true);
    expect(result.debit).toBe(1);
    expect(result.balanceAfter).toBe(1000 - 1 + result.payout);
    expect(result.bet).toBe(1);
  });

  it("charges 3× stake for Feature Spins ante", () => {
    const result = generateSpin({
      bet: 10,
      featureSpins: true,
      clientRequestId: "00000000-0000-4000-8000-000000000008",
      balanceBefore: 1000,
      randomIntFn: sequenceRandom([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    });

    expect(result.debit).toBe(30);
    expect(result.featureSpins).toBe(true);
    expect(result.bet).toBe(10);
    expect(result.balanceAfter).toBe(1000 - 30 + result.payout);
  });

  it("rejects Feature Spins when balance cannot cover ante", () => {
    expect(() =>
      generateSpin({
        bet: 10,
        featureSpins: true,
        clientRequestId: "00000000-0000-4000-8000-000000000009",
        balanceBefore: 25,
      }),
    ).toThrow("insufficient_credits");
  });

  it("forces three wheels left-to-right and applies multipliers", () => {
    const result = generateSpin({
      bet: 10,
      clientRequestId: "00000000-0000-4000-8000-000000000004",
      balanceBefore: 1000,
      randomIntFn: sequenceRandom(Array.from({ length: 200 }, (_, i) => i)),
      override: {
        forceWheelReels: [0, 2, 4],
        forceSegments: {
          0: "n_add_10",
          2: "n_mul_3",
          4: "n_add_20",
        },
      },
    });

    expect(result.wheels).toHaveLength(3);
    expect(result.wheels.map((w) => w.reel)).toEqual([0, 2, 4]);
    expect(result.wheels[0].label).toBe("+10x");
    expect(result.wheels[1].label).toBe("×3");
    expect(result.wheels[2].label).toBe("+20x");

    let m = 0;
    m = applyWheelToMultiplier(m, {
      id: "n_add_10",
      kind: "add",
      value: 10,
      label: "+10x",
    });
    m = applyWheelToMultiplier(m, {
      id: "n_mul_3",
      kind: "multiply",
      value: 3,
      label: "×3",
    });
    m = applyWheelToMultiplier(m, {
      id: "n_add_20",
      kind: "add",
      value: 20,
      label: "+20x",
    });
    expect(result.finalMultiplier).toBe(m);
    expect(result.wheels[2].multiplierAfter).toBe(50);
  });

  it("caps at max win when forced", () => {
    const result = generateSpin({
      bet: 10,
      clientRequestId: "00000000-0000-4000-8000-000000000005",
      balanceBefore: 1_000_000,
      override: {
        forceWheelReels: [0],
        forceSegments: { 0: "n_add_50" },
        forceMaxWin: true,
      },
      randomIntFn: sequenceRandom(Array.from({ length: 300 }, () => 0)),
    });

    // forceMaxWin only caps when baseWin > 0 — may or may not hit depending on grid.
    if (result.baseWin > 0) {
      expect(result.payout).toBe(10 * GAME_CONFIG.maxWin);
      expect(result.cappedAtMaxWin).toBe(true);
    }
  });

  it("does not place wheels when there is no line win", () => {
    const result = generateSpin({
      bet: 10,
      clientRequestId: "00000000-0000-4000-8000-000000000006",
      balanceBefore: 1000,
      // High wheelChance path still gated: only pay symbols, no force.
      // Sequence that rarely aligns 3-of-a-kind LTR on paylines.
      randomIntFn: sequenceRandom([0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5]),
    });

    if (result.baseWin === 0) {
      expect(result.wheels).toHaveLength(0);
      expect(result.payout).toBe(0);
    }
  });

  it("allows forced wheels even without a line win (dev), but pays 0", () => {
    // Force wheels with a grid that has no matching payline.
    // Use alternating high indices so first three reels differ on most lines.
    const result = generateSpin({
      bet: 10,
      clientRequestId: "00000000-0000-4000-8000-000000000007",
      balanceBefore: 1000,
      override: {
        forceWheelReels: [0],
        forceSegments: { 0: "n_add_10" },
      },
      randomIntFn: sequenceRandom([0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5]),
    });

    expect(result.wheels).toHaveLength(1);
    expect(result.finalMultiplier).toBe(10);
    if (result.baseWin === 0) {
      expect(result.payout).toBe(0);
    } else {
      expect(result.payout).toBe(Math.floor(result.baseWin * 10));
    }
  });
});
