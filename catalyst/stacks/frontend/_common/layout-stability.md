# Layout Stability

**Tier:** Frontend — Common

A component that changes size when its own state changes moves everything below it. The move is worst where it is most likely: the control that caused it is the one under the pointer, so the jump lands where the user is already looking and already tapping. On a phone the next tap arrives before the reflow settles and hits whatever slid into that spot.

The rule is one sentence: **reserve the space the largest state needs, so a state change repaints instead of reflowing.** This directory is never a spawn choice; it travels automatically with any module whose `**Requires:**` header names `frontend/_common`, so the rules here hold whatever the framework is.

Two approaches that look like fixes and are not:

- **A fixed height in pixels.** The height a variant needs depends on how it wraps, and that depends on the width. One string measured across a real dialog: two lines at a 293px content width, one line at 764px. A constant is correct at one width and wrong at the others, and it silently clips or pads when the copy is next edited.
- **Animating the change.** Animation does not remove the movement, it slows it down — everything below still travels, and now it travels for 200ms instead of instantly. It also owes a `prefers-reduced-motion` path. Reserve first; animate afterwards only if the transition itself is worth having.

## Copy that changes with state

Stack every variant in one grid cell. The tallest reserves the row; the visible one paints over it. This adapts to width, font size, and future copy edits with no number to maintain.

Wrong — the card shrinks by one line when the power is activated:

```html
<p>{{ description }}</p>
```

Right — every variant reserves the row, the shown one paints over it:

```html
<div class="grid">
  <p
    v-for="variant in descriptionVariants"
    :key="variant"
    class="invisible col-start-1 row-start-1"
    aria-hidden="true"
  >
    {{ variant }}
  </p>
  <p class="col-start-1 row-start-1">{{ description }}</p>
</div>
```

The ghosts are `aria-hidden` — they are a measurement device, and a screen reader that reads all five states of one sentence is worse than the jump. Build the shown string and the variant list from **one function**, or the reservation silently stops covering the thing it reserves for.

## Values that grow a digit

A number that crosses from one digit to two widens its container and shifts everything beside it. Reserve the widest value's slot and centre in it, rather than letting the glyph set the width.

Wrong — the glyph sets the width:

```html
<span>{{ score }}</span>
```

Right — the slot is reserved and the value centres in it:

```html
<span class="w-7 text-center">{{ score }}</span>
```

The same holds for a currency or unit suffix that appears only in some states.

## Affixes that appear on state

A badge, icon, or count that mounts when something becomes active adds inline content to a row that was sized without it. If the row was a single line at its widest, the affix wraps it to two.

Reserve the row's height rather than the affix's width — a row with a fixed height absorbs an affix appearing inside it, and nothing below moves. Where the affix can wrap the line, give it its own reserved slot the way a numeric value gets one.

## Blocks that mount and unmount

A whole section appearing or vanishing is the largest jump of the four, and the only one where reserving is sometimes wrong — a block that is genuinely gone should not leave a hole.

Decide it deliberately, on one question: **does the control that removes the block sit above it?** If it does, the user's pointer is above the collapse and the jump is tolerable. If the control sits below the block, or inside it, removing it drags the rest of the page up under the finger that just tapped — reserve, or move the control.

## Values that are not known yet

The four cases above are about a value that changes. This one is about a value that has not arrived — a signed-in user read from an auth SDK, a feature flag, remote config, anything resolved asynchronously. The first render happens before the answer exists, and what goes in that gap decides whether the page settles or pops.

**Render nothing, and the space collapses**, then re-expands when the answer lands — the mount-and-unmount jump above, on every page load rather than on a user action. **Render one of the real states as a guess** and the guess is wrong for some users, so they watch the UI correct itself: a header that shows a sign-in button for a moment to someone who is already signed in reads as being signed out and back in.

**Model the not-yet-known as a state of its own**, beside the real ones, and give it the reserved placeholder this document already describes: the element keeps its space, and is `invisible`, `aria-hidden`, and removed from the tab order until it has something to say.

```ts
// ✅ the ignorance is a state, so every render has something honest to draw
type SessionStatus = 'unknown' | 'anonymous' | 'signed-in';
```

It costs one member in a union and buys a layout that never moves after the answer arrives.

**Where a framework renders twice — a server or build pass, then hydration — the same state is what keeps the two passes identical.** Frameworks offer a client-only escape hatch for this, and it is the right tool for **a value the server cannot know and the client knows at once**, such as a viewport width or a stored preference. It is the wrong tool when **the client's first render is as ignorant as the server's**, because deferring to the client defers to a client that does not know either — which is how a control renders nothing, then flashes signed-out, then settles on signed-in.

The test is not "does the server know this?" but **"does the client know it on its first render?"** Where both answers are no, the ignorance is real, and it belongs in the model rather than behind a boundary.

## Checking it

Measure; do not eyeball. Record the element's height in **every** state at the project's narrowest and widest supported widths — the reflow band is usually neither extreme, because the narrowest width wraps every variant the same and the widest wraps none of them. A change that is invisible at 320px and on a desktop can still be a full line of jump at 393px.

**In the project:** these rules apply wherever a component renders state-dependent content — no separate opt-in, and nothing to configure. When a component's copy, value, affix, or section varies by state, the reservation ships in the same change as the state, not as a follow-up fix.
