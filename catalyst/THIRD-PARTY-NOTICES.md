# Third-Party Notices

Material in this rule set that is vendored or adapted from someone else's work, and the license each comes under. Each module's `## Provenance` section says what was taken and how it deviates (`architecture.md`, Third-party material); this file carries the notices those licenses require to travel with the copies.

| Material                                                                                                                  | Where in the bundle                                                                                                                                                                              | License                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel `react-best-practices` skill — https://github.com/vercel-labs/agent-skills (`skills/react-best-practices/rules/`)  | `stacks/_lang/typescript/rules/`, `stacks/frontend/_react/rules/`, `stacks/frontend/nextjs/rules/`, `stacks/frontend/nextjs/addons/ssr/rules/` (vendored, with the deviations each router lists) | MIT, as declared by the repository README and the skill's `license:` field; the repository ships no LICENSE file with a copyright line. Copyright Vercel, Inc. |
| Petar Ivanov, _The Conscious React_ and _The Conscious Node_ repositories (`book-examples`, `case-studies`, boilerplates) | `stacks/frontend/_react/`, `stacks/frontend/nextjs/`, `stacks/backend/node-express/`, `stacks/workers/bullmq.md` (adapted; the books themselves are not a source)                                | MIT, Copyright (c) 2026 Petar Ivanov                                                                                                                           |
| Nuxt UI agent skill — https://github.com/nuxt/ui (`skills/nuxt-ui/`)                                                      | Not in the bundle: a project on the `nuxtui` module vendors it to `.claude/skills/nuxt-ui/` with upstream's `LICENSE` beside it (`stacks/frontend/nuxt/ui/nuxtui/nuxtui.md`, Vendoring)          | MIT, Copyright (c) 2023 Nuxt                                                                                                                                   |

Adding vendored or adapted material adds a row here in the same change as its Provenance section.

## MIT License

Applies to every row above, with that row's copyright line.

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
