/** Rank / pay symbols, scatters, and special wheel markers. */
export type PaySymbolId =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "champion"
  | "grand_champion"
  | "ssl";

export type ScatterSymbolId = "fennec" | "octane";

export type SymbolId =
  | PaySymbolId
  | ScatterSymbolId
  | "rank_wheel"
  | "elite_rank_wheel";

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
  | "spins"
  | "end";

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

export interface ScatterWin {
  symbol: ScatterSymbolId;
  count: 3 | 4 | 5;
  positions: [number, number][];
  win: number;
}

export interface ScatterResult {
  wins: ScatterWin[];
  /** Total scatter credits before multiplier. */
  totalWin: number;
  fennecCount: number;
  octaneCount: number;
  /** Octane free-games trigger (base game). */
  freeGames: boolean;
  positions: [number, number][];
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
  /** Credits deducted for this spin (0 during free feature spins). */
  debit: number;
  /** Ante mode: 3× stake for boosted wheels / scatters / features. */
  featureSpins?: boolean;
  paylines: WinningPayline[];
  scatters?: ScatterResult;
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

export type ScatterRole = "combo" | "free_games";

export interface ScatterDefinition {
  id: ScatterSymbolId;
  label: string;
  weight: number;
  role: ScatterRole;
  /** Combo scatter pays for 3 / 4 / 5 anywhere (multiples of bet). */
  payouts?: { 3: number; 4: number; 5: number };
  /** Min count anywhere to trigger free games. */
  freeGamesAt?: number;
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
