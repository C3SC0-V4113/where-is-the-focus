import { describe, expect, it } from 'vitest';

import { getRingVerdict } from '@/lib/focus/ring-verdict';

const input = {
  color: 'blue' as const,
  background: 'light' as const,
  style: 'solid' as const,
  width: 3,
};

describe('Lab 2 verdict', () => {
  it('passes blue on light with the calculated contrast', () => {
    expect(getRingVerdict(input)[0]).toEqual({
      kind: 'contrast',
      state: 'ok',
      minimum: 7.546647976648694,
      maximum: 7.546647976648694,
    });
  });

  it('fails blue on brand', () => {
    const rows = getRingVerdict({ ...input, background: 'brand' });
    expect(rows[0]?.state).toBe('bad');
  });

  it('warns for white on photo with calculated endpoints', () => {
    const rows = getRingVerdict({ ...input, color: 'white', background: 'photo' });
    expect(rows[0]).toEqual({
      kind: 'contrast',
      state: 'warn',
      minimum: 1.1719601541450138,
      maximum: 12.594324364035867,
    });
  });

  it('uses the better of both double-ring colors per photo sample', () => {
    const row = getRingVerdict({ ...input, style: 'double', background: 'photo' }).find(
      (entry) => entry.kind === 'contrast'
    );
    expect(row?.minimum).toBeCloseTo(7.032304258110388, 8);
  });

  it('warns below two pixels', () => {
    const row = getRingVerdict({ ...input, width: 1 })[1]!;
    expect(row).toEqual({ kind: 'width', state: 'warn', value: 1 });
  });

  it('warns for dashed outlines on a photo', () => {
    const row = getRingVerdict({ ...input, style: 'dashed', background: 'photo' })[2]!;
    expect(row).toEqual({ kind: 'style', state: 'warn', style: 'dashed' });
  });

  it('passes dotted outlines on a flat background', () => {
    const row = getRingVerdict({ ...input, style: 'dotted' })[2]!;
    expect(row).toEqual({ kind: 'style', state: 'ok', style: 'dotted' });
  });
});
