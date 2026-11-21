import { describe, expect, it } from 'vitest';

import { getRingSnippet } from '@/lib/focus/ring-snippet';
import { getSnippetCode } from '@/lib/focus/snippets';

const input = { color: 'blue' as const, style: 'solid' as const, width: 3, offset: 3 };

describe('Lab 2 generated snippet', () => {
  it('generates the solid CSS outline and offset', () => {
    expect(getRingSnippet(input).css).toContain(
      'outline: 3px solid #1d2fd8;\n  outline-offset: 3px;'
    );
  });

  it('generates dashed Tailwind utilities', () => {
    expect(getRingSnippet({ ...input, style: 'dashed' }).tw).toContain(
      'focus-visible:outline-dashed'
    );
  });

  it('generates the double CSS ring with both artifact colors', () => {
    expect(getRingSnippet({ ...input, style: 'double' }).css).toContain(
      'box-shadow: 0 0 0 3px #fff,\n              0 0 0 6px #141414;'
    );
  });

  it('translates the specimen label in the English snippet', () => {
    expect(getSnippetCode(getRingSnippet(input), 'tw', 'en')).toContain('Save changes');
  });
});
