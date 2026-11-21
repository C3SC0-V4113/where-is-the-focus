import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LabRing } from '@/components/focus/labs/lab-ring';

vi.mock('@/components/common/code-example', () => ({ CodeExample: () => null }));

describe('LabRing radio labels', () => {
  it.each([
    { locale: 'es' as const, group: 'Estilo', label: 'Sólido' },
    { locale: 'en' as const, group: 'Style', label: 'Solid' },
  ])('shows the $label radio with a visible name', ({ locale, group, label }) => {
    render(<LabRing locale={locale} />);
    const radio = within(screen.getByRole('radiogroup', { name: group })).getByRole('radio', {
      name: label,
    });
    expect(radio).toBeDefined();
    expect(within(screen.getByRole('radiogroup', { name: group })).getByText(label)).toBeDefined();
  });
});
