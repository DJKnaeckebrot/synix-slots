import { randomUUID } from "node:crypto";
import {
  applyWheelToMultiplier,
  GAME_CONFIG,
  getEliteWheelWeighted,
  getNormalWheelWeighted,
  getSymbolWeights,
  isValidBet,
  resolveBigWinTier,
} from "../config";
import {
  chance,
  cryptoRandomInt,
  type RandomIntFn,
  weightedSymbol,
  weightedWheelSegment,
} from "../rng";
import type {
  FeatureState,
  FeatureType,
  SpinResult,
  SymbolId,
  WheelKind,
  WheelReelIndex,
  WheelResult,
  WheelSegment,
} from "../types";
import { evaluatePaylines, sumBaseWin } from "./paylines";
import { evaluateScatters } from "./scatters";

export type DevSpinOverride = {
  forceWheelReels?: WheelReelIndex[];
  forceEliteReels?: WheelReelIndex[];
  forceSegments?: Partial<Record<WheelReelIndex, string>>;
  forceFeature?: FeatureType;
  forceMaxWin?: boolean;
};

export type GenerateSpinInput = {
  bet: number;
  clientRequestId: string;
  /** Active feature mode for this spin (null = base game). */
  featureMode?: FeatureType | null;
  /** When true, bet is used for payout math but not deducted (free feature spin). */
  isFeatureSpin?: boolean;
  balanceBefore: number;
  randomIntFn?: RandomIntFn;
  /** Development-only. Rejected by API in production. */
  override?: DevSpinOverride;
};

export type GeneratedSpin = Omit<SpinResult, "balanceAfter"> & {
  balanceAfter: number;
};

function pickPaySymbol(randomIntFn: RandomIntFn): SymbolId {
  return weightedSymbol(getSymbolWeights(), randomIntFn);
}

function buildBaseGrid(randomIntFn: RandomIntFn): SymbolId[][] {
  const { reels, rows } = GAME_CONFIG.grid;
  return Array.from({ length: reels }, () =>
    Array.from({ length: rows }, () => pickPaySymbol(randomIntFn)),
  );
}

function placeWheelOnReel(
  grid: SymbolId[][],
  reel: WheelReelIndex,
  kind: "rank_wheel" | "elite_rank_wheel",
  randomIntFn: RandomIntFn,
): void {
  const row = randomIntFn(0, GAME_CONFIG.grid.rows);
  grid[reel][row] = kind;
}

function resolveWheelPlacement(
  featureMode: FeatureType | null | undefined,
  randomIntFn: RandomIntFn,
  override?: DevSpinOverride,
): { reel: WheelReelIndex; kind: WheelKind }[] {
  const eligible = [...GAME_CONFIG.wheelEligibleReels] as WheelReelIndex[];
  const placed: { reel: WheelReelIndex; kind: WheelKind }[] = [];

  if (override?.forceWheelReels || override?.forceEliteReels) {
    const eliteSet = new Set(override.forceEliteReels ?? []);
    const wheelSet = new Set([
      ...(override.forceWheelReels ?? []),
      ...eliteSet,
    ]);
    for (const reel of eligible) {
      if (!wheelSet.has(reel)) continue;
      placed.push({
        reel,
        kind: eliteSet.has(reel) ? "elite" : "normal",
      });
    }
    return placed.sort((a, b) => a.reel - b.reel);
  }

  const modeConfig = featureMode ? GAME_CONFIG.features[featureMode] : null;

  if (modeConfig?.guaranteeElite) {
    const guaranteeReel =
      eligible[randomIntFn(0, eligible.length)] ?? eligible[0];
    placed.push({ reel: guaranteeReel, kind: "elite" });

    for (const reel of eligible) {
      if (reel === guaranteeReel) continue;
      if (chance(modeConfig.extraEliteChance ?? 0, randomIntFn)) {
        placed.push({ reel, kind: "elite" });
      }
    }
    return placed.sort((a, b) => a.reel - b.reel);
  }

  const wheelChance =
    modeConfig?.wheelChance ?? GAME_CONFIG.baseGame.wheelChance;
  const eliteChance =
    modeConfig?.eliteChance ?? GAME_CONFIG.baseGame.eliteChance;
  const disableNormal = modeConfig?.disableNormalWheels ?? false;

  for (const reel of eligible) {
    if (!chance(wheelChance, randomIntFn)) continue;

    const isElite = chance(eliteChance, randomIntFn);
    if (!isElite && disableNormal) {
      // Skip normal wheels when disabled (Grand Champion / SSL).
      if (chance(eliteChance, randomIntFn)) {
        placed.push({ reel, kind: "elite" });
      }
      continue;
    }

    placed.push({ reel, kind: isElite ? "elite" : "normal" });
  }

  return placed;
}

