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
- `src/content/comparisons/` — BYD-vs-competitor landing pages
- `src/data/provincial-assumptions.json` — static Canadian utility / gas assumptions for comparison content

Schemas: `src/content.config.ts`

## Deploy

Auto-deploys on push to `main` via Cloudflare Pages. Custom domains (bydfinder.com canonical; bydfinder.ca and bydfinder.org 301 to canonical) are configured in the Cloudflare dashboard.

## Environment variables

- `PUBLIC_ADSENSE_CLIENT` (optional) — AdSense publisher ID, enables ad units when set.
- `GEMINI_API_KEY` (optional, preferred) — enables Gemini-written "What this means for Canada" blurbs during news scraping.
- `GEMINI_MODEL` (optional) — override the Gemini model used by the scraper blurb helper. Defaults to `gemini-2.5-flash`, which is on the Gemini Developer API free tier.
- `OPENAI_API_KEY` (optional, fallback) — enables OpenAI-written blurbs when `GEMINI_API_KEY` is not set.
- `OPENAI_MODEL` (optional) — override the OpenAI model used by the scraper blurb helper.

Blurb selection precedence during scraping:

- Gemini via `GEMINI_API_KEY`
- OpenAI via `OPENAI_API_KEY`
- Deterministic template fallback when both keys are missing, the configured provider errors, or the model returns no usable blurb

For this scraper volume, Gemini's no-card free tier is sufficient for the nightly run. To use Gemini in the scheduled GitHub Actions scrape, add `GEMINI_API_KEY` to the repository's Actions secrets in GitHub settings. The workflow also passes through `OPENAI_API_KEY` if you want the OpenAI fallback path available in environments where Gemini is not configured.

## License

Not affiliated with BYD. All trademarks are property of their respective owners.
