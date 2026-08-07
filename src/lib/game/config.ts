import { PAYLINES } from "./paylines";
import { SCATTERS, SYMBOLS } from "./symbols";
import type {
  BigWinThreshold,
  FeatureModeConfig,
  FeatureType,
  WeightedItem,
  WheelSegment,
} from "./types";

/**
 * Single source of truth for gameplay values.
 * Simulator and production engine MUST import this config — never duplicate tables.
 *
 * Multiplier rule (locked):
 * - Rank Wheels only land when baseWin > 0 (pay grid evaluated first)
 * - No wheels → payout = baseWin (implicit 1×)
 * - Any wheel + line win → payout = baseWin × spinMultiplier
 * - Cap at bet × maxWin
 */

export const GAME_CONFIG = {
  version: 1,
  name: "Rank Rush",
  disclaimer:
    "Free community game. Virtual credits only. No real-money gambling.",

  grid: {
    reels: 5,
    rows: 4,
  },

  bets: [1, 2, 5, 10, 25, 50, 100] as const,
  defaultBet: 1,
  initialCredits: 1000,

  /** Maximum payout as multiple of bet. */
  maxWin: 500,

  /**
   * When true, line-only spins (no wheels) pay baseWin at implicit 1×.
   * Wheel spins always start multiplier at 0 before applying segments.
   */
  lineWinUsesImplicitOne: true as const,

  symbols: SYMBOLS,
  scatters: SCATTERS,
  paylines: PAYLINES,

  baseGame: {
    /** Independent chance a Rank Wheel lands on each eligible reel (0, 2, 4). */
    wheelChance: 0.1,
    /** Given a wheel lands, chance it is elite. */
    eliteChance: 0.07,
  },

  normalWheel: {
    segments: [
      { id: "n_add_5", kind: "add", value: 5, label: "+5x" },
      { id: "n_add_10", kind: "add", value: 10, label: "+10x" },
      { id: "n_add_15", kind: "add", value: 15, label: "+15x" },
      { id: "n_add_20", kind: "add", value: 20, label: "+20x" },
      { id: "n_add_30", kind: "add", value: 30, label: "+30x" },
      { id: "n_add_50", kind: "add", value: 50, label: "+50x" },
      { id: "n_mul_2", kind: "multiply", value: 2, label: "×2" },
      { id: "n_mul_3", kind: "multiply", value: 3, label: "×3" },
      { id: "n_mul_4", kind: "multiply", value: 4, label: "×4" },
      { id: "n_mul_5", kind: "multiply", value: 5, label: "×5" },
      {
        id: "n_overtime",
        kind: "feature",
        featureType: "overtime",
        label: "OVERTIME",
      },
      {
        id: "n_feature",
        kind: "feature",
        featureType: "champion",
        label: "FEATURE",
      },
      { id: "n_max", kind: "max_win", label: "MAX WIN" },
    ] satisfies WheelSegment[],
    weights: [18, 16, 12, 9, 5, 2, 11, 7, 3, 2, 3, 1, 1] as const,
  },

  eliteWheel: {
    segments: [
      { id: "e_add_10", kind: "add", value: 10, label: "+10x" },
      { id: "e_add_20", kind: "add", value: 20, label: "+20x" },
      { id: "e_add_30", kind: "add", value: 30, label: "+30x" },
      { id: "e_add_50", kind: "add", value: 50, label: "+50x" },
      { id: "e_add_75", kind: "add", value: 75, label: "+75x" },
      { id: "e_add_100", kind: "add", value: 100, label: "+100x" },
      { id: "e_add_250", kind: "add", value: 250, label: "+250x" },
      { id: "e_mul_3", kind: "multiply", value: 3, label: "×3" },
      { id: "e_mul_4", kind: "multiply", value: 4, label: "×4" },
      { id: "e_mul_5", kind: "multiply", value: 5, label: "×5" },
      { id: "e_mul_8", kind: "multiply", value: 8, label: "×8" },
      { id: "e_mul_10", kind: "multiply", value: 10, label: "×10" },
      { id: "e_max", kind: "max_win", label: "MAX WIN" },
    ] satisfies WheelSegment[],
    weights: [14, 12, 10, 8, 5, 3, 1, 10, 8, 5, 3, 2, 2] as const,
  },

  rankUpWheel: {
    segments: [
      { id: "ru_spins_2", kind: "spins", value: 2, label: "+2 SPINS" },
      { id: "ru_end", kind: "end", label: "END SERIES" },
      { id: "ru_rank_up", kind: "rank_up", label: "RANK UP" },
    ] satisfies WheelSegment[],
    // Mostly end; tiny extension; rare true rank up.
    weights: [8, 78, 6] as const,
  },

  features: {
    overtime: {
      spins: 4,
      wheelChance: 0.22,
      eliteChance: 0.1,
    },
    champion: {
      spins: 5,
      wheelChance: 0.28,
      eliteChance: 0.15,
    },
    grand_champion: {
      spins: 6,
      wheelChance: 0.35,
      eliteChance: 0.85,
      disableNormalWheels: true,
    },
    road_to_ssl: {
      spins: 6,
      wheelChance: 0.4,
      eliteChance: 1,
      guaranteeElite: true,
      extraEliteChance: 0.35,
      disableNormalWheels: true,
    },
  } as Record<FeatureType, FeatureModeConfig>,

  /** Feature trigger labels for intro animation. */
  featureMeta: {
    overtime: {
      fromRank: "REGULATION",
      toRank: "OVERTIME",
      title: "OVERTIME",
    },
    champion: {
      fromRank: "DIAMOND",
      toRank: "CHAMPION",
      title: "CHAMPION SERIES",
    },
    grand_champion: {
      fromRank: "CHAMPION",
      toRank: "GRAND CHAMPION",
      title: "GRAND CHAMPION SERIES",
    },
    road_to_ssl: {
      fromRank: "GRAND CHAMPION",
      toRank: "SUPERSONIC LEGEND",
      title: "ROAD TO SSL",
    },
  } as const,

  /**
   * Multi-wheel / segment feature trigger chances (base game only).
   */
  featureTriggers: {
    /** Elite FEATURE (Champion) in base → Grand Champion chance. */
    eliteFeatureGrandChampionChance: 0.35,
    /** Three wheels in base → Road to SSL chance. */
    threeWheelRoadToSslChance: 0.04,
    /** Two elite wheels → Grand Champion. */
    twoEliteGrandChampionChance: 0.25,
    /** Two wheels (no series feature) → Overtime chance. */
    twoWheelOvertimeChance: 0.08,
  },

  bigWinThresholds: [
    { id: "nice", label: "NICE", minMultiple: 10 },
    { id: "big", label: "BIG WIN", minMultiple: 25 },
    { id: "massive", label: "MASSIVE", minMultiple: 50 },
    { id: "insane", label: "INSANE", minMultiple: 100 },
    { id: "legendary", label: "LEGENDARY", minMultiple: 250 },
    { id: "supersonic", label: "SUPERSONIC", minMultiple: 500 },
  ] satisfies BigWinThreshold[],

  timing: {
    normalReelSpinMs: 2000,
    turboReelSpinMs: 600,
    reelStopStaggerMs: 280,
    anticipationExtraMs: 700,
  },

  autoplayOptions: [10, 25, 50, 100] as const,
  /** Sentinel for endless autoplay (manual stop / broke only). */
  autoplayInfinite: -1 as const,

  wheelEligibleReels: [0, 2, 4] as const,
} as const;

