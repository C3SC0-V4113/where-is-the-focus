import { expect, test } from '@playwright/test';

const wranglerOrigin = 'http://127.0.0.1:8787';
const expectedHeaders = {
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
};

test.use({ baseURL: wranglerOrigin });

test('Wrangler applies every planned security header to HTML, XML, and CSS assets', async ({
  request,
  page,
}) => {
  const homeResponse = await request.get('/');
  expect(homeResponse.status()).toBe(200);
  const stylesheetHref = await homeResponse.text().then((html) => {
    const match = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/);
    if (!match) throw new Error('The rendered home page has no stylesheet link');
    return match[1];
  });
  const stylesheetPath = new URL(stylesheetHref, wranglerOrigin).pathname;
  const assets = ['/', '/en/', '/sitemap.xml', stylesheetPath];

  for (const asset of assets) {
    const response = await request.get(asset);
    expect(response.status(), `${asset} should be served successfully`).toBe(200);
    const headers = response.headers();
    for (const [name, value] of Object.entries(expectedHeaders)) {
      expect(headers[name], `${name} on ${asset}`).toBe(value);
    }
  }

  const crossOriginErrors: string[] = [];
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      /\bCOEP\b|\bCORP\b|Cross-Origin-Embedder-Policy|Cross-Origin-Resource-Policy/i.test(
        message.text()
      )
    ) {
      crossOriginErrors.push(message.text());
    }
  });

  for (const path of ['/', '/en/']) {
    await page.goto(path);
  }

  expect(crossOriginErrors).toEqual([]);
});
