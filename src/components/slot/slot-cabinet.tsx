"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { BottomBar } from "@/components/slot/bottom-bar";
import { CreditsHud } from "@/components/slot/credits-hud";
import { FeatureHud } from "@/components/slot/feature-hud";
import { FeatureIntro } from "@/components/slot/feature-intro";
import { MultiplierHud } from "@/components/slot/multiplier-hud";
import { RankUpOffer } from "@/components/slot/rank-up-offer";
import {
  RankUpResult,
  type RankUpResultPayload,
} from "@/components/slot/rank-up-result";
import { RankWheel } from "@/components/slot/rank-wheel";
import { SlotGrid } from "@/components/slot/slot-grid";
import { WinDialog, type WinDialogPayload } from "@/components/slot/win-dialog";
import { AudioManager } from "@/lib/game/audio";
import { GAME_CONFIG } from "@/lib/game/config";
import {
  type FeatureSessionView,
  type GamePhase,
  INITIAL_CLIENT_STATE,
  SKIPPABLE_PHASES,
  type TurboMode,
} from "@/lib/game/state";
import { PAY_SYMBOL_IDS } from "@/lib/game/symbols";
import type {
  FeatureType,
  SpinResult,
  SymbolId,
  WheelResult,
} from "@/lib/game/types";

type Props = {
  credits: number;
  username?: string | null;
  authenticated: boolean;
  initialFeature?: FeatureSessionView | null;
};

function demoGrid(): SymbolId[][] {
  const cycle = [...PAY_SYMBOL_IDS];
  return Array.from({ length: 5 }, (_, reel) =>
    Array.from({ length: 4 }, (_, row) => {
      if (reel === 0 && row === 1) return "rank_wheel";
      if (reel === 4 && row === 2) return "elite_rank_wheel";
      return cycle[(reel * 3 + row) % cycle.length];
    }),
  );
}

function sleep(ms: number, signal?: { skipped: boolean }) {
  return new Promise<void>((resolve) => {
    if (signal?.skipped) {
      resolve();
      return;
    }
    const started = Date.now();
    const id = setInterval(() => {
      if (signal?.skipped || Date.now() - started >= ms) {
        clearInterval(id);
        resolve();
      }
    }, 16);
  });
}

function waitForFlag(flag: { done: boolean }, signal?: { skipped: boolean }) {
  return new Promise<void>((resolve) => {
    const id = setInterval(() => {
      if (flag.done || signal?.skipped) {
        clearInterval(id);
        resolve();
      }
    }, 16);
  });
}

