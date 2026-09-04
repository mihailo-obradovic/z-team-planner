<template>
  <div class="flex flex-col items-center p-4 md:p-6">
    <!-- * Justified with automatic hyphenation: at 65ch, justification alone opens rivers on the lines that hold a long storage key. -->
    <article
      class="flex w-full max-w-[130ch] flex-col gap-4 bg-default p-4 text-justify text-sm hyphens-auto panel"
    >
      <header class="flex flex-col gap-1">
        <h1 class="font-heading text-title text-highlighted uppercase">
          Privacy
        </h1>

        <p class="text-xs text-muted">Last updated {{ LAST_UPDATED }}</p>
      </header>

      <section class="flex flex-col gap-2">
        <h2 class="font-heading text-label text-muted uppercase">
          About this app
        </h2>

        <p>
          Z-Team Planner is a non-profit fan project, made in free time by a
          single maintainer. All in-game assets used here are the property of
          AdHoc Studio, and all rights to them are reserved to AdHoc Studio. To
          report issues or ask questions, go to the project's
          <a
            class="text-link hover:text-muted"
            :href="ISSUES_URL"
            target="_blank"
            rel="noopener"
            >GitHub issues</a
          >.
        </p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-heading text-label text-muted uppercase">
          Your builds stay in this browser
        </h2>

        <p>
          Without signing in, nothing you do here leaves your browser. The
          planner keeps its data in this browser's storage, nothing is sent to a
          server, and no data is shared with anyone. It stays until you clear
          this site's data. What the storage holds:
        </p>

        <!-- * Left-aligned inside the justified article: a row holding two unbreakable storage keys justifies into one wide gap. -->
        <ul class="flex list-disc flex-col gap-1 pl-4 text-start">
          <li>
            <span class="font-semibold">z-team-builds</span> — the builds you
            saved, and <span class="font-semibold">z-team-active-build</span> —
            which one is open.
          </li>

          <li>
            <span class="font-semibold">z-team-import-offer-seen</span> — that
            you answered the one-time offer to copy local builds into an
            account.
          </li>

          <li>
            <span class="font-semibold">z-team-spoiler-acknowledged</span> and
            <span class="font-semibold"
              >z-team-storage-notice-acknowledged</span
            >
            — that you closed the two first-run notices.
          </li>
        </ul>

        <p>The app sets no cookies and runs no analytics.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-heading text-label text-muted uppercase">
          Signing in with Google
        </h2>

        <p>
          Signing in is optional and exists so your builds can follow you across
          devices. It uses Google through Firebase Authentication: Google
          confirms who you are, and the app receives your Firebase user ID, your
          Google account ID, your email address and your display name. The app
          also records when the account was created and when it was last seen.
          That is everything — no password is stored, and nothing else is read
          from your Google account.
        </p>

        <p>
          These details are used only to attach your builds to your account and
          to show your name in the header. They are never edited and never
          shared. Builds you save to the account are stored until you delete
          them or the account.
        </p>

        <p>
          The app and its API run on Vercel, the database is on Neon, and
          encrypted nightly backups are kept on Cloudflare R2.
        </p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-heading text-label text-muted uppercase">
          Sharing a build
        </h2>

        <p>
          A link with <span class="font-semibold">?build=</span> in it carries
          the whole build inside the address. Nothing is stored for it; whoever
          you send it to has it, and so does anything that logs the address.
        </p>

        <p>
          A build saved to an account shares as
          <span class="font-semibold">/b/…</span>: a live, read-only view that
          anyone holding the link can open, signed in or not. The link is
          unlisted, kept out of search engines, and stops working when the build
          or the account is deleted.
        </p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-heading text-label text-muted uppercase">
          Deleting your data
        </h2>

        <p>
          Open the profile menu and choose <strong>Delete account</strong>. It
          is immediate and total: the account, every build saved to it and the
          Google sign-in record go at once, and its share links stop working.
          The encrypted backups keep a deleted row for up to {{ BACKUP_DAYS }}
          days, then it is gone from there too.
        </p>

        <p>
          Builds kept in this browser are yours to delete from the build
          manager, or by clearing this site's data.
        </p>
      </section>

      <u-button
        class="self-start"
        size="lg"
        color="primary"
        icon="i-lucide-arrow-left"
        label="Back to the planner"
        to="/"
      />
    </article>
  </div>
</template>

<script setup lang="ts">
// ! Every fact on this page traces to a feature document (feature 010, Inputs). Change the source first, then this page, then the date — the three move together.
const LAST_UPDATED = '4 September 2026';
const ISSUES_URL = 'https://github.com/mihailo-obradovic/z-team-planner/issues';
const BACKUP_DAYS = 30;

useSeoMeta({
  title: 'Privacy — Z-Team Planner',
  description:
    'What Z-Team Planner stores in your browser and in your account, where it is kept, for how long, and how to delete it.'
});
</script>
