---
title: Dependency-Based Parallelization
impact: CRITICAL
impactDescription: 2-10× improvement
tags: async, parallelization, dependencies
---

## Dependency-Based Parallelization

For operations with partial dependencies, start every independent promise eagerly and chain only the dependent step — never serialize work that could already be running.

**Incorrect (profile waits for config unnecessarily):**

```typescript
const [user, config] = await Promise.all([fetchUser(), fetchConfig()]);
const profile = await fetchProfile(user.id);
```

**Correct (config and profile run in parallel):**

Create all the promises first, chain dependent work with `.then()`, and `Promise.all()` at the end.

```typescript
const userPromise = fetchUser();
const profilePromise = userPromise.then((user) => fetchProfile(user.id));

const [user, config, profile] = await Promise.all([
  userPromise,
  fetchConfig(),
  profilePromise
]);
```

**Optional library:** [`better-all`](https://github.com/shuding/better-all) expresses the same dependency graph declaratively and starts each task at the earliest possible moment. It is a new dependency — adopt it only through the project's dependency-approval rule; the pattern above needs nothing beyond the standard library.

> Adapted from Vercel's upstream rule of the same name: the dependency-free pattern is promoted to the default and `better-all` demoted to an optional mention.
