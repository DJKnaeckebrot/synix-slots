import { NextResponse } from "next/server";
import { resolveRankUp } from "@/lib/game/engine/rank-up";
import type { FeatureType } from "@/lib/game/types";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type Body = {
  action: "keep" | "try";
  clientRequestId: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.action !== "keep" && body.action !== "try") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }
  if (!body.clientRequestId || !isUuid(body.clientRequestId)) {
    return NextResponse.json(
      { error: "invalid_client_request_id" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data: session } = await supabase
    .from("feature_sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  // Also allow rank-up offer right after a session just completed (most recent).
  let featureType = session?.feature_type as FeatureType | undefined;
  let sessionId = session?.id as string | undefined;

  if (!session) {
    const { data: recent } = await supabase
      .from("feature_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    featureType = recent?.feature_type as FeatureType | undefined;
    sessionId = recent?.id;
  }

  if (!featureType || !sessionId) {
    return NextResponse.json({ error: "no_feature_session" }, { status: 400 });
  }

  const service = createServiceClient();

  if (body.action === "keep") {
    return NextResponse.json({
      kept: true,
      featureType,
    });
  }

  const outcome = resolveRankUp({ currentFeature: featureType });

  if (outcome.kind === "end") {
    // Ensure session stays completed / leave series.
    await service
      .from("feature_sessions")
      .update({
        status: "completed",
        spins_remaining: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    return NextResponse.json({
      outcome: {
        type: "end",
        label: outcome.segment.label,
        featureType: outcome.featureType,
      },
    });
  }

  if (outcome.kind === "spins") {
    await service
      .from("feature_sessions")
      .update({
        status: "active",
        spins_remaining: outcome.spins,
        spins_total: outcome.spins,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    return NextResponse.json({
      outcome: {
        type: "spins",
        spins: outcome.spins,
        label: outcome.segment.label,
        featureType: outcome.featureType,
      },
    });
  }

  await service
    .from("feature_sessions")
    .update({
      status: "active",
      feature_type: outcome.to,
      spins_remaining: outcome.spins,
      spins_total: outcome.spins,
      feature_win: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  return NextResponse.json({
    outcome: {
      type: "upgrade",
      from: outcome.from,
      to: outcome.to,
      spins: outcome.spins,
      label: outcome.segment.label,
    },
  });
}
