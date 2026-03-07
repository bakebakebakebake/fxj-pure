import type { MarkdownHeading } from 'astro'

export interface TocItem extends MarkdownHeading {
  subheadings: TocItem[]
}

function diveChildren(item: TocItem, depth: number): TocItem[] {
  if (depth === 1 || !item.subheadings.length) {
    return item.subheadings
  }

  return diveChildren(item.subheadings[item.subheadings.length - 1] as TocItem, depth - 1)
}

export function generateToc(headings: readonly MarkdownHeading[]) {
  const bodyHeadings = [...headings.filter(({ depth }) => depth > 1)]
  const toc: TocItem[] = []

  bodyHeadings.forEach((heading) => {
    const item: TocItem = { ...heading, subheadings: [] }

    if (item.depth === 2) {
      toc.push(item)
      return
    }

    const lastItemInToc = toc[toc.length - 1]
    if (!lastItemInToc || item.depth < lastItemInToc.depth) {
      throw new Error(`Orphan heading found: ${item.text}.`)
    }

    const gap = item.depth - lastItemInToc.depth
    const target = diveChildren(lastItemInToc, gap)
    target.push(item)
  })

  return toc
}
