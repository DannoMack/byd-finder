# BYD Finder

Independent BYD Canada news aggregator, review hub, and launch tracker.

**Live:** https://bydfinder.com

## Stack

- [Astro 6](https://astro.build) with content collections
- [Tailwind CSS 4](https://tailwindcss.com) for styling
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com/)
- Newsletter backed by Cloudflare KV (`SUBSCRIBERS` binding)
- Nightly news scraper via GitHub Actions cron

## Local dev

```bash
npm install
npm run dev
```

Dev server: http://localhost:4321

## Scraping news

```bash
npx tsx scripts/scrape-news.ts --dry-run   # preview
npx tsx scripts/scrape-news.ts             # write markdown
```

Pulls RSS from Electrek, InsideEVs, Driving.ca, Drive Tesla — filters for BYD mentions, writes new items to `src/content/news/` deduplicated by URL. Runs nightly at 06:00 UTC via `.github/workflows/scrape-news.yml`.

## Content model

- `src/content/news/` — aggregated news (managed by scraper)
- `src/content/reviews/` — hand-curated YouTube reviews
- `src/content/models/` — BYD model spec pages

Schemas: `src/content.config.ts`

## Deploy

Auto-deploys on push to `main` via Cloudflare Pages. Custom domains (bydfinder.com canonical; bydfinder.ca and bydfinder.org 301 to canonical) are configured in the Cloudflare dashboard.

## Environment variables

- `PUBLIC_ADSENSE_CLIENT` (optional) — AdSense publisher ID, enables ad units when set.

## License

Not affiliated with BYD. All trademarks are property of their respective owners.
