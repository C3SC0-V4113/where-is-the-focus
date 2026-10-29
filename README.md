# Where is the focus

An accessible, bilingual reference for keyboard focus indicators. Spanish is the default language at `/`; English is available at `/en/`.

## Public site URL

`SITE_URL` is a build-time value used for canonical URLs, language alternates, the sitemap, and the robots file. It is required for `astro build` and must be an HTTPS origin without a path, query, fragment, or credentials. The build normalizes an optional trailing slash to the origin. Changing it requires rebuilding the site.

For local builds, copy `.env.example` to `.env` and set `SITE_URL` to the intended HTTPS origin. The value is optional while running `astro dev`, `astro check`, `astro sync`, or `astro preview`; without it, absolute URL metadata is omitted, the sitemap endpoint returns 404, and robots.txt omits its sitemap line. CI and Cloudflare should provide `SITE_URL` as a build environment variable before running the build. No production domain is configured in this repository.

## Development

```sh
pnpm install
pnpm run dev
```

## Quality checks

```sh
pnpm run lint
pnpm run typecheck
pnpm run format:check
pnpm run test
pnpm run test:e2e
pnpm run doctor
pnpm run check
```

E2E tests build and preview the site using a reserved `.example` hostname.
