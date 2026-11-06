import { expect, test, type Locator, type Page } from '@playwright/test';

const routes = [
  {
    path: '/',
    label: 'Ver código',
    fieldName: 'Correo electrónico',
    firstCode: 'position: relative',
  },
  {
    path: '/en/',
    label: 'View code',
    fieldName: 'Email',
    firstCode: 'position: relative',
  },
];

async function focusTriggerWithKeyboard(
  page: Page,
  card: Locator,
  trigger: Locator,
  fieldName: string
) {
  await card.getByRole('textbox', { name: fieldName }).focus();
  for (const chip of await card.locator('.chips a').all()) {
    await page.keyboard.press('Tab');
    await expect(chip).toBeFocused();
  }
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused();
}

async function transitionDurationMilliseconds(locator: Locator) {
  return locator.evaluate((element) => {
    const duration = getComputedStyle(element).transitionDuration.split(',')[0]!.trim();
    const value = Number.parseFloat(duration);
    return duration.endsWith('ms') ? value : value * 1000;
  });
}

async function expectInstantPanelHeight(panel: Locator) {
  const height = await panel.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      properties: style.transitionProperty.split(',').map((property) => property.trim()),
      rendered: element.getBoundingClientRect().height,
      content: element.scrollHeight,
    };
  });

  expect(height.properties).toContain('opacity');
  expect(height.properties).not.toContain('height');
  expect(Math.abs(height.rendered - height.content)).toBeLessThanOrEqual(1);
}

async function expectNoPatternMotion(panel: Locator, chevron: Locator) {
  await expect(panel).toHaveCSS('transition-duration', '0s');
  await expect(chevron).toHaveCSS('transition-duration', '0s');
}

async function transformIsRotated(chevron: Locator, rotated: boolean) {
  await expect
    .poll(() =>
      chevron.evaluate((element) => {
        const transform = getComputedStyle(element).transform;
        if (transform === 'none') return false;
        const matrix = new DOMMatrixReadOnly(transform);
        return Math.abs(matrix.a + 1) < 0.01 && Math.abs(matrix.d + 1) < 0.01;
      })
    )
    .toBe(rotated);
}

