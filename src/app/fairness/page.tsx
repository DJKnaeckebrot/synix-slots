import Link from "next/link";
import {
  GAME_CONFIG,
  getEliteWheelWeighted,
  getNormalWheelWeighted,
  getSymbolWeights,
} from "@/lib/game/config";
import { PAYLINES } from "@/lib/game/paylines";
import { isPaySymbol, isScatterSymbol } from "@/lib/game/symbols";

export const metadata = {
  title: "Fairness · Rank Rush",
  description: "Virtual €, server-side RNG, and game mathematics.",
};

function weightTotal(items: { weight: number }[]) {
  return items.reduce((s, i) => s + i.weight, 0);
}

export default function FairnessPage() {
  const symbols = getSymbolWeights();
  const symbolTotal = weightTotal(symbols);
  const payRows = symbols.filter((s) => isPaySymbol(s.item));
  const scatterRows = symbols.filter((s) => isScatterSymbol(s.item));
  const normal = getNormalWheelWeighted();
  const elite = getEliteWheelWeighted();
  const normalTotal = weightTotal(normal);
  const eliteTotal = weightTotal(elite);

  return (
    <main className="min-h-full bg-[#04060c] px-4 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.3em] text-cyan-300/70 hover:text-cyan-200"
          >
            ← Rank Rush
          </Link>
          <h1 className="mt-4 font-display text-4xl font-bold">Fairness</h1>
          <p className="mt-3 text-white/60">{GAME_CONFIG.disclaimer}</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-cyan-100">Virtual €</h2>
          <p className="text-sm leading-relaxed text-white/55">
            This is a free community game. Virtual € has no monetary value.
            There are no deposits, withdrawals, or real-money gambling.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-cyan-100">
            Server-side outcomes
          </h2>
          <p className="text-sm leading-relaxed text-white/55">
            Spin results are generated on the server with Node{" "}
            <code className="text-cyan-200">crypto.randomInt</code> (CSPRNG).
            The browser only reveals the immutable result. Animations never
            change odds.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-cyan-100">RTP</h2>
          <p className="text-sm leading-relaxed text-white/55">
            Target experimental RTP: <strong>~100%</strong> (validate with
            simulator). RTP emerges from static configured weights — there is
            no per-user, streak, or balance-based odds adjustment. Validate
            with:
          </p>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 text-xs text-cyan-100">
            pnpm simulate -- --spins 1000000
          </pre>
          <p className="text-sm text-white/45">
            Do not treat this page as a certified fairness claim until the
            simulator report for your deployed config is published.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-cyan-100">Limits</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-white/55">
            <li>Max win: {GAME_CONFIG.maxWin.toLocaleString()}× bet</li>
            <li>Rank Wheels only land when there is a win (lines or Fennec)</li>
            <li>
              Fennec: combo scatter — pays 3 / 4 / 5 anywhere (
              {GAME_CONFIG.scatters.fennec.payouts?.[3]} /{" "}
              {GAME_CONFIG.scatters.fennec.payouts?.[4]} /{" "}
              {GAME_CONFIG.scatters.fennec.payouts?.[5]}× bet)
            </li>
            <li>
              Octane: free-games scatter —{" "}
              {GAME_CONFIG.scatters.octane.freeGamesAt}+ anywhere → Overtime
            </li>
            <li>Paylines: {PAYLINES.length} fixed left-to-right</li>
            <li>
              Grid: {GAME_CONFIG.grid.reels}×{GAME_CONFIG.grid.rows}
            </li>
            <li>Bets: {(GAME_CONFIG.bets as readonly number[]).join(", ")}</li>
            <li>
              Feature Spins ante: {GAME_CONFIG.featureSpins.stakeMultiplier}×
              stake — more Rank Wheels, scatters, and free-game triggers (wins
              still vs base bet)
            </li>
            <li>
              Feature packages: Overtime{" "}
              {GAME_CONFIG.features.overtime.spins} / Champion{" "}
              {GAME_CONFIG.features.champion.spins} / Grand Champion{" "}
              {GAME_CONFIG.features.grand_champion.spins} / Road to SSL{" "}
              {GAME_CONFIG.features.road_to_ssl.spins} spins
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-cyan-100">
            Symbol weights (relative)
          </h2>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-white/50">
                <tr>
                  <th className="px-3 py-2">Symbol</th>
                  <th className="px-3 py-2">Weight</th>
                  <th className="px-3 py-2">Approx %</th>
                  <th className="px-3 py-2">3 / 4 / 5</th>
                </tr>
              </thead>
              <tbody>
                {payRows.map(({ item, weight }) => {
                  if (!isPaySymbol(item)) return null;
                  const def = GAME_CONFIG.symbols[item];
                  return (
                    <tr key={item} className="border-t border-white/5">
                      <td className="px-3 py-2">{def.label}</td>
                      <td className="px-3 py-2 font-mono">{weight}</td>
                      <td className="px-3 py-2 font-mono">
                        {((weight / symbolTotal) * 100).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 font-mono text-white/60">
                        {def.payouts[3]} / {def.payouts[4]} / {def.payouts[5]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-cyan-100">
            Scatters (relative)
          </h2>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-white/50">
                <tr>
                  <th className="px-3 py-2">Scatter</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Weight</th>
                  <th className="px-3 py-2">Approx %</th>
                  <th className="px-3 py-2">Effect</th>
                </tr>
              </thead>
              <tbody>
                {scatterRows.map(({ item, weight }) => {
                  if (!isScatterSymbol(item)) return null;
                  const def = GAME_CONFIG.scatters[item];
                  return (
                    <tr key={item} className="border-t border-white/5">
                      <td className="px-3 py-2">{def.label}</td>
                      <td className="px-3 py-2 capitalize text-white/60">
                        {def.role.replace("_", " ")}
                      </td>
                      <td className="px-3 py-2 font-mono">{weight}</td>
                      <td className="px-3 py-2 font-mono">
                        {((weight / symbolTotal) * 100).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 font-mono text-white/60">
                        {def.payouts
                          ? `${def.payouts[3]} / ${def.payouts[4]} / ${def.payouts[5]}×`
                          : `${def.freeGamesAt}+ → Overtime`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-cyan-100">
            Base Rank Wheel chance
          </h2>
          <p className="text-sm text-white/55">
            Per eligible reel (1, 3, 5):{" "}
            {(GAME_CONFIG.baseGame.wheelChance * 100).toFixed(1)}% wheel · of
            those, {(GAME_CONFIG.baseGame.eliteChance * 100).toFixed(1)}% elite.
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold text-cyan-100">Normal wheel</h3>
            <ul className="space-y-1 text-sm text-white/55">
              {normal.map(({ item, weight }) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span>{item.label}</span>
                  <span className="font-mono text-white/40">
                    {((weight / normalTotal) * 100).toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-fuchsia-100">Elite wheel</h3>
            <ul className="space-y-1 text-sm text-white/55">
              {elite.map(({ item, weight }) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span>{item.label}</span>
                  <span className="font-mono text-white/40">
                    {((weight / eliteTotal) * 100).toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-cyan-100">Features</h2>
          <ul className="space-y-2 text-sm text-white/55">
            {(
              Object.keys(
                GAME_CONFIG.features,
              ) as (keyof typeof GAME_CONFIG.features)[]
            ).map((key) => (
              <li key={key}>
                <strong className="text-white/80">
                  {GAME_CONFIG.featureMeta[key].title}
                </strong>
                : {GAME_CONFIG.features[key].spins} spins · wheelChance{" "}
                {GAME_CONFIG.features[key].wheelChance}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