function pickSegment(
  kind: WheelKind,
  randomIntFn: RandomIntFn,
  forcedSegmentId?: string,
): WheelSegment {
  const pool =
    kind === "elite" ? getEliteWheelWeighted() : getNormalWheelWeighted();

  if (forcedSegmentId) {
    const found = pool.find((w) => w.item.id === forcedSegmentId);
    if (found) return found.item;
  }

  return weightedWheelSegment(pool, randomIntFn);
}

function resolveFeatureTrigger(args: {
  featureMode: FeatureType | null | undefined;
  wheels: WheelResult[];
  segments: WheelSegment[];
  randomIntFn: RandomIntFn;
  forceFeature?: FeatureType;
  /** Octane scatter free-games trigger. */
  scatterFreeGames?: boolean;
}): FeatureState {
  if (args.forceFeature) {
    return {
      triggered: true,
      type: args.forceFeature,
      spinsAwarded: GAME_CONFIG.features[args.forceFeature].spins,
    };
  }

  // Features only trigger from base game (not while already in a feature).
  if (args.featureMode) {
    return { triggered: false };
  }

  const eliteCount = args.wheels.filter((w) => w.kind === "elite").length;
  const wheelCount = args.wheels.length;
  const overtimeSegment = args.segments.some(
    (s) => s.kind === "feature" && s.featureType === "overtime",
  );
  const hasSeriesFeature = args.segments.some(
    (s) => s.kind === "feature" && s.featureType !== "overtime",
  );

  if (
    wheelCount >= 3 &&
    chance(
      GAME_CONFIG.featureTriggers.threeWheelRoadToSslChance,
      args.randomIntFn,
    )
  ) {
    return {
      triggered: true,
      type: "road_to_ssl",
      spinsAwarded: GAME_CONFIG.features.road_to_ssl.spins,
    };
  }

  if (
    eliteCount >= 2 &&
    chance(
      GAME_CONFIG.featureTriggers.twoEliteGrandChampionChance,
      args.randomIntFn,
    )
  ) {
    return {
      triggered: true,
      type: "grand_champion",
      spinsAwarded: GAME_CONFIG.features.grand_champion.spins,
    };
  }

  if (hasSeriesFeature) {
    const eliteSeries = args.segments.some(
      (s, i) =>
        s.kind === "feature" &&
        s.featureType !== "overtime" &&
        args.wheels[i]?.kind === "elite",
    );
    if (
      eliteSeries &&
      chance(
        GAME_CONFIG.featureTriggers.eliteFeatureGrandChampionChance,
        args.randomIntFn,
      )
    ) {
      return {
        triggered: true,
        type: "grand_champion",
        spinsAwarded: GAME_CONFIG.features.grand_champion.spins,
      };
    }
    return {
      triggered: true,
      type: "champion",
      spinsAwarded: GAME_CONFIG.features.champion.spins,
    };
  }

  if (overtimeSegment) {
    return {
      triggered: true,
      type: "overtime",
      spinsAwarded: GAME_CONFIG.features.overtime.spins,
    };
  }

  if (
    wheelCount >= 2 &&
    chance(GAME_CONFIG.featureTriggers.twoWheelOvertimeChance, args.randomIntFn)
  ) {
    return {
      triggered: true,
      type: "overtime",
      spinsAwarded: GAME_CONFIG.features.overtime.spins,
    };
  }

  // Octane scatter: 3+ anywhere → Overtime free games.
  if (args.scatterFreeGames) {
    return {
      triggered: true,
      type: "overtime",
      spinsAwarded: GAME_CONFIG.features.overtime.spins,
    };
  }

  return { triggered: false };
}

/**
 * Pure authoritative spin generator.
 * Shared by production API and Monte Carlo simulator.
 */
