import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const routes = [
  {
    path: '/',
    questions: [
      '«El anillo se ve feo»',
      '«Al cerrar el modal, el botón se queda marcado»',
      '«Casi nadie navega con teclado»',
      '«¿No basta con cambiar el color del botón?»',
      '«Usamos una librería de componentes»',
    ],
    firstAnswer:
      'El anillo por defecto del navegador no está pensado para ninguna marca. Uno diseñado con los colores, el radio y la separación del sistema de diseño se integra igual que el hover. Si aun así no convence, las piezas del punto 05 ofrecen alternativas sin anillo.',
  },
  {
    path: '/en/',
    questions: [
      '“The ring looks ugly”',
      '“After closing the modal, the button stays highlighted”',
      '“Hardly anyone uses the keyboard”',
      '“Isn’t changing the button color enough?”',
      '“We use a component library”',
    ],
    firstAnswer:
      'The browser’s default ring isn’t made for any brand. One designed with your design system’s colors, radius and offset fits in just like hover. If that still doesn’t convince, the pieces in section 05 offer alternatives without a ring.',
  },
] as const;

const accordionPanelSelector = '[data-slot="accordion-content"]';
const faqIslandSelector = '#objeciones astro-island:not([ssr])';

function getTriggers(page: Page, questions: readonly string[]) {
  return questions.map((question) => page.getByRole('button', { name: question }));
}

async function loadFaq(page: Page, path: string) {
  await page.goto(path);
  const section = page.locator('#objeciones');
  await section.scrollIntoViewIfNeeded();
  await expect(page.locator(faqIslandSelector)).toHaveCount(1);
  return section;
}

async function expectNoTaggedAxeViolations(page: Page, route: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(
    results.violations,
    `Axe found automatically detectable tagged-rule violations at ${route}`
  ).toHaveLength(0);
}

async function expectInstantDurations(locator: Locator) {
  const durations = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      animation: style.animation,
      animationDuration: style.animationDuration,
      transition: style.transition,
      transitionDuration: style.transitionDuration,
    };
  });

  expect(
    durations.animationDuration.split(',').every((duration) => Number.parseFloat(duration) === 0)
  ).toBe(true);
  expect(
    durations.transitionDuration.split(',').every((duration) => Number.parseFloat(duration) === 0)
  ).toBe(true);
}

