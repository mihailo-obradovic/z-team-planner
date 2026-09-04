<template>
  <div class="flex flex-col items-center p-4 md:p-6">
    <article
      class="flex w-full max-w-[65ch] flex-col gap-6 bg-default p-4 text-sm panel sm:p-6"
    >
      <header class="flex flex-col gap-1">
        <h1 class="font-heading text-title text-highlighted uppercase">
          Privacy
        </h1>

        <p class="text-xs text-muted">Last updated {{ LAST_UPDATED }}</p>
      </header>

      <section class="flex flex-col gap-2">
        <h2 class="font-heading text-label text-muted uppercase">
          Who is responsible
        </h2>

        <p>
          Z-Team Planner is run by {{ CONTROLLER }}. For anything about your
          data, write to
          <a class="text-link" :href="`mailto:${CONTACT_EMAIL}`">{{
            CONTACT_EMAIL
          }}</a
          >. Questions that need not be private can also go to the project's
          <a class="text-link" :href="ISSUES_URL" target="_blank" rel="noopener"
            >GitHub issues</a
          >.
        </p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-heading text-label text-muted uppercase">
          Planning without signing in
        </h2>

        <p>
          Nothing is sent to a server. The planner keeps everything in this
          browser's storage, and it stays there until you clear this site's
          data. What it holds:
        </p>

        <ul class="flex list-disc flex-col gap-1 pl-4">
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
          Share links
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
          Signing in with Google
        </h2>

        <p>
          When you sign in, an account is created because you asked for one, and
          it holds six things: your Firebase user id, your Google account id,
          your email address, your display name, when the account was created,
          and when it was last seen. They are copied from Google at sign-in,
          used only to attach your builds to you and show your name, and never
          edited or shared.
        </p>

        <p>
          Builds you save to the account are stored until you delete them or the
          account.
        </p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-heading text-label text-muted uppercase">
          Where it is kept
        </h2>

        <ul class="flex list-disc flex-col gap-1 pl-4">
          <li>Vercel hosts the app and its API; the API runs in Frankfurt.</li>

          <li>Neon holds the database, in Frankfurt (eu-central-1).</li>

          <li>Google Firebase Authentication handles the Google sign-in.</li>

          <li>
            Cloudflare R2 holds encrypted nightly backups of the database.
          </li>
        </ul>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-heading text-label text-muted uppercase">
          Deleting everything
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
const CONTROLLER = 'Mihailo Obradović';
const CONTACT_EMAIL = 'mihailo.obradovic@pm.me';
const ISSUES_URL = 'https://github.com/mihailo-obradovic/z-team-planner/issues';
const BACKUP_DAYS = 30;

useSeoMeta({
  title: 'Privacy — Z-Team Planner',
  description:
    'What Z-Team Planner stores in your browser and in your account, where it is kept, for how long, and how to delete it.'
});
</script>
