import type { Element, Root, RootContent } from 'hast'
import { h } from 'hastscript'

const calloutTypeMap: Record<string, 'note' | 'tip' | 'caution' | 'danger'> = {
  note: 'note',
  abstract: 'note',
  info: 'note',
  todo: 'note',
  tip: 'tip',
  hint: 'tip',
  important: 'tip',
  warning: 'caution',
  caution: 'caution',
  attention: 'caution',
  danger: 'danger',
  error: 'danger'
}

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

export default function rehypeObsidianBlocks() {
  return function transformer(tree: Root) {
    stripCommentArtifacts(tree)
    transformCallouts(tree)
    transformAnyBlockContainers(tree)
    transformEmbedParagraphs(tree)
    stripCommentArtifacts(tree)
  }
}

function stripCommentArtifacts(tree: Root) {
  stripInlineComments(tree)
  walkCommentArtifacts(tree)
}

function stripInlineComments(parent: Root | Element) {
  const nextChildren: RootContent[] = []

  for (const node of parent.children) {
    if (node.type === 'text') {
      const value = node.value.replace(/%%[\s\S]*?%%/gu, '')
      if (value.length) nextChildren.push({ ...node, value })
      continue
    }

    if (isParentElement(node)) stripInlineComments(node)
    nextChildren.push(node)
  }

  parent.children = nextChildren
}

function walkCommentArtifacts(parent: Root | Element) {
  const nextChildren: RootContent[] = []
  let inCommentBlock = false

  for (const node of parent.children) {
    const text = extractText(node).trim()

    if (!inCommentBlock && startsCommentBlock(text)) {
      if (!endsCommentBlock(text)) inCommentBlock = true
      continue
    }

    if (inCommentBlock) {
      if (endsCommentBlock(text)) inCommentBlock = false
      continue
    }

    if (isParentElement(node)) walkCommentArtifacts(node)
    nextChildren.push(node)
  }

  parent.children = nextChildren
}

function transformCallouts(tree: Root) {
  walkCallouts(tree)
}

function walkCallouts(parent: Root | Element) {
  const children = [...parent.children]
  const nextChildren: RootContent[] = []

  for (const node of children) {
    if (isElement(node, 'blockquote')) {
      const replacement = renderCallout(node)
      if (replacement) {
        nextChildren.push(replacement)
        continue
      }
    }

    if (isParentElement(node)) walkCallouts(node)
    nextChildren.push(node)
  }

  parent.children = nextChildren
}

function transformAnyBlockContainers(tree: Root) {
  walkContainer(tree)
}

function walkContainer(parent: Root | Element) {
  const children = [...parent.children]
  const nextChildren: RootContent[] = []

  for (let index = 0; index < children.length; index += 1) {
    const node = children[index]

    if (isTabsContainerStart(node)) {
      const endIndex = findClosingContainer(children, index + 1)
      if (endIndex !== -1) {
        const between = children.slice(index + 1, endIndex)
        const rendered = renderTabsContainer(between)
        if (rendered) {
          nextChildren.push(rendered)
          index = endIndex
          continue
        }
      }
    }

    const selector = readAnyBlockSelector(node)
    if (selector) {
      const selection = selectBlock(children, index + 1)
      if (selection) {
        const rendered = renderSelector(selector, selection.nodes)
        if (rendered) {
          nextChildren.push(rendered)
          index = selection.endIndex
          continue
        }
      }
    }

    if (isParentElement(node)) walkContainer(node)
    nextChildren.push(node)
  }

  parent.children = nextChildren
}

function transformEmbedParagraphs(tree: Root) {
  walkEmbedParagraphs(tree)
}

function createCallout(type: 'note' | 'tip' | 'caution' | 'danger', title: string, bodyChildren: RootContent[]) {
  return h('aside.obsidian-callout.aside.my-3.overflow-hidden.rounded-xl.border', [
    h(`div.aside-container.border-l-8.border-primary.px-4.py-3.bg-primary.aside-${type}`, [
      h('p.callout-title.not-prose.flex.items-center.gap-x-2.font-medium.text-primary', title),
      h('div.aside-content.mt-2', bodyChildren)
    ])
  ]) as RootContent
}

