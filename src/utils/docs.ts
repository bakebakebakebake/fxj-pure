import type { CollectionEntry } from 'astro:content'

export type DocsEntry = CollectionEntry<'docs'>

export type DocsLocale = 'zh' | 'en'

type DocsSectionMeta = {
  key: string
  title: Record<DocsLocale, string>
}

type DocsSourceMeta = {
  key: string
  title: Record<DocsLocale, string>
  description: Record<DocsLocale, string>
  startDocId: string
  sections: DocsSectionMeta[]
}

type DocsSubsectionMeta = {
  key: string
  title: Record<DocsLocale, string>
}

export type DocsTreeSubsection = DocsSubsectionMeta & {
  entries: DocsEntry[]
}

export type DocsTreeSection = DocsSectionMeta & {
  entries: DocsEntry[]
  subsections: DocsTreeSubsection[]
}

export type DocsTreeSource = DocsSourceMeta & {
  entries: DocsEntry[]
  sections: DocsTreeSection[]
}

export type DocsSiblings = {
  prev?: DocsEntry
  next?: DocsEntry
}

export const docsSourceMeta: DocsSourceMeta[] = [
  {
    key: 'agent-memory',
    title: {
      zh: 'Agent Memory 文档',
      en: 'Agent Memory Docs'
    },
    description: {
      zh: '围绕 Agent Memory Engine 的项目背景、架构、算法、协议与部署说明。',
      en: 'Documentation for Agent Memory Engine, covering architecture, algorithms, APIs and delivery.'
    },
    startDocId: 'agent-memory-teaching/01-project-overview',
    sections: [
      {
        key: 'teaching',
        title: {
          zh: '教学路径',
          en: 'Teaching Path'
        }
      }
    ]
  },
  {
    key: 'mit-6.824',
    title: {
      zh: 'MIT 6.824 学习笔记',
      en: 'MIT 6.824 Notes'
    },
    description: {
      zh: '按总览、基础、实验、论文模块整理的 6.824 学习资料。',
      en: 'Structured study notes for MIT 6.824 across overview, fundamentals, labs and papers.'
    },
    startDocId: 'mit-6824/00-总览/01-mit-6824-分布式系统学习完全指南2020版',
    sections: [
      { key: 'overview', title: { zh: '总览', en: 'Overview' } },
      { key: 'fundamentals', title: { zh: '基础', en: 'Fundamentals' } },
      { key: 'labs', title: { zh: '实验', en: 'Labs' } },
      { key: 'papers', title: { zh: '论文', en: 'Papers' } },
      { key: 'interviews', title: { zh: '面试', en: 'Interviews' } }
    ]
  }
]

export const docsSubsectionMeta: DocsSubsectionMeta[] = [
  { key: 'lab1', title: { zh: 'Lab 1 · MapReduce', en: 'Lab 1 · MapReduce' } },
  { key: 'lab2', title: { zh: 'Lab 2 · Raft', en: 'Lab 2 · Raft' } },
  { key: 'lab3', title: { zh: 'Lab 3 · KVRaft', en: 'Lab 3 · KVRaft' } }
]

export function sortDocsEntries(entries: DocsEntry[]) {
  return [...entries].sort((left, right) => {
    const sourceDiff = getSourceOrder(left) - getSourceOrder(right)
    if (sourceDiff !== 0) return sourceDiff

    const sectionDiff = getSectionOrder(left) - getSectionOrder(right)
    if (sectionDiff !== 0) return sectionDiff

    const subsectionDiff = getSubsectionOrder(left) - getSubsectionOrder(right)
    if (subsectionDiff !== 0) return subsectionDiff

    const orderDiff = left.data.order - right.data.order
    if (orderDiff !== 0) return orderDiff

    return left.data.title.localeCompare(right.data.title, 'zh-CN')
  })
}

export function buildDocsTree(entries: DocsEntry[]): DocsTreeSource[] {
  const sortedEntries = sortDocsEntries(entries)

  return docsSourceMeta
    .map((sourceMeta) => {
      const sourceEntries = sortedEntries.filter((entry) => entry.data.source === sourceMeta.key)
      if (!sourceEntries.length) return null

      const sections: DocsTreeSection[] = sourceMeta.sections
        .map((sectionMeta) => {
          const sectionEntries = sourceEntries.filter(
            (entry) => entry.data.section === sectionMeta.key
          )
          if (!sectionEntries.length) return null

          const subsectionKeys = [
            ...new Set(sectionEntries.map((entry) => entry.data.subsection).filter(Boolean))
          ] as string[]

          const subsections = subsectionKeys
            .map((subsectionKey) => {
              const subsectionMeta = docsSubsectionMeta.find((item) => item.key === subsectionKey)
              if (!subsectionMeta) return null

              return {
                ...subsectionMeta,
                entries: sectionEntries.filter((entry) => entry.data.subsection === subsectionKey)
              }
            })
            .filter((item): item is DocsTreeSubsection => item !== null)

          return {
            ...sectionMeta,
            entries: sectionEntries.filter((entry) => !entry.data.subsection),
            subsections
          } satisfies DocsTreeSection
        })
        .filter((item): item is DocsTreeSection => item !== null)

      return {
        ...sourceMeta,
        entries: sourceEntries,
        sections
      } satisfies DocsTreeSource
    })
    .filter((item): item is DocsTreeSource => item !== null)
}

export function getDocsSiblings(entries: DocsEntry[], currentEntry: DocsEntry): DocsSiblings {
  const relatedEntries = sortDocsEntries(entries).filter(
    (entry) => entry.data.source === currentEntry.data.source
  )
  const currentIndex = relatedEntries.findIndex((entry) => entry.id === currentEntry.id)

  if (currentIndex === -1) return {}

  return {
    prev: currentIndex > 0 ? relatedEntries[currentIndex - 1] : undefined,
    next: currentIndex < relatedEntries.length - 1 ? relatedEntries[currentIndex + 1] : undefined
  }
}

function getSourceOrder(entry: DocsEntry) {
  const index = docsSourceMeta.findIndex((item) => item.key === entry.data.source)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

function getSectionOrder(entry: DocsEntry) {
  const source = docsSourceMeta.find((item) => item.key === entry.data.source)
  if (!source) return Number.MAX_SAFE_INTEGER
  const index = source.sections.findIndex((item) => item.key === entry.data.section)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

function getSubsectionOrder(entry: DocsEntry) {
  if (!entry.data.subsection) return -1
  const index = docsSubsectionMeta.findIndex((item) => item.key === entry.data.subsection)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}
