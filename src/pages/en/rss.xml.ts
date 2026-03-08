import type { AstroGlobal, ImageMetadata } from 'astro'
import { getImage } from 'astro:assets'
import rss from '@astrojs/rss'
import type { Root } from 'mdast'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import config from 'virtual:config'

import { getRawEnglishBlogCollection, sortLocalizedBlogByDate } from '@/utils/blog'

const imagesGlob = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/blog/**/*.{jpeg,jpg,png,gif,avif,webp}'
)

async function resolveHeroImageUrl(post: Awaited<ReturnType<typeof getRawEnglishBlogCollection>>[number], site: URL) {
  const heroImage = post.data.heroImage?.src
  if (!heroImage) return undefined
  if (typeof heroImage !== 'string') return new URL((await getImage({ src: heroImage })).src, site).toString()
  if (/^https?:\/\//u.test(heroImage)) return heroImage
  return new URL(heroImage, site).toString()
}

const renderContent = async (post: Awaited<ReturnType<typeof getRawEnglishBlogCollection>>[number], site: URL) => {
  function remarkReplaceImageLink() {
    return async function (tree: Root) {
      const promises: Promise<void>[] = []
      visit(tree, 'image', (node) => {
        if (node.url.startsWith('/images')) {
          node.url = new URL(node.url, site).toString()
          return
        }
        if (/^https?:\/\//u.test(node.url)) return

        const root = post.collection === 'blogEn' ? '/src/content/blog/en' : '/src/content/blog'
        const imagePathPrefix = `${root}/${post.id}/${node.url.replace('./', '')}`
        const promise = imagesGlob[imagePathPrefix]?.().then(async (res) => {
          const imagePath = res?.default
          if (imagePath) node.url = new URL((await getImage({ src: imagePath })).src, site).toString()
        })
        if (promise) promises.push(promise)
      })
      await Promise.all(promises)
    }
  }

  const file = await unified()
    .use(remarkParse)
    .use(remarkReplaceImageLink)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(post.body)

  return String(file)
}

const GET = async (context: AstroGlobal) => {
  const posts = sortLocalizedBlogByDate(
    (await getRawEnglishBlogCollection())
      .filter((post) => post.id !== '__internal-placeholder')
      .map((post) => ({
      id: post.id,
      sourceId: post.id,
      isPlaceholder: false,
      locale: 'en' as const,
      collection: post.collection as 'blog' | 'blogEn',
      data: post.data
    }))
  )
  const siteUrl = context.site ?? new URL(import.meta.env.SITE)
  const postMap = new Map(
    (await getRawEnglishBlogCollection())
      .filter((post) => post.id !== '__internal-placeholder')
      .map((post) => [post.id, post])
  )

  return rss({
    trailingSlash: false,
    xmlns: { h: 'http://www.w3.org/TR/html4/' },
    stylesheet: '/scripts/pretty-feed-v3.xsl',
    title: `${config.title} (English)`,
    description: 'English feed for FXJ Wiki',
    site: siteUrl.toString(),
    items: await Promise.all(
      posts.map(async (preview) => {
        const post = postMap.get(preview.id)!
        const heroImageUrl = await resolveHeroImageUrl(post, siteUrl)
        return {
          title: preview.data.title,
          description: preview.data.description,
          pubDate: preview.data.publishDate,
          link: `/en/blog/${preview.id}`,
          ...(heroImageUrl && {
            customData: `<h:img src="${heroImageUrl}" /><enclosure url="${heroImageUrl}" type="image/jpeg" />`
          }),
          content: await renderContent(post, siteUrl)
        }
      })
    )
  })
}

export { GET }
