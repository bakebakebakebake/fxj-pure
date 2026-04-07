import { promises as fs } from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const targetRoot = path.join(projectRoot, 'src/content/docs')
const localPrivateDocTargets = [
  path.join(targetRoot, 'agent-memory-teaching', '12-interview-guide.md'),
  path.join(
    targetRoot,
    'mit-6.824',
    '04-面试',
    '01-MIT 6.824 面试题库：Lab1-Lab3 高频题与标准答法.md'
  )
]

const teachingRoot = '/Users/xjf/Public/Code/Agent-Project/docs/teaching'
const mitRoot =
  '/Users/xjf/Library/Mobile Documents/iCloud~md~obsidian/Documents/WORK/30-资源/课程资料/MIT6.824/notes'

const mitSectionMap = {
  '00-总览': { section: 'overview', titleZh: '总览' },
  '01-基础': { section: 'fundamentals', titleZh: '基础' },
  '02-实验': { section: 'labs', titleZh: '实验' },
  '03-论文': { section: 'papers', titleZh: '论文' },
  '04-面试': { section: 'interviews', titleZh: '面试' }
}

const mitSubsectionMap = {
  'Lab1-MapReduce': { subsection: 'lab1', titleZh: 'Lab 1 · MapReduce' },
  'Lab2-Raft': { subsection: 'lab2', titleZh: 'Lab 2 · Raft' },
  'Lab3-KVRaft': { subsection: 'lab3', titleZh: 'Lab 3 · KVRaft' }
}

await main()

async function main() {
  const privateDocBackups = await backupLocalPrivateDocs()
  await fs.rm(targetRoot, { recursive: true, force: true })
  await fs.mkdir(targetRoot, { recursive: true })

  await importTeachingDocs()
  await importMitDocs()
  await restoreLocalPrivateDocs(privateDocBackups)
}

async function importTeachingDocs() {
  const entries = await fs.readdir(teachingRoot, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    if (entry.name === '12-interview-guide.md') continue

    const sourcePath = path.join(teachingRoot, entry.name)
    const targetPath = path.join(targetRoot, 'agent-memory-teaching', entry.name)
    const { body, description, title } = await normalizeMarkdown(sourcePath)

    const metadata = {
      title,
      description,
      order: extractOrder(entry.name),
      source: 'agent-memory',
      sourceTitle: 'Agent Memory 教学',
      section: 'teaching',
      sectionTitle: '教学路径',
      language: 'zh',
      tags: ['docs', 'agent-memory', 'teaching']
    }

    await writeDoc(targetPath, metadata, body)
  }
}

async function importMitDocs() {
  await walkMarkdown(mitRoot, async (sourcePath) => {
    const relativePath = path.relative(mitRoot, sourcePath)
    const targetPath = path.join(targetRoot, 'mit-6.824', relativePath)
    const parts = relativePath.split(path.sep)
    const sectionMeta = mitSectionMap[parts[0]]

    if (!sectionMeta) {
      throw new Error(`Unknown MIT section for: ${relativePath}`)
    }
    if (sectionMeta.section === 'interviews') return

    const subsectionMeta = parts[1] ? mitSubsectionMap[parts[1]] : undefined
    const { body, description, title } = await normalizeMarkdown(sourcePath)

    const metadata = {
      title,
      description,
      order: extractOrder(path.basename(sourcePath)),
      source: 'mit-6.824',
      sourceTitle: 'MIT 6.824 学习笔记',
      section: sectionMeta.section,
      sectionTitle: sectionMeta.titleZh,
      subsection: subsectionMeta?.subsection,
      subsectionTitle: subsectionMeta?.titleZh,
      language: 'zh',
      tags: buildMitTags(sectionMeta.section, subsectionMeta?.subsection)
    }

    await writeDoc(targetPath, metadata, body)
  })
}

