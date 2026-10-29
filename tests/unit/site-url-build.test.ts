import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const temporaryDirectories: string[] = [];
const astro = resolve('node_modules/.bin/astro');

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function buildDirectory() {
  const directory = mkdtempSync(join(tmpdir(), 'where-is-the-focus-seo-'));
  temporaryDirectories.push(directory);
  return directory;
}

describe('SITE_URL build behavior', () => {
  it('uses one configured origin across pages and endpoints, and rejects a missing value', () => {
    const outDir = join(buildDirectory(), 'output');
    execFileSync(astro, ['build', '--outDir', outDir], {
      env: { ...process.env, SITE_URL: 'https://b.example' },
      stdio: 'pipe',
      timeout: 120_000,
    });

    const spanish = readFileSync(join(outDir, 'index.html'), 'utf8');
    const english = readFileSync(join(outDir, 'en/index.html'), 'utf8');
    const sitemap = readFileSync(join(outDir, 'sitemap.xml'), 'utf8');
    const robots = readFileSync(join(outDir, 'robots.txt'), 'utf8');
    const files = [spanish, english, sitemap, robots].join('\n');
    expect(spanish).toContain('<link rel="canonical" href="https://b.example/"');
    expect(english).toContain('<link rel="canonical" href="https://b.example/en/"');
    expect(spanish).toContain('hreflang="en" href="https://b.example/en/"');
    expect(english).toContain('hreflang="es" href="https://b.example/"');
    expect(spanish).toContain('hreflang="x-default" href="https://b.example/"');
    expect(english).toContain('hreflang="x-default" href="https://b.example/"');
    expect(spanish).toContain('<meta property="og:url" content="https://b.example/"');
    expect(english).toContain('<meta property="og:url" content="https://b.example/en/"');
    expect(sitemap).toContain('<loc>https://b.example/</loc>');
    expect(sitemap).toContain('<loc>https://b.example/en/</loc>');
    expect(robots).toContain('Sitemap: https://b.example/sitemap.xml');
    expect(files).toContain('https://b.example/');
    expect(files).toContain('https://b.example/en/');
    expect(files).toContain('https://b.example/sitemap.xml');
    expect(files).not.toContain('a.example');

    const missingEnv = { ...process.env };
    delete missingEnv.SITE_URL;
    const failedBuild = spawnSync(astro, ['build', '--outDir', join(buildDirectory(), 'missing')], {
      env: missingEnv,
      encoding: 'utf8',
      timeout: 120_000,
    });
    expect(failedBuild.status).not.toBe(0);
    expect(failedBuild.stderr + failedBuild.stdout).toContain(
      'SITE_URL is required for production builds'
    );
  }, 150_000);
});
