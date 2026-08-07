import Link from "next/link";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";
import { GAME_CONFIG } from "@/lib/game/config";

export const metadata = {
  title: `Leaderboard · ${GAME_CONFIG.name}`,
  description: "Credits, biggest wins, and highest multipliers.",
};

export default function LeaderboardPage() {
  return (
    <main className="relative min-h-full overflow-hidden bg-[#04060c] px-4 py-10 text-white sm:px-8 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(34,211,238,0.16),transparent_40%),radial-gradient(ellipse_at_80%_80%,rgba(168,85,247,0.12),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[48px_48px]" />

      <div className="relative z-10 mx-auto max-w-3xl space-y-8">
        <div>
          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.3em]">
            <Link href="/" className="text-cyan-300/70 hover:text-cyan-200">
              ← Rank Rush
            </Link>
            <Link href="/play" className="text-white/40 hover:text-white/70">
              Play
            </Link>
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Leaderboard
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/55 sm:text-base">
            Who&apos;s stacking credits, hitting the biggest payouts, and
            landing the wildest multipliers.
          </p>
        </div>

        <LeaderboardView />
      </div>
    </main>
  );
}
