import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const headersFile = readFileSync(resolve('public/_headers'), 'utf8');

function parseHeaders(source: string) {
  const rules = new Map<string, Map<string, string>>();
  let currentRule: Map<string, string> | undefined;

  for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;

    if (!/^\s/.test(line)) {
      if (rules.has(line)) throw new Error(`Duplicate rule: ${line}`);
      currentRule = new Map();
      rules.set(line, currentRule);
      continue;
    }

    if (!currentRule) throw new Error('Header without a rule');
    const match = line.trim().match(/^([^:]+):\s*(.*)$/);
    if (!match) throw new Error(`Invalid header line: ${line}`);
    const [, name, value] = match;
    const normalizedName = name.toLowerCase();
    if (currentRule.has(normalizedName)) throw new Error(`Duplicate header: ${name}`);
    currentRule.set(normalizedName, value);
  }

  return rules;
}

describe('Cloudflare static security headers', () => {
  it('has no duplicate rules or headers and stays within Cloudflare limits', () => {
    expect(() => parseHeaders(headersFile)).not.toThrow();
    expect(headersFile.split(/\r?\n/).every((line) => line.length <= 2000)).toBe(true);
    expect(parseHeaders(headersFile).size).toBeLessThanOrEqual(100);
  });

  it('applies exactly the planned security headers to every asset', () => {
    const rules = parseHeaders(headersFile);
    expect([...rules.keys()]).toEqual(['/*']);
    expect(Object.fromEntries(rules.get('/*') ?? [])).toEqual({
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-resource-policy': 'same-origin',
      'cross-origin-embedder-policy': 'require-corp',
      'permissions-policy':
        'accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), usb=()',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'strict-transport-security': 'max-age=31536000',
      'x-content-type-options': 'nosniff',
      'x-xss-protection': '0',
      'x-frame-options': 'DENY',
      'content-security-policy': "frame-ancestors 'none'; base-uri 'none'; object-src 'none'",
    });
  });
});
