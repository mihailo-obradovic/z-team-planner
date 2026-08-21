# Z-Team Planner

A build calculator for [Dispatch](https://store.steampowered.com/app/2429620/Dispatch/) (AdHoc Studio). Plan your Z-Team ahead of time: level heroes, train powers and flight, pick synergy pairs, and mirror your story choices (who was cut in episode 3, who was hired in episode 4). Builds persist in your browser and are shareable as URLs — no account needed.

Built with Nuxt 4, Nuxt UI 4, and Tailwind CSS 4. There is no server-side storage; the only server code is a static endpoint serving hero base data.

## Setup

Install dependencies (pnpm is enforced):

```bash
pnpm install
```

## Development

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

Other useful scripts:

```bash
pnpm lint        # oxlint
pnpm format      # oxfmt
pnpm typecheck   # vue-tsc via nuxt
pnpm test        # vitest (unit + nuxt projects)
```

## Production

Build and locally preview:

```bash
pnpm build
pnpm preview
```

See the [Nuxt deployment documentation](https://nuxt.com/docs/getting-started/deployment) for hosting options.

## The catalyst/ Directory

`catalyst/` is this repository's Catalyst rule set — the documents an agent reads before it changes anything here, adopted into this repository from the Catalyst template. They are contracts, not descriptions: `catalyst/prime-directive.md` says how work runs (task weights, the feature and decision gates, branch and commit discipline), `catalyst/architecture.md` says what this system may be built from, and `catalyst/project-summary.md` indexes this project's own features and decisions. Start at `catalyst/AGENTS.md` — it is the file index, and everything else loads on demand.

The project's own documents are written inside the bundle (`catalyst/features/`, `catalyst/decisions/`), never in root-level directories. The rule set is upgraded in place from the Catalyst repository, so `catalyst/` is edited deliberately and never reorganized.