async function normalizeMarkdown(sourcePath) {
  const raw = (await fs.readFile(sourcePath, 'utf8')).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = raw.split('\n')

  let cursor = 0
  while (cursor < lines.length && !lines[cursor].trim()) cursor += 1

  const headingLine = lines[cursor] ?? ''
  const title = headingLine.startsWith('# ')
    ? headingLine.slice(2).trim()
    : path.basename(sourcePath, path.extname(sourcePath))

  if (headingLine.startsWith('# ')) cursor += 1
  while (cursor < lines.length && !lines[cursor].trim()) cursor += 1

  let description = ''
  let bodyStart = cursor

  if (lines[cursor]?.trim().startsWith('>')) {
    const quoteLines = []
    while (cursor < lines.length && lines[cursor].trim().startsWith('>')) {
      quoteLines.push(lines[cursor].trim().replace(/^>\s?/, ''))
      cursor += 1
    }
    description = quoteLines.join(' ').trim()
    while (cursor < lines.length && !lines[cursor].trim()) cursor += 1
    bodyStart = cursor
  } else {
    const paragraph = extractFirstParagraph(lines, cursor)
    description = paragraph.text
    bodyStart = paragraph.end
  }

  while (lines[bodyStart]?.trim() === '---') {
    bodyStart += 1
    while (bodyStart < lines.length && !lines[bodyStart].trim()) bodyStart += 1
  }

  const body = lines.slice(bodyStart).join('\n').replace(/^\n+/, '')

  return {
    title: title.slice(0, 60),
    description: description.slice(0, 160),
    body
  }
}

function extractFirstParagraph(lines, startIndex) {
  const paragraph = []
  let inCodeFence = false
  let paragraphStart = -1
  let cursor = startIndex

  for (; cursor < lines.length; cursor += 1) {
    const trimmed = lines[cursor].trim()
    if (trimmed.startsWith('```')) {
      inCodeFence = !inCodeFence
      continue
    }
    if (inCodeFence) continue
    if (!trimmed) {
      if (paragraph.length) break
      continue
    }
    if (trimmed.startsWith('#')) continue
    if (trimmed.startsWith('>')) continue
    if (paragraphStart === -1) paragraphStart = cursor
    paragraph.push(trimmed.replace(/^[-*]\s+/, ''))
  }

  while (cursor < lines.length && !lines[cursor].trim()) cursor += 1

  return {
    text: paragraph.join(' ').trim() || '中文文档。',
    end: paragraphStart === -1 ? startIndex : cursor
  }
}

function extractOrder(name) {
  const match = name.match(/^(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 999
}

function buildMitTags(section, subsection) {
  const tags = ['docs', 'mit-6.824', section]
  if (subsection) tags.push(subsection)
  return tags
}

async function writeDoc(targetPath, metadata, body) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  const frontmatter = toFrontmatter(metadata)
  const content = `${frontmatter}\n${body.trimStart()}\n`
  await fs.writeFile(targetPath, content, 'utf8')
}

function toFrontmatter(metadata) {
  const lines = ['---']
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((item) => `'${escapeYaml(item)}'`).join(', ')}]`)
      continue
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${key}: ${value}`)
      continue
    }
    lines.push(`${key}: '${escapeYaml(value)}'`)
  }
  lines.push('---')
  return lines.join('\n')
}

function escapeYaml(value) {
  return String(value).replaceAll("'", "''")
}

async function walkMarkdown(root, onFile) {
  const entries = await fs.readdir(root, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      await walkMarkdown(fullPath, onFile)
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      await onFile(fullPath)
    }
  }
}

async function backupLocalPrivateDocs() {
  const backups = []

  for (const targetPath of localPrivateDocTargets) {
    try {
      const content = await fs.readFile(targetPath, 'utf8')
      backups.push({ targetPath, content })
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }

  return backups
}

async function restoreLocalPrivateDocs(backups) {
  for (const backup of backups) {
    await fs.mkdir(path.dirname(backup.targetPath), { recursive: true })
    await fs.writeFile(backup.targetPath, backup.content, 'utf8')
  }
}
