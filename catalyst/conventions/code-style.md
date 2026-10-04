# Code Style

**Trigger:** writing or changing a function signature, placing a function within a file, writing a conditional, a ternary, or a loop, reading, storing, or rendering a timestamp, or writing a display formatter — in any language, on every project.

Language-level shaping rules that hold regardless of stack. They are about **how code is written**, never about what a file should carry: whether a comment, a helper, or an abstraction earns its place is [`mold.md`](mold.md)'s. Framework-specific ordering (a Vue SFC's script sections, a route file's declaration order) is the stack module's, and where a module states one it wins for the files it covers.

---

## No boolean parameters

**A function never takes a boolean as a parameter**, positional or named. A two-state input is a string union whose members say what they mean.

A boolean at a call site carries no information. `getToken(true)` is unreadable without opening the callee, and it stays unreadable after the reader has done so once and forgotten. The type is also the wrong shape: `true` and `false` are the only two names the language gives you, and neither is the name of the thing.

```ts
// * Incorrect
async function buildHeaders(forceRefresh: boolean) { … }
buildHeaders(true);

// * Correct
type TokenFreshness = 'cached-token' | 'fresh-token';

async function buildHeaders(freshness: TokenFreshness) { … }
buildHeaders('fresh-token');
```

```python
# * Incorrect
def render_build(build, include_owner: bool): ...
render_build(build, False)

# * Correct
def render_build(build, audience: Literal["owner", "public"]): ...
render_build(build, "public")
```

Two boundaries:

- **Booleans inside an options object are permitted** — the key names them, which is the whole objection answered. `{ replace: true }` reads. What an options object must still not carry is a set of booleans whose illegal combinations type-check; two flags with three legal states are one union, not two booleans.
- **A component's props are an options object** — they are keyed at every call site, so `<UserCard compact />` names its own argument and the carve-out above covers it. A single boolean prop is fine. What is not fine is the same illegal-combination trap: two boolean props with three legal states between them are one union, not two booleans, and the union usually already exists as the component's tier or variant.
- **A third-party signature is converted at its boundary, once.** An SDK that takes a boolean keeps taking one; the project's own code speaks the union up to the call, and the conversion happens in the function that touches the SDK.

A union also extends. A third state added to a boolean means changing every signature it passes through; added to a union it means one more member.

## Same-typed positional parameters become an object

**Two or more parameters of the same type, positionally, are a type hole.** A transposed pair type-checks, so the compiler cannot tell you what a reviewer cannot see either: nothing distinguishes the second `string` from the third.

```ts
// * Incorrect — swap any two and it still compiles
function serialise(id: string, name: string, owner: string) { … }

// * Correct
function serialise(build: { id: string; name: string; owner: string }) { … }
```

The threshold is **two or more same-typed**, not a count of parameters — three parameters of three different types are fine, and two of the same type are not.

An object also stops the growth that makes this urgent: a signature reached eight same-typed parameters, and adding a ninth meant editing every call site to keep the order right. Adding a key edits nothing.

## Named functions are declarations