function createCollapse(
  type: 'note' | 'tip' | 'caution' | 'danger',
  title: string,
  bodyChildren: RootContent[],
  open: boolean
) {
  return h(
    `details.obsidian-collapse.my-4.overflow-hidden.rounded-xl.border.px-3.py-2.sm:px-4.aside-${type}`,
    open ? { open: true } : {},
    [
      h('summary.obsidian-collapse-summary.not-prose.cursor-pointer.font-medium', title),
      h('div.obsidian-collapse-body.mt-3', bodyChildren)
    ]
  ) as RootContent
}

function renderTabsContainer(nodes: RootContent[]) {
  const panels: { label: string; children: RootContent[] }[] = []
  let current: { label: string; children: RootContent[] } | null = null

  for (const node of nodes) {
    const tabLabel = readTabLabel(node)
    if (tabLabel) {
      if (current) panels.push(current)
      current = { label: tabLabel, children: [] }
      continue
    }

    if (current) current.children.push(node)
  }

  if (current) panels.push(current)
  if (!panels.length) return null

  panels.forEach((panel) => panel.children.forEach((child) => isParentElement(child) && walkContainer(child)))
  return createTabs(panels)
}

function renderSelector(selector: 'tabs' | 'timeline' | 'card', nodes: RootContent[]) {
  if (selector === 'timeline') {
    if (nodes.length === 1 && isElement(nodes[0], 'ul')) {
      return createTimeline(nodes[0])
    }
    return null
  }

  if (selector === 'card') {
    if (nodes.length === 1 && isElement(nodes[0], 'ul')) {
      return createCards(nodes[0])
    }
    if (isHeadingSection(nodes[0])) {
      return createCardsFromHeadings(nodes)
    }
    return null
  }

  if (selector === 'tabs') {
    if (nodes.length === 1 && isElement(nodes[0], 'ul')) {
      return createTabsFromList(nodes[0])
    }
    if (isHeadingSection(nodes[0])) {
      return createTabsFromHeadings(nodes)
    }
  }

  return null
}

function createTabsFromList(listNode: Element) {
  const panels = listNode.children
    .filter((child): child is Element => isElement(child, 'li'))
    .map((item) => {
      const children = item.children.filter((child) => !isWhitespaceText(child))
      const firstElement = children.find((child): child is Element => child.type === 'element')
      if (!firstElement) return null
      const { heading, remainder } = splitLeadParagraph(firstElement)
      const body = [
        ...(remainder ? [h('p', remainder) as RootContent] : []),
        ...children.slice(children.indexOf(firstElement) + 1)
      ]
      body.forEach((child) => isParentElement(child) && walkContainer(child))
      return { label: heading || 'Tab', children: body.length ? body : [h('p', heading || 'Tab')] }
    })
    .filter(Boolean) as { label: string; children: RootContent[] }[]

  return panels.length ? createTabs(panels) : null
}

function createTabsFromHeadings(nodes: RootContent[]) {
  const sections = splitHeadingSections(nodes)
  if (!sections.length) return null
  sections.forEach((section) => section.children.forEach((child) => isParentElement(child) && walkContainer(child)))
  return createTabs(sections)
}

function createTabs(panels: { label: string; children: RootContent[] }[]) {
  const panelNodes = panels.map((panel, index) =>
    h(
      'div',
      {
        role: 'tabpanel',
        id: `ob-tab-panel-${index}`,
        hidden: index === 0 ? undefined : true
      },
      panel.children
    )
  )

  return h('div.obsidian-tabs.not-prose', [
    h('div.tablist-wrapper.not-content', [
      h(
        'ul.my-0',
        { role: 'tablist' },
        panels.map((panel, index) =>
          h('li.tab', { role: 'presentation' }, [
            h(
              'button',
              {
                type: 'button',
                role: 'tab',
                class: index === 0 ? 'is-active' : undefined,
                'aria-selected': index === 0 ? 'true' : 'false',
                'data-panel': `ob-tab-panel-${index}`
              },
              panel.label
            )
          ])
        )
      )
    ]),
    ...panelNodes
  ]) as RootContent
}

