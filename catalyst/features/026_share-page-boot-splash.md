# Feature: Share page boot splash

## Status

Active

## Task Weight

Easy

## Purpose

`/b/{id}` is rendered client-only (`ssr: false`, feature 007), so a visitor following a share link gets a blank ground until the JavaScript bundle has loaded and run — only then does the page's own skeleton appear. Feature 023 gave `/` a held-back first paint and deliberately left this route out. This feature fills the gap with Nuxt's own mechanism for it: a loading template inlined into the HTML, shown until the app mounts, torn down by Nuxt itself.

## Inputs

| Input          | Type        | Source                           | Constraints                                          |
| -------------- | ----------- | -------------------------------- | ---------------------------------------------------- |
| route          | path        | any `/b/**` request              | the only routes rendered with `ssr: false`           |
| app mount      | event       | Nuxt                             | the moment the template is removed; nothing else can |
| reduced motion | media query | `prefers-reduced-motion: reduce` | the ring is drawn and does not turn                  |

## Outputs And Side Effects

| Output / Side Effect | Type | Description                                                                   |
| -------------------- | ---- | ----------------------------------------------------------------------------- |
| boot splash          | UI   | the page's ground with one loading ring, from the first paint until the mount |

No state is written. Nothing here is serialized.

## Scope And Non-Goals

In scope:

- `web/spa-loading-template.html`, the markup and inline style Nuxt inlines into every `ssr: false` page, found by Nuxt's default lookup in `web/` with no config setting.
- Its values, restated as literals from the annex.

Non-goals:

- **`/` and `/privacy`.** Prerendered, so the template is never inlined there; feature 023 owns `/`'s wait.
- **The page's own skeleton.** Feature 007's pending state, shown once the app has mounted and is fetching the build, is unchanged. The splash ends where the skeleton begins.
- **Looking identical to feature 023's cover.** The two can never appear on the same route: 023's ring sits below a prerendered header, this one has no header to sit below. Both are the annex's one loading ring on the app's one ground, and that is the whole of the match.
- **Text of any kind.** The ring is the annex's mark, and the annex's mark carries none.

## User / System Behavior

- Opening `/b/{id}` paints the app's ground and one loading ring, centred in the viewport, on the first frame — before any script has run.
- The ring is annex §11's: 32px, a 4px stroke, the primary at full strength for the leading arc over the same colour at 25% for the rest, turning once per 1.4s, `linear`.
- The ground is the app's own: the colour `body` carries in the loaded page, so the mount does not change the ground under the ring.
- On mount Nuxt removes the template and the page's own skeleton takes over. Nothing in the app tears it down, and nothing waits for it.
- Under `prefers-reduced-motion: reduce` the ring is drawn and does not turn, as the annex has it: its presence is the information.
- The colours are literals, not the tokens they mirror: the template is inlined ahead of the stylesheet, and on the dev server the stylesheet arrives by script, so at paint time the tokens do not exist. Each literal is annotated with the token it restates, and a change to that token changes the literal.

## Roles And Access

Not role-specific.

## Examples

| Input                                   | Expected Output                                               | Notes                      |
| --------------------------------------- | ------------------------------------------------------------- | -------------------------- |
| `GET /b/{id}`, the served HTML          | contains the splash markup and its style, beside the app root | before any script          |
| `/b/{id}` before the bundle runs        | the ground and a turning ring, nothing else                   | centred in the viewport    |
| `/b/{id}` once mounted                  | the splash is gone; the skeleton, then the build or the 404   | feature 007 from here      |
| `/b/{id}` with `prefers-reduced-motion` | the ring is drawn and still                                   | annex §11, §14.4           |
| `GET /`, `GET /privacy`                 | no splash markup in the HTML                                  | prerendered routes         |
| the ground token changes in `main.css`  | the literal here is changed with it, in the same commit       | annotated for exactly that |

## Business Rules

- **The values are the annex's**, restated, never re-decided: the ring's geometry and timing from §11's Loading ring, the ground from `body`'s colour.
- **No dependency and no script.** Markup and a style block, inlined by Nuxt.

## Edge Cases

- **A fast connection** may never show the ring for a visible duration. That is fine; a splash that stays up longer than the wait would be the defect.
- **JavaScript disabled.** The template stays: there is no app to replace it. A reader without JavaScript cannot see a client-only page anyway, and feature 007 accepts that.

## Invariants

- The splash never appears on a prerendered route.
- The mount is the only thing that removes it.
- The ring is the annex's, in the same geometry, timing and colours as feature 023's.

## Error Handling

None reaches the user. A broken template is a build-time error in Nuxt, not a runtime one.

## Entry Points

- `web/spa-loading-template.html`: the template.

## Dependencies

- [023_initial-load](023_initial-load.md): the annex entry this restates, and the route split.
- [007_share-links](007_share-links.md): the page whose first paint this precedes.
- `annexes/design-system.md` §11 Loading ring.

## Open Questions

_None._

## Tests

- No automated test: the template is static HTML that Nuxt inlines, and nothing in the app reads it.
- A built `/b/{id}` response is checked for the markup; the dev server is walked with a throttled script load to see the ring, and with reduced motion emulated.

## Verification

Suite 387 passing across 49 files, typecheck, lint and format clean; production build clean. Walked 2026-09-13.

**Served HTML.** The dev server and the built server both put the template beside the app root on `/b/{id}`; the prerendered `/` and `/privacy` carry none of it.

**First paint, scripts blocked.** The splash paints `rgb(23, 28, 25)` edge to edge with a 32px ring, 4px stroke, `rgb(223, 138, 32)` over the same at 25%, turning once per 1.4s linear, centred in a 1000×700 viewport, with no text and an empty app root. With reduced motion emulated the ring is drawn and its animation reads `none`.

**Mount.** With scripts allowed the loader node is gone after load and the page's own state shows.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
