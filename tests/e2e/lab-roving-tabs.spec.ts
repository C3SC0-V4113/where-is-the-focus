import { expect, test, type Locator, type Page } from '@playwright/test';

const locales = [
  {
    route: '/',
    manualTablist: 'Detalles del producto, a mano',
    shadcnTablist: 'Detalles del producto, con shadcn Tabs',
    tabs: ['Descripción', 'Medidas', 'Envío', 'Opiniones'],
  },
  {
    route: '/en/',
    manualTablist: 'Product details, manual',
    shadcnTablist: 'Product details, with shadcn Tabs',
    tabs: ['Description', 'Dimensions', 'Shipping', 'Reviews'],
  },
] as const;

async function loadLab(page: Page, locale: (typeof locales)[number]) {
  await page.goto(locale.route);
  const lab = page.locator('#lab-tabs');
  await lab.scrollIntoViewIfNeeded();
  await expect(lab).toBeVisible();
  const manual = lab.getByRole('tablist', { name: locale.manualTablist });
  const shadcn = lab.getByRole('tablist', { name: locale.shadcnTablist });
  const manualIsland = manual.locator('xpath=ancestor::astro-island[1]');
  const shadcnIsland = shadcn.locator('xpath=ancestor::astro-island[1]');
  await expect(manualIsland).toHaveCount(1);
  await expect(manualIsland).not.toHaveAttribute('ssr');
  await expect(shadcnIsland).toHaveCount(1);
  await expect(shadcnIsland).not.toHaveAttribute('ssr');
  await expect(manual.getByRole('tab').first()).toHaveAttribute('tabindex', '0');
  await expect(shadcn.getByRole('tab').first()).toHaveAttribute('tabindex', '0');
  return lab;
}

function getTabs(list: Locator, labels: readonly string[]) {
  return labels.map((label) => list.getByRole('tab', { name: label, exact: true }));
}

async function focusRing(element: Locator) {
  return element.evaluate(async (node) => {
    await Promise.all(node.getAnimations().map((animation) => animation.finished));
    const style = getComputedStyle(node);
    return {
      boxShadow: style.boxShadow,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });
}

async function expectGlobalFocusRing(element: Locator) {
  const styles = await element.evaluate(async (node) => {
    await Promise.all(node.getAnimations().map((animation) => animation.finished));
    const computed = getComputedStyle(node);
    const root = getComputedStyle(document.documentElement);
    const probe = document.createElement('span');
    document.body.append(probe);
    probe.style.color = root.getPropertyValue('--background').trim();
    const backgroundColor = getComputedStyle(probe).color;
    probe.style.color = root.getPropertyValue('--ring').trim();
    const ringColor = getComputedStyle(probe).color;
    probe.remove();

    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor,
      boxShadow: computed.boxShadow,
      expectedBoxShadow: `${backgroundColor} 0px 0px 0px 2px, ${ringColor} 0px 0px 0px 5px`,
    };
  });
  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('2px');
  expect(styles.outlineColor).toBe('rgba(0, 0, 0, 0)');
  expect(styles.boxShadow).toBe(styles.expectedBoxShadow);
}

async function expectForcedColorsFocus(element: Locator) {
  const styles = await focusRing(element);
  const highlight = await element.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'Highlight';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('3px');
  expect(styles.outlineColor).toBe(highlight);
  await expectNoVisibleShadow(element);
}

async function expectNoVisibleShadow(element: Locator) {
  const invisible = await element.evaluate((node) => {
    const boxShadow = getComputedStyle(node).boxShadow;
    if (boxShadow === 'none') return true;

    const layers: string[] = [];
    let depth = 0;
    let start = 0;
    for (let index = 0; index < boxShadow.length; index += 1) {
      const character = boxShadow[index];
      if (character === '(') depth += 1;
      if (character === ')') depth -= 1;
      if (depth < 0) return false;
      if (character === ',' && depth === 0) {
        layers.push(boxShadow.slice(start, index).trim());
        start = index + 1;
      }
    }
    if (depth !== 0) return false;
    layers.push(boxShadow.slice(start).trim());
    if (layers.length === 0 || layers.some((layer) => layer.length === 0)) return false;

    const context = document.createElement('canvas').getContext('2d');
    if (!context) return false;
    return layers.every((layer) => {
      const firstLength = layer.search(/-?\d*\.?\d+px/);
      if (firstLength === -1) return false;
      const color = layer
        .slice(0, firstLength)
        .replace(/^inset\s+/, '')
        .replace(/\s+inset$/, '')
        .trim();
      const dimensions = layer.match(/-?\d*\.?\d+px/g)?.map(Number.parseFloat) ?? [];
      if (
        color.length === 0 ||
        !CSS.supports('color', color) ||
        dimensions.length !== 4 ||
        dimensions.some((dimension) => dimension !== 0)
      ) {
        return false;
      }

      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data[3] === 0;
    });
  });
  expect(invisible).toBe(true);
}

