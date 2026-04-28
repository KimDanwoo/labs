import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './contents/blog'
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date().optional().default(new Date('2023-01-01')),
      description: z.string(),
      category: z.string().optional().default(''),
      isHidden: z.boolean().optional().default(false),
      thumbnail: image().optional()
    })
})

export const collections = { blog }
