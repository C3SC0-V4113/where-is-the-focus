import { expect, test } from '@playwright/test';

for (const locale of [
  { route: '/', label: 'Saltar al contenido' },
  { route: '/en/', label: 'Skip to content' },
]) {
  test(`skip link works at ${locale.route}`, async ({ page }) => {
    await page.goto(locale.route);
    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: locale.label });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    expect(
      await skipLink.evaluate((link) => {
        const { x, y, width, height } = link.getBoundingClientRect();
        return (
          width > 0 &&
          height > 0 &&
          x >= 0 &&
          y >= 0 &&
          x + width <= innerWidth &&
          y + height <= innerHeight
        );
      })
    ).toBe(true);

    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('contenido');
  });
}
