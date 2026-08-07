import { SlotCabinet } from "@/components/slot/slot-cabinet";
import { GAME_CONFIG } from "@/lib/game/config";
import type { FeatureSessionView } from "@/lib/game/state";
import type { FeatureType } from "@/lib/game/types";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: `${GAME_CONFIG.name} · Play`,
  description: "E-Sports rank slot — virtual € only.",
};

export default async function PlayPage() {
  let credits: number = GAME_CONFIG.initialCredits;
  let username: string | null = "Guest Preview";
  let authenticated = false;
  let initialFeature: FeatureSessionView | null = null;

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        authenticated = true;
        const profile = await getProfile(supabase, user.id);
        credits = profile?.credits ?? GAME_CONFIG.initialCredits;
        username =
          profile?.username ??
          (typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : null) ??
          user.email ??
          "Player";

        const { data: session } = await supabase
          .from("feature_sessions")
          .select("feature_type, spins_remaining, spins_total, feature_win")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (session) {
          initialFeature = {
            type: session.feature_type as FeatureType,
            spinsRemaining: session.spins_remaining,
            spinsTotal: session.spins_total,
            featureWin: Number(session.feature_win),
          };
        }
      }
    } catch {
      // Env present but client misconfigured — fall back to preview.
    }
  }

  return (
    <SlotCabinet
      credits={credits}
      username={username}
      authenticated={authenticated}
      initialFeature={initialFeature}
    />
  );
}
