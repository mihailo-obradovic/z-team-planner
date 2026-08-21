# Performance Rules — Language Tier

**Tier:** Language — TypeScript/JavaScript

Language-level performance rules: pure JavaScript/TypeScript, async control flow, bundler behavior, and browser APIs — nothing here assumes React or any framework. Each rule is a file in [`rules/`](rules/) named `<prefix>-<slug>.md`, with YAML frontmatter (`title`, `impact`, `tags`) and a short rationale plus incorrect/correct code examples.

**Read only the rule files relevant to the problem at hand — never wholesale.** For a slow initial load start with `async-*` and `bundle-*`; for hot-path CPU cost, `js-*`.

Framework tiers carry their own rule sets under the same convention: React rules in `../../frontend/_react/performance.md`, Next.js rules with the `nextjs` module and its `ssr` addon (each present only when the project's stack includes them).

## Categories by Priority

| Priority | Category                 | Impact     | Prefix    |
| -------- | ------------------------ | ---------- | --------- |
| 1        | Eliminating Waterfalls   | CRITICAL   | `async-`  |
| 2        | Bundle Size Optimization | CRITICAL   | `bundle-` |
| 3        | Browser APIs             | MEDIUM     | `client-` |
| 4        | JavaScript Performance   | LOW-MEDIUM | `js-`     |

### 1. Eliminating Waterfalls (CRITICAL)

- `async-defer-await` — Move await into branches where actually used
- `async-parallel` — Use Promise.all() for independent operations
- `async-dependencies` — Parallelize operations with partial dependencies
- `async-cheap-condition-before-await` — Check cheap sync conditions before awaiting flags

### 2. Bundle Size Optimization (CRITICAL)

- `bundle-barrel-imports` — Import directly, avoid barrel files
- `bundle-conditional` — Load modules only when feature is activated
- `bundle-preload` — Preload on hover/focus for perceived speed
- `bundle-analyzable-paths` — Keep import and file-system paths statically analyzable

### 3. Browser APIs (MEDIUM)

- `client-passive-event-listeners` — Use passive listeners for scroll
- `client-localstorage-schema` — Version and minimize localStorage data

### 4. JavaScript Performance (LOW-MEDIUM)

- `js-batch-dom-css` — Group CSS changes via classes or cssText
- `js-index-maps` — Build Map for repeated lookups
- `js-cache-property-access` — Cache object properties in loops
- `js-cache-function-results` — Cache function results in module-level Map
- `js-cache-storage` — Cache localStorage/sessionStorage reads
- `js-combine-iterations` — Combine multiple filter/map into one loop
- `js-length-check-first` — Check array length before expensive comparison
- `js-early-exit` — Return early from functions
- `js-hoist-regexp` — Hoist RegExp creation outside loops
- `js-min-max-loop` — Use loop for min/max instead of sort
- `js-set-map-lookups` — Use Set/Map for O(1) lookups
- `js-tosorted-immutable` — Use toSorted() for immutability
- `js-flatmap-filter` — Use flatMap to map and filter in one pass
- `js-request-idle-callback` — Defer non-critical work to browser idle time

## Provenance

Vendored 2026-07-25 from Vercel's `react-best-practices` skill (as carried in Mihailo's prior projects). The upstream 70-rule set is split across Catalyst's tiers by what each rule assumes: the 24 language-level rules here, React-general rules in `frontend/_react/rules/`, Next.js client-side rules in the `nextjs` module's `rules/`, and RSC/SSR rules in the `ssr` addon's payload.

Upstream: https://github.com/vercel-labs/agent-skills — `skills/react-best-practices/rules/` · commit: `7c180d9044c9ae2b442b567aad4e42a28dd5ed62` · synced: 2026-07-27

Local deviations from upstream:

| Rule                 | Deviation                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `async-dependencies` | Dependency-free promise-chaining pattern promoted to the default; `better-all` demoted to an optional mention |

Re-sync: diff upstream's `rules/` by rule name against the four rule directories; apply upstream changes to whichever tier holds the rule, preserving the deviations listed in each tier's Provenance table.
