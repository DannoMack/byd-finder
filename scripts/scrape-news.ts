#!/usr/bin/env tsx
/**
 * BYD Finder news scraper.
 *
 * Pulls RSS feeds from configured sources, filters for BYD-related items,
 * writes new items as markdown files to src/content/news/, deduplicating
 * by URL/GUID. Designed to run nightly via GitHub Actions.
 *
 * Usage:
 *   npx tsx scripts/scrape-news.ts
 *   npx tsx scripts/scrape-news.ts --dry-run
 */

import Parser from 'rss-parser';
import { writeFile, readdir, readFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(REPO_ROOT, 'src', 'content', 'news');
const DRY_RUN = process.argv.includes('--dry-run');

interface Source {
  name: string;
  url: string;
  // Only keep items whose title OR content matches this pattern
  filter: RegExp;
}

const SOURCES: Source[] = [
  {
    name: 'Electrek',
    url: 'https://electrek.co/guides/byd/feed/',
    filter: /byd/i,
  },
  {
    name: 'InsideEVs',
    url: 'https://insideevs.com/rss/',
    filter: /\bbyd\b/i,
  },
  {
    name: 'Driving.ca',
    url: 'https://driving.ca/feed',
    filter: /\bbyd\b/i,
  },
  {
    name: 'Drive Tesla',
    url: 'https://driveteslacanada.ca/feed/',
    filter: /\bbyd\b/i,
  },
];

// Canada-relevance boost: items matching this get country: "ca"
const CA_RELEVANCE = /\b(canada|canadian|toronto|vancouver|montreal|calgary|ottawa|quebec|ontario|alberta)\b/i;

const parser = new Parser({
  timeout: 20000,
  headers: { 'User-Agent': 'BYDFinder/1.0 (+https://bydfinder.com)' },
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function cleanText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function yamlEscape(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, ' ').trim();
}

async function loadExistingUrls(): Promise<Set<string>> {
  if (!existsSync(OUTPUT_DIR)) return new Set();
  const files = await readdir(OUTPUT_DIR);
  const urls = new Set<string>();
  for (const f of files) {
    if (!f.endsWith('.md')) continue;
    const content = await readFile(join(OUTPUT_DIR, f), 'utf8');
    const match = content.match(/sourceUrl:\s*"?([^"\n]+)"?/);
    if (match) urls.add(match[1].trim());
  }
  return urls;
}

function extractImage(item: Parser.Item): string | undefined {
  const enclosure = (item as unknown as { enclosure?: { url?: string; type?: string } }).enclosure;
  if (enclosure?.url && enclosure.type?.startsWith('image/')) return enclosure.url;
  const mediaContent = (item as unknown as { 'media:content'?: { $?: { url?: string } } })['media:content'];
  if (mediaContent?.$?.url) return mediaContent.$.url;
  const content = item['content:encoded'] || item.content || '';
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
  return imgMatch?.[1];
}

async function main() {
  console.log(`[scraper] starting (dry-run=${DRY_RUN})`);
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const existing = await loadExistingUrls();
  console.log(`[scraper] existing items: ${existing.size}`);

  let newCount = 0;
  for (const source of SOURCES) {
    try {
      console.log(`[scraper] fetching ${source.name}...`);
      const feed = await parser.parseURL(source.url);
      for (const item of feed.items) {
        const url = item.link || item.guid || '';
        if (!url || existing.has(url)) continue;

        const title = (item.title || '').trim();
        const content = cleanText(String(item.contentSnippet || item.content || item['content:encoded'] || ''));
        const haystack = `${title} ${content}`;
        if (!source.filter.test(haystack)) continue;

        const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();
        const date = new Date(publishedAt);
        if (isNaN(date.getTime())) continue;

        // Skip items older than 90 days
        const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
        if (date.getTime() < ninetyDaysAgo) continue;

        const isCanadian = CA_RELEVANCE.test(haystack);
        const summary = content.slice(0, 280).trim() + (content.length > 280 ? '…' : '');
        const image = extractImage(item);
        const dateStr = date.toISOString().slice(0, 10);
        const filename = `${dateStr}-${slugify(title)}.md`;

        const frontmatter = [
          '---',
          `title: "${yamlEscape(title)}"`,
          `summary: "${yamlEscape(summary)}"`,
          `source: "${yamlEscape(source.name)}"`,
          `sourceUrl: "${url}"`,
          item.creator ? `author: "${yamlEscape(item.creator)}"` : null,
          `publishedAt: ${date.toISOString()}`,
          image ? `image: "${image}"` : null,
          `country: "${isCanadian ? 'ca' : 'global'}"`,
          '---',
          '',
          content.slice(0, 1200),
          '',
          `[Read the full article at ${source.name}](${url})`,
          '',
        ]
          .filter((l) => l !== null)
          .join('\n');

        if (DRY_RUN) {
          console.log(`[dry-run] would write: ${filename}`);
          console.log(`          title: ${title}`);
          console.log(`          canada: ${isCanadian}`);
        } else {
          await writeFile(join(OUTPUT_DIR, filename), frontmatter, 'utf8');
          console.log(`[scraper] wrote: ${filename}`);
        }
        existing.add(url);
        newCount++;
      }
    } catch (err) {
      console.error(`[scraper] ERROR fetching ${source.name}:`, (err as Error).message);
    }
  }

  console.log(`[scraper] done. new items: ${newCount}`);
}

main().catch((err) => {
  console.error('[scraper] fatal:', err);
  process.exit(1);
});