export function generateSpin(input: GenerateSpinInput): GeneratedSpin {
  const {
    bet,
    clientRequestId,
    featureMode = null,
    isFeatureSpin = false,
    balanceBefore,
    override,
  } = input;
  const randomIntFn = input.randomIntFn ?? cryptoRandomInt;

  if (!isValidBet(bet)) {
    throw new Error("invalid_bet");
  }
  const debit = isFeatureSpin ? 0 : bet;
  if (balanceBefore < debit) {
    throw new Error("insufficient_credits");
  }

  // Pay + scatter grid first — wheels only stamp after a real win (or dev force).
  const grid = buildBaseGrid(randomIntFn);
  const paylines = evaluatePaylines(grid, bet);
  const scatters = evaluateScatters(grid, bet);
  const lineWin = sumBaseWin(paylines);
  const baseWin = lineWin + scatters.totalWin;

  const hasForceWheels = Boolean(
    override?.forceWheelReels?.length || override?.forceEliteReels?.length,
  );
  const placements =
    baseWin > 0 || hasForceWheels
      ? resolveWheelPlacement(featureMode, randomIntFn, override)
      : [];

  for (const { reel, kind } of placements) {
    placeWheelOnReel(
      grid,
      reel,
      kind === "elite" ? "elite_rank_wheel" : "rank_wheel",
      randomIntFn,
    );
  }

  let spinMultiplier = 0;
  const wheels: WheelResult[] = [];
  const resolvedSegments: WheelSegment[] = [];
  const forceCap = Boolean(override?.forceMaxWin);

  for (const { reel, kind } of placements) {
    const segment = pickSegment(
      kind,
      randomIntFn,
      override?.forceSegments?.[reel],
    );
    resolvedSegments.push(segment);

    const before = spinMultiplier;
    if (segment.kind === "max_win") {
      // Strong multiplier floor — full bet×maxWin only via natural cap or forceMaxWin.
      const floor = kind === "elite" ? 250 : 100;
      spinMultiplier = Math.max(spinMultiplier, floor);
    } else {
      spinMultiplier = applyWheelToMultiplier(spinMultiplier, segment);
    }
    const after = spinMultiplier;

    wheels.push({
      reel,
      kind,
      segmentId: segment.id,
      label: segment.label,
      multiplierBefore: before,
      multiplierAfter: after,
    });
  }

  const hasWheels = wheels.length > 0;
  const effectiveMultiplier = hasWheels
    ? spinMultiplier
    : GAME_CONFIG.lineWinUsesImplicitOne
      ? 1
      : 0;

  // Wheels require a win in production; forced wheels with baseWin 0 pay nothing.
  const rawPayout =
    hasWheels && baseWin > 0
      ? Math.floor(baseWin * effectiveMultiplier)
      : hasWheels
        ? 0
        : baseWin;

  const maxPayout = bet * GAME_CONFIG.maxWin;
  let payout = Math.min(rawPayout, maxPayout);
  let cappedAtMaxWin = rawPayout > maxPayout || (forceCap && baseWin > 0);

  if (forceCap && baseWin > 0) {
    payout = maxPayout;
    cappedAtMaxWin = true;
    spinMultiplier = hasWheels ? spinMultiplier : effectiveMultiplier;
  }

  // Display multiplier: line-only uses 1; wheel spins show computed m (may be 0).
  const finalMultiplier = hasWheels
    ? forceCap && cappedAtMaxWin && baseWin > 0
      ? Math.max(spinMultiplier, maxPayout / Math.max(baseWin, 1))
      : spinMultiplier
    : baseWin > 0
      ? 1
      : 0;

  const feature = resolveFeatureTrigger({
    featureMode,
    wheels,
    segments: resolvedSegments,
    randomIntFn,
    forceFeature: override?.forceFeature,
    scatterFreeGames: scatters.freeGames,
  });

  const balanceAfter = balanceBefore - debit + payout;
  const bigWin = resolveBigWinTier(payout, bet);

  return {
    id: randomUUID(),
    clientRequestId,
    grid,
    bet,
    paylines,
    scatters:
      scatters.fennecCount > 0 || scatters.octaneCount > 0
        ? scatters
        : undefined,
    baseWin,
    wheels,
    finalMultiplier: Number(finalMultiplier.toFixed(4)),
    payout,
    feature: feature.triggered ? feature : { triggered: false },
    balanceAfter,
    cappedAtMaxWin,
    bigWinTier: bigWin?.id,
  };
}
