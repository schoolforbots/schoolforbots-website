import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders'
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema'

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
  // One question per file, the answer in the body. The FAQ page lists them all
  // in `order`; the homepage shows the `featured` ones.
  faq: defineCollection({
    loader: glob({ base: './src/content/faq', pattern: '*.md' }),
    schema: z.object({ question: z.string(), order: z.number(), featured: z.boolean() }),
  }),
}
