import type { APIRoute } from 'astro';

const sitemapNamespace = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const xhtmlNamespace = 'http://www.w3.org/1999/xhtml';

export const GET: APIRoute = ({ site }) => {
  if (!site) return new Response('Not found', { status: 404 });

  const urls = [new URL('/', site).href, new URL('/en/', site).href];
  const alternatives = [
    `<xhtml:link rel="alternate" hreflang="es" href="${urls[0]}" />`,
    `<xhtml:link rel="alternate" hreflang="en" href="${urls[1]}" />`,
    `<xhtml:link rel="alternate" hreflang="x-default" href="${urls[0]}" />`,
  ].join('');
  const body = urls.map((url) => `<url><loc>${url}</loc>${alternatives}</url>`).join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="${sitemapNamespace}" xmlns:xhtml="${xhtmlNamespace}">${body}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
};
