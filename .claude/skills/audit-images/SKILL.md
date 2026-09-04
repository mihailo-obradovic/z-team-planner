---
name: audit-images
description: Audit a codebase area for how it loads images — lossless masters sized to the largest request, a NuxtImg preset per usage site, `image.screens` derived from the presets, one quality per family, a long edge cache with a recorded reset, alt text, lazy loading, and focal points — then apply fixes. Use when adding or replacing an image asset, wiring a new NuxtImg, reviewing the `image` block in nuxt.config.ts, or when the host's image optimizer is transforming more or larger images than the pages render.
---

<!-- catalyst:generated skill wrapper — the substance lives in the catalyst/ documents below; edit those, never this file. Regenerated on spawn and on every upgrade apply. -->

**Target:** $ARGUMENTS (a directory or feature area to audit; when empty, the files changed on the current branch)

Read and follow, in order:

- `catalyst/stacks/frontend/nuxt/addons/image/audit-images.md`
- `catalyst/stacks/frontend/nuxt/addons/image.md`

Paths inside those documents are relative to `catalyst/`. Repo conventions there win over any generic guidance from similarly-named installed skills or plugins.