for (const route of routes) {
  test.describe(`FAQ at ${route.path}`, () => {
    test('starts closed, gives every trigger a Tab stop, and supports keyboard toggles', async ({
      page,
    }) => {
      await loadFaq(page, route.path);
      const triggers = getTriggers(page, route.questions);

      for (const trigger of triggers) {
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      }

      const previousFocusable = await page.evaluate(() => {
        const firstTrigger = document.querySelector<HTMLElement>(
          '#objeciones button[aria-expanded]'
        );
        if (!firstTrigger) return null;

        const candidates = Array.from(
          document.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]'
          )
        ).filter((element) => {
          const style = getComputedStyle(element);
          return (
            element !== firstTrigger &&
            element.tabIndex >= 0 &&
            element.getClientRects().length > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            !element.closest('[hidden], [inert]')
          );
        });

        const previous = candidates
          .filter(
            (element) =>
              (element.compareDocumentPosition(firstTrigger) & Node.DOCUMENT_POSITION_FOLLOWING) !==
              0
          )
          .at(-1);
        previous?.focus();
        return previous?.tagName ?? null;
      });

      expect(previousFocusable).not.toBeNull();
      await page.keyboard.press('Tab');
      await expect(triggers[0]!).toBeFocused();
      for (let index = 1; index < triggers.length; index += 1) {
        await page.keyboard.press('Tab');
        await expect(triggers[index]!).toBeFocused();
      }

      await triggers[0]!.focus();
      await page.keyboard.press('Enter');
      await expect(triggers[0]!).toHaveAttribute('aria-expanded', 'true');
      await expect(triggers[0]!).toBeFocused();
      await expect(triggers[0]!).toHaveAttribute('aria-controls', /.+/);
      const firstPanel = page.getByRole('region', { name: route.questions[0] });
      await expect(firstPanel).toBeVisible();
      await expect(firstPanel).toContainText(route.firstAnswer);

      await page.keyboard.press('Space');
      await expect(triggers[0]!).toHaveAttribute('aria-expanded', 'false');
      await expect(triggers[0]!).toBeFocused();
      await page.keyboard.press('Space');
      await expect(triggers[0]!).toHaveAttribute('aria-expanded', 'true');
      await expect(triggers[0]!).toBeFocused();

      await triggers[1]!.click();
      await expect(triggers[1]!).toHaveAttribute('aria-expanded', 'true');
      await expect(triggers[0]!).toHaveAttribute('aria-expanded', 'true');
    });

    test('has no horizontal overflow at 375 px, including with all answers open', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await loadFaq(page, route.path);
      const triggers = getTriggers(page, route.questions);

      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(375);
      for (const trigger of triggers) {
        await trigger.click();
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      }
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(375);

      const computed = await page.locator('#objeciones [data-faq]').evaluate((root) => {
        const items = Array.from(
          root.querySelectorAll<HTMLElement>('[data-slot="accordion-item"]')
        );
        const styles = items.map((item) => {
          const trigger = item.querySelector<HTMLElement>('[data-slot="accordion-trigger"]');
          const answer = item.querySelector<HTMLElement>('[data-slot="accordion-content"] > div');
          if (!trigger || !answer)
            throw new Error('An open FAQ item is missing its trigger or answer.');

          const triggerStyle = getComputedStyle(trigger);
          const answerStyle = getComputedStyle(answer);
          const lineHeight = Number.parseFloat(triggerStyle.lineHeight);
          const fontSize = Number.parseFloat(triggerStyle.fontSize);
          const answerLineHeight = Number.parseFloat(answerStyle.lineHeight);
          const answerFontSize = Number.parseFloat(answerStyle.fontSize);

          return {
            borderBottomWidth: getComputedStyle(item).borderBottomWidth,
            triggerFontSize: triggerStyle.fontSize,
            triggerLineHeight: triggerStyle.lineHeight.endsWith('px')
              ? lineHeight / fontSize
              : lineHeight,
            triggerFontWeight: triggerStyle.fontWeight,
            triggerPaddingBlockStart: triggerStyle.paddingBlockStart,
            triggerPaddingBlockEnd: triggerStyle.paddingBlockEnd,
            answerFontFamily: answerStyle.fontFamily,
            answerLineHeight: Number((answerLineHeight / answerFontSize).toFixed(2)),
            answerFontSize: answerStyle.fontSize,
            answerPaddingBottom: answerStyle.paddingBottom,
          };
        });

        return {
          borderTopWidth: getComputedStyle(root).borderTopWidth,
          items: styles,
        };
      });

      expect(computed.borderTopWidth).toBe('2px');
      expect(computed.items).toHaveLength(5);
      for (const item of computed.items) {
        const { answerFontFamily, ...measuredStyles } = item;
        expect({
          ...measuredStyles,
          triggerLineHeight: Number(measuredStyles.triggerLineHeight.toFixed(2)),
        }).toEqual({
          borderBottomWidth: '1px',
          triggerFontSize: '18px',
          triggerLineHeight: 1.25,
          triggerFontWeight: '600',
          triggerPaddingBlockStart: '18px',
          triggerPaddingBlockEnd: '18px',
          answerLineHeight: 1.5,
          answerFontSize: '16px',
          answerPaddingBottom: '20px',
        });
        expect(answerFontFamily).toMatch(/^['"]?Literata/);
      }
    });

    test('pointer activation uses a 150 ms opacity transition without a keyframe animation', async ({
      page,
    }) => {
      await loadFaq(page, route.path);
      const trigger = page.getByRole('button', { name: route.questions[0] });

      await page.evaluate(() => {
        const targetWindow = window as Window & {
          __faqPanelOpacityTransition?: { panelId: string; propertyName: string };
        };
        const recordTransition = (event: TransitionEvent) => {
          const panel = event.target;
          if (
            panel instanceof HTMLElement &&
            panel.matches('[data-slot="accordion-content"]') &&
            event.propertyName === 'opacity'
          ) {
            targetWindow.__faqPanelOpacityTransition = {
              panelId: panel.id,
              propertyName: event.propertyName,
            };
            document.removeEventListener('transitionrun', recordTransition, true);
          }
        };
        document.addEventListener('transitionrun', recordTransition, true);
      });

      await trigger.click();

      const root = page.locator('#objeciones [data-faq]');
      const panel = page.locator(accordionPanelSelector).first();
      await expect(root).toHaveAttribute('data-activation', 'pointer');
      await expect(panel).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (
                window as Window & {
                  __faqPanelOpacityTransition?: { panelId: string; propertyName: string };
                }
              ).__faqPanelOpacityTransition ?? null
          )
        )
        .not.toBeNull();
      const transition = await page.evaluate(
        () =>
          (
            window as Window & {
              __faqPanelOpacityTransition?: { panelId: string; propertyName: string };
            }
          ).__faqPanelOpacityTransition ?? null
      );
      expect(transition?.panelId).toBe(await panel.getAttribute('id'));
      expect(transition?.propertyName).toBe('opacity');

      const styles = await panel.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          animationName: computed.animationName,
          transitionProperty: computed.transitionProperty,
          transitionDuration: computed.transitionDuration,
        };
      });

      expect(styles.animationName).toBe('none');
      expect(styles.transitionProperty.split(',').map((value) => value.trim())).toContain(
        'opacity'
      );
      expect(
        styles.transitionDuration.split(',').map((duration) => {
          const value = Number.parseFloat(duration);
          return duration.trim().endsWith('ms') ? value : value * 1000;
        })
      ).toContain(150);
    });

    test('keyboard activation records its source and disables Panel transitions', async ({
      page,
    }) => {
      await loadFaq(page, route.path);
      const trigger = page.getByRole('button', { name: route.questions[0] });
      await trigger.focus();
      await page.keyboard.press('Enter');

      await expect(page.locator('#objeciones [data-faq]')).toHaveAttribute(
        'data-activation',
        'keyboard'
      );
      const panel = page.locator(accordionPanelSelector).first();
      await expect(panel).toBeVisible();
      const transitionDuration = await panel.evaluate(
        (element) => getComputedStyle(element).transitionDuration
      );
      expect(
        transitionDuration.split(',').every((duration) => Number.parseFloat(duration) === 0)
      ).toBe(true);
    });

    test('closing stops the active Panel fade without waiting for it to finish', async ({
      page,
    }) => {
      await loadFaq(page, route.path);
      const result = await page.evaluate(async (question) => {
        const trigger = Array.from(
          document.querySelectorAll<HTMLButtonElement>(
            '#objeciones [data-slot="accordion-trigger"]'
          )
        ).find((button) => button.textContent?.trim() === question);
        if (!trigger) throw new Error('The FAQ trigger was not found.');

        const openingTransition = new Promise<HTMLElement>((resolve) => {
          const recordTransition = (event: TransitionEvent) => {
            const panel = event.target;
            if (
              panel instanceof HTMLElement &&
              panel.matches('[data-slot="accordion-content"]') &&
              event.propertyName === 'opacity'
            ) {
              document.removeEventListener('transitionrun', recordTransition, true);
              resolve(panel);
            }
          };
          document.addEventListener('transitionrun', recordTransition, true);
        });

        trigger.click();
        const panel = await openingTransition;
        const openingTransitionIsRunning = panel
          .getAnimations()
          .some(
            (animation) =>
              animation instanceof CSSTransition &&
              animation.transitionProperty === 'opacity' &&
              animation.playState === 'running'
          );
        const opened = trigger.getAttribute('aria-expanded') === 'true';
        const panelId = panel.id;

        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            trigger.click();
            resolve();
          });
        });

        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

        const remainingPanel = document.getElementById(panelId);
        const runningAfterClose =
          remainingPanel?.getAnimations().some((animation) => animation.playState === 'running') ??
          false;

        return {
          opened,
          openingTransitionIsRunning,
          closed: trigger.getAttribute('aria-expanded') === 'false',
          panelRemoved: remainingPanel === null,
          runningAfterClose,
        };
      }, route.questions[0]);

      expect(result.opened).toBe(true);
      expect(result.openingTransitionIsRunning).toBe(true);
      expect(result.closed).toBe(true);
      expect(result.panelRemoved || !result.runningAfterClose).toBe(true);
      await expect(page.locator('#objeciones [data-slot="accordion-content"]')).toHaveCount(0);
    });

    test('has instant Panel and visible chevron motion when reduced motion is requested', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await loadFaq(page, route.path);
      const trigger = page.getByRole('button', { name: route.questions[0] });
      await trigger.click();

      const panel = page.locator(accordionPanelSelector).first();
      await expect(panel).toBeVisible();
      const chevron = trigger.locator('[data-slot="accordion-trigger-icon"]:visible');
      await expect(chevron).toBeVisible();
      await expectInstantDurations(panel);
      await expectInstantDurations(chevron);
    });
  });
}

for (const route of routes) {
  for (const theme of ['light', 'dark'] as const) {
    test(`FAQ at ${route.path} in ${theme} mode has no automatically detectable tagged axe violations with a question open`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((storedTheme: 'light' | 'dark') => {
        localStorage.setItem('foco-theme', storedTheme);
      }, theme);
      await loadFaq(page, route.path);
      await expect
        .poll(() => page.locator('html').evaluate((element) => element.classList.contains('dark')))
        .toBe(theme === 'dark');
      await page.getByRole('button', { name: route.questions[0] }).click();
      await expect(page.locator(accordionPanelSelector).first()).toBeVisible();
      await expectNoTaggedAxeViolations(page, route.path);
    });
  }
}
