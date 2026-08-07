import { notFound } from "next/navigation";
import { DevGameClient } from "@/components/dev/dev-game-client";
import {
  GAME_CONFIG,
  getNormalWheelWeighted,
  getSymbolWeights,
} from "@/lib/game/config";

export const metadata = {
  title: "Dev Inspector · Rank Rush",
};

export default function DevGamePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const symbols = getSymbolWeights();
  const symbolTotal = symbols.reduce((s, w) => s + w.weight, 0);
  const wheels = getNormalWheelWeighted();
  const wheelTotal = wheels.reduce((s, w) => s + w.weight, 0);

  return (
    <main className="min-h-full bg-[#04060c] px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">
            Development only
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">
            Game Inspector
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Overrides are rejected by the API when{" "}
            <code>NODE_ENV === &quot;production&quot;</code>.
          </p>
        </div>

        <section className="rounded-xl border border-white/10 bg-black/40 p-4">
          <h2 className="font-semibold text-cyan-100">Config snapshot</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>Version: {GAME_CONFIG.version}</div>
            <div>Max win: {GAME_CONFIG.maxWin}×</div>
            <div>Base wheel chance: {GAME_CONFIG.baseGame.wheelChance}</div>
            <div>Elite given wheel: {GAME_CONFIG.baseGame.eliteChance}</div>
          </dl>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <h3 className="text-sm font-semibold text-white/80">Symbols</h3>
            <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-white/50">
              {symbols.map((s) => (
                <li key={s.item} className="flex justify-between">
                  <span>{s.item}</span>
                  <span>{((s.weight / symbolTotal) * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <h3 className="text-sm font-semibold text-white/80">
              Normal wheel
            </h3>
            <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-white/50">
              {wheels.map((s) => (
                <li key={s.item.id} className="flex justify-between">
                  <span>{s.item.label}</span>
                  <span>{((s.weight / wheelTotal) * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <DevGameClient />
      </div>
    </main>
  );
}
