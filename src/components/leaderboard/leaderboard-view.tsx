"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DiscordSignInButton } from "@/components/auth/discord-sign-in-button";
import { formatEuro } from "@/lib/format-euro";
import {
  formatMetricValue,
  LEADERBOARD_METRICS,
  type LeaderboardEntry,
  type LeaderboardMe,
  type LeaderboardMetric,
  metricLabel,
} from "@/lib/leaderboard";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      entries: LeaderboardEntry[];
      me: LeaderboardMe | null;
    };

function Avatar({
  url,
  name,
  highlight,
}: {
  url: string | null;
  name: string;
  highlight?: boolean;
}) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <div
      className={[
        "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-bold",
        highlight
          ? "border-cyan-300/60 bg-cyan-950/60 text-cyan-100"
          : "border-white/15 bg-white/5 text-white/70",
      ].join(" ")}
    >
      {url ? (
        <Image src={url} alt="" fill sizes="36px" className="object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.28em] text-white/40">
        {label}
      </div>
      <div className="mt-1 font-mono text-base text-cyan-100 sm:text-lg">
        {value}
      </div>
    </div>
  );
}

export function LeaderboardView() {
  const [metric, setMetric] = useState<LeaderboardMetric>("credits");
  const [state, setState] = useState<FetchState>({ status: "loading" });

  const load = useCallback(async (by: LeaderboardMetric) => {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/leaderboard?by=${by}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        entries: LeaderboardEntry[];
        me: LeaderboardMe | null;
      };
      setState({
        status: "ready",
        entries: data.entries,
        me: data.me,
      });
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error ? err.message : "Could not load leaderboard",
      });
    }
  }, []);

  useEffect(() => {
    void load(metric);
  }, [load, metric]);

  const me = state.status === "ready" ? state.me : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {LEADERBOARD_METRICS.map((key) => {
          const active = key === metric;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setMetric(key)}
              className={[
                "rounded-md border px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] transition",
                active
                  ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100"
                  : "border-white/10 bg-black/40 text-white/50 hover:border-white/25 hover:text-white/80",
              ].join(" ")}
            >
              {metricLabel(key)}
            </button>
          );
        })}
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur sm:p-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              Top 25
            </p>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              {metricLabel(metric)}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void load(metric)}
            className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70 hover:text-cyan-200"
          >
            Refresh
          </button>
        </div>

        {state.status === "loading" ? (
          <p className="py-10 text-center text-sm text-white/45">Loading…</p>
        ) : null}

        {state.status === "error" ? (
          <div className="space-y-3 py-8 text-center">
            <p className="text-sm text-rose-300">
              Leaderboard unavailable
              {state.message === "leaderboard_unavailable"
                ? " — apply migration 0003_leaderboard.sql in Supabase"
                : ` (${state.message})`}
            </p>
            <button
              type="button"
              onClick={() => void load(metric)}
              className="text-xs text-cyan-300 underline-offset-4 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : null}

        {state.status === "ready" && state.entries.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/45">
            No players yet — spin to claim the board.
          </p>
        ) : null}

        {state.status === "ready" && state.entries.length > 0 ? (
          <ol className="divide-y divide-white/5">
            {state.entries.map((entry) => {
              const name = entry.username?.trim() || "Player";
              const isMe = me?.id === entry.id;
              return (
                <li
                  key={entry.id}
                  className={[
                    "flex items-center gap-3 py-2.5 sm:gap-4",
                    isMe ? "bg-cyan-500/10 px-2 sm:-mx-2 sm:rounded-lg" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "w-8 shrink-0 font-mono text-sm tabular-nums",
                      entry.rank <= 3 ? "text-cyan-200" : "text-white/40",
                    ].join(" ")}
                  >
                    #{entry.rank}
                  </span>
                  <Avatar url={entry.avatarUrl} name={name} highlight={isMe} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-white/90">
                      {name}
                      {isMe ? (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-cyan-300/80">
                          You
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="font-mono text-sm text-cyan-100 sm:text-base">
                    {formatMetricValue(metric, entry.value)}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : null}
      </section>

      <section className="rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-4 backdrop-blur sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/70">
          Your Stats
        </p>
        {me ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <Avatar
                url={me.avatarUrl}
                name={me.username?.trim() || "You"}
                highlight
              />
              <div className="min-w-0">
                <h2 className="font-display truncate text-xl font-bold text-white">
                  {me.username?.trim() || "Player"}
                </h2>
                <p className="text-xs text-white/45">
                  {me.rank != null
                    ? `Rank #${me.rank} · ${metricLabel(metric)}`
                    : `Unranked · ${metricLabel(metric)}`}
                </p>
              </div>
              <Link
                href="/play"
                className="ml-auto rounded-md bg-gradient-to-b from-cyan-400 to-blue-600 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-950"
              >
                Play
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatCell label="Balance" value={formatEuro(me.credits)} />
              <StatCell label="Spins" value={me.totalSpins.toLocaleString()} />
              <StatCell label="Biggest Win" value={formatEuro(me.biggestWin)} />
              <StatCell
                label="Highest Mult"
                value={`${Number(me.highestMultiplier.toFixed(2))}×`}
              />
              <StatCell label="Total Won" value={formatEuro(me.totalWon)} />
              <StatCell label="Wagered" value={formatEuro(me.totalWagered)} />
            </div>
          </>
        ) : (
          <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-sm text-sm text-white/55">
              Sign in with Discord to track your career and climb the board.
            </p>
            <DiscordSignInButton
              label="Sign in"
              className="rounded-md bg-[#5865F2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:opacity-60"
            />
          </div>
        )}
      </section>
    </div>
  );
}
