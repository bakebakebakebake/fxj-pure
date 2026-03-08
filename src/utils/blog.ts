import { getCollection, type CollectionEntry } from 'astro:content'
import type { Locale } from './i18n'
import { isEnglishContent } from './i18n'

type BlogEntry = CollectionEntry<'blog'>
type BlogEnEntry = CollectionEntry<'blogEn'>

export type LocalizedBlogPreview = {
  id: string
  sourceId: string
  isPlaceholder: boolean
  locale: Locale
  collection: 'blog' | 'blogEn'
  data: {
    title: string
    description: string
    publishDate: Date
    updatedDate?: Date
    heroImage?: BlogEntry['data']['heroImage']
    heroImageSrc?: BlogEntry['data']['heroImageSrc']
    heroImageAlt?: BlogEntry['data']['heroImageAlt']
    heroImageColor?: BlogEntry['data']['heroImageColor']
    tags: string[]
    language?: string
    draft: boolean
    comment: boolean
  }
}

export async function getZhBlogCollection() {
  return await getCollection(
    'blog',
    ({ id, data }) => (import.meta.env.PROD ? !data.draft : true) && !id.startsWith('en/')
  )
}

export async function getRawEnglishBlogCollection() {
  const englishMirror = await getCollection('blogEn', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true
  )
  const nativeEnglish = (await getZhBlogCollection()).filter((post) => isEnglishContent(post.data.language))
  return dedupeEnglishEntries([
    ...nativeEnglish.map((post) => ({ ...post, collection: 'blog' as const })),
    ...englishMirror.map((post) => ({ ...post, collection: 'blogEn' as const }))
  ])
}

export async function getLocalizedBlogPreviews(locale: Locale): Promise<LocalizedBlogPreview[]> {
  const zhPosts = await getZhBlogCollection()
  if (locale === 'zh') {
    return zhPosts.map((post) => toLocalizedPreview(post, 'zh', false))
  }

  const englishPosts = await getRawEnglishBlogCollection()
  const englishMap = new Map(englishPosts.map((post) => [post.id, post]))

  return zhPosts.map((zhPost) => {
    const englishPost = englishMap.get(zhPost.id)
    if (englishPost) return toLocalizedPreview(englishPost, 'en', false)
    return toLocalizedPreview(zhPost, 'en', true)
  })
}

export async function getLocalizedBlogEntry(locale: Locale, id: string) {
  const zhPosts = await getZhBlogCollection()
  const zhPost = zhPosts.find((post) => post.id === id)
  if (!zhPost) return null

  if (locale === 'zh') {
    return {
      kind: 'entry' as const,
      entry: zhPost,
      preview: toLocalizedPreview(zhPost, 'zh', false)
    }
  }

  const englishPosts = await getRawEnglishBlogCollection()
  const englishPost = englishPosts.find((post) => post.id === id)
  if (englishPost) {
    return {
      kind: 'entry' as const,
      entry: englishPost,
      preview: toLocalizedPreview(englishPost, 'en', false)
    }
  }

  return {
    kind: 'placeholder' as const,
    source: zhPost,
    preview: toLocalizedPreview(zhPost, 'en', true)
  }
}

export function sortLocalizedBlogByDate(posts: LocalizedBlogPreview[]) {
  return [...posts].sort((a, b) => {
    const aDate = new Date(a.data.updatedDate ?? a.data.publishDate ?? 0).valueOf()
    const bDate = new Date(b.data.updatedDate ?? b.data.publishDate ?? 0).valueOf()
    return bDate - aDate
  })
}

export function groupLocalizedBlogByYear(posts: LocalizedBlogPreview[]) {
  const years = new Map<number, LocalizedBlogPreview[]>()
  for (const post of posts) {
    const year = new Date(post.data.updatedDate ?? post.data.publishDate).getFullYear()
    if (!years.has(year)) years.set(year, [])
    years.get(year)!.push(post)
  }
  return Array.from(years.entries()).sort((a, b) => b[0] - a[0])
}

export function getLocalizedTagsWithCount(posts: LocalizedBlogPreview[]) {
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function dedupeEnglishEntries(entries: (BlogEntry | BlogEnEntry & { collection?: 'blog' | 'blogEn' })[]) {
  const map = new Map<string, BlogEntry | BlogEnEntry>()
  for (const entry of entries) {
    if (entry.collection === 'blogEn') {
      map.set(entry.id, entry)
      continue
    }
    if (!map.has(entry.id)) map.set(entry.id, entry)
  }
  return [...map.values()]
}

function toLocalizedPreview(
  post: BlogEntry | BlogEnEntry,
  locale: Locale,
  isPlaceholder: boolean
): LocalizedBlogPreview {
  return {
    id: post.id,
    sourceId: post.id,
    isPlaceholder,
    locale,
    collection: post.collection as 'blog' | 'blogEn',
    data: {
      ...post.data,
      title: isPlaceholder ? post.data.title : post.data.title,
      description: isPlaceholder
        ? 'This post is currently available in Chinese only. The English version will be added later.'
        : post.data.description,
      language: locale === 'en' ? 'English' : post.data.language
    }
  }
}
