// * Whole-file count, template and style included: oxlint's `max-lines` sees only a `.vue` file's script block (catalyst/stacks/frontend/_vue/vue-style.md, Component size).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const HARD_LIMIT = 450;
const SOURCE_DIR = 'web';

const oversized = sfcFiles(SOURCE_DIR)
  .map((file) => ({ file, lines: lineCount(file) }))
  .filter(({ lines }) => lines > HARD_LIMIT);

for (const { file, lines } of oversized) {
  console.error(`${file}: ${lines} lines, over the ${HARD_LIMIT}-line limit`);
}

process.exit(oversized.length > 0 ? 1 : 0);

function sfcFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return entry.name === 'node_modules' || entry.name.startsWith('.')
        ? []
        : sfcFiles(path);
    }

    return entry.name.endsWith('.vue') ? [path] : [];
  });
}

function lineCount(file: string): number {
  const text = readFileSync(file, 'utf8');
  const newlines = text.split('\n').length - 1;

  return text.endsWith('\n') ? newlines : newlines + 1;
}
