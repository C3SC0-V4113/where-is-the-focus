import { render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RichText } from '../../src/components/common/rich-text';

describe('RichText keyboard markers', () => {
  it('returns one inline span around marked text and its Kbd', () => {
    const view = renderToStaticMarkup(<RichText text="Before [[Tab]] after." />);

    expect(view).toMatch(
      /^<span>Before <kbd\b[^>]*data-slot="kbd"[^>]*>Tab<\/kbd> after\.<\/span>$/
    );

    const keyClassTokens = view.match(/<kbd\b[^>]*\bclass="([^"]*)"[^>]*>/)?.[1].split(/\s+/) ?? [];

    expect(keyClassTokens).toContain('inline');
    expect(keyClassTokens).not.toContain('inline-flex');
  });

  it('returns one inline span containing unchanged plain text', () => {
    expect(renderToStaticMarkup(<RichText text="Plain text only." />)).toBe(
      '<span>Plain text only.</span>'
    );
  });

  it('renders backtick-delimited text as inline code inside the root span', () => {
    expect(renderToStaticMarkup(<RichText text="Avoid `outline: none` here." />)).toBe(
      '<span>Avoid <code>outline: none</code> here.</span>'
    );
  });

  it('keeps inline code and keyboard markers in the same inline run', () => {
    const view = renderToStaticMarkup(<RichText text="Use `:focus-visible` with [[Tab]] now." />);

    expect(view).toMatch(
      /^<span>Use <code>:focus-visible<\/code> with <kbd\b[^>]*data-slot="kbd"[^>]*>Tab<\/kbd> now\.<\/span>$/
    );

    const keyClassTokens = view.match(/<kbd\b[^>]*\bclass="([^"]*)"[^>]*>/)?.[1].split(/\s+/) ?? [];

    expect(keyClassTokens).toContain('inline');
    expect(keyClassTokens).not.toContain('inline-flex');
  });

  it('leaves unmatched backticks as plain text', () => {
    expect(renderToStaticMarkup(<RichText text="Unmatched ` stays plain." />)).toBe(
      '<span>Unmatched ` stays plain.</span>'
    );
  });

  it('keeps plain text unchanged', () => {
    render(
      <p data-testid="plain-text">
        <RichText text="No keyboard markers here." />
      </p>
    );

    expect(screen.getByTestId('plain-text').textContent).toBe('No keyboard markers here.');
    expect(screen.queryByText('ArrowDown', { selector: 'kbd' })).toBeNull();
  });

  it('renders one marked key while preserving surrounding text', () => {
    render(
      <p data-testid="single-marker">
        <RichText text="Press [[Tab]] to move." />
      </p>
    );

    expect(
      within(screen.getByTestId('single-marker')).getByText('Tab', {
        selector: 'kbd[data-slot="kbd"]',
      }).textContent
    ).toBe('Tab');
    expect(screen.getByTestId('single-marker').textContent).toBe('Press Tab to move.');
  });

  it('renders every marked key', () => {
    render(
      <p data-testid="multiple-markers">
        <RichText text="Use [[ArrowLeft]] or [[Shift]]." />
      </p>
    );

    const keys = within(screen.getByTestId('multiple-markers')).getAllByText(
      /^(ArrowLeft|Shift)$/,
      { selector: 'kbd[data-slot="kbd"]' }
    );
    expect(keys).toHaveLength(2);
    expect(screen.getByTestId('multiple-markers').textContent).toBe('Use ArrowLeft or Shift.');
  });

  it('leaves unmatched brackets as plain text', () => {
    const text = 'Use [Tab], [[Enter], or Tab]].';
    render(
      <p data-testid="unmatched-markers">
        <RichText text={text} />
      </p>
    );

    expect(screen.getByTestId('unmatched-markers').textContent).toBe(text);
    expect(
      within(screen.getByTestId('unmatched-markers')).queryByText('Enter', { selector: 'kbd' })
    ).toBeNull();
  });
});
