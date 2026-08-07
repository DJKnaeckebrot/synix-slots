# Rank Rush (Team Synix)

Free community E-Sports rank slot. **Virtual credits only** — no deposits, no withdrawals, no real-money gambling.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Framer Motion
- Supabase Auth (Discord OAuth) + PostgreSQL + RLS

## Setup

```bash
pnpm install
cp .env.local.example .env.local
```

Fill in Supabase URL/keys. In the Supabase dashboard:

1. Enable **Discord** under Authentication → Providers
2. Set redirect URL to `http://localhost:3000/auth/callback`
3. Apply `supabase/migrations/0001_init.sql`

```bash
pnpm dev
```

- `/` — landing + Discord sign-in
- `/play` — slot cabinet (guest preview works without Auth)

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm typecheck` | TypeScript |
| `pnpm lint` | Biome |
| `pnpm test` | Vitest |
| `pnpm build` | Production build |
| `pnpm simulate` | Monte Carlo stub (STEP 10) |

## Status

STEPS 1–12 complete: engine, API, polished wheel/feature UI, Rank Up, simulator,
`/fairness`, `/dev/game` (dev-only), AudioManager stubs, responsive shell.
