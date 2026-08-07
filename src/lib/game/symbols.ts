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

/** Placeholder paytable — re-tune via `pnpm simulate` toward ~94–96% RTP. */
export const SYMBOLS: Record<PaySymbolId, SymbolDefinition> = {
  bronze: {
    id: "bronze",
    label: "Bronze",
    weight: 120,
    payouts: { 3: 0.3, 4: 0.7, 5: 2.2 },
    assetPath: "/ranks/bronze.webp",
    color: "#cd7f32",
  },
  silver: {
    id: "silver",
    label: "Silver",
    weight: 100,
    payouts: { 3: 0.4, 4: 1.1, 5: 2.8 },
    assetPath: "/ranks/silver.webp",
    color: "#c0c0c0",
  },
  gold: {
    id: "gold",
    label: "Gold",
    weight: 90,
    payouts: { 3: 0.45, 4: 1.2, 5: 3 },
    assetPath: "/ranks/gold.webp",
    color: "#ffd700",
  },
  platinum: {
    id: "platinum",
    label: "Platinum",
    weight: 70,
    payouts: { 3: 0.7, 4: 2, 5: 5 },
    assetPath: "/ranks/platinum.webp",
    color: "#7fd3e0",
  },
  diamond: {
    id: "diamond",
    label: "Diamond",
    weight: 50,
    payouts: { 3: 1, 4: 3, 5: 10 },
    assetPath: "/ranks/diamond.webp",
    color: "#4fc3f7",
  },
  champion: {
    id: "champion",
    label: "Champion",
    weight: 28,
    payouts: { 3: 1.8, 4: 6, 5: 18 },
    assetPath: "/ranks/champion.webp",
    color: "#5c6bc0",
  },
  grand_champion: {
    id: "grand_champion",
    label: "Grand Champion",
    weight: 14,
    payouts: { 3: 3.5, 4: 12, 5: 35 },
    assetPath: "/ranks/grand-champion.webp",
    color: "#ab47bc",
  },
  ssl: {
    id: "ssl",
    label: "Supersonic Legend",
    weight: 6,
    payouts: { 3: 5, 4: 15, 5: 50 },
    assetPath: "/ranks/ssl.webp",
    color: "#e040fb",
  },
};

/**
 * Scatters land anywhere (not payline-bound).
 * - Fennec: combo scatter — pays 3 / 4 / 5 anywhere
 * - Octane: free-games scatter — 3+ triggers Overtime (base game)
 *
 * Drop icons at the assetPath (png or webp).
 */
export const SCATTERS: Record<ScatterSymbolId, ScatterDefinition> = {
  fennec: {
    id: "fennec",
    label: "Fennec",
    weight: 14,
    role: "combo",
    payouts: { 3: 1.2, 4: 4, 5: 15 },
    assetPath: "/scatters/fennec.png",
    color: "#f59e0b",
  },
  octane: {
    id: "octane",
    label: "Octane",
    weight: 9,
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
