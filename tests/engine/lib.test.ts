import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as source from '../../src/engine/index.js';

const root = resolve(import.meta.dirname, '..', '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  version: string;
  dependencies?: Record<string, string>;
  scripts: Record<string, string>;
  exports: Record<string, string | Record<string, string>>;
  files: string[];
};

describe('the package other tools install', () => {
  it('has lib/ built from the current source', () => {
    const fresh = mkdtempSync(join(tmpdir(), 'eurth-calendar-lib-'));
    try {
      execFileSync(process.execPath, [join(root, 'tools', 'build-engine.mjs'), fresh], { cwd: root, stdio: 'pipe' });
      const built = readdirSync(fresh).sort();
      expect(readdirSync(join(root, 'lib')).sort()).toEqual(built);
      for (const name of built) {
        if (readFileSync(join(root, 'lib', name), 'utf8') !== readFileSync(join(fresh, name), 'utf8')) {
          throw new Error(`lib/${name} is out of date: run "npm run build:engine" and commit the result.`);
        }
      }
    } finally {
      rmSync(fresh, { recursive: true, force: true });
    }
  }, 60_000);

  it('works when loaded the way another tool loads it', async () => {
    const entry = pkg.exports['.'] as Record<string, string>;
    expect(existsSync(join(root, entry.default!))).toBe(true);
    expect(existsSync(join(root, entry.types!))).toBe(true);
    const built = (await import(join(root, entry.default!))) as typeof source;
    expect(Object.keys(built).sort()).toEqual(Object.keys(source).sort());
    const calendar = built.createCalendar(built.SELUNNAN);
    const days = calendar.fromGregorian({ year: 2026, month: 11, day: 12 })!;
    expect(calendar.format(days, 'full')).toBe('Tideday, 17 Harvestmoon 1022 FS');
    expect(built.decodeCalendar(built.encodeCalendar(built.GREGORIAN))!.calendar).toEqual(source.GREGORIAN);
  });

  it('asks nothing of whoever installs it', () => {
    // Installed from GitHub: no dependencies to fetch, and no script that would make npm
    // install this repository's own tooling on the other side.
    expect(pkg.dependencies ?? {}).toEqual({});
    for (const script of ['prepare', 'preinstall', 'install', 'postinstall', 'prepack']) {
      expect(pkg.scripts[script]).toBeUndefined();
    }
    expect(pkg.files).toContain('lib');
    expect(source.VERSION).toBe(pkg.version);
  });
});