function createTimeline(listNode: Element) {
  const items = listNode.children.filter((child): child is Element => isElement(child, 'li'))
  return h('div.obsidian-timeline.not-prose', [
    h(
      'ul.ps-0.sm:ps-2',
      items.map((item, index) => {
        const children = item.children.filter((child) => !isWhitespaceText(child))
        const firstElement = children.find((child): child is Element => child.type === 'element')
        const lead = firstElement ? splitLeadParagraph(firstElement) : { heading: '', remainder: '' }
        const date = lead.heading || `Step ${index + 1}`
        const body = [
          ...(lead.remainder ? [h('p', lead.remainder) as RootContent] : []),
          ...children.slice(firstElement ? children.indexOf(firstElement) + 1 : 0)
        ]
        return h('li.group.relative.flex.list-none.gap-x-3.rounded-full.ps-0.sm:gap-x-2', [
          h('span.z-10.my-2.ms-2.h-3.w-3.min-w-3.rounded-full.border-2.border-muted-foreground'),
          index !== items.length - 1
            ? h('span.absolute.start-[12px].top-[20px].w-1.bg-border', {
                style: 'height:calc(100% - 4px)'
              })
            : null,
          h('div.flex.gap-2.max-sm:flex-col', [
            h('samp.w-fit.grow-0.rounded-md.py-1.text-sm.max-sm:bg-primary-foreground.max-sm:px-2.sm:min-w-[82px].sm:text-right', date),
            h('div', body.length ? body : [h('p', date)])
          ])
        ])
      })
    )
  ]) as RootContent
}

function createCards(listNode: Element) {
  const cards = listNode.children
    .filter((child): child is Element => isElement(child, 'li'))
    .map((item) => {
      const children = item.children.filter((child) => !isWhitespaceText(child))
      const firstElement = children.find((child): child is Element => child.type === 'element')
      const lead = firstElement ? splitLeadParagraph(firstElement) : { heading: '', remainder: '' }
      const title = lead.heading || 'Card'
      const body = [
        ...(lead.remainder ? [h('p', lead.remainder) as RootContent] : []),
        ...children.slice(firstElement ? children.indexOf(firstElement) + 1 : 0)
      ]
      return h('article.obsidian-card.rounded-2xl.border.bg-muted.px-5.py-3', [
        h('h3.text-lg.font-medium', title),
        h('div.mt-2', body.length ? body : [h('p', title)])
      ])
    })

  return h('div.obsidian-card-grid.not-prose', cards) as RootContent
}

function createCardsFromHeadings(nodes: RootContent[]) {
  const sections = splitHeadingSections(nodes)
  if (!sections.length) return null
  return h(
    'div.obsidian-card-grid.not-prose',
    sections.map((section) =>
      h('article.obsidian-card.rounded-2xl.border.bg-muted.px-5.py-3', [
        h('h3.text-lg.font-medium', section.label),
        h('div.mt-2', section.children)
      ])
    )
  ) as RootContent
}

function splitHeadingSections(nodes: RootContent[]) {
  const sections: { label: string; children: RootContent[] }[] = []
  let current: { label: string; children: RootContent[] } | null = null

  for (const node of nodes) {
    if (isHeadingSection(node)) {
      if (current) sections.push(current)
      current = { label: extractText(node).trim() || 'Section', children: [] }
      continue
    }

    if (current) current.children.push(node)
  }

  if (current) sections.push(current)
  return sections
}

function selectBlock(children: RootContent[], startIndex: number) {
  let cursor = startIndex
  while (cursor < children.length && isIgnorableNode(children[cursor])) {
    cursor += 1
  }

  const startNode = children[cursor]
  if (!startNode) return null

  if (isElement(startNode) && /^h[1-6]$/u.test(startNode.tagName)) {
    const level = Number(startNode.tagName.slice(1))
    const nodes: RootContent[] = [startNode]
    let endCursor = cursor + 1
    while (endCursor < children.length) {
      const candidate = children[endCursor]
      if (isElement(candidate) && /^h[1-6]$/u.test(candidate.tagName)) {
        const nextLevel = Number(candidate.tagName.slice(1))
        if (nextLevel <= level) break
      }
      nodes.push(candidate)
      endCursor += 1
    }
    return { nodes, endIndex: endCursor - 1 }
  }

  if (isElement(startNode) && ['ul', 'ol', 'blockquote', 'pre', 'table'].includes(startNode.tagName)) {
    return { nodes: [startNode], endIndex: cursor }
  }

  return null
}

function findClosingContainer(children: RootContent[], startIndex: number) {
  for (let index = startIndex; index < children.length; index += 1) {
    if (isParagraphText(children[index], ':::')) return index
  }
  return -1
}

function isTabsContainerStart(node: RootContent) {
  const value = getParagraphText(node)
  return value ? /^:::\s*tabs\s*$/iu.test(value) : false
}

function readTabLabel(node: RootContent) {
  const value = getParagraphText(node)
  const match = value?.match(/^@tab\s+(.+)$/iu)
  return match?.[1]?.trim() || ''
}

