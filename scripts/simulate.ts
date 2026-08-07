/**
 * Monte Carlo simulator — uses EXACTLY the same generateSpin + GAME_CONFIG as production.
 *
 * Usage:
 *   pnpm simulate
 *   pnpm simulate -- --spins 100000
 */
import { GAME_CONFIG } from "../src/lib/game/config";
import { generateSpin } from "../src/lib/game/engine/spin";
import type { FeatureType } from "../src/lib/game/types";

function parseSpins(argv: string[]): number {
  const idx = argv.indexOf("--spins");
  if (idx >= 0 && argv[idx + 1]) {
    const n = Number(argv[idx + 1]);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  }
  return 1_000_000;
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function bucket(multiple: number): string {
  if (multiple <= 0) return "0x";
  if (multiple < 1) return "0–1x";
  if (multiple < 5) return "1–5x";
  if (multiple < 10) return "5–10x";
  if (multiple < 50) return "10–50x";
  if (multiple < 100) return "50–100x";
  if (multiple < 500) return "100–500x";
  return "500x+";
}

const spins = parseSpins(process.argv.slice(2));
const bet = 1;
const buckets: Record<string, number> = {
  "0x": 0,
  "0–1x": 0,
  "1–5x": 0,
  "5–10x": 0,
  "10–50x": 0,
  "50–100x": 0,
  "100–500x": 0,
  "500x+": 0,
};

let totalPayout = 0;
let hits = 0;
let wheelSpins = 0;
let oneWheel = 0;
let twoWheels = 0;
let threeWheels = 0;
let maxMult = 0;
let maxPayout = 0;
const payouts: number[] = [];
const featureCounts: Record<FeatureType, number> = {
  overtime: 0,
  champion: 0,
  grand_champion: 0,
  road_to_ssl: 0,
};

// Feature package simulation: when a feature triggers, play out free spins
// with the same engine (no extra bet debit conceptually — still count payouts).
const start = Date.now();

for (let i = 0; i < spins; i++) {
  const base = generateSpin({
    bet,
    clientRequestId: `00000000-0000-4000-8000-${(i % 1e12).toString().padStart(12, "0")}`,
    balanceBefore: 1_000_000_000,
  });

  let packagePayout = base.payout;
  const wheelCount = base.wheels.length;
  if (wheelCount > 0) wheelSpins += 1;
  if (wheelCount === 1) oneWheel += 1;
  if (wheelCount === 2) twoWheels += 1;
  if (wheelCount === 3) threeWheels += 1;
  maxMult = Math.max(maxMult, base.finalMultiplier);

  if (base.feature?.triggered && base.feature.type) {
    featureCounts[base.feature.type] += 1;
    const mode = base.feature.type;
    const freeSpins =
      base.feature.spinsAwarded ?? GAME_CONFIG.features[mode].spins;
    for (let s = 0; s < freeSpins; s++) {
      const fs = generateSpin({
        bet,
        clientRequestId: `00000000-0000-4000-8001-${((i * 20 + s) % 1e12).toString().padStart(12, "0")}`,
        balanceBefore: 1_000_000_000,
        featureMode: mode,
        isFeatureSpin: true,
      });
      packagePayout += fs.payout;
      maxMult = Math.max(maxMult, fs.finalMultiplier);
    }
  }

  totalPayout += packagePayout;
  if (packagePayout > 0) hits += 1;
  maxPayout = Math.max(maxPayout, packagePayout);
  payouts.push(packagePayout);
  buckets[bucket(packagePayout / bet)] += 1;

  if ((i + 1) % 100_000 === 0) {
    process.stderr.write(`… ${(((i + 1) / spins) * 100).toFixed(0)}%\n`);
  }
}

payouts.sort((a, b) => a - b);
const elapsed = ((Date.now() - start) / 1000).toFixed(1);
const rtp = (totalPayout / (spins * bet)) * 100;

const report = {
  spins,
  bet,
  elapsedSeconds: Number(elapsed),
  RTP_percent: Number(rtp.toFixed(3)),
  hitFrequency_percent: Number(((hits / spins) * 100).toFixed(3)),
  averagePayout: Number((totalPayout / spins).toFixed(4)),
  medianPayout: median(payouts),
  wheelFrequency_percent: Number(((wheelSpins / spins) * 100).toFixed(3)),
  oneWheel_percent: Number(((oneWheel / spins) * 100).toFixed(3)),
  twoWheels_percent: Number(((twoWheels / spins) * 100).toFixed(3)),
  threeWheels_percent: Number(((threeWheels / spins) * 100).toFixed(3)),
  championSeries_perMillion: Number(
    ((featureCounts.champion / spins) * 1_000_000).toFixed(1),
  ),
  overtime_perMillion: Number(
    ((featureCounts.overtime / spins) * 1_000_000).toFixed(1),
  ),
  grandChampionSeries_perMillion: Number(
    ((featureCounts.grand_champion / spins) * 1_000_000).toFixed(1),
  ),
  roadToSsl_perMillion: Number(
    ((featureCounts.road_to_ssl / spins) * 1_000_000).toFixed(1),
  ),
  maxMultiplierObserved: maxMult,
  maxPayoutObserved: maxPayout,
  distribution: Object.fromEntries(
    Object.entries(buckets).map(([k, v]) => [
      k,
      {
        count: v,
        percent: Number(((v / spins) * 100).toFixed(3)),
      },
    ]),
  ),
  targetRtpBand: "94–96% (tune GAME_CONFIG if outside after 1e6 spins)",
};

console.log(JSON.stringify(report, null, 2));
