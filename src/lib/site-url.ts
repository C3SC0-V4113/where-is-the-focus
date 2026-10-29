export function normalizeSiteUrl(value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error('SITE_URL is required for production builds. Set it to an HTTPS origin.');
  }

  if (value.includes('?') || value.includes('#')) {
    throw new Error('SITE_URL must not include a query or fragment.');
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('SITE_URL must be a valid HTTPS origin.');
  }

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search !== '' ||
    url.hash !== '' ||
    url.pathname !== '/'
  ) {
    throw new Error(
      'SITE_URL must be an HTTPS origin without credentials, path, query, or fragment.'
    );
  }

  return url.origin;
}
