import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

type AxeNodeTarget = Awaited<
  ReturnType<AxeBuilder['analyze']>
>['violations'][number]['nodes'][number]['target'];

function formatSelector(target: AxeNodeTarget): string {
  return target.map(formatCrossTreeSelector).join(' | ');
}

function formatCrossTreeSelector(selector: AxeNodeTarget[number]): string {
  return typeof selector === 'string' ? selector : selector.flat(Infinity).join(' >>> ');
}

async function expectNoViolations(
  page: Page,
  route: string,
  label: string,
  theme: 'light' | 'dark'
) {
  await page.emulateMedia({ colorScheme: theme });
  await page.addInitScript((storedTheme: 'light' | 'dark') => {
    localStorage.setItem('foco-theme', storedTheme);
  }, theme);
  await page.goto(route);
  await expect(page.getByRole('group', { name: label })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  // This means zero automatically detectable violations for these tagged rules,
  // not full WCAG 2.2 conformance. Keyboard, focus, forced-colors, reduced-motion,
  // and screen-reader behavior still need behavioral or manual testing.
  const violations = results.violations;
  const details = violations
    .map(({ id, impact, nodes }) => {
      const selectors = nodes.map(({ target }) => `  - ${formatSelector(target)}`);
      return `- ${id} (impact: ${impact ?? 'unknown'})\n${selectors.join('\n')}`;
    })
    .join('\n');

  expect(violations, `Axe found accessibility violations at ${route}:\n${details}`).toHaveLength(0);
}

for (const locale of [
  { route: '/', label: 'Tema' },
  { route: '/en/', label: 'Theme' },
]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`home page at ${locale.route} in ${theme} mode has no automatically detectable tagged accessibility violations`, async ({
      page,
    }) => {
      await expectNoViolations(page, locale.route, locale.label, theme);
      await expect(page.getByRole('main')).toBeVisible();
    });
  }
}
