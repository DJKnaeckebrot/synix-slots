import { NextResponse } from "next/server";
import { isValidBet, resolveSpinDebit } from "@/lib/game/config";
import { type DevSpinOverride, generateSpin } from "@/lib/game/engine";
import { syncFeatureSessionAfterSpin } from "@/lib/game/feature-session";
import type { FeatureType, SpinResult } from "@/lib/game/types";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type SpinBody = {
  bet: number;
  clientRequestId: string;
  /** Ante mode: 3× stake for boosted odds (ignored during free feature spins). */
  featureSpins?: boolean;
  override?: DevSpinOverride;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(request: Request) {
  let body: SpinBody;
  try {
    body = (await request.json()) as SpinBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { bet, clientRequestId, override } = body;
  const wantFeatureSpins = Boolean(body.featureSpins);

  if (!Number.isInteger(bet) || !isValidBet(bet)) {
    return NextResponse.json({ error: "invalid_bet" }, { status: 400 });
  }

  if (!clientRequestId || !isUuid(clientRequestId)) {
    return NextResponse.json(
      { error: "invalid_client_request_id" },
      { status: 400 },
    );
  }

  if (override && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "dev_overrides_not_allowed" },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("slot_spins")
    .select("result")
    .eq("client_request_id", clientRequestId)
    .maybeSingle();

  if (existing?.result) {
    const stored = existing.result as SpinResult;
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      spin: {
        ...stored,
        balanceAfter: Number(profile?.credits ?? stored.balanceAfter),
      },
      idempotent: true,
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  const { data: featureSession } = await supabase
    .from("feature_sessions")
    .select("id, feature_type, spins_remaining, feature_win")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const featureMode =
    (featureSession?.feature_type as FeatureType | null) ?? null;
  const isFeatureSpin = Boolean(featureSession);
  const featureSpins = wantFeatureSpins && !isFeatureSpin;
  const debit = resolveSpinDebit({ bet, isFeatureSpin, featureSpins });
  const balanceBefore = Number(profile.credits);

  if (balanceBefore < debit) {
    return NextResponse.json(
      { error: "insufficient_credits" },
      { status: 400 },
    );
  }

  let spin: SpinResult;
  try {
    spin = generateSpin({
      bet,
      clientRequestId,
      balanceBefore,
      featureMode,
      isFeatureSpin,
      featureSpins,
      override: process.env.NODE_ENV === "development" ? override : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "spin_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  let balanceAfter = spin.balanceAfter;
  let idempotent = false;

  if (isFeatureSpin) {
    const service = createServiceClient();

    const { data: locked, error: lockError } = await service
      .from("profiles")
      .select(
        "credits, total_spins, total_won, biggest_win, highest_multiplier",
      )
      .eq("id", user.id)
      .single();

    if (lockError || !locked) {
      return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
    }

    balanceAfter = Number(locked.credits) + spin.payout;

    const { error: updateError } = await service
      .from("profiles")
      .update({
        credits: balanceAfter,
        total_spins: Number(locked.total_spins) + 1,
        total_won: Number(locked.total_won) + spin.payout,
        biggest_win: Math.max(Number(locked.biggest_win), spin.payout),
        highest_multiplier: Math.max(
          Number(locked.highest_multiplier),
          spin.finalMultiplier,
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "settle_failed", detail: updateError.message },
        { status: 500 },
      );
    }

    const { error: insertError } = await service.from("slot_spins").insert({
      user_id: user.id,
      client_request_id: clientRequestId,
      bet,
      payout: spin.payout,
      multiplier: spin.finalMultiplier,
      feature_type: featureMode,
      grid: spin.grid,
      wheel_results: spin.wheels,
      winning_lines: spin.paylines,
      result: { ...spin, balanceAfter },
    });

    if (insertError) {
      if (insertError.code === "23505") {
        idempotent = true;
      } else {
        return NextResponse.json(
          { error: "spin_insert_failed", detail: insertError.message },
          { status: 500 },
        );
      }
    }
  } else {
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "execute_spin",
      {
        // RPC debits p_bet — pass ante cost when Feature Spins is on.
        p_bet: debit,
        p_client_request_id: clientRequestId,
        p_result: spin,
        p_dev_override: null,
      },
    );

    if (rpcError) {
      const msg = rpcError.message ?? "execute_spin_failed";
      if (msg.includes("insufficient_credits")) {
        return NextResponse.json(
          { error: "insufficient_credits" },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "execute_spin_failed", detail: msg },
        { status: 500 },
      );
    }

    balanceAfter = Number(
      (rpcResult as { balance_after?: number } | null)?.balance_after ??
        spin.balanceAfter,
    );
    idempotent = Boolean(
      (rpcResult as { idempotent?: boolean } | null)?.idempotent,
    );
  }

  try {
    await syncFeatureSessionAfterSpin({
      userId: user.id,
      payout: spin.payout,
      triggered:
        !isFeatureSpin && spin.feature?.triggered && spin.feature.type
          ? {
              type: spin.feature.type,
              spinsAwarded: spin.feature.spinsAwarded ?? 10,
            }
          : undefined,
      hadActiveSession: Boolean(featureSession),
      activeSessionId: featureSession?.id,
      spinsRemainingBefore: featureSession?.spins_remaining,
      featureWinBefore: featureSession ? Number(featureSession.feature_win) : 0,
    });
  } catch {
    // Feature bookkeeping failure must not undo an already-settled spin.
  }

  return NextResponse.json({
    spin: { ...spin, balanceAfter },
    idempotent,
  });
}