**A named function is a declaration; an arrow is for a callback or an inline value.** It holds in every language that has both forms. Declarations hoist, which is what lets [Principal export first](#principal-export-first) put the export above its helpers.

```ts
// * Incorrect
export const createPaymentsService = (db: Db) => ({ … });
items.map(function (item) { return item.id; });

// * Correct
export function createPaymentsService(db: Db) {
  return { … };
}
items.map((item) => item.id);
```

Three exceptions: object-literal methods in a returned object stay as written — they are values, not declarations; a framework-required form keeps the framework's shape (`defineConfig(…)`, `forwardRef(…)`, a handler passed to `app.get`); and a function passed exactly once — a comparator, a predicate — may stay inline at the call site, becoming a declaration once it is named and reused.

oxlint enforces it with `func-style: ["error", "declaration"]` and `prefer-arrow-callback`.

## Principal export first

**A module with a single principal export defines it first**; every function it calls follows, below it, in call order.

A reader opening a file wants the thing the file is for, not the parts it is made of. Bottom-up ordering forces them to read four helpers before learning what any of them serve, and to hold all four in mind while they find out.

```ts
// * Incorrect — the reader meets three helpers before the point of the file
function isUnauthorized(error: unknown) { … }
function generateRequestId() { … }
async function makeRequest(path, options) { … }

export async function fetcher(path, options) { … }

// * Correct
export async function fetcher(path, options) { … }

async function makeRequest(path, options) { … }
function generateRequestId() { … }
function isUnauthorized(error: unknown) { … }
```

Three carve-outs:

- **Modules of sibling exports are exempt.** A service with six endpoint functions, a route file, a schema module — there is no principal export to put first, and inventing a hierarchy to satisfy the rule is worse than the arbitrary order it replaces.
- **Module-level constants stay above first use.** They are not functions and they do not hoist; a constant moved below its reader is a crash, not a style choice. The same holds for any function assigned to a `const` rather than declared.
- **Files with a framework-imposed order keep it.** A Vue SFC follows its script section order; a test file keeps its fixtures above the suite. A second ordering rule on top of an existing one means two contracts for one file.

The rule is about reading order, not about call depth: a helper called from two places sits after the first of them, and a helper's own helper follows it rather than being hoisted to the top of the tail.

## Braced control flow

**Every control-flow body is a braced block** — `if`, `else`, `for`, `while`, `do` — including a body of one statement, including a body that fits on the same line as its condition.

A brace-less body is a hazard twice over. It is a diff hazard: adding a second statement to `if (!build) return;` means restructuring the line before the change can be made, and the restructure is exactly where the second statement lands outside the branch it was meant for. It is a reading hazard: `if (x) return;` scans as one unit of flow, and a reader counting the branches in a function will not count it.

```ts
// * Incorrect
if (!build) return;
if (level > 0) bl[id] = level;
for (const id of build.fl) fl[id] = true;

// * Correct
if (!build) {
  return;
}

if (level > 0) {
  bl[id] = level;
}

for (const id of build.fl) {
  fl[id] = true;
}
```

Two boundaries:

- **The rule binds languages whose braces are optional.** Python's block syntax is not a choice, and this says nothing about it.
- **Expressions are not control flow.** A ternary, a `&&` short-circuit, and a single-expression arrow body are values, not branches, and stay as they are. `return a ? b : c` is untouched; a ternary inside a ternary is [Ternaries do not nest](#ternaries-do-not-nest)'s.

Where the stack's linter offers the check, it is turned on rather than left to review — ESLint and oxlint both spell it `curly`, with the `all` option.

## Ternaries do not nest

**A ternary's branches are values, never another ternary.** A third outcome gets a name: a function whose guard clauses return each case, or a `Record` lookup keyed by it.

```ts
// * Incorrect
const label = count > 1 ? 'many' : count > 0 ? 'one' : 'none';

// * Correct
function countLabel(count: number) {
  if (count > 1) {
    return 'many';
  }
  if (count > 0) {
    return 'one';
  }
  return 'none';
}
```

oxlint enforces it with `no-nested-ternary`. It does not lint Vue templates, where `vue-style.md`'s binding threshold holds the same line in review.

## Wall-clock time is the server's

**Application code never reads the clock, and a timestamp that is persisted or transmitted is an ISO-8601 UTC string the server produced** — never an epoch number a client produced.

Two failures sit behind this. A client clock is wrong: skewed, in the viewer's zone, and settable by the person it belongs to, so any value it stamps is untrustworthy the moment it crosses a boundary. And an epoch integer cannot be compared to the ISO strings the API returns, so a codebase carrying both carries two representations of one concept and a conversion nobody wrote.

```ts
// * Incorrect — a client clock stamps a record, as an integer
build.savedAt = Date.now();

// * Correct — the server stamped it, and it arrives as a string
build.updated_at; // '2026-08-29T12:34:56Z'
```

Rendering a timestamp is a conversion, and a conversion happens at one named boundary rather than wherever a component needs it:

```ts
// * Incorrect — parsing scattered across components
const label = new Date(build.updated_at).toLocaleString();

// * Correct — one module parses a timestamp, and every component calls it
import { formatTimestamp } from '@/utils/formatTimestamp';
```

In TypeScript, `Date` is banned outright — in value positions (`new Date()`, `Date.now()`, `Date.parse()`, `Date.UTC()`) and in type positions alike. `Temporal` is the sanctioned replacement, behind a polyfill until it reaches Baseline; a project that adds one records it in `architecture.md` like any other dependency. Enforce the ban with `no-restricted-globals` where the linter offers it.

Three boundaries:

- **A server reading its own clock is the rule working, not an exception to it.** `datetime` in a model or a repository is where a timestamp is supposed to come from; this rule constrains the client that would otherwise invent one.
- **Monotonic time is not wall-clock time.** `performance.now()` measures elapsed duration, cannot be compared across processes, and is untouched.
- **A delay is not a timestamp.** `setTimeout` and its relatives take durations, and nothing here applies to them.
- **An id is not a timestamp either.** `Date.now()` is sometimes reached for as a unique-enough key; the replacement there is `crypto.randomUUID()`, not `Temporal`. The ban lists `Date.now()` and offers only `Temporal`, which is the wrong answer for an id.

A polyfill is **imported inside the one boundary module that needs it**, never installed as a global shim: imported, it lands in the chunk that formats a timestamp, while a shim lands in the entry bundle every visitor downloads.

## Formatters take absence, never bad input

**A display formatter accepts `T | null | undefined`, and legitimate absence renders the one house fallback**, defined in one place rather than chosen per call site.

```ts
// * Correct
export function formatPrice(cents: number | null | undefined) {
  if (cents === null || cents === undefined) {
    return EMPTY_VALUE;
  }

  if (!Number.isFinite(cents)) {
    throw new TypeError(`formatPrice: not a finite number: ${cents}`);
  }

  return priceFormat.format(cents / 100);
}
```

A bad value — `NaN`, an invalid date, an unparseable string — never reaches a formatter: the schema at the service boundary parses it out ([`architecture.md`](../architecture.md), Validation). One that arrives anyway throws rather than rendering the fallback, which would hide the bug ([`architecture.md`](../architecture.md), Error Handling).
