import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const trackedScope = [
  'astro.config.mjs',
  'playwright.config.ts',
  '.env.example',
  'README.md',
  'src/lib',
  'src/layouts',
  'src/pages',
];

function sourceFiles(path: string): string[] {
  const entries = readdirSync(path, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = join(path, entry.name);
    return entry.isDirectory() ? sourceFiles(entryPath) : [entryPath];
  });
}

function hostIsAllowed(host: string) {
  return (
    host.endsWith('.example') ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === 'www.sitemaps.org' ||
    host === 'www.w3.org'
  );
}

describe('public URL hygiene', () => {
  it('contains no public absolute URL outside test and XML namespace hosts', () => {
    const files = trackedScope.flatMap((path) => {
      try {
        return sourceFiles(path);
      } catch {
        return [path];
      }
    });
    const violations = files.flatMap((file) => {
      const content = readFileSync(file, 'utf8');
      const urls = content.matchAll(/https?:\/\/([^\s"'<>]+)/g);
      return Array.from(urls, ([url, authority]) => {
        const host = authority.split(/[/:?#]/, 1)[0];
        return hostIsAllowed(host) ? undefined : `${file}: ${url}`;
      }).filter((entry): entry is string => entry !== undefined);
    });

    expect(violations).toEqual([]);
  });
});
