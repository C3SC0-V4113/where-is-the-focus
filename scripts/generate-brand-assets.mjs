import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

import { en, es } from '../src/i18n/messages.ts';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const publicDirectory = new URL('../public/', import.meta.url);
const outputDirectory = new URL('../public/og/', import.meta.url);
const fontPath = new URL(
  '../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2',
  import.meta.url
);
const fontBase64 = (await readFile(fontPath)).toString('base64');

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
  <style>
    rect { fill: none; stroke: oklch(0.47 0.25 266); }
    @media (prefers-color-scheme: dark) {
      rect { stroke: oklch(0.78 0.11 272); }
    }
  </style>
  <rect x="1.25" y="1.25" width="11.5" height="11.5" rx="1.75" fill="none" stroke-width="2.5" />
</svg>
`;

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function titleLines(title, locale) {
  const separator = locale === 'es' ? ' el ' : ' the ';
  const splitAt = title.toLocaleLowerCase(locale).lastIndexOf(separator);
  if (splitAt === -1) throw new Error(`Unable to split the localized title for ${locale}.`);

  return [
    title.slice(0, splitAt).toLocaleUpperCase(locale),
    title.slice(splitAt + 1).toLocaleUpperCase(locale),
  ];
}

function openGraphHtml(title, locale) {
  const lines = titleLines(title, locale)
    .map((line) => `<span>${escapeHtml(line)}</span>`)
    .join('');

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <style>
      @font-face {
        font-family: Archivo;
        font-style: normal;
        font-weight: 100 900;
        font-stretch: 62% 125%;
        src: url(data:font/woff2;base64,${fontBase64}) format('woff2-variations');
      }
      * { box-sizing: border-box; }
      html, body { width: 1200px; height: 630px; margin: 0; }
      body { display: grid; place-items: center; background: oklch(1 0 0); }
      .safe-area {
        width: 630px;
        height: 630px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 24px;
      }
      .mark { display: block; width: 112px; height: 112px; flex: none; }
      .mark rect { fill: none; stroke: oklch(0.47 0.25 266); stroke-width: 2.5; }
      h1 {
        margin: 0;
        color: oklch(0.145 0 0);
        font-family: Archivo, sans-serif;
        font-size: 64px;
        font-stretch: 66%;
        font-weight: 850;
        font-variation-settings: 'wdth' 66, 'wght' 850;
        line-height: .96;
        text-align: center;
        text-transform: uppercase;
      }
      h1 span { display: block; white-space: nowrap; }
    </style>
  </head>
  <body>
    <main class="safe-area">
      <svg class="mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" aria-hidden="true">
        <rect x="1.25" y="1.25" width="11.5" height="11.5" rx="1.75" fill="none" stroke-width="2.5" />
      </svg>
      <h1>${lines}</h1>
    </main>
  </body>
</html>`;
}

function makeIco(png) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(32, 6);
  header.writeUInt8(32, 7);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);
  return Buffer.concat([header, png]);
}

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });

  for (const [locale, messages] of [
    ['es', es],
    ['en', en],
  ]) {
    await page.setContent(openGraphHtml(messages.title, locale), { waitUntil: 'load' });
    const fontLoaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('850 64px Archivo');
    });
    if (!fontLoaded) throw new Error(`Archivo variable font did not load for ${locale}.`);
    const png = await page.screenshot({ type: 'png' });
    await writeFile(new URL(`og-${locale}.png`, outputDirectory), png);
  }

  await writeFile(new URL('favicon.svg', publicDirectory), faviconSvg);

  const faviconPage = await browser.newPage({
    viewport: { width: 32, height: 32 },
    deviceScaleFactor: 1,
  });
  const svgData = Buffer.from(faviconSvg).toString('base64');
  await faviconPage.setContent(
    `<html><body style="margin:0;width:32px;height:32px"><img alt="" width="32" height="32" src="data:image/svg+xml;base64,${svgData}"></body></html>`
  );
  await faviconPage.locator('img').evaluate((image) => image.decode());
  const faviconPng = await faviconPage.screenshot({ type: 'png', omitBackground: true });
  await writeFile(new URL('favicon.ico', publicDirectory), makeIco(faviconPng));
  await faviconPage.close();
} finally {
  await browser.close();
}

process.stdout.write(`Generated public/og/og-es.png and public/og/og-en.png in ${projectRoot}.\n`);
process.stdout.write('Replaced public/favicon.svg and public/favicon.ico.\n');
