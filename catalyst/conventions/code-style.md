# Code Style

**Trigger:** writing or changing a function signature, or placing a function within a file — in any language, on every project.

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
- **A third-party signature is converted at its boundary, once.** An SDK that takes a boolean keeps taking one; the project's own code speaks the union up to the call, and the conversion happens in the function that touches the SDK.

A union also extends. A third state added to a boolean means changing every signature it passes through; added to a union it means one more member.

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
