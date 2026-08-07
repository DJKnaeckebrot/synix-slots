import { randomInt } from "node:crypto";
import type { WeightedItem } from "./types";

export type RandomIntFn = (
  minInclusive: number,
  maxExclusive: number,
) => number;

/** Production CSPRNG — never use Math.random for outcomes. */
export const cryptoRandomInt: RandomIntFn = (min, max) => {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error("randomInt bounds must be integers");
  }
  if (max <= min) {
    throw new Error("maxExclusive must be greater than minInclusive");
  }
  return randomInt(min, max);
};

/**
 * Pick an item by relative weight.
 * Weights must be finite positive numbers; totals must be > 0.
 */
export function weightedRandom<T>(
  items: WeightedItem<T>[],
  randomIntFn: RandomIntFn = cryptoRandomInt,
): T {
  if (items.length === 0) {
    throw new Error("weightedRandom requires at least one item");
  }

  let total = 0;
  for (const { weight } of items) {
    if (!Number.isFinite(weight) || weight < 0) {
      throw new Error(`Invalid weight: ${weight}`);
    }
    total += weight;
  }

  if (total <= 0) {
    throw new Error("Total weight must be greater than 0");
  }

  // Scale to integer space for crypto.randomInt when weights are floats.
  const scale = 1_000_000;
  const scaledTotal = Math.round(total * scale);
  if (scaledTotal <= 0) {
    throw new Error("Scaled weight total must be greater than 0");
  }

  const roll = randomIntFn(0, scaledTotal);
  let cumulative = 0;
  for (const { item, weight } of items) {
    cumulative += Math.round(weight * scale);
    if (roll < cumulative) {
      return item;
    }
  }

  return items[items.length - 1].item;
}

export function weightedSymbol<T>(
  items: WeightedItem<T>[],
  randomIntFn: RandomIntFn = cryptoRandomInt,
): T {
  return weightedRandom(items, randomIntFn);
}

export function weightedWheelSegment<T>(
  items: WeightedItem<T>[],
  randomIntFn: RandomIntFn = cryptoRandomInt,
): T {
  return weightedRandom(items, randomIntFn);
}

/** Bernoulli trial with probability p in [0, 1]. */
export function chance(
  p: number,
  randomIntFn: RandomIntFn = cryptoRandomInt,
): boolean {
  if (!Number.isFinite(p) || p < 0 || p > 1) {
    throw new Error(`Probability must be in [0, 1], got ${p}`);
  }
  if (p === 0) return false;
  if (p === 1) return true;
  const scale = 1_000_000;
  return randomIntFn(0, scale) < Math.round(p * scale);
}
