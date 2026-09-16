<template>
  <u-app>
    <u-header class="shrink-0">
      <template #title>
        <span class="font-heading text-title">
          Z-Team <span class="text-primary">Planner</span>
        </span>

        <span
          class="ml-2 hidden font-sans text-xs tracking-widest text-secondary-300 uppercase xl:inline"
        >
          Build calculator
        </span>
      </template>

      <template #right>
        <!-- ! Withheld by CSS, not `v-if`: the markup stays in the prerendered HTML, only its paint waits for boot (feature 023). -->
        <div data-boot-withheld class="flex items-center gap-2">
          <BudgetCounters />

          <div class="mx-2 hidden h-7 w-px bg-secondary-400 md:block" />

          <!-- ! Using localStorage in SSR causes hydration errors if not client-only -->
          <ClientOnly>
            <BuildManager class="hidden lg:flex" tier="labelled" />
            <BuildManager
              class="hidden md:flex lg:hidden"
              :labelled="false"
              tier="icon"
            />
          </ClientOnly>

          <!-- ! Outside ClientOnly on purpose: auth starts `unknown` on server and client alike, so both render the same reserved slot. -->
          <AuthMenu tier="labelled" />

          <AuthMenu tier="icon" />

          <AuthMenu tier="bare" />

          <StorySetupButton tier="labelled" @open="handleOpen" />

          <StorySetupButton tier="icon" @open="handleOpen" />

          <StorySetupButton tier="bare" @open="handleOpen" />
        </div>
      </template>
    </u-header>

    <!-- ! Explicit width and `x1`: without them the image module snaps to the portrait screens or requests a 5120 that no source has. -->
    <NuxtImg
      src="/images/background.webp"
      width="2560"
      densities="x1"
      class="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-20"
      alt=""
    />

    <!-- * Hidden during boot by `main.css`, which also removes it from the tab order and accessibility tree. -->
    <u-main class="relative z-10">
      <NuxtPage />
    </u-main>

    <!-- * Leave-only: the ring is already showing when the app mounts. -->
    <Transition
      leave-active-class="transition-opacity duration-(--duration-baseline) ease-in"
      leave-to-class="opacity-0"
    >
      <LoadingRing v-if="booting" />
    </Transition>

    <!-- ! Using localStorage in SSR causes hydration errors if not client-only -->
    <ClientOnly>
      <!-- * `v-if` rather than the header's CSS withholding: client-only content has no prerendered markup to preserve. -->
      <template v-if="!booting">
        <FirstRunBanners />

        <div
          class="shrink-0 border-t-2 border-secondary-950 bg-secondary-800 p-3 md:hidden"
        >
          <BuildManager block size="lg" tier="bare" />
        </div>
      </template>

      <BuildDialogs />

      <BuildAccountDialogs />

      <BuildConflictDialog />

      <FirstLoginOffer />
    </ClientOnly>

    <AccountDialogs />

    <StorySetupDrawer v-model:open="storySetupOpen" />
  </u-app>
</template>

<script setup lang="ts">
const { name: title, description } = useSiteConfig();

const { loadInitialBuild } = useInitialBuild();
const { setupBeforeUnload } = useUnsavedChanges();

const storySetupOpen = ref(false);

// * Read once, not reactively: only the initial boot of `/` waits, never a later navigation to it.
// * A plain ref, not query state: it waits on localStorage, not a request (feature 023).
const booting = ref(useRoute().path === '/');

function handleOpen() {
  storySetupOpen.value = true;
}

onMounted(async () => {
  // * `finally` reveals the planner even when the build fails to load; the leave-site prompt stays unarmed, as there is nothing to lose.
  try {
    await loadInitialBuild();
  } catch (error) {
    console.error('The initial build could not be loaded.', error);

    return;
  } finally {
    booting.value = false;
  }

  setupBeforeUnload();
});

useHead({
  // ! Overrides SEO Utils' low-priority `'%s %separator %siteName'` default: every page title here is already complete, so it doubled the site name.
  titleTemplate: '%s',

  meta: [
    // * Matches the header chrome, so the browser bar continues the page.
    { name: 'theme-color', content: '#143e38' }
  ],
  link: [
    // ! Order matters: browsers take the first icon they understand, so SVG leads and .ico is the fallback.
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: '/apple-touch-icon.png'
    },
    { rel: 'manifest', href: '/site.webmanifest' }
  ],
  htmlAttrs: {
    lang: 'en',

    // * The flag every boot rule keys off, set via unhead so it stays outside the hydrated tree.
    // ! Always 'true' or 'false', never `undefined`: unhead does not remove an attribute inherited from SSR, so the app would stay hidden.
    'data-booting': computed(() => String(booting.value))
  },

  // ! Without JavaScript nothing clears the flag, so this must undo every boot rule in `main.css`.
  // ! In <head>, not the template: browsers parse <noscript> as text when scripting is on, which would mismatch hydration.
  // ! `!important` because these rules tie in specificity with the ones they undo.
  noscript: [
    {
      innerHTML:
        "<style>[data-booting='true'] main{visibility:visible!important;overflow-y:auto!important}" +
        "[data-booting='true'] [data-boot-withheld]{display:flex!important}" +
        '[data-loading-ring]{display:none!important}</style>'
    }
  ]
});

useSeoMeta({
  title,
  description,
  ogImage: '/images/og/build-now.png',
  twitterImage: '/images/og/build-now.png'
});
</script>
