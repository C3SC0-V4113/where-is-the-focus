import { expect, test, type Page } from '@playwright/test';

const latinText = 'Dónde está el foco: ñáéíóú ¿¡';

async function loadAndCheckFont(page: Page, descriptor: string) {
  const faces = await page.evaluate(
    async ({ descriptor, text }) => {
      const loadedFaces = await document.fonts.load(descriptor, text);
      return loadedFaces.map(({ family, status }) => ({ family, status }));
    },
    { descriptor, text: latinText }
  );

  expect(faces, `Expected a loaded FontFace for ${descriptor}`).not.toHaveLength(0);
  expect(faces.every(({ status }) => status === 'loaded')).toBe(true);
}

test('self-hosts latin font files and applies the expected font families', async ({
  page,
  baseURL,
}) => {
  const externalRequests: string[] = [];
  const fontResponses: Array<{
    status: number;
    contentType: string;
    url: string;
  }> = [];
  const origin = new URL(baseURL as string).origin;

  page.on('request', (request) => {
    const url = request.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return;
    }

    if (new URL(url).origin !== origin) {
      externalRequests.push(url);
    }
  });

  page.on('response', (response) => {
    if (response.request().resourceType() !== 'font') {
      return;
    }

    fontResponses.push({
      status: response.status(),
      contentType: response.headers()['content-type'] ?? '',
      url: response.url(),
    });
  });

  await page.goto('/');
  await loadAndCheckFont(page, `400 16px "Archivo Variable"`);
  await loadAndCheckFont(page, `400 16px "Literata Variable"`);
  await loadAndCheckFont(page, `italic 400 16px "Literata Variable"`);
  await loadAndCheckFont(page, `400 16px "Geist Variable"`);
  await loadAndCheckFont(page, `400 16px "Geist Mono Variable"`);

  expect(externalRequests, 'Unexpected requests to third-party origins').toEqual([]);
  expect(fontResponses.length).toBeGreaterThanOrEqual(5);
  for (const response of fontResponses) {
    const url = new URL(response.url);
    const filename = url.pathname.split('/').at(-1) ?? '';

    expect(response.status, response.url).toBe(200);
    expect(response.contentType, response.url).toContain('font/woff2');
    expect(url.pathname, response.url).toMatch(/^\/_astro\//);
    expect(filename, response.url).toContain('-latin-');
    expect(filename, response.url).not.toMatch(/latin-ext|cyrillic|greek|vietnamese/);
  }

  const computedFamilies = await page.evaluate(() => {
    const heading = document.createElement('h2');
    const code = document.createElement('code');
    const paragraph = document.createElement('p');
    heading.textContent = 'Font family heading';
    code.textContent = 'font family code';
    paragraph.textContent = 'Font family prose';
    document.body.append(heading, code, paragraph);

    return {
      heading: getComputedStyle(heading).fontFamily,
      code: getComputedStyle(code).fontFamily,
      paragraph: getComputedStyle(paragraph).fontFamily,
    };
  });

  const firstFamily = (familyList: string) =>
    familyList
      .split(',')[0]
      ?.trim()
      .replace(/^['"]|['"]$/g, '');

  expect(firstFamily(computedFamilies.heading)).toBe('Archivo Variable');
  expect(firstFamily(computedFamilies.code)).toBe('Geist Mono Variable');
  expect(firstFamily(computedFamilies.paragraph)).toBe('Geist Variable');

  const widths = await page.evaluate(async (text) => {
    await document.fonts.load('400 32px "Archivo Variable"', text);
    const measure = (stretch: string) => {
      const heading = document.createElement('h2');
      heading.textContent = text;
      Object.assign(heading.style, {
        display: 'inline-block',
        fontFamily: '"Archivo Variable"',
        fontSize: '32px',
        fontStretch: stretch,
        fontWeight: '400',
        whiteSpace: 'nowrap',
      });
      document.body.append(heading);
      const width = heading.getBoundingClientRect().width;
      heading.remove();
      return width;
    };

    return { condensed: measure('66%'), normal: measure('100%') };
  }, 'Archivo variable width axis');

  // Without the wdth axis, browsers do not synthesize font-stretch, so any narrowing proves the axis works.
  expect(widths.condensed).toBeLessThan(widths.normal);
});
