import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ComplianceBadge } from '../../src/components/common/compliance-badge';

const states = [
  {
    state: 'ok',
    label: 'Cumple',
    glyph: '✓',
    classes: ['bg-success-muted', 'text-success-text'],
  },
  {
    state: 'warn',
    label: 'Parcial',
    glyph: '◐',
    classes: ['bg-warning-muted', 'text-warning-text'],
  },
  {
    state: 'bad',
    label: 'No cumple',
    glyph: '✕',
    classes: ['bg-destructive-muted', 'text-destructive-text'],
  },
] as const;

describe('ComplianceBadge', () => {
  it.each(states)('renders the $state state with its decorative glyph and tokens', (state) => {
    render(<ComplianceBadge state={state.state}>{state.label}</ComplianceBadge>);

    const badge = screen.getByText(state.label, { selector: '[data-slot="badge"]' });
    const glyph = screen.getByText(state.glyph, { selector: '[aria-hidden="true"]' });
    const classTokens = badge.className.split(/\s+/);

    expect(badge.getAttribute('data-slot')).toBe('badge');
    expect(badge.textContent).toBe(`${state.glyph}${state.label}`);
    expect(glyph.getAttribute('aria-hidden')).toBe('true');
    expect(classTokens).toContain(state.classes[0]);
    expect(classTokens).toContain(state.classes[1]);
    expect(classTokens).toContain('uppercase');
  });
});
