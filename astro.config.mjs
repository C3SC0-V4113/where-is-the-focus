// @ts-check

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import { normalizeSiteUrl } from './src/lib/site-url.ts';

/** @type {import('astro').AstroIntegration} */
const siteUrlIntegration = {
  name: 'site-url',
  hooks: {
    'astro:config:setup': ({ command, updateConfig }) => {
      if (command !== 'build') return;

      const env = loadEnv('production', process.cwd(), '');
      updateConfig({ site: normalizeSiteUrl(env.SITE_URL) });
    },
  },
};

export default defineConfig({
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react(), siteUrlIntegration],
});
