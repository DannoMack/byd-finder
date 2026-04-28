const LIVE_MODEL_SLUGS = new Set(['atto-3', 'dolphin', 'seal', 'sealion-7']);
const LIVE_COMPARISON_SLUGS = new Set([
  'seal-vs-model-3-canada',
  'atto-3-vs-niro-ev-canada',
  'dolphin-vs-leaf-canada',
]);

export const BLURB_SYSTEM_PROMPT = `You write concise BYD Canada editorial blurbs.

Rules:
- 2-3 plain sentences. No markdown. No hype. No throat-clearing openers ("In a world where...", "Here's what...", "It's worth noting...").
- No adverbs. No em-dashes. No "not X but Y" contrasts.
- Use active voice. Every sentence has a human or concrete subject doing something specific. Avoid inanimate-thing-doing-human-verb patterns like "the decision emerges" or "the conversation becomes."
- Be specific: name actual models, prices, provinces, dates. No vague declaratives like "the implications are significant" or "this matters."
- Vary sentence length within the 2-3 sentences. Don't write three same-length sentences.
- Trust the reader. State facts directly. No softening, justifying, or hand-holding.
- No quotable summary lines. If a sentence sounds like a pull-quote, rewrite it.

Examples:
Before: "This matters in Canada because BYD's local launch depends on pricing discipline, dealer rollout, and policy timing."
After: "BYD has 20 Canadian dealers signed and no pricing. Watch the Q2 announcement. Ontario Tesla Model 3 shoppers will compare both cars that week."

Before: "Here's what Canadian buyers should know: the implications are significant."
After: "Transport Canada has not published a compliance filing for the Seal. Quebec buyers cannot count on Roulez vert eligibility until BYD prices the car under the cap."`;

export type EntityKind = 'byd-model' | 'competitor' | 'location' | 'policy';

export interface EntityTag {
  label: string;
  slug: string;
  kind: EntityKind;
}

export interface InternalLinkSuggestion {
  label: string;
  href: string;
  slug: string;
  kind: 'model' | 'comparison' | 'location' | 'policy' | 'calculator';
  live: boolean;
}

export interface ComparisonPrompt {
  bydModel: string;
  competitor: string;
  slug: string;
  href: string;
  title: string;
  live: boolean;
}

export interface NewsEnrichment {
  entityTags: EntityTag[];
  internalLinks: InternalLinkSuggestion[];
  comparisonPrompts: ComparisonPrompt[];
  canadaBlurb: string;
}

interface EntityDefinition {
  label: string;
  slug: string;
  patterns: RegExp[];
  href?: string;
}

const BYD_MODELS: EntityDefinition[] = [
  { label: 'Seal', slug: 'seal', patterns: [/\bbyd seal\b/i, /\bseal\b/i], href: '/ca/models/seal' },
  { label: 'Atto 3', slug: 'atto-3', patterns: [/\batto\s*3\b/i, /\byuan plus\b/i], href: '/ca/models/atto-3' },
  { label: 'Dolphin', slug: 'dolphin', patterns: [/\bbyd dolphin\b/i, /\bdolphin\b/i], href: '/ca/models/dolphin' },
  { label: 'Sealion 7', slug: 'sealion-7', patterns: [/\bsealion\s*7\b/i], href: '/ca/models/sealion-7' },
  { label: 'Han', slug: 'han', patterns: [/\bbyd han\b/i, /\bhan ev\b/i] },
  { label: 'Tang', slug: 'tang', patterns: [/\bbyd tang\b/i, /\btang\b/i] },
];

const COMPETITORS: EntityDefinition[] = [
  { label: 'Tesla Model 3', slug: 'model-3', patterns: [/\btesla model 3\b/i, /\bmodel 3\b/i] },
  { label: 'Tesla Model Y', slug: 'model-y', patterns: [/\btesla model y\b/i, /\bmodel y\b/i] },
  { label: 'Hyundai Ioniq 5', slug: 'ioniq-5', patterns: [/\bhyundai ioniq 5\b/i, /\bioniq 5\b/i] },
  { label: 'Hyundai Ioniq 6', slug: 'ioniq-6', patterns: [/\bhyundai ioniq 6\b/i, /\bioniq 6\b/i] },
  { label: 'Kia EV6', slug: 'ev6', patterns: [/\bkia ev6\b/i, /\bev6\b/i] },
  { label: 'Polestar 2', slug: 'polestar-2', patterns: [/\bpolestar 2\b/i] },
  { label: 'Kia Niro EV', slug: 'niro-ev', patterns: [/\bkia niro ev\b/i, /\bniro ev\b/i] },
  { label: 'Nissan Leaf', slug: 'leaf', patterns: [/\bnissan leaf\b/i, /\bleaf\b/i] },
  { label: 'Hyundai Kona Electric', slug: 'kona-electric', patterns: [/\bhyundai kona electric\b/i, /\bkona electric\b/i] },
  { label: 'Ford Mustang Mach-E', slug: 'mustang-mach-e', patterns: [/\bmustang mach-e\b/i, /\bford mustang mach-e\b/i] },
];

