import Link from "next/link";
import { DiscordSignInButton } from "@/components/auth/discord-sign-in-button";
import { GAME_CONFIG } from "@/lib/game/config";

type Props = {
  authError?: boolean;
};

export function LandingHero({ authError }: Props) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div className="absolute inset-0 bg-[#04060c]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(34,211,238,0.2),transparent_40%),radial-gradient(ellipse_at_80%_70%,rgba(168,85,247,0.18),transparent_42%)]" />
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px]" />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.45em] text-cyan-300/80">
          Team Synix · Community Arena
        </p>
        <h1 className="font-display max-w-3xl text-5xl font-bold tracking-tight text-white sm:text-7xl">
          {GAME_CONFIG.name}
        </h1>
        <p className="mt-5 max-w-xl text-base text-white/65 sm:text-lg">
          Climb the ranks on a 5×4 tournament slot. Spin Rank Wheels, stack
          multipliers, and chase Road to SSL — with virtual € only.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <DiscordSignInButton />
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              href="/play"
              className="text-cyan-200/80 underline-offset-4 hover:text-cyan-100 hover:underline"
            >
              Preview cabinet
            </Link>
            <Link
              href="/leaderboard"
              className="text-cyan-200/80 underline-offset-4 hover:text-cyan-100 hover:underline"
            >
              Leaderboard
            </Link>
            <Link
              href="/fairness"
              className="text-white/50 underline-offset-4 hover:text-white/80 hover:underline"
            >
              Fairness
            </Link>
          </div>
        </div>

        {authError ? (
          <p className="mt-6 text-sm text-rose-300">
            Sign-in failed. Check Discord OAuth settings in Supabase.
          </p>
        ) : null}

        <p className="mt-12 max-w-md text-xs leading-relaxed text-white/40">
          {GAME_CONFIG.disclaimer} No deposits. No withdrawals. Virtual € has no
          monetary value.
        </p>
      </main>
    </div>
  );
}
