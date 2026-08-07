"use client";

import { useState } from "react";
import type { DevSpinOverride } from "@/lib/game/engine";
import type { SpinResult } from "@/lib/game/types";

const PRESETS: { label: string; override: DevSpinOverride }[] = [
  { label: "Force 1 Wheel", override: { forceWheelReels: [0] } },
  { label: "Force 2 Wheels", override: { forceWheelReels: [0, 2] } },
  { label: "Force 3 Wheels", override: { forceWheelReels: [0, 2, 4] } },
  {
    label: "Force Overtime",
    override: { forceFeature: "overtime" },
  },
  {
    label: "Force Champion Feature",
    override: { forceFeature: "champion" },
  },
  {
    label: "Force Grand Champion",
    override: { forceFeature: "grand_champion" },
  },
  {
    label: "Force Road to SSL",
    override: { forceFeature: "road_to_ssl" },
  },
  {
    label: "Force +10 then ×5",
    override: {
      forceWheelReels: [0, 2],
      forceSegments: { 0: "n_add_10", 2: "n_mul_5" },
    },
  },
  {
    label: "Force Max Win",
    override: {
      forceWheelReels: [0],
      forceSegments: { 0: "n_add_50" },
      forceMaxWin: true,
    },
  },
];

export function DevGameClient() {
  const [log, setLog] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function run(override: DevSpinOverride) {
    setBusy(true);
    setLog("Requesting…");
    try {
      const res = await fetch("/api/game/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bet: 1,
          clientRequestId: crypto.randomUUID(),
          override,
        }),
      });
      const data = (await res.json()) as {
        spin?: SpinResult;
        error?: string;
      };
      if (!res.ok || !data.spin) {
        setLog(`Error ${res.status}: ${data.error ?? "no spin"}`);
        return;
      }
      const spin = data.spin;
      setLog(
        JSON.stringify(
          {
            payout: spin.payout,
            multiplier: spin.finalMultiplier,
            wheels: spin.wheels.map((w) => ({
              reel: w.reel,
              label: w.label,
            })),
            feature: spin.feature,
            cappedAtMaxWin: spin.cappedAtMaxWin,
            balanceAfter: spin.balanceAfter,
          },
          null,
          2,
        ),
      );
    } catch (err) {
      setLog(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="font-semibold text-amber-100">Force outcomes</h2>
      <p className="text-xs text-white/40">
        Requires Discord sign-in and sufficient credits. Each click spends 1
        credit via the real spin API.
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={busy}
            onClick={() => void run(preset.override)}
            className="rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-100 disabled:opacity-40"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <pre className="max-h-80 overflow-auto rounded-lg border border-white/10 bg-black/60 p-4 text-xs text-cyan-100">
        {log || "Results appear here."}
      </pre>
    </section>
  );
}
