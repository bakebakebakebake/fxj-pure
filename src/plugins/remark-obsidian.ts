import fs from 'node:fs'
import path from 'node:path'
import type { Image, Link, List, Parent, Root, Text } from 'mdast'
import { visit } from 'unist-util-visit'

type ContentCollection = 'blog' | 'docs'

interface NoteEntry {
  absPath: string
  collection: ContentCollection
  slug: string
  url: string
}

interface ResolvedNote {
  url: string
  broken: boolean
  label: string
}

interface ResolvedAsset {
  url: string
  broken: boolean
}

const projectRoot = process.cwd()
const contentRoots = {
  blog: path.join(projectRoot, 'src/content/blog'),
  docs: path.join(projectRoot, 'src/content/docs')
} as const

const noteEntries = collectNoteEntries()
const noteByAbsPath = new Map(noteEntries.map((entry) => [entry.absPath, entry]))
const noteBySlug = new Map(noteEntries.map((entry) => [`${entry.collection}:${entry.slug}`, entry]))
const noteByStem = buildUniqueLookup(noteEntries, (entry) => path.basename(entry.slug))
const noteByDir = buildUniqueLookup(
  noteEntries.filter((entry) => entry.slug.includes('/')),
  (entry) => entry.slug.split('/').slice(-1)[0]!
)
const assetEntries = collectAssets()
const assetsByBasename = buildUniqueLookup(assetEntries, (assetPath) => path.basename(assetPath))

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif'])

const selectorMap = new Map<string, 'tabs' | 'timeline' | 'card'>([
  ['tabs', 'tabs'],
  ['list2tab', 'tabs'],
  ['标签页', 'tabs'],
  ['timeline', 'timeline'],
  ['list2timeline', 'timeline'],
  ['时间线', 'timeline'],
  ['card', 'card'],
  ['list2card', 'card'],
  ['卡片', 'card']
])

export default function remarkObsidian() {
  return function transformer(tree: Root, file: { path?: string }) {
    stripCommentBlocks(tree)
    normalizeMathBlocks(tree)

    visit(tree, 'html', (node: { value: string }, index, parent) => {
      if (!parent || index === undefined) return
      if (/^<!--\s*steps\s*-->$/i.test(node.value)) {
        const nextNode = (parent as Parent).children[index + 1]
        if (nextNode && nextNode.type === 'list' && (nextNode as List).ordered) {
          const listNode = nextNode as List
          listNode.data ??= {}
          listNode.data.hProperties = {
            ...(listNode.data.hProperties ?? {}),
            className: [...toClassNames(listNode.data.hProperties?.className), 'sl-steps']
          }
          ;(parent as Parent).children.splice(index, 1)
          return index
        }
      }
    })

    visit(tree, 'image', (node: Image) => {
      const parsed = parseImageMeta(node.url)
      node.data ??= {}
      if (parsed) node.url = parsed.url
      node.data.hProperties = {
        ...(node.data.hProperties ?? {}),
        className: [
          ...toClassNames(node.data.hProperties?.className),
          'zoomable',
          ...(parsed?.classNames ?? [])
        ],
        style: joinStyles(node.data.hProperties?.style, parsed?.style),
        ...(parsed?.width ? { width: parsed.width } : {})
      }
    })

    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined || shouldSkipInlineTransform(parent)) return

      const replacements = replaceInlineSyntax(node.value, file.path)
      if (!replacements) return

      parent.children.splice(index, 1, ...replacements)
      return index + replacements.length
    })

    visit(tree, 'link', (node: Link) => {
      const resolvedLink = resolveMarkdownLink(node.url, file.path)
      if (!resolvedLink) return

      node.url = resolvedLink.url
      if (!resolvedLink.broken) return

      node.data ??= {}
      node.data.hProperties = {
        ...(node.data.hProperties ?? {}),
        className: [...toClassNames(node.data.hProperties?.className), 'broken-link']
      }
    })
  }
}

function normalizeMathBlocks(tree: Root) {
  visit(tree, 'inlineMath', (node: { value: string }) => {
    node.value = normalizeKatexMath(node.value, true)
  })

  visit(tree, 'math', (node: { value: string }) => {
    node.value = normalizeKatexMath(node.value, false)
  })
}

