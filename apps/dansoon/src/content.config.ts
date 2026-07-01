import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const schema = ({ image }: { image: () => z.ZodType }) =>
  z.object({
    title: z.string(),
    date: z.coerce.date().optional().default(new Date('2023-01-01')),
    description: z.string(),
    category: z.string().optional().default(''),
    isHidden: z.boolean().optional().default(false),
    thumbnail: image().optional(),
  });

const tech = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './contents/tech' }),
  schema,
});

const book = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './contents/book' }),
  schema,
});

export const collections = { tech, book };
