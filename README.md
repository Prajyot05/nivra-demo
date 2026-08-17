# Nivra Calculators

Fullstack Next.js app: shared finance engine + App Router API + calculator UI.

## Development

```sh
npm i
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Goal SIP Planner is at `/`. Calculate API is `POST /api/calculate/:id` on the same origin.

- **Cursor / Prajyot guide:** [`AGENTS.md`](AGENTS.md) (also `.cursor/rules/`)
- Formula notes and Days 1–5 work: [`PROGRESS.md`](PROGRESS.md)
- API contract: [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)

## Layout

| Path | Role |
| --- | --- |
| `packages/finance` | Pure math (no UI, no rounding) |
| `packages/ui` | Calculator page kit |
| `src/app` | Next.js App Router pages + API routes |
| `src/components` | Goal SIP Planner, shell, shadcn inputs |

## Stack

- Next.js (App Router)
- TypeScript
- React
- Tailwind CSS
