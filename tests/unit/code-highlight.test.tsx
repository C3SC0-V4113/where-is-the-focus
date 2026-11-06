import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CodeHighlight } from '@/components/common/code-highlight';

describe('CodeHighlight', () => {
  it('marks comments and focus-related terms with semantic color tokens', () => {
    render(
      <CodeHighlight
        code={`/* comentario */
:focus-visible { outline-hidden; scroll-padding-top: 1rem; scroll-pt-4; forced-colors: active; }`}
      />
    );

    expect(screen.getByText('/* comentario */').className).toContain('text-code-dim');
    expect(screen.getByText(':focus-visible').className).toContain('text-code-hi');
    expect(screen.getByText('outline-hidden').className).toContain('text-code-hi');
    expect(screen.getByText('scroll-padding-top').className).toContain('text-code-hi');
    expect(screen.getByText('scroll-pt-4').className).toContain('text-code-hi');
    expect(screen.getByText('forced-colors:').className).toContain('text-code-hi');
  });

  it('keeps HTML comments and source text as literal React text', () => {
    render(<CodeHighlight code="<!-- comentario -->" />);

    expect(screen.getByText('<!-- comentario -->').className).toContain('text-code-dim');
    render(<CodeHighlight code={'<button title="literal">'} />);
    expect(screen.getByText('<button title="literal">').textContent).toBe(
      '<button title="literal">'
    );
  });
});
