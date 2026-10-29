import { describe, expect, it } from 'vitest';

import { normalizeSiteUrl } from '../../src/lib/site-url';

describe('normalizeSiteUrl', () => {
  it.each([
    undefined,
    '',
    '   ',
    'not a url',
    'http://a.example',
    'https://a.example/blog',
    'https://a.example?q',
    'https://a.example?',
    'https://a.example#f',
    'https://a.example#',
    'https://user@a.example',
    'https://user:pass@a.example',
  ])('rejects %s', (value) => {
    expect(() => normalizeSiteUrl(value)).toThrow();
  });

  it.each([
    ['https://a.example', 'https://a.example'],
    ['https://a.example/', 'https://a.example'],
    ['https://a.example:8443', 'https://a.example:8443'],
  ])('normalizes %s to %s', (value, expected) => {
    expect(normalizeSiteUrl(value)).toBe(expected);
  });
});
