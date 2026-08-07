import { describe, expect, it } from "vitest";
import { targetRotationDegrees } from "../wheel-math";
import { resolveRankUp } from "./rank-up";

describe("targetRotationDegrees", () => {
  it("lands slice 0 after full turns", () => {
    const n = 12;
    const rot = targetRotationDegrees(0, n, 5);
    expect(rot).toBe(5 * 360 + (360 - 360 / n / 2));
  });

  it("reduces residual angle for later slices", () => {
    // Higher index → larger centerAngle → smaller (360 - center) term
    expect(targetRotationDegrees(3, 12, 1)).toBeLessThan(
      targetRotationDegrees(0, 12, 1),
    );
  });
});

describe("resolveRankUp", () => {
  it("returns spins from first weight bucket", () => {
    const outcome = resolveRankUp({
      currentFeature: "champion",
      randomIntFn: (min) => min,
    });
    expect(outcome.kind).toBe("spins");
    if (outcome.kind === "spins") {
      expect(outcome.spins).toBe(2);
    }
  });

  it("upgrades when rank_up segment forced via high roll into last bucket", () => {
    // Rank-up weights: 8,78,6 — total 92. Last segment is rank_up.
    const outcome = resolveRankUp({
      currentFeature: "champion",
      randomIntFn: (_min, max) => max - 1,
    });
    expect(outcome.kind).toBe("upgrade");
    if (outcome.kind === "upgrade") {
      expect(outcome.to).toBe("grand_champion");
    }
  });

  it("ends the series on END segment", () => {
    // Weights 8,78,6 — END is second bucket starting at scaled 8e6.
    const outcome = resolveRankUp({
      currentFeature: "overtime",
      randomIntFn: () => 8_000_000,
    });
    expect(outcome.kind).toBe("end");
  });
});
