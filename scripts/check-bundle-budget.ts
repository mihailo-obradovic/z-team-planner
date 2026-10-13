// * Decision 017: the JavaScript `/` loads before any interaction — the entry module and every chunk its prerendered HTML preloads — stays under a brotli budget, measured on the build output. Run after `nuxt build`.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync } from 'node:zlib';

const BUDGET_BYTES = 230 * 1024;
const OUTPUT_DIR = join('.output', 'public');

const html = readFileSync(join(OUTPUT_DIR, 'index.html'), 'utf8');

// * Attributes in any order: SRI (decision 018) writes `integrity` before `src` and `href`.
const entry = /<script[^>]*\btype="module"[^>]*\bsrc="(\/_nuxt\/[^"]+)"/.exec(
  html
)?.[1];

if (!entry) {
  console.error('No entry module script found in the prerendered /.');
  process.exit(1);
}

const preloaded = [
  ...html.matchAll(
    /<link(?=[^>]*\brel="modulepreload")[^>]*\bhref="(\/_nuxt\/[^"]+)"/g
  )
].map((match) => match[1] as string);

const scripts = [...new Set([entry, ...preloaded])];

const sizes = scripts.map((path) => ({
  path,
  bytes: brotliCompressSync(readFileSync(join(OUTPUT_DIR, path))).length
}));

const total = sizes.reduce((sum, { bytes }) => sum + bytes, 0);

for (const { path, bytes } of sizes.toSorted((a, b) => b.bytes - a.bytes)) {
  console.log(`${kilobytes(bytes).padStart(7)} KB  ${path}`);
}

console.log(
  `${kilobytes(total).padStart(7)} KB  total before interaction (budget ${kilobytes(BUDGET_BYTES)} KB brotli)`
);

if (total > BUDGET_BYTES) {
  console.error(
    `Over budget by ${kilobytes(total - BUDGET_BYTES)} KB. Split a surface out of the entry (decision 017) or re-decide the budget.`
  );
  process.exit(1);
}

function kilobytes(bytes: number): string {
  return (bytes / 1024).toFixed(1);
}