const LOCATIONS: EntityDefinition[] = [
  { label: 'Ontario', slug: 'ontario', patterns: [/\bontario\b/i], href: '/ca/dealers' },
  { label: 'Quebec', slug: 'quebec', patterns: [/\bquebec\b/i, /\bquébec\b/i], href: '/ca/dealers' },
  { label: 'British Columbia', slug: 'british-columbia', patterns: [/\bbritish columbia\b/i, /\bbc\b/i], href: '/ca/dealers' },
  { label: 'Alberta', slug: 'alberta', patterns: [/\balberta\b/i], href: '/ca/dealers' },
  { label: 'Toronto', slug: 'toronto', patterns: [/\btoronto\b/i], href: '/ca/dealers' },
  { label: 'Vancouver', slug: 'vancouver', patterns: [/\bvancouver\b/i], href: '/ca/dealers' },
  { label: 'Montreal', slug: 'montreal', patterns: [/\bmontreal\b/i, /\bmontréal\b/i], href: '/ca/dealers' },
  { label: 'Calgary', slug: 'calgary', patterns: [/\bcalgary\b/i], href: '/ca/dealers' },
  { label: 'Ottawa', slug: 'ottawa', patterns: [/\bottawa\b/i], href: '/ca/dealers' },
  { label: 'Markham', slug: 'markham', patterns: [/\bmarkham\b/i], href: '/ca/dealers' },
];

const POLICIES: EntityDefinition[] = [
  { label: 'Transport Canada', slug: 'transport-canada', patterns: [/\btransport canada\b/i], href: '/ca/faq' },
  { label: 'iZEV rebate', slug: 'izev-rebate', patterns: [/\bizev\b/i, /\bfederal ev rebate\b/i, /\bev rebate\b/i], href: '/ca/faq' },
  { label: 'Quebec Roulez vert', slug: 'roulez-vert', patterns: [/\broulez vert\b/i], href: '/ca/faq' },
  { label: 'BC Go Electric', slug: 'bc-go-electric', patterns: [/\bgo electric\b/i], href: '/ca/faq' },
  { label: 'ZEV mandate', slug: 'zev-mandate', patterns: [/\bzev mandate\b/i, /\bzero-emission vehicle mandate\b/i], href: '/ca/faq' },
  { label: 'Import tariff', slug: 'import-tariff', patterns: [/\btariff\b/i, /\bimport dut(y|ies)\b/i], href: '/ca/faq' },
];

function extractEntities(text: string, definitions: EntityDefinition[], kind: EntityKind): EntityTag[] {
  const found = new Map<string, EntityTag>();
  for (const definition of definitions) {
    if (definition.patterns.some((pattern) => pattern.test(text))) {
      found.set(definition.slug, {
        label: definition.label,
        slug: definition.slug,
        kind,
      });
    }
  }
  return [...found.values()];
}

function dedupeLinks(links: InternalLinkSuggestion[]): InternalLinkSuggestion[] {
  const deduped = new Map<string, InternalLinkSuggestion>();
  for (const link of links) {
    deduped.set(`${link.kind}:${link.label}:${link.slug}`, link);
  }
  return [...deduped.values()];
}

function normalizeBlurb(blurb: string): string {
  return blurb.replace(/\s+/g, ' ').trim().replace(/^"|"$/g, '');
}

function normalizeGeneratedBlurb(blurb: string | null | undefined): string | null {
  if (!blurb) return null;

  const normalized = normalizeBlurb(blurb);
  if (!normalized) return null;

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.length >= 2 && sentences.length <= 3 ? normalized : null;
}

function buildFallbackBlurb(title: string, content: string, enrichment: Omit<NewsEnrichment, 'canadaBlurb'>): string {
  const bydModels = enrichment.entityTags.filter((tag) => tag.kind === 'byd-model').map((tag) => tag.label);
  const competitors = enrichment.entityTags.filter((tag) => tag.kind === 'competitor').map((tag) => tag.label);
  const locations = enrichment.entityTags.filter((tag) => tag.kind === 'location').map((tag) => tag.label);
  const policies = enrichment.entityTags.filter((tag) => tag.kind === 'policy').map((tag) => tag.label);

  const lead = locations.length > 0
    ? `This matters in Canada because it directly touches ${locations.slice(0, 2).join(' and ')} buyers and dealers.`
    : policies.length > 0
      ? `This matters in Canada because ${policies[0]} can change pricing, availability, or launch timing here.`
      : `This matters in Canada because BYD's local launch still depends on pricing discipline, dealer rollout, and policy timing.`;

  let follow = 'Watch for how quickly BYD turns global headlines into Canadian trim, price, and delivery details.';
  if (bydModels.length > 0 && competitors.length > 0) {
    follow = `${bydModels[0]} shoppers should compare it directly with ${competitors[0]} once Canadian pricing lands.`;
  } else if (bydModels.length > 0) {
    follow = `${bydModels[0]} is one of the clearest signals for how aggressive BYD plans to be in Canada.`;
  } else if (competitors.length > 0) {
    follow = `Canadian buyers cross-shopping ${competitors[0]} should watch whether BYD undercuts it on price or ownership cost.`;
  }

  const closer = /dealer|retail|delivery|launch|import|tariff|rebate/i.test(`${title} ${content}`)
    ? 'The practical question is not whether BYD can build it, but how fast Canada gets dealers, approvals, and inventory.'
    : 'For Canadian buyers, the useful signal is whether this changes wait times, rebate eligibility, or winter ownership math.';

  return [lead, follow, closer].join(' ');
}

