import { expect, test } from '@playwright/test';

const origin = 'https://a.example';
const pages = [
  {
    path: '/',
    locale: 'es',
    canonical: `${origin}/`,
    title: 'Dónde está el foco',
    description:
      'Quien navega con teclado no tiene puntero. Lo que le dice dónde está es el indicador de foco, así que merece el mismo cuidado que cualquier otro estado de un componente.',
    ogLocale: 'es_ES',
    alternateLocale: 'en_US',
    ogImage: `${origin}/og/og-es.png`,
    ogImagePath: '/og/og-es.png',
    ogImageAlt: 'Cuadrado azul de la marca y el título «Dónde está el foco».',
  },
  {
    path: '/en/',
    locale: 'en',
    canonical: `${origin}/en/`,
    title: 'Where is the focus',
    description:
      'Keyboard users have no pointer. What tells them where they are is the focus indicator, so it deserves the same care as any other component state.',
    ogLocale: 'en_US',
    alternateLocale: 'es_ES',
    ogImage: `${origin}/og/og-en.png`,
    ogImagePath: '/og/og-en.png',
    ogImageAlt: 'Blue brand square and the title “Where is the focus”.',
  },
];

for (const pageData of pages) {
  test(`${pageData.path} has localized SEO metadata and a safe OG image`, async ({
    page,
    request,
  }) => {
    await page.goto(pageData.path);
    await expect(page.locator('html')).toHaveAttribute('lang', pageData.locale);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', pageData.canonical);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      pageData.description
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      pageData.title
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      'content',
      pageData.description
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      pageData.ogLocale
    );
    await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveAttribute(
      'content',
      pageData.alternateLocale
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      pageData.canonical
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      pageData.ogImage
    );
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
      'content',
      '1200'
    );
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
      'content',
      '630'
    );
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      'content',
      pageData.ogImageAlt
    );

    const imageResponse = await request.get(pageData.ogImagePath);
    expect(imageResponse.status()).toBe(200);
    expect(imageResponse.headers()['content-type']).toContain('image/png');
    const png = await imageResponse.body();
    expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);

    const pixels = await page.evaluate(
      async ({ imageUrl, ring, foreground }) => {
        const image = new Image();
        image.src = imageUrl;
        await image.decode();

        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas 2D context unavailable');
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;

        const colorPixel = (color: string) => {
          const colorCanvas = document.createElement('canvas');
          colorCanvas.width = 1;
          colorCanvas.height = 1;
          const colorContext = colorCanvas.getContext('2d');
          if (!colorContext) throw new Error('Canvas 2D context unavailable');
          colorContext.fillStyle = '#010203';
          colorContext.fillStyle = color;
          colorContext.fillRect(0, 0, 1, 1);
          return Array.from(colorContext.getImageData(0, 0, 1, 1).data);
        };

        const background = [255, 255, 255, 255];
        const ringPixel = colorPixel(ring);
        const foregroundPixel = colorPixel(foreground);
        let outsideMismatches = 0;
        let ringPixels = 0;
        let foregroundPixels = 0;
        for (let y = 0; y < canvas.height; y += 1) {
          for (let x = 0; x < canvas.width; x += 1) {
            const offset = (y * canvas.width + x) * 4;
            const pixel = Array.from(pixels.slice(offset, offset + 4));
            if (x < 285 || x >= 915) {
              if (pixel.some((channel, index) => channel !== background[index])) {
                outsideMismatches += 1;
              }
            } else {
              if (pixel.every((channel, index) => channel === ringPixel[index])) ringPixels += 1;
              if (pixel.every((channel, index) => channel === foregroundPixel[index])) {
                foregroundPixels += 1;
              }
            }
          }
        }

        return { outsideMismatches, ringPixels, foregroundPixels };
      },
      {
        imageUrl: pageData.ogImagePath,
        ring: 'oklch(0.47 0.25 266)',
        foreground: 'oklch(0.145 0 0)',
      }
    );
    expect(pixels.outsideMismatches).toBe(0);
    expect(pixels.ringPixels).toBeGreaterThan(0);
    expect(pixels.foregroundPixels).toBeGreaterThan(0);

    for (const [language, href] of [
      ['es', `${origin}/`],
      ['en', `${origin}/en/`],
      ['x-default', `${origin}/`],
    ]) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${language}"]`)).toHaveAttribute(
        'href',
        href
      );
    }
  });
}

test('sitemap contains both localized pages and valid reciprocal alternatives', async ({
  page,
}) => {
  const response = await page.goto('/sitemap.xml');
  expect(response?.headers()['content-type']).toMatch(/(?:application|text)\/xml/);
  const xml = await response?.text();
  expect(xml).toBeTruthy();
  const parsed = await page.evaluate((source) => {
    const document = new DOMParser().parseFromString(source, 'application/xml');
    return {
      hasParserError: Boolean(document.querySelector('parsererror')),
      locations: Array.from(document.querySelectorAll('url > loc'), (node) => node.textContent),
      alternates: Array.from(
        document.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'link'),
        (node) => ({
          language: node.getAttribute('hreflang'),
          href: node.getAttribute('href'),
        })
      ),
    };
  }, xml!);

  expect(parsed.hasParserError).toBe(false);
  expect(parsed.locations).toEqual([`${origin}/`, `${origin}/en/`]);
  expect(parsed.alternates).toHaveLength(6);
  expect(parsed.alternates).toEqual(
    expect.arrayContaining([
      { language: 'es', href: `${origin}/` },
      { language: 'en', href: `${origin}/en/` },
      { language: 'x-default', href: `${origin}/` },
    ])
  );
});

test('brand favicons use the mark and valid raster fallback', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute(
    'href',
    '/favicon.ico'
  );
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
    'href',
    '/favicon.svg'
  );

  const svgResponse = await request.get('/favicon.svg');
  expect(svgResponse.status()).toBe(200);
  expect(svgResponse.headers()['content-type']).toContain('image/svg+xml');
  const svg = await svgResponse.text();
  expect(svg).toContain('viewBox="0 0 14 14"');
  expect(svg).toContain(
    '<rect x="1.25" y="1.25" width="11.5" height="11.5" rx="1.75" fill="none" stroke-width="2.5" />'
  );
  expect(svg).toContain('oklch(0.47 0.25 266)');
  expect(svg).toContain('oklch(0.78 0.11 272)');
  expect(svg).not.toContain('<path');

  const icoResponse = await request.get('/favicon.ico');
  expect(icoResponse.status()).toBe(200);
  const ico = await icoResponse.body();
  expect(ico.subarray(0, 4)).toEqual(Buffer.from([0, 0, 1, 0]));
  expect(ico.readUInt16LE(4)).toBe(1);
  expect(ico[6]).toBe(32);
  expect(ico[7]).toBe(32);
  const pngOffset = ico.readUInt32LE(18);
  expect(ico.subarray(pngOffset, pngOffset + 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  );
  expect(ico.readUInt32BE(pngOffset + 16)).toBe(32);
  expect(ico.readUInt32BE(pngOffset + 20)).toBe(32);
});

test('robots.txt names the sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.headers()['content-type']).toContain('text/plain');
  expect(await response.text()).toBe(`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
});
