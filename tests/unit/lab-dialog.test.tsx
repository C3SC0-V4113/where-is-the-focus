import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { LabDialog } from '@/components/focus/labs/lab-dialog';

let unmount: (() => void) | undefined;
afterEach(() => unmount?.());

const copy = {
  es: {
    triggers: ['Eliminar proyecto (:focus)', 'Eliminar proyecto (:focus-visible)'],
    initial: 'Aún no has abierto el diálogo.',
    opened: 'Diálogo abierto. El foco está en «Cancelar».',
    closedWith: 'Cerrado con',
    mouse: 'el ratón',
    keyboard: 'el teclado',
    focusReturned: 'El foco volvió al botón',
    andRing: 'y el anillo',
    visible: 'se ve',
    hidden: 'no se ve',
    title: '¿Eliminar el proyecto «Rediseño web»?',
    cancel: 'Cancelar',
  },
  en: {
    triggers: ['Delete project (:focus)', 'Delete project (:focus-visible)'],
    initial: 'You haven’t opened the dialog yet.',
    opened: 'Dialog open. Focus is on “Cancel”.',
    closedWith: 'Closed with',
    mouse: 'the mouse',
    keyboard: 'the keyboard',
    focusReturned: 'Focus returned to the button',
    andRing: 'and the ring',
    visible: 'is visible',
    hidden: 'is hidden',
    title: 'Delete the “Website redesign” project?',
    cancel: 'Cancel',
  },
} as const;

function renderLab(locale: keyof typeof copy) {
  const user = userEvent.setup();
  unmount = render(<LabDialog locale={locale} />).unmount;
  const status = screen.getByText(copy[locale].initial);
  const triggers = copy[locale].triggers.map((name) => screen.getByRole('button', { name }));
  return { user, status, triggers };
}

function expectClosedStatus(
  status: HTMLElement,
  locale: keyof typeof copy,
  method: 'mouse' | 'keyboard',
  triggerIndex: 0 | 1,
  visible: boolean
) {
  const text = copy[locale];
  expect(status.textContent).toBe(
    `${text.closedWith} ${text[method]}. ${text.focusReturned} ${text.triggers[triggerIndex]} ${text.andRing} ${visible ? text.visible : text.hidden}.`
  );
}

describe('LabDialog', () => {
  it.each(['es', 'en'] as const)('starts with the exact initial state in %s', (locale) => {
    const { status } = renderLab(locale);

    expect(status.textContent).toBe(copy[locale].initial);
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it.each(['es', 'en'] as const)('reports the exact keyboard states in %s', async (locale) => {
    const { user, status, triggers } = renderLab(locale);

    await user.tab();
    await user.tab();
    expect(triggers[1]).toHaveProperty('ownerDocument.activeElement', triggers[1]);
    await user.keyboard('{Enter}');
    expect(screen.getByRole('alertdialog', { name: copy[locale].title })).toBeTruthy();
    const cancel = screen.getByRole('button', { name: copy[locale].cancel });
    await waitFor(() => expect(cancel).toHaveProperty('ownerDocument.activeElement', cancel));
    expect(status.textContent).toBe(copy[locale].opened);

    await user.keyboard('{Escape}');
    expect(triggers[1]).toHaveProperty('ownerDocument.activeElement', triggers[1]);
    expectClosedStatus(status, locale, 'keyboard', 1, true);
  });

  it.each(['es', 'en'] as const)(
    'reports the exact pointer states for both triggers in %s',
    async (locale) => {
      const { user, status, triggers } = renderLab(locale);

      for (const [index, trigger] of triggers.entries()) {
        await user.click(trigger);
        expect(screen.getByRole('alertdialog', { name: copy[locale].title })).toBeTruthy();
        expect(status.textContent).toBe(copy[locale].opened);
        await user.click(screen.getByRole('button', { name: copy[locale].cancel }));
        expect(trigger).toHaveProperty('ownerDocument.activeElement', trigger);
        expectClosedStatus(status, locale, 'mouse', index as 0 | 1, index === 0);
      }
    }
  );
});
