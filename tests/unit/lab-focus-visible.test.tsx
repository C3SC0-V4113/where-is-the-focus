import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { LabFocusVisible } from '@/components/focus/labs/lab-focus-visible';

let unmount: (() => void) | undefined;
afterEach(() => {
  unmount?.();
  unmount = undefined;
});

const copy = {
  es: {
    save: 'Guardar cambios',
    initial: 'Todavía no has interactuado con los botones.',
    statuses: [
      '◐Molesta Botón :focus con el ratón: el anillo se ve.',
      '✓Como se espera Botón :focus-visible con el ratón: el anillo no se ve.',
      '✓Como se espera Botón :focus con el teclado: el anillo se ve.',
      '✓Como se espera Botón :focus-visible con el teclado: el anillo se ve.',
    ],
  },
  en: {
    save: 'Save changes',
    initial: 'You haven’t interacted with the buttons yet.',
    statuses: [
      '◐Distracting Button :focus with the mouse: the ring is visible.',
      '✓As expected Button :focus-visible with the mouse: the ring is hidden.',
      '✓As expected Button :focus with the keyboard: the ring is visible.',
      '✓As expected Button :focus-visible with the keyboard: the ring is visible.',
    ],
  },
} as const;

function renderLab(locale: keyof typeof copy) {
  const view = render(<LabFocusVisible locale={locale} />);
  unmount = view.unmount;
  const region = screen.getByText(copy[locale].initial);
  const buttons = screen.getAllByRole('button', { name: copy[locale].save });
  expect(buttons).toHaveLength(2);
  expect(region.getAttribute('aria-live')).toBe('polite');
  return { view, region, buttons };
}

function expectStatus(region: HTMLElement, locale: keyof typeof copy, index: number) {
  expect(region).toHaveProperty('textContent', copy[locale].statuses[index]);
  expect(
    screen.getByText(index % 2 === 0 ? ':focus' : ':focus-visible', { selector: 'strong' })
  ).toBeTruthy();
}

describe('LabFocusVisible', () => {
  it.each(['es', 'en'] as const)('reports keyboard focus in %s', async (locale) => {
    const user = userEvent.setup();
    const { region } = renderLab(locale);

    expect(region.textContent).toBe(copy[locale].initial);
    await user.tab();
    expectStatus(region, locale, 2);
    await user.tab();
    expectStatus(region, locale, 3);
  });

  it.each(['es', 'en'] as const)('reports pointer focus in %s', async (locale) => {
    const user = userEvent.setup();
    const { region, buttons } = renderLab(locale);

    expect(region.textContent).toBe(copy[locale].initial);
    await user.click(buttons[0]!);
    expectStatus(region, locale, 0);
    await user.click(buttons[1]!);
    expectStatus(region, locale, 1);
  });
});