async function generateCanadaBlurbWithOpenAI(
  title: string,
  summary: string,
  content: string,
  enrichment: Omit<NewsEnrichment, 'canadaBlurb'>,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: BLURB_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: JSON.stringify({
            task: 'Write a "What this means for Canada" blurb for this BYD news item.',
            title,
            summary,
            excerpt: content.slice(0, 900),
            entityTags: enrichment.entityTags,
            comparisonPrompts: enrichment.comparisonPrompts,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const message = data.choices?.[0]?.message?.content;
  return normalizeGeneratedBlurb(message);
}

async function generateCanadaBlurbWithGemini(
  title: string,
  summary: string,
  content: string,
  enrichment: Omit<NewsEnrichment, 'canadaBlurb'>,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: BLURB_SYSTEM_PROMPT,
            },
          ],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: JSON.stringify({
                  task: 'Write a "What this means for Canada" blurb for this BYD news item.',
                  title,
                  summary,
                  excerpt: content.slice(0, 900),
                  entityTags: enrichment.entityTags,
                  comparisonPrompts: enrichment.comparisonPrompts,
                }),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string | null }>;
      };
    }>;
  };
  const message = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim();

  return normalizeGeneratedBlurb(message);
}

export async function enrichNewsItem(title: string, summary: string, content: string): Promise<NewsEnrichment> {
  const haystack = `${title}\n${summary}\n${content}`;
  const entityTags = [
    ...extractEntities(haystack, BYD_MODELS, 'byd-model'),
    ...extractEntities(haystack, COMPETITORS, 'competitor'),
    ...extractEntities(haystack, LOCATIONS, 'location'),
    ...extractEntities(haystack, POLICIES, 'policy'),
  ].sort((a, b) => a.label.localeCompare(b.label));

  const bydModels = entityTags.filter((tag) => tag.kind === 'byd-model');
  const competitors = entityTags.filter((tag) => tag.kind === 'competitor');

  const comparisonPrompts: ComparisonPrompt[] = [];
  for (const bydModel of bydModels) {
    for (const competitor of competitors) {
      const slug = `${bydModel.slug}-vs-${competitor.slug}-canada`;
      comparisonPrompts.push({
        bydModel: bydModel.label,
        competitor: competitor.label,
        slug,
        href: `/ca/comparisons/${slug}`,
        title: `${bydModel.label} vs ${competitor.label} in Canada`,
        live: LIVE_COMPARISON_SLUGS.has(slug),
      });
    }
  }

  const internalLinks = dedupeLinks([
    ...entityTags.flatMap((tag): InternalLinkSuggestion[] => {
      if (tag.kind === 'byd-model') {
        return [{
          label: tag.label,
          href: `/ca/models/${tag.slug}`,
          slug: tag.slug,
          kind: 'model',
          live: LIVE_MODEL_SLUGS.has(tag.slug),
        }];
      }
      if (tag.kind === 'competitor') {
        const liveComparison = comparisonPrompts.find((prompt) => prompt.competitor === tag.label && prompt.live);
        if (liveComparison) {
          return [{
            label: tag.label,
            href: liveComparison.href,
            slug: liveComparison.slug,
            kind: 'comparison',
            live: true,
          }];
        }
        return [{
          label: tag.label,
          href: '/ca/calculators/tco',
          slug: 'tco-calculator',
          kind: 'calculator',
          live: true,
        }];
      }
      if (tag.kind === 'location') {
        return [{
          label: tag.label,
          href: '/ca/dealers',
          slug: 'dealers',
          kind: 'location',
          live: true,
        }];
      }
      return [{
        label: tag.label,
        href: '/ca/faq',
        slug: 'faq',
        kind: 'policy',
        live: true,
      }];
    }),
  ]);

  const baseEnrichment = {
    entityTags,
    internalLinks,
    comparisonPrompts,
  };

  try {
    let llmBlurb: string | null = null;
    if (process.env.GEMINI_API_KEY) {
      llmBlurb = await generateCanadaBlurbWithGemini(title, summary, content, baseEnrichment);
    } else if (process.env.OPENAI_API_KEY) {
      llmBlurb = await generateCanadaBlurbWithOpenAI(title, summary, content, baseEnrichment);
    }

    if (llmBlurb) {
      return {
        ...baseEnrichment,
        canadaBlurb: llmBlurb,
      };
    }
  } catch (error) {
    console.warn('[scraper] canada blurb fallback:', (error as Error).message);
  }

  return {
    ...baseEnrichment,
    canadaBlurb: buildFallbackBlurb(title, content, baseEnrichment),
  };
}
