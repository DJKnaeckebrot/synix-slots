import { GAME_CONFIG } from "@/lib/game/config";
import type { FeatureType } from "@/lib/game/types";
import { createServiceClient } from "@/lib/supabase/server";

export async function syncFeatureSessionAfterSpin(args: {
  userId: string;
  payout: number;
  triggered?: { type: FeatureType; spinsAwarded: number };
  hadActiveSession: boolean;
  activeSessionId?: string;
  spinsRemainingBefore?: number;
  featureWinBefore?: number;
}) {
  const service = createServiceClient();

  if (args.hadActiveSession && args.activeSessionId) {
    const remaining = Math.max(0, (args.spinsRemainingBefore ?? 1) - 1);
    const featureWin = (args.featureWinBefore ?? 0) + args.payout;
    await service
      .from("feature_sessions")
      .update({
        spins_remaining: remaining,
        feature_win: featureWin,
        status: remaining === 0 ? "completed" : "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", args.activeSessionId);
    return;
  }

  if (args.triggered?.type) {
    // Close any stray active session then open the new one.
    await service
      .from("feature_sessions")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("user_id", args.userId)
      .eq("status", "active");

    const spins =
      args.triggered.spinsAwarded ??
      GAME_CONFIG.features[args.triggered.type].spins;

    await service.from("feature_sessions").insert({
      user_id: args.userId,
      feature_type: args.triggered.type,
      spins_remaining: spins,
      spins_total: spins,
      feature_win: 0,
      status: "active",
    });
  }
}
