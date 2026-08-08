import type {
  PaySymbolId,
  ScatterDefinition,
  ScatterSymbolId,
  SymbolDefinition,
} from "./types";

export const PAY_SYMBOL_IDS: PaySymbolId[] = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "champion",
  "grand_champion",
  "ssl",
];

export const SCATTER_SYMBOL_IDS: ScatterSymbolId[] = ["fennec", "octane"];

/** Paytable tuned via `pnpm simulate -- --spins 1000000 --bet 10` toward ~100% RTP. */
export const SYMBOLS: Record<PaySymbolId, SymbolDefinition> = {
  bronze: {
    id: "bronze",
    label: "Bronze",
    weight: 120,
    payouts: { 3: 0.24, 4: 0.61, 5: 1.85 },
    assetPath: "/ranks/bronze.webp",
    color: "#cd7f32",
  },
  silver: {
    id: "silver",
    label: "Silver",
    weight: 100,
    payouts: { 3: 0.37, 4: 0.88, 5: 2.55 },
    assetPath: "/ranks/silver.webp",
    color: "#c0c0c0",
  },
  gold: {
    id: "gold",
    label: "Gold",
    weight: 88,
    payouts: { 3: 0.44, 4: 1.18, 5: 3.1 },
    assetPath: "/ranks/gold.webp",
    color: "#ffd700",
  },
  platinum: {
    id: "platinum",
    label: "Platinum",
    weight: 66,
    payouts: { 3: 0.61, 4: 1.62, 5: 4.6 },
    assetPath: "/ranks/platinum.webp",
    color: "#7fd3e0",
  },
  diamond: {
    id: "diamond",
    label: "Diamond",
    weight: 44,
    payouts: { 3: 0.93, 4: 2.8, 5: 8.4 },
    assetPath: "/ranks/diamond.webp",
    color: "#4fc3f7",
  },
  champion: {
    id: "champion",
    label: "Champion",
    weight: 22,
    payouts: { 3: 1.32, 4: 4.42, 5: 12.9 },
    assetPath: "/ranks/champion.webp",
    color: "#5c6bc0",
  },
  grand_champion: {
    id: "grand_champion",
    label: "Grand Champion",
    weight: 11,
    payouts: { 3: 2.35, 4: 7.55, 5: 22 },
    assetPath: "/ranks/grand-champion.webp",
    color: "#ab47bc",
  },
  ssl: {
    id: "ssl",
    label: "Supersonic Legend",
    weight: 4,
    payouts: { 3: 3.45, 4: 10.6, 5: 30.5 },
    assetPath: "/ranks/ssl.webp",
    color: "#e040fb",
  },
};

/**
 * Scatters land anywhere (not payline-bound).
 * - Fennec: combo scatter — pays 3 / 4 / 5 anywhere
 * - Octane: free-games scatter — 3+ triggers Overtime (base game)
 */
export const SCATTERS: Record<ScatterSymbolId, ScatterDefinition> = {
  fennec: {
    id: "fennec",
    label: "Fennec",
    weight: 9,
    role: "combo",
    payouts: { 3: 0.83, 4: 2.75, 5: 8.7 },
    assetPath: "/scatters/fennec.png",
    color: "#f59e0b",
  },
  octane: {
    id: "octane",
    label: "Octane",
    weight: 8,
    role: "free_games",
    freeGamesAt: 3,
    assetPath: "/scatters/octane.png",
    color: "#38bdf8",
  },
};

export function isPaySymbol(id: string): id is PaySymbolId {
  return id in SYMBOLS;
}

export function isScatterSymbol(id: string): id is ScatterSymbolId {
  return id in SCATTERS;
}

export function isWheelSymbol(
  id: string,
): id is "rank_wheel" | "elite_rank_wheel" {
  return id === "rank_wheel" || id === "elite_rank_wheel";
}
