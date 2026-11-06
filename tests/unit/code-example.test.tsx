import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CodeExample, hasHorizontalOverflow } from '@/components/common/code-example';
import { getSnippetCode, snippets, type CodeSnippet } from '@/lib/focus/snippets';
import {
  getFocusLanguage,
  getServerFocusLanguage,
  setFocusLanguage,
  subscribeToFocusLanguage,
} from '@/lib/focus-language';

import type { ReactNode } from 'react';

const labels = {
  copy: 'Copiar',
  copied: 'Copiado',
  selectAndCopy: 'Selecciona y copia',
  language: 'Lenguaje del ejemplo',
};

function localizedExample(snippet: CodeSnippet, locale: 'es' | 'en', exampleLabels = labels) {
  return (
    <CodeExample
      css={getSnippetCode(snippet, 'css', locale)}
      tailwind={getSnippetCode(snippet, 'tw', locale)}
      labels={exampleLabels}
    />
  );
}

const unmounts: Array<() => void> = [];

function renderCodeExample(node: ReactNode) {
  const view = render(node);
  unmounts.push(view.unmount);
  return view;
}

function setClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
}

beforeEach(() => {
  window.localStorage.clear();
  setFocusLanguage('css');
});

afterEach(() => {
  unmounts.splice(0).forEach((unmount) => unmount());
  vi.restoreAllMocks();
});

