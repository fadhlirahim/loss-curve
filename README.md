# Roadmap to Mastery — interactive learning site

The https://fadhlirahim.github.io/swe-to-researcher/  ML/LLM research roadmap as an interactive
website: phase pages with artifact checklists, a weekly habit tracker, a "you are here"
diagnostic, the jargon decoder, and the resource shelf. Your overall progress renders as a
descending training-loss curve — loss being what you don't know yet.

All progress lives in `localStorage`. No account, no backend state.

<img width="957" height="1095" alt="Screenshot 2026-06-10 at 7 29 17 PM" src="https://github.com/user-attachments/assets/b0665a1d-fd14-4b43-807b-5635a1e978ca" />

## Stack

TanStack Start + TanStack Router on Cloudflare Workers (`@cloudflare/vite-plugin`),
Tailwind v4, Biome, bun. Scaffolded with the
[claude-cloudflare-starter-kit](https://github.com/fadhlirahim/claude-cf-starter-kit) —
see `CLAUDE.md` for conventions. Auth/D1/AI are intentionally absent in v1; the kit's
`/add-*` skills add them when needed.

## Develop

```bash
bun install
bun dev          # http://localhost:5173
bun check        # biome lint + format
bun typecheck
bun run build
bun run deploy   # wrangler deploy (needs `wrangler login`)
```

## Where things live

- `src/data/` — all roadmap content as typed data (phases, checklist, glossary, resources, levels)
- `src/hooks/use-progress.ts` — the localStorage progress store (checklist, habits, diagnostic)
- `src/routes/` — overview, `phases/$phaseId`, method, rl, habits, glossary, resources
- `src/components/loss-curve.tsx` — the progress-as-loss-curve hero
