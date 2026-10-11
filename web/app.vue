<template>
  <u-app>
    <SkipLink />

    <u-header class="shrink-0">
      <!-- * The title is the page's one `h1`: the title link is the only element on every route that names the app. -->
      <!-- ! No comment inside this slot: `u-header` builds the link's `aria-label` from the slot's nodes, comments included. -->
      <template #title>
        <h1 class="font-heading text-title">
          Z-Team <span class="text-primary">Planner</span>
        </h1>

        <span
          class="ml-2 hidden font-sans text-xs tracking-widest text-secondary-300 uppercase xl:inline"
        >
          Build calculator
        </span>
      </template>

      <template #right>
        <!-- ! Withheld by CSS, not `v-if`: the markup has to stay in the prerendered HTML (feature 023). -->
        <!-- * A pointer or focus in the cluster is the intent that fetches the drawer's and the build dialogs' chunks before a click (decision 017). -->
        <div
          data-boot-withheld
          class="flex items-center gap-2"
          @pointerenter.once="preloadHeaderSurfaces"
          @focusin.once="preloadHeaderSurfaces"
        >
          <BudgetCounters />

          <div class="mx-2 hidden h-7 w-px bg-secondary-400 md:block" />

          <!-- * Not on a share page: every build control there would act on a build that is not open (feature 007). -->
          <!-- ! Client-only because it renders localStorage: server-rendering it desynchronises hydration. -->
          <ClientOnly v-if="!isSharePage">
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

          <template v-if="!isSharePage">
            <StorySetupButton tier="labelled" @open="handleOpen" />

            <StorySetupButton tier="icon" @open="handleOpen" />

            <StorySetupButton tier="bare" @open="handleOpen" />
          </template>
        </div>
      </template>
    </u-header>

    <!-- ! `provider="none"`: the master is already a lossy 2560×1161 WebP, so any re-encode is softer at low quality or larger at high; the committed file is served as it is, at low priority so it stays off the entry script's bandwidth (decision 017). Its 2560 width stays for the same reason: under `object-cover` a portrait phone scales it by height, so a narrower variant would be blurrier. -->
    <NuxtImg
      src="/images/background.webp"
      provider="none"
      densities="x1"
      fetchpriority="low"
      class="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-20"
      alt=""
    />

    <!-- * Hidden during boot by `main.css` — `visibility`, so it leaves the tab order with it. -->
    <u-main :id="MAIN_CONTENT_ID" tabindex="-1" class="relative z-10">
      <NuxtPage />
    </u-main>

    <!-- * Leave-only: the ring is already showing when the app mounts. -->
    <Transition
      leave-active-class="transition-opacity duration-(--duration-baseline) ease-in"
      leave-to-class="opacity-0"
    >
      <LoadingRing v-if="booting" />
    </Transition>

    <ClientOnly>
      <!-- * `v-if` rather than the header's CSS withholding: client-only content has no prerendered markup to preserve. -->
      <template v-if="!booting">
        <FirstRunBanners />

        <div
          v-if="!isSharePage"
          class="relative z-10 shrink-0 border-t-2 border-secondary-950 bg-secondary-800 p-3 md:hidden"
        >
          <BuildManager block size="lg" tier="bare" />
        </div>
      </template>

      <!-- * Each overlay mounts from its own chunk the first time its state opens it and stays mounted from then on (decision 017). -->
      <LocalBuildDialogs v-if="saveAsNewOpened" />

      <CloudBuildDialogs v-if="accountSaveOpened" />

      <OpenBuildDialogs v-if="openBuildDialogsOpened" />

      <DiscardChangesDialog v-if="discardOpened" />

      <CloudBuildConflictDialog v-if="conflictOpened" />

      <!-- * Signed-in surfaces: the offer decides for itself whether to open, so it mounts with the session rather than with a flag. -->
      <FirstLoginOffer v-if="signedInOnce" />
    </ClientOnly>

    <AccountDialogs v-if="signedInOnce" />

    <StorySetupDrawer v-if="storySetupOpened" v-model:open="storySetupOpen" />
  </u-app>
</template>

<script setup lang="ts">
import SkipLink from '@/components/shell/SkipLink.vue';
import BudgetCounters from '@/components/shell/BudgetCounters.vue';
import BuildManager from '@/components/build/BuildManager.vue';
import AuthMenu from '@/components/account/AuthMenu.vue';
import StorySetupButton from '@/components/shell/StorySetupButton.vue';
import LoadingRing from '@/components/shell/LoadingRing.vue';
import FirstRunBanners from '@/components/shell/FirstRunBanners.vue';

import { MAIN_CONTENT_ID } from '@/types/header';

// * Own chunks, fetched on first use or by the idle preload (decision 017).
const LocalBuildDialogs = defineAsyncComponent(
  surfaceLoaders.localBuildDialogs
);
const CloudBuildDialogs = defineAsyncComponent(
  surfaceLoaders.cloudBuildDialogs
);
const OpenBuildDialogs = defineAsyncComponent(surfaceLoaders.openBuildDialogs);
const DiscardChangesDialog = defineAsyncComponent(
  surfaceLoaders.discardChangesDialog
);
const CloudBuildConflictDialog = defineAsyncComponent(
  surfaceLoaders.cloudBuildConflictDialog
);
const FirstLoginOffer = defineAsyncComponent(surfaceLoaders.firstLoginOffer);
const AccountDialogs = defineAsyncComponent(surfaceLoaders.accountDialogs);
const StorySetupDrawer = defineAsyncComponent(surfaceLoaders.storySetupDrawer);

const { name: title, description } = useSiteConfig();

const { loadInitialBuild } = useInitialBuild();
const { setupBeforeUnload } = useUnsavedChanges();

// * The open build follows the account and the API: the reload paint's replacement, the owner check, sign-out (feature 029).
useOpenBuildSync();

const storySetupOpen = ref(false);

const { saveAsNewOpen, accountSaveOpen, renameOpen, deleteOpen, conflictOpen } =
  useDialogs();
const { discardOpen } = useDiscardGuard();
const { isSignedIn } = storeToRefs(useAuthStore());
const { preload } = useLazySurfaces();

const saveAsNewOpened = useOpenedOnce(saveAsNewOpen);
const accountSaveOpened = useOpenedOnce(accountSaveOpen);
const openBuildDialogsOpened = useOpenedOnce(
  () => renameOpen.value || deleteOpen.value
);
const discardOpened = useOpenedOnce(discardOpen);
const conflictOpened = useOpenedOnce(conflictOpen);
const signedInOnce = useOpenedOnce(isSignedIn);
const storySetupOpened = useOpenedOnce(storySetupOpen);

// * Read once and a plain ref, not query state: only `/`'s initial boot waits, and on localStorage rather than a request (feature 023).
const route = useRoute();

const booting = ref(route.path === '/');

const isSharePage = computed(() => route.path.startsWith('/b/'));

function handleOpen() {
  storySetupOpen.value = true;
}

function preloadHeaderSurfaces() {
  preload(
    'storySetupDrawer',
    'localBuildDialogs',
    'cloudBuildDialogs',
    'openBuildDialogs',
    'discardChangesDialog'
  );
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
    // ! Order matters: browsers take the first icon they understand.
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
  // * No twitter:* tags: X reads Open Graph, and unhead v3 deprecates them (feature 027).
  ogImage: {
    url: '/images/og/build-now.png',
    width: 1200,
    height: 630,
    type: 'image/png',
    alt: 'Z-Team Planner card reading "Plan your Dispatch build ahead of time" beside a masked hero'
  }
});
</script>