for (const route of routes) {
  test.describe(`gallery code at ${route.path}`, () => {
    test('renders six independent code controls, opens two with the keyboard, and keeps focus', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(route.path);
      const cards = page.locator('.gallery article.pat');
      await expect(cards).toHaveCount(6);

      const triggers = page.getByRole('button', { name: route.label });
      await expect(triggers).toHaveCount(6);
      for (let index = 0; index < 6; index += 1) {
        const trigger = triggers.nth(index);
        await trigger.scrollIntoViewIfNeeded();
        await expect(trigger).toBeVisible();
        await expect(cards.nth(index).locator('astro-island:not([ssr])')).toHaveCount(1);
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      }

      const first = triggers.nth(0);
      const second = triggers.nth(1);
      await first.scrollIntoViewIfNeeded();
      await first.focus();
      await page.keyboard.press('Enter');
      await expect(first).toHaveAttribute('aria-expanded', 'true');
      await expect(cards.nth(0).getByRole('tabpanel', { name: 'CSS' })).toContainText(
        route.firstCode
      );
      await expect(first).toBeFocused();

      await second.scrollIntoViewIfNeeded();
      await second.focus();
      await page.keyboard.press('Space');
      await expect(second).toHaveAttribute('aria-expanded', 'true');
      const expectedCode = [
        route.firstCode,
        'border: 2px solid currentColor',
        'nav a { position: relative; }',
        'background: linear-gradient',
        '.card { position: relative; }',
        '.thumb { position: relative; display: block; }',
      ];
      await expect(cards.nth(1).getByRole('tabpanel', { name: 'CSS' })).toContainText(
        expectedCode[1]!
      );
      await expect(first).toHaveAttribute('aria-expanded', 'true');
      await expect(second).toBeFocused();

      for (let index = 2; index < 6; index += 1) {
        const trigger = triggers.nth(index);
        await trigger.scrollIntoViewIfNeeded();
        await trigger.click();
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(cards.nth(index).getByRole('tabpanel', { name: 'CSS' })).toContainText(
          expectedCode[index]!
        );
      }

      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(375);
    });

    test('opens without a transition when reduced motion is requested', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route.path);
      const trigger = page.getByRole('button', { name: route.label }).first();
      await trigger.scrollIntoViewIfNeeded();
      await expect(trigger).toBeVisible();
      await expect(
        page.locator('.gallery article.pat').first().locator('astro-island:not([ssr])')
      ).toHaveCount(1);
      await trigger.click();
      const panel = page.locator('[data-pattern-code-panel]').first();
      await expect(panel).toBeVisible();
      await expect
        .poll(() => panel.evaluate((element) => getComputedStyle(element).transitionDuration))
        .toBe('0s');
    });

    test('pointer motion is opacity-only; height is instant', async ({ page }) => {
      await page.goto(route.path);
      const card = page.locator('.gallery article.pat').first();
      const trigger = card.getByRole('button', { name: route.label });
      await trigger.scrollIntoViewIfNeeded();
      await expect(trigger).toBeVisible();
      await expect(card.locator('astro-island:not([ssr])')).toHaveCount(1);

      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(card.getByRole('tabpanel', { name: 'CSS' })).toContainText(route.firstCode);
      const panel = card.locator('[data-pattern-code-panel]');
      const chevron = card.locator('[data-pattern-code-chevron]');
      await expectInstantPanelHeight(panel);
      expect(await transitionDurationMilliseconds(panel)).toBeGreaterThan(0);
      expect(await transitionDurationMilliseconds(chevron)).toBeGreaterThan(0);

      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(card.getByRole('tabpanel', { name: 'CSS' })).toHaveCount(0);
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(card.getByRole('tabpanel', { name: 'CSS' })).toContainText(route.firstCode);
    });

    test('keyboard toggles instantly and keeps trigger focus', async ({ page }) => {
      await page.goto(route.path);
      const card = page.locator('.gallery article.pat').first();
      const trigger = card.getByRole('button', { name: route.label });
      await trigger.scrollIntoViewIfNeeded();
      await expect(trigger).toBeVisible();
      await expect(card.locator('astro-island:not([ssr])')).toHaveCount(1);
      await focusTriggerWithKeyboard(page, card, trigger, route.fieldName);
      await page.keyboard.press('Enter');

      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toBeFocused();
      await expect
        .poll(() => trigger.evaluate((element) => element.matches(':focus-visible')))
        .toBe(true);
      await expect(card.getByRole('tabpanel', { name: 'CSS' })).toContainText(route.firstCode);
      const panel = card.locator('[data-pattern-code-panel]');
      const chevron = card.locator('[data-pattern-code-chevron]');
      await expectInstantPanelHeight(panel);
      await expectNoPatternMotion(panel, chevron);

      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(card.getByRole('tabpanel', { name: 'CSS' })).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await page.keyboard.press('Space');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toBeFocused();
      await expect(card.getByRole('tabpanel', { name: 'CSS' })).toContainText(route.firstCode);
      await expectInstantPanelHeight(panel);
      await expectNoPatternMotion(panel, chevron);
    });

    test('reduced motion keeps pointer and keyboard toggles instant', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route.path);
      const card = page.locator('.gallery article.pat').first();
      const trigger = card.getByRole('button', { name: route.label });
      await trigger.scrollIntoViewIfNeeded();
      await expect(trigger).toBeVisible();
      await expect(card.locator('astro-island:not([ssr])')).toHaveCount(1);
      const panel = card.locator('[data-pattern-code-panel]');
      const chevron = card.locator('[data-pattern-code-chevron]');

      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(card.getByRole('tabpanel', { name: 'CSS' })).toContainText(route.firstCode);
      await expectNoPatternMotion(panel, chevron);
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(card.getByRole('tabpanel', { name: 'CSS' })).toHaveCount(0);
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expectNoPatternMotion(panel, chevron);

      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await focusTriggerWithKeyboard(page, card, trigger, route.fieldName);
      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expectNoPatternMotion(panel, chevron);
      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(card.getByRole('tabpanel', { name: 'CSS' })).toHaveCount(0);
      await page.keyboard.press('Space');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(card.getByRole('tabpanel', { name: 'CSS' })).toContainText(route.firstCode);
      await expectNoPatternMotion(panel, chevron);
    });

    test('pointer closes during the opening frame without leaving a running transition', async ({
      page,
    }) => {
      await page.goto(route.path);
      const trigger = page.getByRole('button', { name: route.label }).first();
      await trigger.scrollIntoViewIfNeeded();
      await expect(trigger).toBeVisible();
      await expect(
        page.locator('.gallery article.pat').first().locator('astro-island:not([ssr])')
      ).toHaveCount(1);

      const result = await trigger.evaluate(async (element) => {
        const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        (element as HTMLButtonElement).click();
        await frame();
        (element as HTMLButtonElement).click();
        await frame();
        await frame();
        const card = element.closest('[data-pattern-code]');
        const panel = card?.querySelector('[data-pattern-code-panel]');
        const runningTransitions =
          panel?.getAnimations().filter((animation) => animation instanceof CSSTransition).length ??
          0;
        return {
          panelInDom: panel !== null,
          runningTransitions,
        };
      });

      expect(result.panelInDom && result.runningTransitions > 0).toBe(false);
    });

    test('pointer opening starts a real opacity transition', async ({ page }) => {
      await page.goto(route.path);
      const trigger = page.getByRole('button', { name: route.label }).first();
      await trigger.scrollIntoViewIfNeeded();
      await expect(trigger).toBeVisible();
      await expect(
        page.locator('.gallery article.pat').first().locator('astro-island:not([ssr])')
      ).toHaveCount(1);

      const transitionProperty = await trigger.evaluate(async (element) => {
        const card = element.closest('[data-pattern-code]');
        let propertyName: string | null = null;
        const recordTransition = (event: Event) => {
          const target = event.target;
          if (
            target instanceof Element &&
            target.matches('[data-pattern-code-panel]') &&
            target.closest('[data-pattern-code]') === card
          ) {
            propertyName = (event as TransitionEvent).propertyName;
          }
        };
        document.addEventListener('transitionrun', recordTransition, true);
        (element as HTMLButtonElement).click();
        for (let frame = 0; frame < 20 && propertyName === null; frame += 1) {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
        document.removeEventListener('transitionrun', recordTransition, true);
        return propertyName;
      });

      expect(transitionProperty).toBe('opacity');
    });

    test('keyboard opening has no running panel or chevron transitions', async ({ page }) => {
      await page.goto(route.path);
      const card = page.locator('.gallery article.pat').first();
      const trigger = page.getByRole('button', { name: route.label }).first();
      await trigger.scrollIntoViewIfNeeded();
      await expect(trigger).toBeVisible();
      await expect(card.locator('astro-island:not([ssr])')).toHaveCount(1);
      await focusTriggerWithKeyboard(page, card, trigger, route.fieldName);
      await page.keyboard.press('Enter');
      const transitions = await trigger.evaluate(async (element) => {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const card = element.closest('[data-pattern-code]');
        const panel = card?.querySelector('[data-pattern-code-panel]');
        const chevron = card?.querySelector('[data-pattern-code-chevron]');
        return {
          focusVisible: element.matches(':focus-visible'),
          running: [panel, chevron].flatMap(
            (node) =>
              node
                ?.getAnimations()
                .filter(
                  (animation) =>
                    animation instanceof CSSTransition && animation.playState === 'running'
                ) ?? []
          ).length,
        };
      });

      expect(transitions.focusVisible).toBe(true);
      expect(transitions.running).toBe(0);
    });

    test('chevron rotates open and returns to its identity transform when closed', async ({
      page,
    }) => {
      await page.goto(route.path);
      const trigger = page.getByRole('button', { name: route.label }).first();
      await trigger.scrollIntoViewIfNeeded();
      await expect(trigger).toBeVisible();
      await expect(
        page.locator('.gallery article.pat').first().locator('astro-island:not([ssr])')
      ).toHaveCount(1);
      const chevron = page.locator('[data-pattern-code-chevron]').first();

      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await transformIsRotated(chevron, true);

      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect
        .poll(() => chevron.evaluate((element) => getComputedStyle(element).transform))
        .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    });
  });
}