function normalizeKatexMath(value: string, isInline: boolean) {
  let next = value
    .replace(/\\begin\{align\*\}/gu, '\\begin{aligned}')
    .replace(/\\end\{align\*\}/gu, '\\end{aligned}')
    .replace(/\\begin\{align\}/gu, '\\begin{aligned}')
    .replace(/\\end\{align\}/gu, '\\end{aligned}')

  if (isInline && /\\begin\{aligned\}/u.test(next) && !/\\displaystyle/u.test(next)) {
    next = `\\displaystyle ${next}`
  }

  return next
}

function stripCommentBlocks(tree: Root) {
  const nextChildren: Root['children'] = []
  let inCommentBlock = false

  for (const node of tree.children) {
    const plainText = extractPlainText(node).trim()

    if (!inCommentBlock && plainText.startsWith('%%')) {
      inCommentBlock = !plainText.endsWith('%%')
      continue
    }

    if (inCommentBlock) {
      if (plainText.endsWith('%%')) inCommentBlock = false
      continue
    }

    nextChildren.push(node)
  }

  tree.children = nextChildren
}

function collectNoteEntries(): NoteEntry[] {
  const results: NoteEntry[] = []

  for (const [collection, rootDir] of Object.entries(contentRoots) as [
    ContentCollection,
    string
  ][]) {
    for (const absPath of walk(rootDir)) {
      if (!absPath.endsWith('.md') && !absPath.endsWith('.mdx')) continue

      const relativePath = path.relative(rootDir, absPath)
      const withoutExt = relativePath.replace(/\.(md|mdx)$/u, '')
      const slug = path.basename(withoutExt) === 'index' ? path.dirname(withoutExt) : withoutExt
      const normalizedSlug = normalizeSlug(slug)
      results.push({
        absPath,
        collection,
        slug: normalizedSlug,
        url: `/${collection}/${normalizedSlug}`
      })
    }
  }

  return results
}

function collectAssets(): string[] {
  const results: string[] = []

  for (const rootDir of Object.values(contentRoots)) {
    for (const absPath of walk(rootDir)) {
      if (absPath.endsWith('.md') || absPath.endsWith('.mdx')) continue
      results.push(absPath)
    }
  }

  return results
}

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const absPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(absPath)
    } else {
      yield absPath
    }
  }
}

function buildUniqueLookup<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>()
  for (const item of items) {
    const key = normalizeKey(getKey(item))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const lookup = new Map<string, T>()
  for (const item of items) {
    const key = normalizeKey(getKey(item))
    if (counts.get(key) === 1) lookup.set(key, item)
  }

  return lookup
}

