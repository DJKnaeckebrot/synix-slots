import { NextResponse } from "next/server";
import {
  isLeaderboardMetric,
  type LeaderboardEntry,
  type LeaderboardMe,
  type LeaderboardMetric,
  type LeaderboardResponse,
} from "@/lib/leaderboard";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

type RpcRow = {
  rank: number | string;
  id: string;
  username: string | null;
  avatar_url: string | null;
  value: number | string;
};

function metricValue(
  metric: LeaderboardMetric,
  profile: {
    credits: number;
    biggest_win: number;
    highest_multiplier: number;
  },
): number {
  switch (metric) {
    case "credits":
      return profile.credits;
    case "biggest_win":
      return profile.biggest_win;
    case "highest_multiplier":
      return profile.highest_multiplier;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const byRaw = url.searchParams.get("by") ?? "credits";
  if (!isLeaderboardMetric(byRaw)) {
    return NextResponse.json({ error: "invalid_metric" }, { status: 400 });
  }
  const by: LeaderboardMetric = byRaw;

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json(
      { error: "supabase_not_configured" },
      { status: 503 },
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_leaderboard", {
      p_metric: by,
      p_limit: 25,
    });

    if (error) {
      console.error("get_leaderboard", error.message);
      return NextResponse.json(
        { error: "leaderboard_unavailable" },
        { status: 503 },
      );
    }

    const entries: LeaderboardEntry[] = ((data as RpcRow[] | null) ?? []).map(
      (row) => ({
        rank: Number(row.rank),
        id: row.id,
        username: row.username,
        avatarUrl: row.avatar_url,
        value: Number(row.value),
      }),
    );

    let me: LeaderboardMe | null = null;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const profile = await getProfile(supabase, user.id);
      if (profile) {
        const { data: rankData, error: rankError } = await supabase.rpc(
          "get_my_leaderboard_rank",
          {
            p_metric: by,
            p_user_id: user.id,
          },
        );
        if (rankError) {
          console.error("get_my_leaderboard_rank", rankError.message);
        }

        me = {
          rank: rankError || rankData == null ? null : Number(rankData),
          id: profile.id,
          username: profile.username,
          avatarUrl: profile.avatar_url,
          credits: profile.credits,
          totalSpins: profile.total_spins,
          totalWagered: profile.total_wagered,
          totalWon: profile.total_won,
          biggestWin: profile.biggest_win,
          highestMultiplier: profile.highest_multiplier,
          value: metricValue(by, profile),
        };
      }
    }

    const body: LeaderboardResponse = { by, entries, me };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (err) {
    console.error("leaderboard route", err);
    return NextResponse.json({ error: "leaderboard_failed" }, { status: 500 });
  }
}
