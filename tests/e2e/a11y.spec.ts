import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home page has no automatically detectable tagged accessibility violations', async ({
  page,
}) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  // This means zero automatically detectable violations for these tagged rules, not full WCAG 2.2 conformance. Keyboard, focus, forced-colors, reduced-motion, and screen-reader behavior still need behavioral or manual testing.
  const violations = results.violations;
  const details = violations
    .map(({ id, impact, nodes }) => {
      const selectors = nodes.flatMap(({ target }) => target.map((selector) => `  - ${selector}`));
      return `- ${id} (impact: ${impact ?? 'unknown'})\n${selectors.join('\n')}`;
    })
    .join('\n');

  expect(violations, `Axe found accessibility violations:\n${details}`).toHaveLength(0);
});
