/** Rank / pay symbols and special wheel markers. */
export type SymbolId =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "champion"
  | "grand_champion"
  | "ssl"
  | "rank_wheel"
  | "elite_rank_wheel";

export type PaySymbolId = Exclude<SymbolId, "rank_wheel" | "elite_rank_wheel">;

export type FeatureType =
  | "overtime"
  | "champion"
  | "grand_champion"
  | "road_to_ssl";

export type WheelKind = "normal" | "elite" | "rank_up";

export type WheelSegmentKind =
  | "add"
  | "multiply"
  | "feature"
  | "max_win"
  | "rank_up"
  | "spins";

export type BigWinTierId =
  | "nice"
  | "big"
  | "massive"
  | "insane"
  | "legendary"
  | "supersonic";

/** Eligible Rank Wheel reels (1-based reels 1, 3, 5). */
export type WheelReelIndex = 0 | 2 | 4;

export interface WheelSegment {
  id: string;
  kind: WheelSegmentKind;
  /** Additive amount, multiply factor, or spin award depending on kind. */
  value?: number;
  featureType?: FeatureType;
  label: string;
}

export interface WheelResult {
  reel: WheelReelIndex;
  kind: WheelKind;
  segmentId: string;
  label: string;
  multiplierBefore: number;
  multiplierAfter: number;
}

export interface WinningPayline {
  paylineId: number;
  symbol: PaySymbolId;
  count: 3 | 4 | 5;
  /** [reel, row] pairs for the winning streak. */
  positions: [number, number][];
  /** Win amount before spinMultiplier. */
  win: number;
}

export interface FeatureState {
  triggered: boolean;
  type?: FeatureType;
  spinsAwarded?: number;
  rankUpOffered?: boolean;
}

/**
 * Immutable server-authored spin outcome.
 * Client animations only reveal this payload.
 */
export interface SpinResult {
  id: string;
  clientRequestId: string;
  /** grid[reel][row] — 5 reels × 4 rows. */
  grid: SymbolId[][];
  bet: number;
  paylines: WinningPayline[];
  baseWin: number;
  wheels: WheelResult[];
  finalMultiplier: number;
  payout: number;
  feature?: FeatureState;
  balanceAfter: number;
  cappedAtMaxWin: boolean;
  bigWinTier?: BigWinTierId;
}

export interface SymbolDefinition {
  id: PaySymbolId;
  label: string;
  weight: number;
  /** Payout as multiples of bet for 3 / 4 / 5 of a kind. */
  payouts: { 3: number; 4: number; 5: number };
  assetPath: string;
  color: string;
}

export interface WeightedItem<T> {
  item: T;
  weight: number;
}

export interface FeatureModeConfig {
  spins: number;
  wheelChance: number;
  eliteChance: number;
  /** Road to SSL: guarantee at least one elite wheel. */
  guaranteeElite?: boolean;
  /** Chance for each additional eligible reel to get an elite wheel. */
  extraEliteChance?: number;
  /** Disable normal (non-elite) wheels. */
  disableNormalWheels?: boolean;
}

export interface BigWinThreshold {
  id: BigWinTierId;
  label: string;
  /** Minimum payout / bet ratio. */
  minMultiple: number;
}
