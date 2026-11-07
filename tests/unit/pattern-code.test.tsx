import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { PatternCode } from '@/components/focus/patterns/pattern-code';
import { en, es } from '@/i18n/messages';
import { getSnippetCode, snippets } from '@/lib/focus/snippets';

const codeLabels = { ...es.codeExample };

function renderPattern(snippet: keyof typeof snippets, locale: 'es' | 'en' = 'es') {
  const messages = locale === 'en' ? en : es;
  const labels = messages.sections.beyondRing.gallery.code;
  return render(
    <PatternCode
      snippet={snippet}
      locale={locale}
      label={labels.trigger}
      codeLabels={messages.codeExample}
    />
  );
}

describe('PatternCode', () => {
  it('starts closed with an accessible collapsed trigger and no visible code', () => {
    const view = renderPattern('campo');

    expect(
      within(view.container)
        .getByRole('button', { name: 'Ver código' })
        .getAttribute('aria-expanded')
    ).toBe('false');
    expect(within(view.container).queryByRole('tabpanel', { name: 'CSS' })).toBeNull();
  });

  it.each(['{Enter}', ' '])(
    'opens with keyboard input %s and keeps focus on the trigger',
    async (key) => {
      const user = userEvent.setup();
      const view = renderPattern('campo');
      const trigger = within(view.container).getByRole('button', { name: 'Ver código' });

      trigger.focus();
      await user.keyboard(key);

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(trigger.matches(':focus')).toBe(true);
      expect(within(view.container).getByRole('tabpanel', { name: 'CSS' }).textContent).toContain(
        getSnippetCode(snippets.campo, 'css', 'es')
      );
    }
  );

  it('opens independent instances simultaneously', async () => {
    const user = userEvent.setup();
    const view = render(
      <>
        <PatternCode snippet="campo" locale="es" label="Ver código" codeLabels={codeLabels} />
        <PatternCode snippet="invertir" locale="es" label="Ver código" codeLabels={codeLabels} />
      </>
    );
    const triggers = within(view.container).getAllByRole('button', { name: 'Ver código' });

    await user.click(triggers[0]!);
    await user.click(triggers[1]!);

    expect(triggers[0]!.getAttribute('aria-expanded')).toBe('true');
    expect(triggers[1]!.getAttribute('aria-expanded')).toBe('true');
    expect(within(view.container).getAllByRole('tabpanel', { name: 'CSS' })).toHaveLength(2);
  });

  it.each([
    ['es', 'Ver código'],
    ['en', 'View code'],
  ] as const)('localizes the trigger in %s', (locale, label) => {
    const view = renderPattern('campo', locale);
    expect(within(view.container).getByRole('button', { name: label })).toBeTruthy();
  });
});
