import type { MarkdownHeading } from 'astro'

export interface TocItem extends MarkdownHeading {
  subheadings: TocItem[]
}

export function generateToc(headings: readonly MarkdownHeading[]) {
  const bodyHeadings = [...headings.filter(({ depth }) => depth > 1)]
  const toc: TocItem[] = []
  const stack: TocItem[] = []

  bodyHeadings.forEach((heading) => {
    const item: TocItem = { ...heading, subheadings: [] }

    while (stack.length && (stack[stack.length - 1] as TocItem).depth >= item.depth) {
      stack.pop()
    }

    const parent = stack[stack.length - 1]

    if (!parent || item.depth === 2) {
      toc.push(item)
    } else {
      parent.subheadings.push(item)
    }

    stack.push(item)
  })

  return toc
}
