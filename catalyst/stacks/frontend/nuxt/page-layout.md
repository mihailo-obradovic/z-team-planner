# Nuxt Page Layout

**Layer:** Frontend
**Tool:** CSS flexbox · Nuxt layouts

How a page gets its height. The shell owns the viewport and `main` is the only scrolling region; this document owns the whole chain — the shell half a project wires once, and the page half every page lives under. It is the module's answer to viewport height: `design-system.md` §4 holds the token values and defers here, and no page, layout, or component computes viewport height any other way.

## The height chain

Height flows down one unbroken chain. Every link is required; break one and everything below it collapses to content height.

1. **The stylesheet** pins `html`, `body`, and `#__nuxt` to `height: 100%` with `overflow-y: hidden`. The shell is exactly the viewport and never scrolls, which is what keeps the header and footer in place.
2. **The layout** is a column of that height: header and footer do not shrink, and the row between them takes the rest.
3. **`main` is the only scrolling region** — a flex child of that row, free to shrink below its content, scrolling inside itself.
4. **`main` is therefore a flex column of definite height** — the only reason a page root can ask for full height and get a real number back.

In CSS, links 2 and 3:

```css
.layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.layout > header,
.layout > footer {
  flex-shrink: 0;
}
.layout > .row {
  display: flex;
  flex: 1;
  min-height: 0;
}
.layout main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
```

Where the `frontend/ui` choice brings Tailwind, the same links are `flex h-full flex-col` on the layout, `shrink-0` on header and footer, `flex min-h-0 flex-1` on the row, and `flex min-h-0 flex-1 flex-col overflow-y-auto` on `main`. A choice that ships its own layout engine states its form of links 2 and 3 in its own document, and the rest of this one holds unchanged.

The chain already subtracts the header and the footer. **Nothing below it does that arithmetic again**: no `100vh`, no `100dvh`, and above all no `calc(100vh - <header> - <footer>)`. A header-height token, where the ui choice provides one, exists so the header can _set_ its height — not so a page can subtract it. The moment a page hardcodes that sum it is wrong on the next chrome change, and wrong at once on any breakpoint where the footer wraps.

**Viewport units outside the chain.** A surface rendered without the layout — a pre-mount splash, a standalone error page — has no chain to inherit and sizes itself with `100dvh`, never `100vh`, so mobile browser chrome does not clip it. That is the only place a viewport unit is correct.

## The two kinds of page

**Ordinary flow — the default.** The page renders its content and stops. If it is taller than `main`, `main` scrolls; if it is shorter, it sits at the top. Most pages are this and need no height rules at all.

**Full-height column — the opt-in.** Use it only when one region inside the page must scroll while the rest of the page stays put: a table whose column headers stay visible under `sticky`, a chat log pinned above its composer, a list beside a detail pane. The shape:

```html
<div class="flex h-full flex-col">
  <!-- fixed chrome: every sibling that is not the scrolling region -->
  <div class="shrink-0">…heading, filters, counts…</div>

  <!-- the one region that absorbs what is left and scrolls inside itself -->
  <data-table class="min-h-0 flex-1" sticky />
</div>
```

Three rules make it work, and all three are load-bearing:

- **Full height on the page root.** It resolves against `main`, so the column is exactly the space between the header and the footer.
- **No shrinking on the fixed children.** Without it flexbox shrinks the page's own chrome to make room for the overflowing region — headings and counts compress before the table does.
- **`min-height: 0` with `flex: 1` on the scrolling child, and on exactly one child.** `flex: 1` claims the leftover space. `min-height: 0` is the half that gets forgotten: a flex child's default `min-height: auto` refuses to shrink below its content, so without it the region grows the column, the column grows past `main`, and the _page_ scrolls instead of the region — sticky headers scroll away with it. Two such siblings split the space and both scroll, which is almost never what was wanted.

Nested columns repeat the pattern: an intermediate wrapper that contains a scrolling descendant needs `min-height: 0` too, or it re-imposes its content height on everything under it.

## What a page must not do

- **Never introduce a second scrolling region in the page frame.** `overflow-y: auto` on the page root gives two nested scrollbars and a wheel that stops at the wrong boundary; the scroll belongs on the inner region or on `main`, never in between.
- **Never set a fixed pixel height on a content region** to make it fit — the height comes from the chain (`design-system.md`, §4 Sizing).
- **Never measure.** Reading an element's box to derive a height re-encodes, at runtime, the arithmetic the chain exists to remove: it is wrong for one frame on every layout change, and silently wrong whenever the measurement runs before the thing above it settles. The chain calculates nothing.
- **Never reach up.** A page that needs the layout to change asks for it in the layout, not with a positioned element escaping `main`.

## Diagnosing it

| Symptom                                                   | Cause                                                                                    |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| The whole page scrolls and sticky headers scroll away     | Missing `min-height: 0` on the scrolling child (or on a wrapper between it and the root) |
| The region is the height of its content, not the leftover | Missing `flex: 1`, or an ancestor in the chain is not a flex column                      |
| The column is the height of its content, not of `main`    | Missing full height on the page root, or `main` lost its `flex: 1`                       |
| Headings and toolbars squash as the list grows            | The fixed children are shrinking — they need `flex-shrink: 0`                            |
| Two scrollbars                                            | A second `overflow-y: auto` between `main` and the scrolling region                      |
| Content sits under the footer on mobile                   | A `100vh`/`100dvh` somewhere in the page — remove it, the chain already fits             |

## Comments

The pattern is documented here, so a page that follows it needs no explanatory comment — the classes are the convention, and repeating the rationale on every page is the duplication this document replaces (`conventions/code-annotations.md`). Annotate only a genuine deviation: a page that departs from the shape says why, in one `// !` line.
