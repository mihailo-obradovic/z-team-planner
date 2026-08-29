// * Nuxt DevTools mounts its floating panel as two custom elements (`nuxt-devtools-frame`, `nuxt-devtools-inspect-panel`), each hosting its own Vue app that clutters the Vue DevTools app selector as "VueElement" entries. Tag their component definitions with `devtools: { hide: true }` so @vue/devtools-kit skips them and only the main app registers. Dev-only.
export default defineNuxtPlugin({
  name: 'hide-devtools-webcomponents',
  enforce: 'pre',
  setup() {
    if (!import.meta.dev) {
      return;
    }

    const originalDefine = customElements.define.bind(customElements);

    customElements.define = (name, constructor, options) => {
      if (name.startsWith('nuxt-devtools')) {
        // * defineCustomElement() exposes the component definition as a static `def` on the returned constructor.
        const def = (constructor as { def?: Record<string, unknown> }).def;

        if (def) {
          def.devtools = { hide: true };
        }
      }

      originalDefine(name, constructor, options);
    };
  }
});
