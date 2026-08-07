import { GAME_CONFIG, getRankUpWheelWeighted } from "@/lib/game/config";
import {
  cryptoRandomInt,
  type RandomIntFn,
  weightedWheelSegment,
} from "@/lib/game/rng";
import type { FeatureType, WheelSegment } from "@/lib/game/types";

const UPGRADE: Partial<Record<FeatureType, FeatureType>> = {
  overtime: "champion",
  champion: "grand_champion",
  grand_champion: "road_to_ssl",
};

export type RankUpOutcome =
  | {
      kind: "spins";
      spins: number;
      segment: WheelSegment;
      featureType: FeatureType;
    }
  | {
      kind: "end";
      segment: WheelSegment;
      featureType: FeatureType;
    }
  | {
      kind: "upgrade";
      from: FeatureType;
      to: FeatureType;
      spins: number;
      segment: WheelSegment;
    };

export function resolveRankUp(args: {
  currentFeature: FeatureType;
  randomIntFn?: RandomIntFn;
}): RankUpOutcome {
  const randomIntFn = args.randomIntFn ?? cryptoRandomInt;
  const segment = weightedWheelSegment(getRankUpWheelWeighted(), randomIntFn);

  if (segment.kind === "rank_up") {
    const next = UPGRADE[args.currentFeature];
    if (!next) {
      // Already at top — award spins instead.
      return {
        kind: "spins",
        spins: 5,
        segment,
        featureType: args.currentFeature,
      };
    }
    return {
      kind: "upgrade",
      from: args.currentFeature,
      to: next,
      spins: GAME_CONFIG.features[next].spins,
      segment,
    };
  }

  if (segment.kind === "end") {
    return {
      kind: "end",
      segment,
      featureType: args.currentFeature,
    };
  }

  return {
    kind: "spins",
    spins: segment.value ?? 3,
    segment,
    featureType: args.currentFeature,
  };
}