function normalizeSlug(slug: string) {
  return slug.split(path.sep).join('/').replace(/^\.\//u, '')
}

function normalizeKey(value: string) {
  return value
    .trim()
    .replace(/\.(md|mdx)$/u, '')
    .toLowerCase()
}

function shouldSkipInlineTransform(parent: Parent) {
  return ['link', 'image', 'html', 'inlineCode', 'code'].includes(parent.type)
}

function replaceInlineSyntax(value: string, filePath?: string) {
  const pattern = /(!?\[\[[^[\]]+\]\]|==[^=\n][\s\S]*?==|%%[\s\S]*?%%)/gu
  const matches = [...value.matchAll(pattern)]
  if (!matches.length) return null

  const nodes: Parent['children'] = []
  let cursor = 0

  for (const match of matches) {
    const token = match[0]
    const start = match.index ?? 0

    if (start > cursor) {
      nodes.push({ type: 'text', value: value.slice(cursor, start) })
    }

    if (token.startsWith('%%')) {
      cursor = start + token.length
      continue
    }

    if (token.startsWith('==') && token.endsWith('==')) {
      const highlighted = token.slice(2, -2).trim()
      if (highlighted) {
        nodes.push({ type: 'html', value: `<mark>${escapeHtml(highlighted)}</mark>` })
      }
      cursor = start + token.length
      continue
    }

    const embed = token.startsWith('![[', 0)
    const inner = token.slice(embed ? 3 : 2, -2)
    const [rawTarget, rawMeta = ''] = inner.split('|')
    const { target, anchor } = splitAnchor(rawTarget.trim())
    const meta = rawMeta.trim()

    if (isImageTarget(target)) {
      const resolvedAsset = resolveAssetTarget(target, filePath)
      const imageNode: Image = {
        type: 'image',
        url: resolvedAsset?.url ?? target,
        alt: '',
        title: undefined,
        data: {
          hProperties: {
            className: resolvedAsset?.broken ? ['broken-link'] : [],
            ...(isWidthMeta(meta) ? { width: Number(meta) } : {})
          }
        }
      }

      const parsed = parseImageMeta(imageNode.url)
      if (parsed) {
        imageNode.url = parsed.url
        imageNode.data!.hProperties = {
          ...(imageNode.data?.hProperties ?? {}),
          className: [
            ...toClassNames(imageNode.data?.hProperties?.className),
            ...parsed.classNames
          ],
          style: joinStyles(imageNode.data?.hProperties?.style, parsed.style),
          ...(parsed.width ? { width: parsed.width } : {})
        }
      }

      nodes.push(imageNode)
      cursor = start + token.length
      continue
    }

    const resolvedNote = resolveNoteTarget(target, filePath)
    const url = resolvedNote?.url
      ? anchor
        ? `${resolvedNote.url}#${slugifyHeading(anchor)}`
        : resolvedNote.url
      : '#'
    const linkNode: Link = {
      type: 'link',
      url,
      children: [{ type: 'text', value: meta || resolvedNote?.label || target }],
      data: {
        hProperties: {
          className: [
            ...(resolvedNote?.broken ? ['broken-link'] : []),
            ...(embed ? ['obsidian-note-embed'] : [])
          ],
          ...(embed ? { dataEmbed: 'true' } : {})
        }
      }
    }
    nodes.push(linkNode)
    cursor = start + token.length
  }

  if (cursor < value.length) {
    nodes.push({ type: 'text', value: value.slice(cursor) })
  }

  return nodes
}

function splitAnchor(target: string) {
  const hashIndex = target.indexOf('#')
  if (hashIndex === -1) return { target, anchor: '' }
  return {
    target: target.slice(0, hashIndex),
    anchor: target.slice(hashIndex + 1)
  }
}

function resolveNoteTarget(target: string, currentFile?: string): ResolvedNote | null {
  const cleaned = normalizeKey(target)
  if (!cleaned) return null

  const currentEntry = currentFile ? noteByAbsPath.get(path.resolve(currentFile)) : undefined
  const resolved =
    resolveRelativeNote(target, currentFile, currentEntry?.collection) ??
    (currentEntry ? noteBySlug.get(`${currentEntry.collection}:${cleaned}`) : undefined) ??
    noteBySlug.get(`blog:${cleaned}`) ??
    noteBySlug.get(`docs:${cleaned}`) ??
    noteByStem.get(cleaned) ??
    noteByDir.get(cleaned)

  if (!resolved) {
    return { url: '#', broken: true, label: target }
  }

  return { url: resolved.url, broken: false, label: path.basename(resolved.slug) }
}

function resolveRelativeNote(
  target: string,
  currentFile?: string,
  currentCollection?: ContentCollection
) {
  if (!currentFile || !currentCollection) return null
  if (!target.includes('/') && !target.startsWith('.')) return null

  const rootDir = contentRoots[currentCollection]
  const currentDir = path.dirname(path.resolve(currentFile))
  const absoluteTarget = path.resolve(currentDir, target)
  const candidates = [
    absoluteTarget,
    `${absoluteTarget}.md`,
    `${absoluteTarget}.mdx`,
    path.join(absoluteTarget, 'index.md'),
    path.join(absoluteTarget, 'index.mdx')
  ]

  for (const candidate of candidates) {
    const normalized = path.normalize(candidate)
    if (noteByAbsPath.has(normalized)) {
      return noteByAbsPath.get(normalized)!
    }
    const relativeToRoot = path.relative(rootDir, normalized)
    const cleaned = normalizeKey(relativeToRoot)
    const match = noteBySlug.get(`${currentCollection}:${cleaned}`)
    if (match) return match
  }

  return null
}

function resolveAssetTarget(target: string, currentFile?: string): ResolvedAsset | null {
  if (!currentFile) return null
  const currentDir = path.dirname(path.resolve(currentFile))
  const directCandidate = path.resolve(currentDir, target)
  if (fs.existsSync(directCandidate)) {
    return { url: toRelativeAssetPath(currentDir, directCandidate), broken: false }
  }

  if (!target.includes('/') && assetsByBasename.has(normalizeKey(target))) {
    const candidate = assetsByBasename.get(normalizeKey(target))!
    return { url: toRelativeAssetPath(currentDir, candidate), broken: false }
  }

  return { url: target, broken: true }
}

function resolveMarkdownLink(target: string, currentFile?: string): ResolvedAsset | null {
  if (!isMarkdownNoteLink(target)) return null

  const { target: noteTarget, anchor } = splitAnchor(target)
  const resolvedNote = resolveNoteTarget(noteTarget, currentFile)
  if (!resolvedNote) return { url: '#', broken: true }

  return {
    url: resolvedNote.broken
      ? '#'
      : anchor
        ? `${resolvedNote.url}#${slugifyHeading(anchor)}`
        : resolvedNote.url,
    broken: resolvedNote.broken
  }
}

function toRelativeAssetPath(fromDir: string, absoluteTarget: string) {
  let relativePath = path.relative(fromDir, absoluteTarget).split(path.sep).join('/')
  if (!relativePath.startsWith('.')) relativePath = `./${relativePath}`
  return relativePath
}

function isMarkdownNoteLink(target: string) {
  if (!target || target.startsWith('#') || target.startsWith('/')) return false
  if (/^[a-z]+:/iu.test(target)) return false

  const { target: pathTarget } = splitAnchor(target)
  return /\.(md|mdx)$/iu.test(pathTarget.trim())
}

function isImageTarget(target: string) {
  if (target.startsWith('http://') || target.startsWith('https://')) {
    return imageExtensions.has(path.extname(target.split('?')[0]).toLowerCase())
  }
  return imageExtensions.has(path.extname(target).toLowerCase())
}

function parseImageMeta(url: string) {
  const [pathPart, hashPart] = url.split('#')
  if (!hashPart) return null

  const [anchorPart, queryWidth] = hashPart.split('|')
  const className =
    anchorPart === 'pic_center'
      ? 'obsidian-image-center'
      : anchorPart === 'pic_left'
        ? 'obsidian-image-left'
        : anchorPart === 'pic_right'
          ? 'obsidian-image-right'
          : ''

  return {
    url: pathPart,
    classNames: className ? [className] : [],
    style: isWidthMeta(queryWidth)
      ? `width:min(100%, ${Number(queryWidth)}px);max-width:${Number(queryWidth)}px;height:auto;`
      : '',
    width: isWidthMeta(queryWidth) ? Number(queryWidth) : undefined
  }
}

function isWidthMeta(value: string) {
  return /^\d+$/u.test(value.trim())
}

function toClassNames(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.flatMap((item) => toClassNames(item))
  if (typeof value === 'string') return value.split(/\s+/u).filter(Boolean)
  return []
}

function slugifyHeading(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .replace(/\s+/gu, '-')
    .replace(/-+/gu, '-')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function extractPlainText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  if ('value' in node && typeof node.value === 'string') return node.value
  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map((child) => extractPlainText(child)).join('')
  }
  return ''
}

function joinStyles(...styles: unknown[]) {
  return styles
    .flatMap((style) => (typeof style === 'string' ? [style] : []))
    .map((style) => style.trim())
    .filter(Boolean)
    .join(';')
}

export function normalizeAnyBlockSelector(input: string) {
  const token = input.trim().slice(1, -1).split('|')[0]?.trim()
  if (!token) return null
  return selectorMap.get(token.toLowerCase()) ?? selectorMap.get(token)
}
