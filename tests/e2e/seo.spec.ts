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
  },
];

for (const pageData of pages) {
  test(`${pageData.path} has localized SEO metadata`, async ({ page }) => {
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
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      pageData.canonical
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);

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

test('robots.txt names the sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.headers()['content-type']).toContain('text/plain');
  expect(await response.text()).toBe(`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
});
