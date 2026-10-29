import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const publicDirectory = join(process.cwd(), 'public');
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function assertPngDimensions(png: Buffer, width: number, height: number) {
  expect(png.subarray(0, 8)).toEqual(pngSignature);
  expect(png.readUInt32BE(16)).toBe(width);
  expect(png.readUInt32BE(20)).toBe(height);
}

describe('generated brand assets', () => {
  it.each(['og-es.png', 'og-en.png'])('keeps %s at 1200×630 and below 5 MB', (filename) => {
    const path = join(publicDirectory, 'og', filename);
    const png = readFileSync(path);
    assertPngDimensions(png, 1200, 630);
    expect(statSync(path).size).toBeLessThan(5 * 1024 * 1024);
  });

  it('keeps the SVG mark geometry and both color schemes exact', () => {
    const svg = readFileSync(join(publicDirectory, 'favicon.svg'), 'utf8');
    expect(svg).toContain('viewBox="0 0 14 14"');
    expect(svg).toContain(
      '<rect x="1.25" y="1.25" width="11.5" height="11.5" rx="1.75" fill="none" stroke-width="2.5" />'
    );
    expect(svg).toContain('oklch(0.47 0.25 266)');
    expect(svg).toContain('oklch(0.78 0.11 272)');
    expect(svg).not.toContain('<path');
  });

  it('stores a 32×32 PNG in a valid ICO container', () => {
    const ico = readFileSync(join(publicDirectory, 'favicon.ico'));
    expect(ico.subarray(0, 4)).toEqual(Buffer.from([0, 0, 1, 0]));
    expect(ico.readUInt16LE(4)).toBe(1);
    expect(ico[6]).toBe(32);
    expect(ico[7]).toBe(32);

    const pngOffset = ico.readUInt32LE(18);
    assertPngDimensions(ico.subarray(pngOffset), 32, 32);
  });
});
