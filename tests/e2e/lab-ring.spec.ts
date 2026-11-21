import { expect, test, type Page } from '@playwright/test';

const locales = [
  {
    path: '/',
    title: 'Laboratorio 2',
    style: 'Estilo',
    solid: 'Sólido',
    dashed: 'Discontinuo',
    double: 'Doble anillo',
    color: 'Color',
    blue: 'Azul',
    white: 'Blanco',
    background: 'Fondo',
    light: 'Claro',
    brand: 'Marca',
    photo: 'Foto',
    width: 'Grosor',
    offset: 'Separación',
    pass: 'Cumple',
    partial: 'Parcial',
    fail: 'No cumple',
    between: 'entre',
    contrast: 'Contraste',
    and: 'y',
    widthLabel: 'Grosor',
    styleBroken: 'Los huecos dejan ver la imagen y el contorno se fragmenta',
  },
  {
    path: '/en/',
    title: 'Lab 2',
    style: 'Style',
    solid: 'Solid',
    dashed: 'Dashed',
    double: 'Double ring',
    color: 'Color',
    blue: 'Blue',
    white: 'White',
    background: 'Background',
    light: 'Light',
    brand: 'Brand',
    photo: 'Photo',
    width: 'Width',
    offset: 'Offset',
    pass: 'Pass',
    partial: 'Partial',
    fail: 'Fail',
    between: 'between',
    contrast: 'Contrast',
    and: 'and',
    widthLabel: 'Width',
    styleBroken: 'The gaps let the image through and the outline breaks up',
  },
] as const;

for (const copy of locales) {
  test.describe(`Lab 2 ${copy.path}`, () => {
    async function loadLab(page: Page) {
      await page.goto(copy.path);
      const lab = page.locator('#lab-anillo');
      await lab.scrollIntoViewIfNeeded();
      await expect(lab.locator('.lab-title')).toHaveText(copy.title);
      await expect(lab.getByRole('radiogroup', { name: copy.style })).toBeVisible();
      await expect(lab.locator('astro-island[ssr]')).toHaveCount(0);
      return { lab, verdict: lab.locator('[data-lab-verdict]') };
    }

    test('reports the calculated default contrast', async ({ page }) => {
      const { verdict } = await loadLab(page);
      await expect(verdict).toContainText(new RegExp(`${copy.pass}.*${copy.contrast}: 7.5:1`));
    });

    test('reports blue on brand as a failure', async ({ page }) => {
      const { lab, verdict } = await loadLab(page);
      await lab.getByRole('radio', { name: copy.brand }).click();
      await expect(verdict).toContainText(new RegExp(`${copy.fail}.*${copy.contrast}: 1.0:1`));
    });

    test('reports photo contrast endpoints calculated from its samples', async ({ page }) => {
      const { lab, verdict } = await loadLab(page);
      await lab.getByRole('radio', { name: copy.white }).click();
      await lab.getByRole('radio', { name: copy.photo }).click();
      await expect(verdict).toContainText(
        new RegExp(`${copy.partial}.*${copy.contrast}: ${copy.between} 1.2:1 ${copy.and} 12.6:1`)
      );
    });

    test('disables color choices for the double ring', async ({ page }) => {
      const { lab } = await loadLab(page);
      await lab.getByRole('radio', { name: copy.double }).click();
      await expect(lab.getByRole('radio', { name: copy.blue })).toBeDisabled();
    });

    test('passes the double ring', async ({ page }) => {
      const { lab, verdict } = await loadLab(page);
      await lab.getByRole('radio', { name: copy.double }).click();
      await expect(verdict).toContainText(copy.pass);
    });

    test('warns when the width is below two pixels', async ({ page }) => {
      const { lab, verdict } = await loadLab(page);
      const width = lab.getByRole('slider', { name: copy.width });
      await width.focus();
      await page.keyboard.press('Home');
      await expect(verdict).toContainText(new RegExp(`${copy.partial}.*${copy.widthLabel}: 1px`));
    });

    test('warns for dashed outlines on a photo', async ({ page }) => {
      const { lab } = await loadLab(page);
      await lab.getByRole('radio', { name: copy.dashed }).click();
      await lab.getByRole('radio', { name: copy.photo }).click();
      await expect(lab.locator('[data-lab-verdict]')).toContainText(
        new RegExp(`${copy.partial}.*${copy.styleBroken}`)
      );
    });

    test('updates the generated code and supports keyboard operation', async ({ page }) => {
      const { lab } = await loadLab(page);
      const codeTab = lab.getByRole('tab', { name: 'Tailwind' });
      await codeTab.click();
      const code = lab.locator('[data-testid="code-example-content"]').last();
      const before = await code.textContent();
      const solid = lab.getByRole('radio', { name: copy.solid });
      await solid.focus();
      await page.keyboard.press('ArrowRight');
      await expect(lab.getByRole('radio', { name: copy.dashed })).toBeChecked();
      const width = lab.getByRole('slider', { name: copy.width });
      await width.focus();
      await page.keyboard.press('ArrowRight');
      await expect(code).not.toHaveText(before ?? '');
    });
  });
}
