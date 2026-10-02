// * Titles the error page from a plugin rather than from `error.vue`: an entry `error.vue` registers on a client-raised error lands while the swap from `app.vue` is rendering, and the tab keeps the previous title (feature 009).
export default defineNuxtPlugin({
  name: 'error-title',
  setup() {
    const error = useError();

    useHead({
      // * The site name as a literal, like `privacy.vue`'s: the site config is empty on `/b/**`, which is never server-rendered.
      title: () =>
        error.value
          ? `${errorHeading(error.value)} — Z-Team Planner`
          : undefined
    });
  }
});