function readAnyBlockSelector(node: RootContent) {
  const value = getParagraphText(node)
  if (!value?.startsWith('[') || !value.endsWith(']')) return null
  return normalizeAnyBlockSelector(value)
}

function isParagraphText(node: RootContent, expected: string) {
  return getParagraphText(node)?.trim() === expected
}

function getParagraphText(node: RootContent) {
  if (!isElement(node, 'p')) return null
  return extractText(node).trim()
}

function extractText(node: RootContent | Element): string {
  if (node.type === 'text') return node.value
  if ('children' in node) {
    return node.children.map((child) => extractText(child as RootContent)).join('')
  }
  return ''
}

function isElement(node: RootContent | Element | null | undefined, tagName?: string): node is Element {
  return Boolean(node && node.type === 'element' && (!tagName || node.tagName === tagName))
}

function isParentElement(node: RootContent): node is Element {
  return node.type === 'element' && Array.isArray(node.children)
}

function isHeadingSection(node: RootContent | undefined): node is Element {
  return Boolean(node && isElement(node) && /^h[1-6]$/u.test(node.tagName))
}

function toClassNames(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.flatMap((item) => toClassNames(item))
  if (typeof value === 'string') return value.split(/\s+/u).filter(Boolean)
  return []
}

function isWhitespaceText(node: RootContent) {
  return node.type === 'text' && !node.value.trim()
}

function isIgnorableNode(node: RootContent | undefined) {
  return Boolean(
    node &&
      ((node.type === 'text' && !node.value.trim()) ||
        (node.type === 'comment' && !String(node.value || '').trim()))
  )
}

function splitLeadParagraph(node: Element) {
  const text = extractText(node)
  const [heading, ...rest] = text.split('\n')
  return {
    heading: heading.trim(),
    remainder: rest.join('\n').trim()
  }
}

function renderCallout(node: Element) {
  const contentChildren = node.children.filter((child) => !isIgnorableNode(child))
  const firstParagraph = contentChildren.find((child): child is Element => isElement(child, 'p'))
  if (!firstParagraph) return null

  const paragraphText = extractText(firstParagraph)
  const [markerLine, ...restLines] = paragraphText.split('\n')
  const match = markerLine.match(/^\[!([a-zA-Z-]+)\]([+-])?\s*(.*)$/u)
  if (!match) return null

  const rawType = match[1].toLowerCase()
  const type = calloutTypeMap[rawType] ?? 'note'
  const foldMarker = match[2] ?? ''
  const title = (match[3] || rawType).trim()
  const bodyChildren: RootContent[] = []

  if (restLines.join('\n').trim()) {
    bodyChildren.push(h('p', restLines.join('\n').trim()) as RootContent)
  }

  const firstParagraphIndex = contentChildren.indexOf(firstParagraph)
  for (const child of contentChildren.slice(firstParagraphIndex + 1)) {
    if (isParentElement(child)) walkCallouts(child)
    bodyChildren.push(child)
  }

  return foldMarker === '+' || foldMarker === '-'
    ? createCollapse(type, title, bodyChildren, foldMarker === '+')
    : createCallout(type, title, bodyChildren)
}

function walkEmbedParagraphs(parent: Root | Element) {
  const children = [...parent.children]
  const nextChildren: RootContent[] = []

  for (const node of children) {
    if (isElement(node, 'p') && node.children.length === 1) {
      const onlyChild = node.children[0]
      if (isElement(onlyChild, 'a')) {
        const classNames = toClassNames(onlyChild.properties.className)
        if (classNames.includes('obsidian-note-embed')) {
          nextChildren.push(
            h('div.obsidian-note-embed-card.not-prose', [
              h('p.obsidian-note-embed-label', 'Embedded note'),
              onlyChild
            ]) as RootContent
          )
          continue
        }
      }
    }

    if (isParentElement(node)) walkEmbedParagraphs(node)
    nextChildren.push(node)
  }

  parent.children = nextChildren
}

function normalizeAnyBlockSelector(input: string) {
  const token = input.trim().slice(1, -1).split('|')[0]?.trim()
  if (!token) return null
  return selectorMap.get(token.toLowerCase()) ?? selectorMap.get(token)
}

function startsCommentBlock(value: string) {
  return value.startsWith('%%')
}

function endsCommentBlock(value: string) {
  return value.endsWith('%%')
}
