// Canonical-host redirect middleware for Cloudflare Pages.
// Anything hitting .ca, .org, www., or the .pages.dev subdomain gets 301'd
// to the equivalent path on bydfinder.com.

const CANONICAL_HOST = 'bydfinder.com';

const HOSTS_TO_REDIRECT = new Set([
  'bydfinder.ca',
  'www.bydfinder.ca',
  'bydfinder.org',
  'www.bydfinder.org',
  'www.bydfinder.com',
  'canadaevfinder.ca',
  'www.canadaevfinder.ca',
]);

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const host = url.host.toLowerCase();

  if (HOSTS_TO_REDIRECT.has(host)) {
    const target = `https://${CANONICAL_HOST}${url.pathname}${url.search}`;
    return Response.redirect(target, 301);
  }

  return context.next();
};
