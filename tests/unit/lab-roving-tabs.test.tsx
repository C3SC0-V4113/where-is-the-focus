import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { LabRovingTabs } from '@/components/focus/labs/lab-roving-tabs';
import { RovingTabsManual } from '@/components/focus/labs/roving-tabs-manual';
import { RovingTabsShadcn } from '@/components/focus/labs/roving-tabs-shadcn';
import { getSnippetCode, snippets } from '@/lib/focus/snippets';

const unmounts: (() => void)[] = [];

afterEach(() => {
  unmounts.splice(0).forEach((unmount) => unmount());
});

const versions = [
  {
    name: 'manual',
    Component: RovingTabsManual,
    listName: 'Detalles del producto, a mano',
  },
  {
    name: 'shadcn',
    Component: RovingTabsShadcn,
    listName: 'Detalles del producto, con shadcn Tabs',
  },
] as const;
const tabs = ['Descripción', 'Medidas', 'Envío', 'Opiniones'];
const panels = [
  'Mochila de 22 litros en tejido reciclado, con espalda ventilada.',
  '48 × 30 × 18 cm · 680 g.',
  'Gratis desde 40 €. Llega en 48 horas.',
  '4,7 de 5 en 312 opiniones.',
];

it('translates the roving tabs snippet comments and visible label literally', () => {
  expect(getSnippetCode(snippets.roving, 'css', 'en')).toContain('the only one reached with Tab');
  expect(getSnippetCode(snippets.roving, 'css', 'en')).toContain('aria-selected and its panel');
  expect(getSnippetCode(snippets.roving, 'tw', 'en')).toContain(
    'The JS is the same. Styling, with attribute\n     and focus-visible variants:'
  );
  expect(getSnippetCode(snippets.roving, 'tw', 'en')).toContain('  Description');
});

it('does not add region landmarks around the tabs examples', () => {
  const view = render(<LabRovingTabs locale="es" />);
  unmounts.push(view.unmount);
  expect(screen.queryAllByRole('region')).toHaveLength(0);
});

function setup(Component: (typeof versions)[number]['Component'], listName: string) {
  const user = userEvent.setup();
  const view = render(<Component locale="es" />);
  unmounts.push(view.unmount);
  const list = screen.getByRole('tablist', { name: listName });
  return { user, list, items: within(list).getAllByRole('tab') };
}

function expectSelected(items: HTMLElement[], index: number) {
  expect(items.filter((item) => item.getAttribute('aria-selected') === 'true')).toEqual([
    items[index],
  ]);
  expect(items.map((item) => item.tabIndex)).toEqual(items.map((_, i) => (i === index ? 0 : -1)));
  expect(screen.getByRole('tabpanel').textContent).toBe(panels[index]);
  expect(screen.getByRole('tabpanel')).toHaveProperty('tabIndex', 0);
  for (const item of items) {
    expect(within(item).getByText(`tabindex="${item.tabIndex}"`).textContent).toBe(
      `tabindex="${item.tabIndex}"`
    );
  }
}

function expectFocus(element: HTMLElement) {
  expect(element).toHaveProperty('ownerDocument.activeElement', element);
}

describe.each(versions)('$name roving tabs', ({ Component, listName, name }) => {
  it('starts selected, exposes one tab stop and makes the active panel tabbable', async () => {
    const { user, list, items } = setup(Component, listName);

    expect(screen.getByRole('tablist', { name: listName })).toBe(list);
    expect(tabs.map((label) => within(list).getByRole('tab', { name: label }))).toEqual(items);
    expectSelected(items, 0);
    await user.tab();
    expectFocus(items[0]!);
    await user.tab();
    expectFocus(screen.getByRole('tabpanel'));
    await user.tab({ shift: true });
    expectFocus(items[0]!);
  });

  it('moves focus and selection with arrows, Home, End and circular wrap', async () => {
    const { user, items } = setup(Component, listName);
    const select = async (index: number, key: string) => {
      await user.keyboard(key);
      expect(items[index]!.getAttribute('aria-selected')).toBe('true');
      expectSelected(items, index);
      expectFocus(items[index]!);
    };

    items[0]!.focus();
    await select(1, '{ArrowRight}');
    await select(0, '{ArrowLeft}');
    await select(3, '{ArrowLeft}');
    await select(0, '{Home}');
    await select(3, '{End}');
  });

  it('keeps the only keyboard stop on the selected tab in the tab order', async () => {
    const { user, items } = setup(Component, listName);
    items[0]!.focus();
    await user.keyboard('{End}');
    await user.tab();
    expect(screen.getByRole('tabpanel').getAttribute('tabindex')).toBe('0');
    expectFocus(screen.getByRole('tabpanel'));
    await user.tab({ shift: true });
    expectFocus(items[3]!);
  });

  it('keeps each visible tabindex label in sync after click and arrow navigation', async () => {
    const { user, items } = setup(Component, listName);

    await user.click(items[2]!);
    expect(items[2]!.getAttribute('aria-selected')).toBe('true');
    expectSelected(items, 2);
    await user.keyboard('{ArrowRight}');
    expect(items[3]!.getAttribute('aria-selected')).toBe('true');
    expectSelected(items, 3);
  });

  if (name === 'manual') {
    it('updates the visible tabindex label when a tab is clicked', async () => {
      const { user, items } = setup(Component, listName);

      await user.click(items[2]!);
      expectSelected(items, 2);
      expect(within(items[2]!).getByText('tabindex="0"').textContent).toBe('tabindex="0"');
      expect(within(items[0]!).getByText('tabindex="-1"').textContent).toBe('tabindex="-1"');
    });
  }
});
