import { expect, test } from '@playwright/test';

for (const locale of [
  { route: '/', title: 'Dónde está el foco' },
  { route: '/en/', title: 'Where is the focus' },
]) {
  test(`loads the ${locale.route} page`, async ({ page }) => {
    await page.goto(locale.route);

    await expect(page.getByRole('heading', { level: 1, name: locale.title })).toBeVisible();
  });
}
