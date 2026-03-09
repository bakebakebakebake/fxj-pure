import type { CollectionEntry } from 'astro:content'
import type { LocalizedBlogPreview } from '@/utils/blog'

type BlogData = CollectionEntry<'blog'>['data']
type LocalizedBlogData = LocalizedBlogPreview['data']
type SupportedBlogData = BlogData | LocalizedBlogData

export function resolveHeroImage(data: SupportedBlogData) {
  if (data.heroImage) return data.heroImage
  if (!data.heroImageSrc) return undefined

  return {
    src: data.heroImageSrc,
    ...(data.heroImageAlt ? { alt: data.heroImageAlt } : {}),
    ...(data.heroImageColor ? { color: data.heroImageColor } : {})
  } satisfies NonNullable<BlogData['heroImage']>
}

export function resolveHeroImageColor(data: SupportedBlogData) {
  return data.heroImageColor ?? resolveHeroImage(data)?.color
}

export function resolveHeroImageSrc(data: SupportedBlogData) {
  const heroImage = resolveHeroImage(data)
  if (!heroImage) return undefined
  return typeof heroImage.src === 'string' ? heroImage.src : heroImage.src.src
}