for (const locale of locales) {
  test(`${locale.route} manual tabs move focus and selection with the arrow keys`, async ({
    page,
  }) => {
    const lab = await loadLab(page, locale);
    const list = lab.getByRole('tablist', { name: locale.manualTablist });
    const tabs = getTabs(list, locale.tabs);
    await tabs[0]!.focus();

    for (const [key, index] of [
      ['ArrowRight', 1],
      ['ArrowLeft', 0],
      ['ArrowLeft', 3],
      ['Home', 0],
      ['End', 3],
    ] as const) {
      await page.keyboard.press(key);
      await expect(tabs[index]!).toBeFocused();
      await expect(tabs[index]!).toHaveAttribute('aria-selected', 'true');
      await expect(tabs[index]!).toHaveAttribute('tabindex', '0');
      await expect(tabs[index]!.getByText('tabindex="0"')).toBeVisible();
      await expect(list.getByRole('tab', { name: locale.tabs[0], exact: true })).toHaveAttribute(
        'tabindex',
        index === 0 ? '0' : '-1'
      );
      const panelId = await tabs[index]!.getAttribute('aria-controls');
      await expect(lab.locator(`#${panelId}`)).toBeVisible();
    }
  });

  test(`${locale.route} each tabs version has one Tab stop and returns to its selected tab`, async ({
    page,
  }) => {
    const lab = await loadLab(page, locale);
    const manual = lab.getByRole('tablist', { name: locale.manualTablist });
    const manualTabs = getTabs(manual, locale.tabs);
    const beforeLab = page.locator('#movimiento .more a').last();
    await beforeLab.focus();
    await page.keyboard.press('Tab');
    await expect(manualTabs[0]!).toBeFocused();
    await page.keyboard.press('End');
    await expect(manualTabs[3]!).toHaveAttribute('aria-selected', 'true');
    expect(await Promise.all(manualTabs.map((tab) => tab.getAttribute('tabindex')))).toEqual([
      '-1',
      '-1',
      '-1',
      '0',
    ]);
    const manualPanelId = await manualTabs[3]!.getAttribute('aria-controls');
    const manualPanel = lab.locator(`#${manualPanelId}`);
    await page.keyboard.press('Tab');
    await expect(manualPanel).toBeFocused();
    await expect(page.locator(':focus')).not.toHaveAttribute('role', 'tab');
    await page.keyboard.press('Shift+Tab');
    await expect(manualTabs[3]!).toBeFocused();

    const shadcn = lab.getByRole('tablist', { name: locale.shadcnTablist });
    const shadcnTabs = getTabs(shadcn, locale.tabs);
    await manualPanel.focus();
    await page.keyboard.press('Tab');
    await expect(shadcnTabs[0]!).toBeFocused();
    await page.keyboard.press('End');
    await expect(shadcnTabs[3]!).toHaveAttribute('aria-selected', 'true');
    const shadcnPanelId = await shadcnTabs[3]!.getAttribute('aria-controls');
    const shadcnPanel = lab.locator(`#${shadcnPanelId}`);
    await page.keyboard.press('Tab');
    await expect(shadcnPanel).toBeFocused();
    await expect(page.locator(':focus')).not.toHaveAttribute('role', 'tab');
    await page.keyboard.press('Shift+Tab');
    await expect(shadcnTabs[3]!).toBeFocused();
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`${locale.route} both tabs versions use the global keyboard focus ring in ${theme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((value) => localStorage.setItem('foco-theme', value), theme);
      const lab = await loadLab(page, locale);
      const manual = lab.getByRole('tablist', { name: locale.manualTablist });
      const manualTabs = getTabs(manual, locale.tabs);
      await page.locator('#movimiento .more a').last().focus();
      await page.keyboard.press('Tab');
      await expect(manualTabs[0]!).toBeFocused();
      await expectGlobalFocusRing(manualTabs[0]!);
      const manualRing = await focusRing(manualTabs[0]!);

      const manualPanelId = await manualTabs[0]!.getAttribute('aria-controls');
      await lab.locator(`#${manualPanelId}`).focus();
      await page.keyboard.press('Tab');
      const shadcn = lab.getByRole('tablist', { name: locale.shadcnTablist });
      const shadcnTab = getTabs(shadcn, locale.tabs)[0]!;
      await expect(shadcnTab).toBeFocused();
      await expectGlobalFocusRing(shadcnTab);
      expect(await focusRing(shadcnTab)).toEqual(manualRing);
    });
  }

  test(`${locale.route} both tab panels retain a forced-colors focus outline`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    const lab = await loadLab(page, locale);
    const manual = lab.getByRole('tablist', { name: locale.manualTablist });
    const manualTab = getTabs(manual, locale.tabs)[0]!;
    await page.locator('#movimiento .more a').last().focus();
    await page.keyboard.press('Tab');
    await expect(manualTab).toBeFocused();
    const manualPanel = lab.locator(`#${await manualTab.getAttribute('aria-controls')}`);
    await page.keyboard.press('Tab');
    await expect(manualPanel).toBeFocused();
    await expectForcedColorsFocus(manualPanel);

    await manualPanel.focus();
    await page.keyboard.press('Tab');
    const shadcn = lab.getByRole('tablist', { name: locale.shadcnTablist });
    const shadcnTab = getTabs(shadcn, locale.tabs)[0]!;
    await expect(shadcnTab).toBeFocused();
    const shadcnPanel = lab.locator(`#${await shadcnTab.getAttribute('aria-controls')}`);
    await page.keyboard.press('Tab');
    await expect(shadcnPanel).toBeFocused();
    await expectForcedColorsFocus(shadcnPanel);
  });

  test(`${locale.route} both tab versions show a forced-colors focus outline`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    const lab = await loadLab(page, locale);
    const manual = lab.getByRole('tablist', { name: locale.manualTablist });
    const manualTab = getTabs(manual, locale.tabs)[0]!;
    await page.locator('#movimiento .more a').last().focus();
    await page.keyboard.press('Tab');
    await expect(manualTab).toBeFocused();
    await expectForcedColorsFocus(manualTab);

    const manualPanel = lab.locator(`#${await manualTab.getAttribute('aria-controls')}`);
    await manualPanel.focus();
    await page.keyboard.press('Tab');
    const shadcn = lab.getByRole('tablist', { name: locale.shadcnTablist });
    const shadcnTab = getTabs(shadcn, locale.tabs)[0]!;
    await expect(shadcnTab).toBeFocused();
    await expectForcedColorsFocus(shadcnTab);
  });

  test(`${locale.route} selected tabs remain distinct from unselected tabs in forced colors`, async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    const lab = await loadLab(page, locale);
    await lab.click({ position: { x: 2, y: 2 } });
    for (const tablistName of [locale.manualTablist, locale.shadcnTablist]) {
      const tablist = lab.getByRole('tablist', { name: tablistName });
      expect(await tablist.evaluate((element) => element.contains(document.activeElement))).toBe(
        false
      );
      const selected = await tablist
        .getByRole('tab', { selected: true })
        .evaluate(readSelectionStyles);
      const unselected = await Promise.all(
        (await tablist.getByRole('tab', { selected: false }).all()).map((tab) =>
          tab.evaluate(readSelectionStyles)
        )
      );
      expect(selected.textDecorationLine.split(/\s+/)).toContain('underline');
      expect(selected.textDecorationThickness).toBe('2px');
      for (const styles of unselected) {
        expect(styles.textDecorationLine.split(/\s+/)).not.toContain('underline');
      }
    }
  });

  test(`${locale.route} tab controls and labels fit narrow and medium viewports`, async ({
    page,
  }) => {
    const lab = await loadLab(page, locale);
    for (const width of [320, 375, 640, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);
      const overflows = await lab.getByRole('tab').evaluateAll((tabs) =>
        tabs.flatMap((tab) => {
          const elements = [tab, ...Array.from(tab.children)];
          return elements
            .filter((element) => element.scrollWidth > element.clientWidth)
            .map((element) => ({
              text: element.textContent,
              scrollWidth: element.scrollWidth,
              clientWidth: element.clientWidth,
            }));
        })
      );
      expect(overflows, `horizontal tab overflow at ${width}px`).toEqual([]);
    }
  });
}

function readSelectionStyles(element: HTMLElement) {
  const style = getComputedStyle(element);
  const after = getComputedStyle(element, '::after');
  return {
    borderBottomColor: style.borderBottomColor,
    borderBottomStyle: style.borderBottomStyle,
    borderBottomWidth: style.borderBottomWidth,
    backgroundColor: style.backgroundColor,
    color: style.color,
    textDecorationLine: style.textDecorationLine,
    textDecorationThickness: style.textDecorationThickness,
    afterOpacity: after.opacity,
    afterBackgroundColor: after.backgroundColor,
  };
}
