"use client";

import { formatEuro } from "@/lib/format-euro";
import { GAME_CONFIG } from "@/lib/game/config";
import type { TurboMode } from "@/lib/game/state";

type Props = {
  bet: number;
  featureSpins: boolean;
  turbo: TurboMode;
  autoplayRemaining: number;
  canSpin: boolean;
  spinLabel?: string;
  onBetChange: (bet: number) => void;
  onFeatureSpinsToggle: () => void;
  onSpin: () => void;
  onTurboToggle: () => void;
  onAutoplay: (count: number) => void;
  onStopAutoplay: () => void;
};

function autoplayLabel(count: number): string {
  return count === GAME_CONFIG.autoplayInfinite ? "∞" : String(count);
}

export function BottomBar({
  bet,
  featureSpins,
  turbo,
  autoplayRemaining,
  canSpin,
  spinLabel = "SPIN",
  onBetChange,
  onFeatureSpinsToggle,
  onSpin,
  onTurboToggle,
  onAutoplay,
  onStopAutoplay,
}: Props) {
  const bets = GAME_CONFIG.bets as readonly number[];
  const betIndex = bets.indexOf(bet);
  const stake =
    bet *
    (featureSpins ? GAME_CONFIG.featureSpins.stakeMultiplier : 1);
  const autoplayChoices = [
    ...(GAME_CONFIG.autoplayOptions as readonly number[]),
    GAME_CONFIG.autoplayInfinite,
  ];

  function cycleBet(delta: number) {
    const next = bets[(betIndex + delta + bets.length) % bets.length];
    onBetChange(next);
  }

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-black/55 px-3 py-3 backdrop-blur-md sm:px-5 sm:py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/45">
              Bet
            </span>
            <button
              type="button"
              aria-label="Decrease bet"
              onClick={() => cycleBet(-1)}
              className="h-9 w-9 rounded-md border border-white/15 text-lg text-white/80 hover:border-cyan-400/40"
            >
              −
            </button>
            <div className="min-w-[4.5rem] rounded-md border border-cyan-400/25 bg-cyan-950/30 px-3 py-1.5 text-center font-mono text-lg text-cyan-100">
              {formatEuro(bet)}
            </div>
            <button
              type="button"
              aria-label="Increase bet"
              onClick={() => cycleBet(1)}
              className="h-9 w-9 rounded-md border border-white/15 text-lg text-white/80 hover:border-cyan-400/40"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={onFeatureSpinsToggle}
            aria-pressed={featureSpins}
            className={[
              "rounded-md border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] transition",
              featureSpins
                ? "border-amber-400/55 bg-amber-500/20 text-amber-100"
                : "border-white/15 text-white/55 hover:border-amber-400/35 hover:text-amber-100",
            ].join(" ")}
          >
            Feature Spins · {GAME_CONFIG.featureSpins.stakeMultiplier}×
            {featureSpins ? (
              <span className="mt-0.5 block font-mono text-[9px] font-normal tracking-normal text-amber-100/70 normal-case">
                Stake {formatEuro(stake)} · more wheels & free games
              </span>
            ) : (
              <span className="mt-0.5 block font-mono text-[9px] font-normal tracking-normal text-white/35 normal-case">
                Off · pay {GAME_CONFIG.featureSpins.stakeMultiplier}× for boost
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onSpin}
          disabled={!canSpin}
          className="min-w-[8.5rem] rounded-xl bg-gradient-to-b from-cyan-400 to-blue-600 px-8 py-3 text-sm font-bold tracking-[0.2em] text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {spinLabel}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTurboToggle}
            className={[
              "rounded-md border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition",
              turbo === "TURBO"
                ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                : "border-white/15 text-white/60 hover:border-violet-400/40",
            ].join(" ")}
          >
            Turbo
          </button>

          {autoplayRemaining !== 0 ? (
            <button
              type="button"
              onClick={onStopAutoplay}
              className="rounded-md border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-100"
            >
              Stop ({autoplayLabel(autoplayRemaining)})
            </button>
          ) : (
            autoplayChoices.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onAutoplay(count)}
                className="rounded-md border border-white/15 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/55 hover:border-cyan-400/35 hover:text-cyan-100"
              >
                Auto {autoplayLabel(count)}
              </button>
            ))
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-white/35">
        Virtual € only · No real-money gambling
      </p>
    </div>
  );
}
