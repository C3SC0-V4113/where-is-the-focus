import { render, screen } from '@testing-library/react';
import { cn } from 'cn';
import { describe, expect, it } from 'vitest';

import { Button, buttonVariants } from '../../src/components/ui/button';

const variants = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const;

describe('Button focus ring classes', () => {
  it.each(variants)('keeps the global focus ring for the %s variant', (variant) => {
    const label = `Action ${variant}`;
    render(<Button variant={variant}>{label}</Button>);
    const button = screen.getByRole('button', { name: label });
    const classes = button.className.split(/\s+/);

    expect(classes).not.toContain('outline-none');
    expect(classes.some((className) => className.startsWith('focus-visible:ring-'))).toBe(false);
    expect(button.className).toBe(cn(buttonVariants({ variant })));
  });
});
