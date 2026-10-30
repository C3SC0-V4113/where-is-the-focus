import { expect, test, type Page } from '@playwright/test';

const locales = [
  { route: '/', locale: 'es', title: 'Dónde está el foco', nav: 'Idioma' },
  { route: '/en/', locale: 'en', title: 'Where is the focus', nav: 'Language' },
] as const;

async function expectLocalePage(
  page: Page,
  { route, locale, title, nav: label }: (typeof locales)[number]
) {
  await page.goto(route);
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
  await expect(page).toHaveTitle(title);

  const navigation = page.getByRole('navigation', { name: label });
  const spanish = navigation.locator('a[hreflang="es"]');
  const english = navigation.locator('a[hreflang="en"]');
  await expect(spanish).toHaveAttribute('href', '/');
  await expect(spanish).toHaveAttribute('lang', 'es');
  await expect(spanish).toHaveAccessibleName('ES (Español)');
  await expect(english).toHaveAttribute('href', '/en/');
  await expect(english).toHaveAttribute('lang', 'en');
  await expect(english).toHaveAccessibleName('EN (English)');
  await expect(navigation.locator(`[hreflang="${locale}"]`)).toHaveAttribute(
    'aria-current',
    'page'
  );
  await expect(
    navigation.locator(`[hreflang="${locale === 'es' ? 'en' : 'es'}"]`)
  ).not.toHaveAttribute('aria-current', 'page');
}

async function switchLanguages(page: Page) {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Idioma' }).locator('a[hreflang="en"]').click();
  const englishPath = new URL(page.url()).pathname;
  await page.getByRole('navigation', { name: 'Language' }).locator('a[hreflang="es"]').click();
  return { englishPath, spanishPath: new URL(page.url()).pathname };
}

for (const locale of locales) {
  test(`renders ${locale.locale} language metadata and selector state`, async ({ page }) => {
    await expectLocalePage(page, locale);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}

test('language selector navigates between Spanish and English', async ({ page }) => {
  expect(await switchLanguages(page)).toEqual({ englishPath: '/en/', spanishPath: '/' });
});

test.describe('language selector without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('navigates in both directions with native links', async ({ page }) => {
    expect(await switchLanguages(page)).toEqual({ englishPath: '/en/', spanishPath: '/' });
  });
});
