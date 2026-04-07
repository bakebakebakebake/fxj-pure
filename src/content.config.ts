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
  loader: glob({
    base: './src/content/docs',
    pattern: [
      '**/*.{md,mdx}',
      '!agent-memory-teaching/12-interview-guide.md',
      '!mit-6.824/00-总览/**/*.md',
      '!mit-6.824/01-基础/07-基础概念速查：Go、RPC、并发、分布式.md',
      '!mit-6.824/02-实验/00-调试手册：Lab 1-3 统一排障流程.md',
      '!mit-6.824/02-实验/01-Lab 1 MapReduce：从零到通过所有测试.md',
      '!mit-6.824/02-实验/02-Lab 2 Raft：从零到通过所有测试.md',
      '!mit-6.824/02-实验/03-Lab 3 KVRaft：从零到通过所有测试.md',
      '!mit-6.824/03-论文/00-论文精华：MapReduce + Raft 核心要点.md',
      '!mit-6.824/03-论文/03-论文规则到实验代码速查表.md',
      '!mit-6.824/04-面试/**/*.md'
    ]
  }),
  schema: () =>
    z.object({
      title: z.string().max(60),
      description: z.string().max(160),
      publishDate: z.coerce.date().optional(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
      draft: z.boolean().default(false),
      source: z.string().optional(),
      sourceTitle: z.string().optional(),
      section: z.string().optional(),
      sectionTitle: z.string().optional(),
      subsection: z.string().optional(),
      subsectionTitle: z.string().optional(),
      language: z.string().optional(),
      // Special fields
      order: z.number().default(999)
    })
})

export const collections = { blog, blogEn, docs }
