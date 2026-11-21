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
    dark: 'Oscuro',
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
    dark: 'Dark',
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

    test('uses specimen token colors on light and dark backgrounds without hover changes', async ({
      page,
    }) => {
      const { lab } = await loadLab(page);
      const specimen = lab.locator('[data-lab-ring-stage] [data-lab-ring-specimen]');
      const tokens = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        const resolve = (property: string) => {
          const probe = document.createElement('span');
          probe.style.color = root.getPropertyValue(property).trim();
          document.body.append(probe);
          const color = getComputedStyle(probe).color;
          probe.remove();
          return color;
        };
        return {
          light: resolve('--lab-specimen-light'),
          dark: resolve('--lab-specimen-dark'),
        };
      });
      const readAppearance = () =>
        specimen.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            outline: style.outline,
            outlineOffset: style.outlineOffset,
            boxShadow: style.boxShadow,
          };
        });
      const expectHoverUnchanged = async (expected: Awaited<ReturnType<typeof readAppearance>>) => {
        await specimen.hover();
        await expect.poll(readAppearance).toEqual(expected);
      };

      await expect(specimen).toHaveCSS('background-color', tokens.dark);
      await expect(specimen).toHaveCSS('color', tokens.light);
      const light = await readAppearance();
      expect(light.backgroundColor).toBe(tokens.dark);
      expect(light.color).toBe(tokens.light);
      await expectHoverUnchanged(light);

      await lab.getByRole('radio', { name: copy.dark }).click();
      await expect(specimen).toHaveCSS('background-color', tokens.light);
      await expect(specimen).toHaveCSS('color', tokens.dark);
      const dark = await readAppearance();
      expect(dark.backgroundColor).toBe(tokens.light);
      expect(dark.color).toBe(tokens.dark);
      await expectHoverUnchanged(dark);
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
      const contrastRow = verdict.getByText(new RegExp(`${copy.contrast}:`)).locator('..');
      await lab.getByRole('radio', { name: copy.brand }).click();
      await expect(contrastRow).toContainText(copy.fail);
      await lab.getByRole('radio', { name: copy.double }).click();
      await expect(contrastRow).toContainText(copy.pass);
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
      await expect(code).not.toHaveText(before ?? '');
      const afterStyle = await code.textContent();
      const width = lab.getByRole('slider', { name: copy.width });
      await width.focus();
      await page.keyboard.press('ArrowRight');
      await expect(width).toHaveAttribute('aria-valuenow', '4');
      await expect(code).not.toHaveText(afterStyle ?? '');
      await expect(code).toContainText('focus-visible:outline-4');
    });
  });
}
