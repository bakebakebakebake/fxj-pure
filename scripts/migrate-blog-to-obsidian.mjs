import fs from 'node:fs'
import path from 'node:path'

const blogRoot = path.resolve('src/content/blog')
const files = walk(blogRoot).filter((filePath) => filePath.endsWith('.mdx'))
const manualFiles = new Set([
  path.join(blogRoot, 'comprehensive-syntax-test.mdx'),
  path.join(blogRoot, 'syntax-test/index.mdx'),
  path.join(blogRoot, 'test.mdx')
])

for (const filePath of files) {
  if (manualFiles.has(filePath)) continue

  let source = fs.readFileSync(filePath, 'utf8')
  source = source.replace(/^import .*astro-pure.*\n/gu, '')
  source = transformLabelBlocks(source)
  source = transformAsides(source)
  source = transformCollapses(source)
  source = transformSteps(source)
  source = transformTabs(source)
  source = transformTimelines(source)
  source = cleanupBlankLines(source).trimEnd() + '\n'

  const nextPath = filePath.replace(/\.mdx$/u, '.md')
  fs.writeFileSync(nextPath, source)
  fs.unlinkSync(filePath)
}

console.log(`Migrated ${files.length - manualFiles.size} blog files to Markdown.`)

function walk(dir) {
  const result = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const absPath = path.join(dir, entry.name)
    if (entry.isDirectory()) result.push(...walk(absPath))
    else result.push(absPath)
  }
  return result
}

function transformLabelBlocks(source) {
  return source.replace(
    /<div class=['"]not-prose flex flex-wrap gap-3 text-sm['"]>\s*([\s\S]*?)\s*<\/div>/gu,
    (_, body) => {
      const labels = [...body.matchAll(/<Label title=['"](.+?)['"]\s*\/>/gu)].map((match) => match[1])
      if (!labels.length) return body
      return labels.map((label) => `\`${label}\``).join(' ')
    }
  )
}

function transformAsides(source) {
  return source.replace(/<Aside([^>]*)>([\s\S]*?)<\/Aside>/gu, (_, rawAttrs, body) => {
    const type = readAttr(rawAttrs, 'type') || 'note'
    const title = readAttr(rawAttrs, 'title') || defaultCalloutTitle(type)
    return toCallout(type, title, body)
  })
}

function transformCollapses(source) {
  return source.replace(/<Collapse([^>]*)>([\s\S]*?)<\/Collapse>/gu, (_, rawAttrs, body) => {
    const title = readAttr(rawAttrs, 'title') || 'Details'
    return toCallout('note-', title, body)
  })
}

function transformSteps(source) {
  return source.replace(/<Steps>\s*([\s\S]*?)\s*<\/Steps>/gu, (_, body) => {
    return `<!--steps-->\n\n${body.trim()}`
  })
}

function transformTabs(source) {
  return source.replace(/<Tabs>\s*([\s\S]*?)\s*<\/Tabs>/gu, (_, body) => {
    const panels = [...body.matchAll(/<TabItem label=['"](.+?)['"]>\s*([\s\S]*?)\s*<\/TabItem>/gu)]
    if (!panels.length) return body
    const lines = ['::: tabs', '']
    for (const [, label, panelBody] of panels) {
      lines.push(`@tab ${label}`, '', panelBody.trim(), '')
    }
    lines.push(':::')
    return lines.join('\n')
  })
}

function transformTimelines(source) {
  return source.replace(/<Timeline\s+events=\{([\s\S]*?)\}\s*\/>/gu, (_, rawArray) => {
    const events = Function(`"use strict"; return (${rawArray});`)()
    const lines = ['[timeline]', '']
    for (const event of events) {
      lines.push(`- ${String(event.date).trim()}`)
      const contentLines = String(event.content).trim().split('\n')
      for (const line of contentLines) {
        lines.push(`  ${line.trim()}`)
      }
      lines.push('')
    }
    return lines.join('\n').trimEnd()
  })
}

function toCallout(type, title, body) {
  const quotePrefix = type.endsWith('-') ? `[!${type.slice(0, -1)}]- ${title}` : `[!${type}] ${title}`
  const bodyLines = body
    .trim()
    .split('\n')
    .map((line) => (line.length ? `> ${line}` : '>'))
    .join('\n')
  return `> ${quotePrefix}\n${bodyLines}`
}

function defaultCalloutTitle(type) {
  return type.toUpperCase()
}

function readAttr(rawAttrs, attrName) {
  const match = rawAttrs.match(new RegExp(`${attrName}=['"](.+?)['"]`, 'u'))
  return match?.[1] ?? ''
}

function cleanupBlankLines(source) {
  return source
    .replace(/\n{3,}/gu, '\n\n')
    .replace(/\n+::: tabs/gu, '\n\n::: tabs')
    .replace(/\n+\[timeline\]/gu, '\n\n[timeline]')
}

