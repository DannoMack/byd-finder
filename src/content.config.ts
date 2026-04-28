import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    source: z.string(),
    sourceUrl: z.string().url(),
    author: z.string().optional(),
    publishedAt: z.coerce.date(),
    image: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    entityTags: z.array(z.object({
      label: z.string(),
      slug: z.string(),
      kind: z.enum(['byd-model', 'competitor', 'location', 'policy']),
    })).default([]),
    internalLinks: z.array(z.object({
      label: z.string(),
      href: z.string(),
      slug: z.string(),
      kind: z.enum(['model', 'comparison', 'location', 'policy', 'calculator']),
      live: z.boolean().default(false),
    })).default([]),
    comparisonPrompts: z.array(z.object({
      bydModel: z.string(),
      competitor: z.string(),
      slug: z.string(),
      href: z.string(),
      title: z.string(),
      live: z.boolean().default(false),
    })).default([]),
    canadaBlurb: z.string().optional(),
    country: z.enum(['ca', 'global']).default('global'),
    editorial: z.boolean().default(false),
  }),
});

const reviews = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reviews' }),
  schema: z.object({
    title: z.string(),
    model: z.string(),
    channel: z.string(),
    youtubeId: z.string(),
    publishedAt: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

const models = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/models' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    bodyStyle: z.string(),
    priceFromCAD: z.number().optional(),
    rangeKm: z.number().optional(),
    batteryKWh: z.number().optional(),
    driveTrain: z.string().optional(),
    dcFastChargeKw: z.number().optional(),
    efficiencyKWhPer100Km: z.number().optional(),
    winterRangeLossPct: z.number().optional(),
    insurancePerYearCAD: z.number().optional(),
    maintenancePerYearCAD: z.number().optional(),
    depreciationPct5yr: z.number().optional(),
    availableInCanada: z.boolean().default(false),
    heroImage: z.string().optional(),
    order: z.number().default(100),
  }),
});

const comparisons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/comparisons' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    summary: z.string(),
    bydModelSlug: z.string(),
    targetBuyer: z.string(),
    specRows: z.array(z.object({
      label: z.string(),
      byd: z.string(),
      competitor: z.string(),
    })).default([]),
    competitor: z.object({
      name: z.string(),
      slug: z.string(),
      bodyStyle: z.string(),
      priceFromCAD: z.number(),
      rangeKm: z.number(),
      batteryKWh: z.number(),
      driveTrain: z.string(),
      dcFastChargeKw: z.number(),
      efficiencyKWhPer100Km: z.number(),
      winterRangeLossPct: z.number(),
      insurancePerYearCAD: z.number(),
      maintenancePerYearCAD: z.number(),
      depreciationPct5yr: z.number(),
    }),
    cta: z.object({
      heading: z.string(),
      body: z.string(),
    }),
  }),
});

export const collections = { news, reviews, models, comparisons };
