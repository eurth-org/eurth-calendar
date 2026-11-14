// Builds lib/ (JavaScript and type declarations) from the TypeScript in src/engine/.
//
//   node tools/build-engine.mjs           writes lib/
//   node tools/build-engine.mjs <folder>  writes the same files to another folder,
//                                         so a test can compare them with lib/
//
// lib/ is committed: Time and any other tool install @eurth/calendar straight from GitHub,
// with no build step on their side. Run this after every change to src/engine/ and commit
// the result; tests/engine/lib.test.ts fails when lib/ is out of date.

import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, process.argv[2] ?? 'lib');

rmSync(outDir, { recursive: true, force: true });
execFileSync(
  process.execPath,
  [join(root, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', join(root, 'tsconfig.engine.json'), '--outDir', outDir],
  { cwd: root, stdio: 'inherit' },
);
