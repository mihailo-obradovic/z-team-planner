# Import NuxtUI Component

Import the default theme configuration for a NuxtUI component into the project.

**Component:** $ARGUMENTS

## Steps

1. **Look up the component's theme** — Use the NuxtUI MCP or documentation to find the default theme configuration for the component. Navigate to the component's page and find the `#theme` section. Extract the contents of the component's theme object (not the outer wrapper).

2. **Create the config file** — Write the theme to `app/config/nuxt-ui/<component-name>.ts`. Export the theme object as default. Only include the inner contents — the wrappers are already handled in `app.config.ts`.

3. **Register in app.config.ts** — Import the new config file in `app.config.ts` and add it to the `ui` section under the component's key name.

4. **Add type helper** — Add the corresponding type entry in `types/nuxt-ui.d.ts` so the component config is properly typed in SSR mode.

5. **Verify** — Check that the component name, import path, and type registration are all consistent.

## Notes

- If the config file already exists for this component, report it and stop — do not overwrite existing customizations.
- The imported config should be the exact defaults from NuxtUI docs, with no modifications. Customizations are done separately following the patterns in CLAUDE.md.
