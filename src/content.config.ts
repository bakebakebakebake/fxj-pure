import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

function removeDupsAndLowerCase(array: string[]) {
  if (!array.length) return array
  const lowercaseItems = array.map((str) => str.toLowerCase())
  const distinctItems = new Set(lowercaseItems)
  return Array.from(distinctItems)
}

// Define blog collection
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: ['**/*.md', '!en/**/*.md'] }),
  // Required
  schema: ({ image }) =>
    z
      .object({
        // Required
        title: z.string().max(60),
        description: z.string().max(160),
        publishDate: z.coerce.date(),
        // Optional
        updatedDate: z.coerce.date().optional(),
        heroImage: z
          .object({
            src: image(),
            alt: z.string().optional(),
            inferSize: z.boolean().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
            color: z.string().optional()
          })
          .optional(),
        heroImageSrc: image().optional(),
        heroImageAlt: z.string().optional(),
        heroImageColor: z.string().optional(),
        tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
        language: z.string().optional(),
        draft: z.boolean().default(false),
        // Special fields
        comment: z.boolean().default(true)
      })
      .transform((data) => {
        const legacyImage = data.heroImage
        const normalizedSrc = data.heroImageSrc ?? legacyImage?.src
        const normalizedAlt = data.heroImageAlt ?? legacyImage?.alt
        const normalizedColor = data.heroImageColor ?? legacyImage?.color

        return {
          ...data,
          heroImage: normalizedSrc
            ? {
                ...(legacyImage ?? {}),
                src: normalizedSrc,
                ...(normalizedAlt ? { alt: normalizedAlt } : {}),
                ...(normalizedColor ? { color: normalizedColor } : {})
              }
            : undefined,
          heroImageSrc: normalizedSrc,
          heroImageAlt: normalizedAlt,
          heroImageColor: normalizedColor
        }
      })
})

const blogEn = defineCollection({
  loader: glob({ base: './src/content/blog/en', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(120),
        description: z.string().max(160),
        publishDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: z
          .object({
            src: image(),
            alt: z.string().optional(),
            inferSize: z.boolean().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
            color: z.string().optional()
          })
          .optional(),
        heroImageSrc: image().optional(),
        heroImageAlt: z.string().optional(),
        heroImageColor: z.string().optional(),
        tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
        language: z.string().optional(),
        draft: z.boolean().default(false),
        comment: z.boolean().default(true)
      })
      .transform((data) => {
        const legacyImage = data.heroImage
        const normalizedSrc = data.heroImageSrc ?? legacyImage?.src
        const normalizedAlt = data.heroImageAlt ?? legacyImage?.alt
        const normalizedColor = data.heroImageColor ?? legacyImage?.color

        return {
          ...data,
          heroImage: normalizedSrc
            ? {
                ...(legacyImage ?? {}),
                src: normalizedSrc,
                ...(normalizedAlt ? { alt: normalizedAlt } : {}),
                ...(normalizedColor ? { color: normalizedColor } : {})
              }
            : undefined,
          heroImageSrc: normalizedSrc,
          heroImageAlt: normalizedAlt,
          heroImageColor: normalizedColor
        }
      })
})

// Define docs collection
const docs = defineCollection({
  loader: glob({ base: './src/content/docs', pattern: '**/*.{md,mdx}' }),
  schema: () =>
    z.object({
      title: z.string().max(60),
      description: z.string().max(160),
      publishDate: z.coerce.date().optional(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
      draft: z.boolean().default(false),
      // Special fields
      order: z.number().default(999)
    })
})

export const collections = { blog, blogEn, docs }