export function SlotCabinet({
  credits,
  username,
  authenticated,
  initialFeature = null,
}: Props) {
  const [bet, setBet] = useState(INITIAL_CLIENT_STATE.bet);
  const [turbo, setTurbo] = useState<TurboMode>(INITIAL_CLIENT_STATE.turbo);
  const [autoplayRemaining, setAutoplayRemaining] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [balance, setBalance] = useState(credits);
  const [phase, setPhase] = useState<GamePhase>("IDLE");
  const [grid, setGrid] = useState<SymbolId[][]>(() => demoGrid());
  const [spinningReels, setSpinningReels] = useState([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [displayedMultiplier, setDisplayedMultiplier] = useState(0);
  const [multEffect, setMultEffect] = useState<"add" | "multiply" | null>(null);
  const [multEquation, setMultEquation] = useState<string | null>(null);
  const [highlightedPositions, setHighlightedPositions] = useState<
    [number, number][]
  >([]);
  const [lastPayout, setLastPayout] = useState<number | null>(null);
  const [activeWheel, setActiveWheel] = useState<WheelResult | null>(null);
  const [featureSession, setFeatureSession] =
    useState<FeatureSessionView | null>(initialFeature);
  const [pendingIntro, setPendingIntro] = useState<{
    type: FeatureType;
    spins: number;
  } | null>(null);
  const [winDialog, setWinDialog] = useState<WinDialogPayload | null>(null);
  const [rankUpOpen, setRankUpOpen] = useState(false);
  const [rankUpBusy, setRankUpBusy] = useState(false);
  const [rankUpResult, setRankUpResult] = useState<
    | (RankUpResultPayload & {
        apply: () => void;
      })
    | null
  >(null);
  const [muted, setMuted] = useState(false);

  const skipRef = useRef({ skipped: false });
  const wheelDoneRef = useRef({ done: false });
  const inFeatureRef = useRef(Boolean(initialFeature));
  const lastFeatureTypeRef = useRef<FeatureType | null>(
    initialFeature?.type ?? null,
  );
  const handleWheelComplete = useCallback(() => {
    wheelDoneRef.current.done = true;
  }, []);

  const busy = phase !== "IDLE" && phase !== "FEATURE_SPINNING";
  const canSpin =
    authenticated &&
    (phase === "IDLE" || phase === "FEATURE_SPINNING") &&
    (featureSession != null || balance >= bet);

  const spinLabel = useMemo(() => {
    if (SKIPPABLE_PHASES.has(phase) && phase !== "FEATURE_SPINNING") {
      return "SKIP";
    }
    return "SPIN";
  }, [phase]);

  const revealSpin = useCallback(
    async (spin: SpinResult) => {
      skipRef.current.skipped = false;
      const turboMode = turbo === "TURBO";
      const baseMs = turboMode
        ? GAME_CONFIG.timing.turboReelSpinMs
        : GAME_CONFIG.timing.normalReelSpinMs;
      const stagger = turboMode ? 80 : GAME_CONFIG.timing.reelStopStaggerMs;

      setPhase("REELS_SPINNING");
      setSpinningReels([true, true, true, true, true]);
      setHighlightedPositions([]);
      setDisplayedMultiplier(0);
      setMultEffect(null);
      setMultEquation(null);
      setLastPayout(null);
      setActiveWheel(null);
      AudioManager.play("reel-spin");

      for (let reel = 0; reel < 5; reel++) {
        const anticipation =
          !turboMode && spin.wheels.some((w) => w.reel === 0) && reel >= 3
            ? GAME_CONFIG.timing.anticipationExtraMs
            : 0;
        await sleep(baseMs / 5 + stagger + anticipation, skipRef.current);
        setSpinningReels((prev) => {
          const next = [...prev];
          next[reel] = false;
          return next;
        });
        setGrid((prev) => {
          const next = prev.map((col) => [...col]);
          next[reel] = [...spin.grid[reel]];
          return next;
        });
        AudioManager.play("reel-stop");
      }

      setPhase("REELS_STOPPING");
      await sleep(turboMode ? 80 : 200, skipRef.current);

      setPhase("CHECKING_LINES");
      const scatterHighlights = spin.scatters
        ? [
            ...spin.scatters.wins.flatMap((w) => w.positions),
            ...(spin.scatters.freeGames
              ? spin.scatters.positions.filter(
                  ([reel, row]) => spin.grid[reel]?.[row] === "octane",
                )
              : []),
          ]
        : [];
      if (spin.paylines.length > 0 || scatterHighlights.length > 0) {
        setHighlightedPositions([
          ...spin.paylines.flatMap((p) => p.positions),
          ...scatterHighlights,
        ]);
        await sleep(turboMode ? 200 : 700, skipRef.current);
      }

      if (spin.wheels.length > 0) {
        for (const wheel of spin.wheels) {
          setActiveWheel(wheel);
          setPhase("WHEEL_APPEARING");
          AudioManager.play("wheel-appear");
          await sleep(turboMode ? 120 : 280, skipRef.current);

          setPhase("WHEEL_SPINNING");
          wheelDoneRef.current = { done: false };
          await waitForFlag(wheelDoneRef.current, skipRef.current);
          // Force complete flag if skipped mid-spin
          wheelDoneRef.current.done = true;

          setPhase("WHEEL_RESULT");
          AudioManager.play("wheel-land");
          setMessage(`Reel ${wheel.reel + 1}: ${wheel.label}`);
          await sleep(turboMode ? 120 : 350, skipRef.current);

          setPhase("APPLYING_MULTIPLIER");
          const isMul =
            wheel.label.startsWith("×") || wheel.label.startsWith("x");
          const before = wheel.multiplierBefore;
          const after = wheel.multiplierAfter;
          if (isMul) {
            setMultEffect("multiply");
            const from = before > 0 ? before : 1;
            setMultEquation(`${from}x × ${wheel.label.replace(/^×|^x/i, "")}`);
            AudioManager.play("multiplier-multiply");
          } else if (wheel.label.startsWith("+")) {
            setMultEffect("add");
            setMultEquation(`${before}x + ${wheel.label}`);
            AudioManager.play("multiplier-add");
          }
          setDisplayedMultiplier(after);
          await sleep(turboMode ? 180 : 500, skipRef.current);
          setMultEquation(null);
        }
        setActiveWheel(null);
      } else if (spin.finalMultiplier > 0) {
        setDisplayedMultiplier(spin.finalMultiplier);
      }

      if (spin.feature?.triggered && spin.feature.type) {
        setPhase("FEATURE_TRIGGER");
        AudioManager.play("feature-trigger");
        setAutoplayRemaining(0);
        if (spin.scatters?.freeGames && spin.feature.type === "overtime") {
          setMessage(`Octane ×${spin.scatters.octaneCount} · FREE GAMES`);
        }
        const spins = spin.feature.spinsAwarded ?? 10;
        setPendingIntro({
          type: spin.feature.type,
          spins,
        });
        setFeatureSession({
          type: spin.feature.type,
          spinsRemaining: spins,
          spinsTotal: spins,
          featureWin: 0,
        });
        lastFeatureTypeRef.current = spin.feature.type;
        inFeatureRef.current = true;
        setPhase("FEATURE_INTRO");
        await sleep(turboMode ? 100 : 200, skipRef.current);
      } else if (inFeatureRef.current) {
        setFeatureSession((prev) => {
          if (!prev) return prev;
          const nextRemaining = Math.max(0, prev.spinsRemaining - 1);
          const next = {
            ...prev,
            spinsRemaining: nextRemaining,
            featureWin: prev.featureWin + spin.payout,
          };
          if (nextRemaining === 0) {
            lastFeatureTypeRef.current = prev.type;
            inFeatureRef.current = false;
            setRankUpOpen(prev.type !== "road_to_ssl");
            setPhase("FEATURE_COMPLETE");
            return null;
          }
          return next;
        });
      }

      if (spin.payout > 0) {
        setPhase("BIG_WIN");
        AudioManager.play(
          spin.cappedAtMaxWin ? "max-win" : spin.bigWinTier ? "big-win" : "win",
        );
        setWinDialog({
          payout: spin.payout,
          baseWin: spin.baseWin,
          multiplier: spin.finalMultiplier,
          tier: spin.bigWinTier,
          maxWin: spin.cappedAtMaxWin,
        });
        const holdMs = turboMode
          ? spin.bigWinTier || spin.cappedAtMaxWin
            ? 700
            : 420
          : spin.bigWinTier || spin.cappedAtMaxWin
            ? 1800
            : 1100;
        await sleep(holdMs, skipRef.current);
        setWinDialog(null);
      }

      setBalance(spin.balanceAfter);
      setLastPayout(spin.payout);
      setDisplayedMultiplier(spin.finalMultiplier);

      if (spin.payout > 0) {
        setMessage(`+${spin.payout.toLocaleString()} credits`);
      } else if (!spin.feature?.triggered) {
        setMessage("No win");
      }

      if (!spin.feature?.triggered) {
        setPhase(inFeatureRef.current ? "FEATURE_SPINNING" : "IDLE");
      }
    },
    [turbo],
  );

  const requestSpin = useCallback(async () => {
    if (!authenticated) {
      setMessage("Sign in with Discord to play with virtual credits.");
      return;
    }
    if (phase !== "IDLE" && phase !== "FEATURE_SPINNING") return;
    if (balance < bet) {
      setMessage("Insufficient credits.");
      setAutoplayRemaining(0);
      return;
    }

    setPhase("REQUESTING");
    setMessage(null);
    const clientRequestId = crypto.randomUUID();

    try {
      const res = await fetch("/api/game/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, clientRequestId }),
      });
      const data = (await res.json()) as {
        spin?: SpinResult;
        error?: string;
      };

      if (!res.ok || !data.spin) {
        setPhase("IDLE");
        setMessage(data.error ?? "Spin failed");
        setAutoplayRemaining(0);
        return;
      }

      await revealSpin(data.spin);
    } catch {
      setPhase("IDLE");
      setMessage("Network error — try again.");
      setAutoplayRemaining(0);
    }
  }, [authenticated, balance, bet, phase, revealSpin]);

  function onSpinOrSkip() {
    if (SKIPPABLE_PHASES.has(phase) && phase !== "FEATURE_SPINNING") {
      skipRef.current.skipped = true;
      wheelDoneRef.current.done = true;
      return;
    }
    void requestSpin();
  }

  useEffect(() => {
    if (autoplayRemaining === 0) return;
    if (phase !== "IDLE") return;
    if (featureSession) {
      setAutoplayRemaining(0);
      return;
    }
    if (!authenticated || balance < bet) {
      setAutoplayRemaining(0);
      return;
    }
    const timer = setTimeout(() => {
      setAutoplayRemaining((n) =>
        n === GAME_CONFIG.autoplayInfinite ? n : Math.max(0, n - 1),
      );
      void requestSpin();
    }, 350);
    return () => clearTimeout(timer);
  }, [
    autoplayRemaining,
    phase,
    authenticated,
    balance,
    bet,
    requestSpin,
    featureSession,
  ]);

  // Auto-continue feature spins
  useEffect(() => {
    if (!featureSession) return;
    if (phase !== "FEATURE_SPINNING") return;
    if (pendingIntro || rankUpOpen || rankUpResult || winDialog) return;
    const timer = setTimeout(() => {
      void requestSpin();
    }, 600);
    return () => clearTimeout(timer);
  }, [
    featureSession,
    phase,
    pendingIntro,
    rankUpOpen,
    rankUpResult,
    winDialog,
    requestSpin,
  ]);

  useEffect(() => {
    setBalance(credits);
  }, [credits]);

  async function handleRankUp(action: "keep" | "try") {
    setRankUpBusy(true);
    try {
      const res = await fetch("/api/game/rank-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          clientRequestId: crypto.randomUUID(),
        }),
      });
      const data = await res.json();
      if (action === "try" && data.outcome) {
        AudioManager.play("rank-up");
        const prevFeatureWin = featureSession?.featureWin ?? 0;

        if (data.outcome.type === "upgrade") {
          const to = data.outcome.to as FeatureType;
          const spins = data.outcome.spins as number;
          setRankUpResult({
            kind: "upgrade",
            title: data.outcome.label ?? "RANK UP",
            subtitle: `${GAME_CONFIG.featureMeta[to].title} · ${spins} spins`,
            apply: () => {
              setPendingIntro({ type: to, spins });
              setFeatureSession({
                type: to,
                spinsRemaining: spins,
                spinsTotal: spins,
                featureWin: 0,
              });
              inFeatureRef.current = true;
              setMessage(`RANK UP → ${data.outcome.label}`);
            },
          });
        } else if (data.outcome.type === "end") {
          setRankUpResult({
            kind: "end",
            title: data.outcome.label ?? "END SERIES",
            subtitle: "No upgrade this time — back to the cabinet.",
            apply: () => {
              setFeatureSession(null);
              inFeatureRef.current = false;
              setMessage("Series ended");
              setPhase("IDLE");
            },
          });
        } else {
          const spins = data.outcome.spins as number;
          const featureType = data.outcome.featureType as FeatureType;
          setRankUpResult({
            kind: "spins",
            title: data.outcome.label ?? `+${spins} SPINS`,
            subtitle: `${spins} more spins in ${GAME_CONFIG.featureMeta[featureType].title}`,
            apply: () => {
              setFeatureSession({
                type: featureType,
                spinsRemaining: spins,
                spinsTotal: spins,
                featureWin: prevFeatureWin,
              });
              inFeatureRef.current = true;
              setMessage(`+${spins} feature spins`);
              setPhase("FEATURE_SPINNING");
            },
          });
        }
      }
    } finally {
      setRankUpBusy(false);
      setRankUpOpen(false);
      if (action === "keep") {
        setFeatureSession(null);
        inFeatureRef.current = false;
        setPhase("IDLE");
      }
    }
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#04060c]" />
        <div
          className={[
            "absolute inset-0 transition-opacity",
            featureSession
              ? "bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.28),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(34,211,238,0.12),transparent_40%)]"
              : "bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.14),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.12),transparent_40%)]",
          ].join(" ")}
        />
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[48px_48px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-3 px-3 py-3 sm:px-8 sm:py-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-300/70">
            Team Synix
          </p>
          <h1 className="font-display truncate text-xl font-bold tracking-tight text-white sm:text-3xl">
            {GAME_CONFIG.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/leaderboard"
            className="rounded border border-white/15 px-2 py-1 text-[10px] uppercase tracking-wider text-white/60 hover:border-cyan-400/40 hover:text-cyan-100"
          >
            Board
          </Link>
          <button
            type="button"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              AudioManager.setMuted(next);
            }}
            className="rounded border border-white/15 px-2 py-1 text-[10px] uppercase tracking-wider text-white/60"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
          {authenticated ? <SignOutButton /> : null}
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 px-2 pb-6 sm:gap-5 sm:px-6 sm:pb-8">
        <div className="flex w-full max-w-3xl items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0 sm:min-w-24">
            {lastPayout != null ? (
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 sm:text-xs">
                Last
                <div className="mt-1 font-mono text-base text-cyan-100 sm:text-lg">
                  {lastPayout.toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="hidden sm:block sm:min-w-24" />
            )}
          </div>
          <MultiplierHud
            multiplier={displayedMultiplier}
            effect={multEffect}
            equation={multEquation}
          />
          <CreditsHud credits={balance} username={username} />
        </div>

        {featureSession ? (
          <FeatureHud
            type={featureSession.type}
            spinsRemaining={featureSession.spinsRemaining}
            spinsTotal={featureSession.spinsTotal}
            featureWin={featureSession.featureWin}
            multiplier={displayedMultiplier}
          />
        ) : null}

        <div className="relative w-full max-w-3xl">
          <SlotGrid
            grid={grid}
            idle={phase === "IDLE" || phase === "FEATURE_SPINNING"}
            spinningReels={spinningReels}
            highlightedPositions={highlightedPositions}
          />

          {activeWheel ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
              <RankWheel
                key={`${activeWheel.reel}-${activeWheel.segmentId}`}
                kind={activeWheel.kind}
                segmentId={activeWheel.segmentId}
                turbo={turbo === "TURBO"}
                onComplete={handleWheelComplete}
              />
            </div>
          ) : null}
        </div>

        {!featureSession ? (
          <BottomBar
            bet={bet}
            turbo={turbo}
            autoplayRemaining={autoplayRemaining}
            canSpin={
              authenticated
                ? canSpin ||
                  (SKIPPABLE_PHASES.has(phase) && phase !== "FEATURE_SPINNING")
                : true
            }
            spinLabel={authenticated ? spinLabel : "SPIN"}
            onBetChange={(next) => {
              if (!busy) setBet(next);
            }}
            onSpin={onSpinOrSkip}
            onTurboToggle={() =>
              setTurbo((t) => (t === "NORMAL" ? "TURBO" : "NORMAL"))
            }
            onAutoplay={(count) => {
              if (!authenticated) {
                setMessage("Sign in with Discord to enable autoplay.");
                return;
              }
              setAutoplayRemaining(count);
            }}
            onStopAutoplay={() => setAutoplayRemaining(0)}
          />
        ) : (
          <div className="flex w-full max-w-3xl items-center justify-center gap-3 rounded-2xl border border-violet-400/20 bg-black/40 px-4 py-3">
            <button
              type="button"
              onClick={onSpinOrSkip}
              className="rounded-xl bg-gradient-to-b from-fuchsia-400 to-violet-700 px-8 py-3 text-sm font-bold tracking-[0.2em] text-white"
            >
              {spinLabel === "SKIP" ? "SKIP" : "FEATURE SPIN"}
            </button>
            <button
              type="button"
              onClick={() =>
                setTurbo((t) => (t === "NORMAL" ? "TURBO" : "NORMAL"))
              }
              className="rounded-md border border-white/15 px-3 py-2 text-[10px] uppercase tracking-wider text-white/60"
            >
              Turbo {turbo === "TURBO" ? "ON" : "OFF"}
            </button>
          </div>
        )}

        {message ? (
          <p className="max-w-md px-2 text-center text-sm text-cyan-100/70">
            {message}
          </p>
        ) : (
          <p className="max-w-md px-2 text-center text-sm text-white/40">
            {authenticated
              ? GAME_CONFIG.disclaimer
              : "Sign in to spin · Guest preview grid"}
          </p>
        )}
      </main>

      {pendingIntro ? (
        <FeatureIntro
          type={pendingIntro.type}
          spins={pendingIntro.spins}
          onDone={() => {
            setPendingIntro(null);
            setPhase("FEATURE_SPINNING");
          }}
        />
      ) : null}

      {winDialog ? (
        <WinDialog
          payout={winDialog.payout}
          baseWin={winDialog.baseWin}
          multiplier={winDialog.multiplier}
          tier={winDialog.tier}
          maxWin={winDialog.maxWin}
          onDone={() => {
            skipRef.current.skipped = true;
            setWinDialog(null);
          }}
        />
      ) : null}

      {rankUpOpen ? (
        <RankUpOffer
          current={lastFeatureTypeRef.current ?? "overtime"}
          busy={rankUpBusy}
          onKeep={() => void handleRankUp("keep")}
          onTry={() => void handleRankUp("try")}
        />
      ) : null}

      {rankUpResult ? (
        <RankUpResult
          kind={rankUpResult.kind}
          title={rankUpResult.title}
          subtitle={rankUpResult.subtitle}
          onDone={() => {
            const apply = rankUpResult.apply;
            setRankUpResult(null);
            apply();
          }}
        />
      ) : null}
    </div>
  );
}
