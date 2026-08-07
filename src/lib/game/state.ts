/**
 * Explicit game presentation state machine.
 * Drive UI from a single `phase` — avoid unrelated boolean flags.
 */
export type GamePhase =
  | "IDLE"
  | "REQUESTING"
  | "REELS_SPINNING"
  | "REELS_STOPPING"
  | "CHECKING_LINES"
  | "WHEEL_APPEARING"
  | "WHEEL_SPINNING"
  | "WHEEL_RESULT"
  | "APPLYING_MULTIPLIER"
  | "FEATURE_TRIGGER"
  | "FEATURE_INTRO"
  | "FEATURE_SPINNING"
  | "BIG_WIN"
  | "FEATURE_COMPLETE";

export type TurboMode = "NORMAL" | "TURBO";

export interface FeatureSessionView {
  type: import("./types").FeatureType;
  spinsRemaining: number;
  spinsTotal: number;
  featureWin: number;
}

export interface ClientGameState {
  phase: GamePhase;
  bet: number;
  turbo: TurboMode;
  autoplayRemaining: number;
  displayedMultiplier: number;
  wheelIndex: number;
  featureSession: FeatureSessionView | null;
  muted: boolean;
  volume: number;
}

export const INITIAL_CLIENT_STATE: ClientGameState = {
  phase: "IDLE",
  bet: 1,
  turbo: "NORMAL",
  autoplayRemaining: 0,
  displayedMultiplier: 0,
  wheelIndex: 0,
  featureSession: null,
  muted: false,
  volume: 0.7,
};

/** Phases where SKIP advances the current reveal (never submits a new spin). */
export const SKIPPABLE_PHASES: ReadonlySet<GamePhase> = new Set([
  "REELS_SPINNING",
  "REELS_STOPPING",
  "CHECKING_LINES",
  "WHEEL_APPEARING",
  "WHEEL_SPINNING",
  "WHEEL_RESULT",
  "APPLYING_MULTIPLIER",
  "FEATURE_TRIGGER",
  "FEATURE_INTRO",
  "BIG_WIN",
  "FEATURE_COMPLETE",
]);