describe('focus language preference', () => {
  it('starts at CSS and uses CSS as the server snapshot', () => {
    expect(getFocusLanguage()).toBe('css');
    expect(getServerFocusLanguage()).toBe('css');
  });

  it('notifies all subscribers when another instance changes the language', () => {
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = subscribeToFocusLanguage(first);
    const unsubscribeSecond = subscribeToFocusLanguage(second);

    setFocusLanguage('tw');

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(getFocusLanguage()).toBe('tw');
    expect(window.localStorage.getItem('foco-lang')).toBe('tw');
    unsubscribeFirst();
    unsubscribeSecond();
  });

  it('updates subscribers from a storage event', () => {
    const subscriber = vi.fn();
    const unsubscribe = subscribeToFocusLanguage(subscriber);

    window.dispatchEvent(new StorageEvent('storage', { key: 'foco-lang', newValue: 'tw' }));

    expect(getFocusLanguage()).toBe('tw');
    expect(subscriber).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it.each([
    { key: null, newValue: null },
    { key: 'foco-lang', newValue: null },
  ])('resets to CSS and notifies subscribers for storage event $key', ({ key, newValue }) => {
    setFocusLanguage('tw');
    const subscriber = vi.fn();
    const unsubscribe = subscribeToFocusLanguage(subscriber);

    window.dispatchEvent(new StorageEvent('storage', { key, newValue }));

    expect(getFocusLanguage()).toBe('css');
    expect(subscriber).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it('keeps the English Tailwind badge labels translated', () => {
    const tailwind = getSnippetCode(snippets.shadcn, 'tw', 'en');

    expect(tailwind).toContain('>Pass<');
    expect(tailwind).toContain('>Partial<');
    expect(tailwind).toContain('Fail');
    expect(tailwind).not.toContain('No Pass');
    expect(tailwind).not.toContain('Cumple');
    expect(tailwind).not.toContain('Parcial');
    expect(tailwind).not.toContain('No cumple');
  });

  it('tolerates unavailable localStorage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(getFocusLanguage()).toBe('css');
    expect(() => setFocusLanguage('tw')).not.toThrow();
    expect(getFocusLanguage()).toBe('tw');
  });
});

describe('CodeExample', () => {
  it.each([
    ['campo', 'css', 'high-contrast mode'],
    ['campo', 'tw', 'Email'],
    ['invertir', 'tw', 'Download report'],
    ['nav', 'tw', 'Products'],
    ['subrayador', 'tw', 'shipping terms'],
    ['visor', 'css', 'repeat for the other three corners'],
    ['visor', 'tw', 'Team plan'],
    ['capa', 'tw', 'View route →'],
  ] as const)('translates %s %s gallery snippet text into English', (key, language, phrase) => {
    const code = getSnippetCode(snippets[key], language, 'en');

    expect(code).toContain(phrase);
  });

  it('renders only the selected language tab tabbable before hydration', () => {
    const view = renderToString(localizedExample(snippets.fv, 'es'));
    const cssTab = view.match(/<button[^>]*role=\"tab\"[^>]*>CSS<\/button>/)?.[0];
    const tailwindTab = view.match(/<button[^>]*role=\"tab\"[^>]*>Tailwind<\/button>/)?.[0];

    expect(cssTab).toContain('aria-selected=\"true\"');
    expect(cssTab).toContain('tabindex=\"0\"');
    expect(tailwindTab).toContain('aria-selected=\"false\"');
    expect(tailwindTab).toContain('tabindex=\"-1\"');
  });

  it('hydrates with the persisted Tailwind preference and active panel', async () => {
    window.localStorage.setItem('foco-lang', 'tw');
    vi.resetModules();

    const [{ CodeExample: PersistedCodeExample }, { getSnippetCode, snippets }, testingLibrary] =
      await Promise.all([
        import('@/components/common/code-example'),
        import('@/lib/focus/snippets'),
        import('@testing-library/react'),
      ]);
    const view = testingLibrary.render(
      <PersistedCodeExample
        css={getSnippetCode(snippets.fv, 'css', 'es')}
        tailwind={getSnippetCode(snippets.fv, 'tw', 'es')}
        labels={labels}
      />
    );

    expect(
      await testingLibrary.screen.findByRole('tab', { name: 'Tailwind', selected: true })
    ).toBeTruthy();
    expect(testingLibrary.screen.getByRole('tabpanel', { name: 'Tailwind' })).toBeTruthy();
    view.unmount();
  });

  it('keeps the panel out of Tab order and the pre tabbable only while it overflows', async () => {
    renderCodeExample(localizedExample(snippets.fv, 'es'));

    const tabpanel = screen.getByRole('tabpanel', { name: 'CSS' });
    const codeContent = within(tabpanel).getByTestId('code-example-content');
    expect(tabpanel.getAttribute('tabindex')).toBe('-1');
    expect(codeContent.tagName).toBe('PRE');

    let scrollWidth = 300;
    let clientWidth = 300;
    Object.defineProperties(codeContent, {
      scrollWidth: { configurable: true, get: () => scrollWidth },
      clientWidth: { configurable: true, get: () => clientWidth },
    });
    window.dispatchEvent(new Event('resize'));
    await waitFor(() => expect(codeContent.getAttribute('tabindex')).toBe('-1'));

    scrollWidth = 302;
    clientWidth = 300;
    window.dispatchEvent(new Event('resize'));
    await waitFor(() => expect(codeContent.getAttribute('tabindex')).toBe('0'));
  });

  it('keeps both panels mounted while hiding the inactive panel from AT and Tab', async () => {
    const user = userEvent.setup();
    renderCodeExample(localizedExample(snippets.fv, 'es'));

    const panels = screen.getAllByRole('tabpanel', { hidden: true });
    expect(panels).toHaveLength(2);
    const hiddenTailwind = panels[1]!;
    const visibleCss = panels[0]!;
    expect(screen.queryByRole('tabpanel', { name: 'Tailwind' })).toBeNull();
    expect(hiddenTailwind.getAttribute('aria-hidden')).toBe('true');
    expect(visibleCss.getAttribute('aria-hidden')).toBe('false');
    expect(hiddenTailwind.className).toContain('aria-hidden:invisible');
    expect(visibleCss.className).toContain('aria-hidden:invisible');
    expect(
      within(hiddenTailwind).getByTestId('code-example-content').getAttribute('tabindex')
    ).not.toBe('0');

    await user.click(screen.getByRole('tab', { name: 'Tailwind' }));

    const hiddenCss = screen.getAllByRole('tabpanel', { hidden: true })[0]!;
    expect(screen.queryByRole('tabpanel', { name: 'CSS' })).toBeNull();
    expect(hiddenCss.getAttribute('aria-hidden')).toBe('true');
    expect(within(hiddenCss).getByTestId('code-example-content').getAttribute('tabindex')).not.toBe(
      '0'
    );
    expect(screen.getByRole('tabpanel', { name: 'Tailwind' })).toBeTruthy();
  });

  it('detects overflowing code from the rendered pre dimensions', () => {
    expect(hasHorizontalOverflow({ scrollWidth: 377, clientWidth: 375 })).toBe(true);
    expect(hasHorizontalOverflow({ scrollWidth: 376, clientWidth: 375 })).toBe(false);
    expect(hasHorizontalOverflow(null)).toBe(false);
  });

  it('selects CSS and Tailwind with accessible tabs and arrow keys', async () => {
    const user = userEvent.setup();
    renderCodeExample(localizedExample(snippets.fv, 'es'));

    const tablist = screen.getByRole('tablist', { name: 'Lenguaje del ejemplo' });
    const css = within(tablist).getByRole('tab', { name: 'CSS' });
    const tailwind = within(tablist).getByRole('tab', { name: 'Tailwind' });
    expect(css.getAttribute('aria-selected')).toBe('true');
    expect(css.getAttribute('tabindex')).toBe('0');
    expect(tailwind.getAttribute('tabindex')).toBe('-1');

    css.focus();
    await user.keyboard('{ArrowRight}');

    await screen.findByRole('tab', { name: 'Tailwind', selected: true });
    expect(tailwind.matches(':focus')).toBe(true);
    expect(tailwind.getAttribute('aria-selected')).toBe('true');
    expect(window.localStorage.getItem('foco-lang')).toBe('tw');

    await user.keyboard('{Home}');
    await screen.findByRole('tab', { name: 'CSS', selected: true });
    await user.keyboard('{End}');
    await screen.findByRole('tab', { name: 'Tailwind', selected: true });
  });

  it('styles code labels in mono and uses a filled theme tab list', () => {
    renderCodeExample(localizedExample(snippets.fv, 'es'));

    const tablist = screen.getByRole('tablist', { name: 'Lenguaje del ejemplo' });
    const css = within(tablist).getByRole('tab', { name: 'CSS' });
    const copy = screen.getByRole('button', { name: 'Copiar' });

    expect(tablist.getAttribute('data-variant')).toBe('default');
    expect(tablist.className).toContain('font-mono');
    expect(css.className).toContain('font-mono');
    expect(css.className).toContain('data-active:bg-code-fg/10');
    expect(copy.className).toContain('font-mono');
    expect(screen.getByTestId('code-example-block').className).toContain('rounded-sm');
  });

  it('keeps two rendered examples synchronized across islands', async () => {
    const user = userEvent.setup();
    renderCodeExample(
      <>
        {localizedExample(snippets.fv, 'es')}
        {localizedExample(snippets.shadcn, 'es')}
      </>
    );
    const tablists = screen.getAllByRole('tablist', { name: 'Lenguaje del ejemplo' });

    await user.click(within(tablists[1]!).getByRole('tab', { name: 'Tailwind' }));

    expect(
      within(tablists[0]!).getByRole('tab', { name: 'Tailwind' }).getAttribute('aria-selected')
    ).toBe('true');
    expect(window.localStorage.getItem('foco-lang')).toBe('tw');

    await user.click(within(tablists[0]!).getByRole('tab', { name: 'CSS' }));

    expect(
      within(tablists[1]!).getByRole('tab', { name: 'CSS' }).getAttribute('aria-selected')
    ).toBe('true');
    expect(window.localStorage.getItem('foco-lang')).toBe('css');
  });

  it('copies the active snippet and announces the localized success once', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    renderCodeExample(localizedExample(snippets.fv, 'es'));

    const copyButton = screen.getByRole('button', { name: 'Copiar' });
    expect(within(copyButton).getByText('Copiar').isConnected).toBe(true);
    await user.click(copyButton);

    expect(writeText).toHaveBeenCalledWith(snippets.fv.css);
    const copiedButton = await screen.findByRole('button', { name: 'Copiado' });
    expect(within(copiedButton).getByText('Copiado').isConnected).toBe(true);
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]!.textContent).toBe('Copiado');
  });

  it('selects the active code and announces the localized copy fallback', async () => {
    const user = userEvent.setup();
    setClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    renderCodeExample(localizedExample(snippets.fv, 'es'));
    const selectNodeContents = vi.spyOn(Range.prototype, 'selectNodeContents');

    const copyButton = screen.getByRole('button', { name: 'Copiar' });
    await user.click(copyButton);

    const fallbackButton = await screen.findByRole('button', { name: 'Selecciona y copia' });
    expect(within(fallbackButton).getByText('Selecciona y copia').isConnected).toBe(true);
    expect(selectNodeContents).toHaveBeenCalledOnce();
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]!.textContent).toBe('Selecciona y copia');
  });

  it('localizes copy feedback in English', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    renderCodeExample(
      localizedExample(snippets.shadcn, 'en', {
        copy: 'Copy',
        copied: 'Copied',
        selectAndCopy: 'Select and copy',
        language: 'Example language',
      })
    );

    const copyButton = screen.getByRole('button', { name: 'Copy' });
    await user.click(copyButton);

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('globals.css: adjust --ring'));
    const copiedButton = await screen.findByRole('button', { name: 'Copied' });
    expect(within(copiedButton).getByText('Copied').isConnected).toBe(true);
    expect(
      within(screen.getByRole('tabpanel', { name: 'CSS' })).getByTestId('code-example-content')
        .textContent
    ).toContain('globals.css: adjust --ring and add states');
    await user.click(screen.getByRole('tab', { name: 'Tailwind' }));
    const tailwindPanel = within(screen.getByRole('tabpanel', { name: 'Tailwind' })).getByTestId(
      'code-example-content'
    );
    expect(tailwindPanel.textContent).toContain('Component focus: opaque double ring');
    expect(tailwindPanel.textContent).toContain('Compliance states with the new tokens');
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]!.textContent).toBe('Copied');
  });

  it('announces the English copy fallback', async () => {
    const user = userEvent.setup();
    setClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    renderCodeExample(
      localizedExample(snippets.fv, 'en', {
        copy: 'Copy',
        copied: 'Copied',
        selectAndCopy: 'Select and copy',
        language: 'Example language',
      })
    );

    const copyButton = screen.getByRole('button', { name: 'Copy' });
    await user.click(copyButton);

    const fallbackButton = await screen.findByRole('button', { name: 'Select and copy' });
    expect(within(fallbackButton).getByText('Select and copy').isConnected).toBe(true);
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]!.textContent).toBe('Select and copy');
  });
});
