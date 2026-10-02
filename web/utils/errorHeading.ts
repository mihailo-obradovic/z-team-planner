import type { NuxtError } from '#app';

import type { ErrorPageData } from '@/types/errorPage';

// * The error page's heading and its tab title both read this, so the two cannot disagree (feature 009).
// ! Never `statusMessage`: Nuxt writes it itself for an unmatched route, as `Page not found: <path>`.
export function errorHeading(error: NuxtError): string {
  const data = error.data as ErrorPageData | undefined;

  if (data?.heading) {
    return data.heading;
  }

  return error.statusCode === 404 ? 'Page not found' : 'Something went wrong';
}
