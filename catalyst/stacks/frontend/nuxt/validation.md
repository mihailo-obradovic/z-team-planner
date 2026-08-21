# Nuxt Validation

**Layer:** Frontend
**Tool:** Zod (responses) · Regle (requests)

Two libraries, two directions, no overlap. **Zod validates what comes in; Regle validates what goes out.** Neither is used for the other's job.

## Zod — responses only

Domain schemas live next to the types they produce in `@/types/`, and the **types are inferred from the schemas** — never hand-write a type a schema can infer:

```ts
export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['user', 'admin']),
  created_at: z.string()
});

// APIs that wrap a single resource get an envelope schema alongside it.
export const UserEnvelopeSchema = z.object({ data: UserSchema });

export type User = z.infer<typeof UserSchema>;
```

- **Response-only schemas** — a `{ status: string }` acknowledgement used in one service file — stay at the top of that service file rather than polluting `@/types/`.
- **Request and form payload types stay hand-written.** They describe what the UI sends, not what the server returns, so there is no response to infer them from and no runtime parsing to do.
- Parsing happens once, at the service boundary (`data-layer.md`). A parse failure is a programming or contract error, not a user-facing one: log the Zod issue and throw a generic message rather than surfacing schema internals.

## Regle — requests only

Forms validate client-side with Regle, wired as the **`@regle/nuxt` module** — one entry in `modules`, no plugin file. (The `ui/vuetify` choice goes the other way and says so in `ui/vuetify/setup.md`; neither call generalises to the other library. The `ui/nuxtui` choice declines the library's own `<u-form>` so Regle stays the only validation owner — `ui/nuxtui/nuxtui.md`, Components Not Used.)

### Dependencies

| Package        | Where        | Why                                                      |
| -------------- | ------------ | -------------------------------------------------------- |
| `@regle/core`  | dependencies | `useRegle` and the validation core                       |
| `@regle/rules` | dependencies | The built-in rules — `required`, `email`, `minLength`, … |
| `@regle/nuxt`  | dependencies | The module: auto-imports and the devtools                |

Adding these is a Dependency Change: it needs the user's approval and an `architecture.md` update in the same change.

### Nuxt config

```ts
export default defineNuxtConfig({
  modules: ['@regle/nuxt']
});
```

Installing the plugin by hand (`app.use(RegleVuePlugin)`) is what a plain Vue app does; a Nuxt app that registered the module never should.

Where a project needs custom rules or shared error messages, the module injects them from one setup file — `regle: { setupFile: '~/regle-config.ts' }` alongside the `modules` entry. Not the default: a project with neither has no reason to own the file.

### The auto-import boundary

The module auto-imports the `@regle/core` composables — `useRegle`, `inferRules`, `useScopedRegle`, `useCollectScope` — so do not import them explicitly (`../_vue/vue-style.md`, auto-import boundary).

**The rules are the exception and stay explicit:** `import { email, required } from '@regle/rules'`. Deleting a rule import because "Regle is auto-imported" breaks the build.

The module also auto-imports `useRegleSchema` and `inferSchema` from `@regle/schemas` — the bridge that drives a form off a Zod schema. **Both are offered by editor completion and neither is used here** — that is Zod doing Regle's job.

### Writing the form

**Rules mirror the backend's validation for that endpoint** — the same `required`, `email`, `maxLength(255)`, `minLength(8)`, `sameAs`, `requiredIf`. When they drift, the user meets a server error the form promised could not happen.

- The form component keeps a plain `ref` form model and calls `useRegle(form, rules, { externalErrors })`.
- Rules that depend on props (create mode vs edit mode) use a **rules getter** — `useRegle(form, () => ({ … }), …)` — so they re-evaluate when the props change.
- Inputs bind the field's errors; confirm buttons bind `r$.$invalid`; submit handlers `await r$.$validate()` before mutating.
- Dialog forms reset with `r$.$reset({ toInitialState: true, clearExternalErrors: true })` (`toState` when the fresh state depends on props), so a cancelled edit leaves no values or errors behind — no manual `Object.assign` back to an initial-form copy, and `clearExternalErrors` stops stale server 422s from reappearing. Trigger it from the dialog's after-close hook when the UI framework has one (stale input, passwords included, must not linger while closed); reset on open only when no such hook exists or when the target state depends on props the parent assigns right before opening.
- **No manual `isFormValid` computed.** Regle owns validity.

## Server 422s appear inline, not as toasts

A validation failure the form could have caught belongs on the field that caused it. The path from a mutation error to a field message has four pieces:

1. The mutation opts out of the validation toast — and only that toast:

   ```ts
   const { mutate, error } = useUpdateUser({
     errorHandling: { hideValidationToast: true }
   });
   ```

   Non-422 errors still toast centrally (`error-handling.md`). `hideValidationToast` is narrower than `hideToast` on purpose: a 500 during a form submit must still be visible.

2. `useValidationErrors(error)` derives field-keyed messages from the mutation's error ref — a `computed` producing `Record<string, string[]>`.

3. `useExternalErrors(source)` mirrors those into a ref Regle can own as its `externalErrors` modifier. It **copies rather than shares**, because Regle clears an entry as the user edits that field and must not be writing into the mutation's derived state.

4. Regle renders them alongside its own messages, and clears a field's server error as soon as the user edits it.

**Two component shapes, same pieces:**

- **A page that owns its own mutation** chains both directly: `useExternalErrors(useValidationErrors(error))`.
- **A parent that owns the mutation and a child that owns the form** — the common case for dialogs — has the parent derive `useValidationErrors(mutationError)` and pass it down as a `serverErrors` prop; the child does `useExternalErrors(() => props.serverErrors)`.

## Field error display

Where the `frontend/ui` choice provides inputs with an error-message prop, pass Regle's `$errors` array straight to it — it is already `string[]`.

Where it does not, the project owns a small presenter component with a **fixed minimum height** (`ui/headless.md`, The field-error presenter).
