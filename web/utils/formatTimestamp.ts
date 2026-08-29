import { Temporal } from 'temporal-polyfill';

// * The one module that parses a timestamp (`conventions/code-style.md`, Wall-clock time is the server's).
// * The input is always an API-supplied ISO-8601 UTC string; the output is that instant in the viewer's own zone and locale.
export function formatTimestamp(iso: string | undefined): string {
  if (!iso) {
    return '';
  }

  try {
    return Temporal.Instant.from(iso).toLocaleString();
  } catch {
    // ! Unlike `new Date()`, which yielded `Invalid Date` and rendered it, `Instant.from` throws — and this runs inside a computed, so an uncaught throw takes the whole dialog down with it.
    // * A string that will not parse means the API sent something its schema does not describe: a developer error, logged for one, degraded to nothing for the user.
    console.error('Timestamp did not parse as an ISO-8601 instant.', iso);

    return '';
  }
}
