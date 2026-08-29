import { Temporal } from 'temporal-polyfill';

export function formatTimestamp(iso: string | undefined): string {
  if (!iso) {
    return '';
  }

  try {
    return Temporal.Instant.from(iso).toLocaleString();
  } catch {
    console.error('Timestamp did not parse as an ISO-8601 instant.', iso);

    return '';
  }
}