export type GameConfig = typeof GAME_CONFIG;

export function isValidBet(bet: number): boolean {
  return (GAME_CONFIG.bets as readonly number[]).includes(bet);
}

export function getNormalWheelWeighted(): WeightedItem<WheelSegment>[] {
  return GAME_CONFIG.normalWheel.segments.map((segment, i) => ({
    item: segment,
    weight: GAME_CONFIG.normalWheel.weights[i],
  }));
}

export function getEliteWheelWeighted(): WeightedItem<WheelSegment>[] {
  return GAME_CONFIG.eliteWheel.segments.map((segment, i) => ({
    item: segment,
    weight: GAME_CONFIG.eliteWheel.weights[i],
  }));
}

export function getRankUpWheelWeighted(): WeightedItem<WheelSegment>[] {
  return GAME_CONFIG.rankUpWheel.segments.map((segment, i) => ({
    item: segment,
    weight: GAME_CONFIG.rankUpWheel.weights[i],
  }));
}

export function getSymbolWeights(): WeightedItem<
  keyof typeof GAME_CONFIG.symbols | keyof typeof GAME_CONFIG.scatters
>[] {
  const pays = Object.values(GAME_CONFIG.symbols).map((symbol) => ({
    item: symbol.id,
    weight: symbol.weight,
  }));
  const scatters = Object.values(GAME_CONFIG.scatters).map((symbol) => ({
    item: symbol.id,
    weight: symbol.weight,
  }));
  return [...pays, ...scatters];
}

/** Resolve big-win tier for a payout / bet ratio (highest matching threshold). */
export function resolveBigWinTier(
  payout: number,
  bet: number,
): BigWinThreshold | undefined {
  if (bet <= 0) return undefined;
  const multiple = payout / bet;
  let matched: BigWinThreshold | undefined;
  for (const threshold of GAME_CONFIG.bigWinThresholds) {
    if (multiple >= threshold.minMultiple) {
      matched = threshold;
    }
  }
  return matched;
}

/**
 * Apply a wheel segment to the running multiplier.
 * add: m += value; multiply: m *= value (from a floor of 1 if m is still 0);
 * max_win / feature / spins / rank_up / end: no direct m change here.
 */
export function applyWheelToMultiplier(
  current: number,
  segment: WheelSegment,
): number {
  switch (segment.kind) {
    case "add":
      return current + (segment.value ?? 0);
    case "multiply": {
      // ×N alone must not stay 0 (0 × 2 === 0). Treat empty mult as 1× base.
      const base = current > 0 ? current : 1;
      return base * (segment.value ?? 1);
    }
    default:
      return current;
  }
}
