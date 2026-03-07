import fs from 'node:fs'
import path from 'node:path'

const sourceRoot =
  process.argv[2] ??
  '/Users/xjf/Library/Mobile Documents/iCloud~md~obsidian/Documents/WORK/.obsidian'
const targetRoot = path.resolve('src/content/.obsidian')

fs.mkdirSync(targetRoot, { recursive: true })
fs.mkdirSync(path.join(targetRoot, 'snippets'), { recursive: true })

const sourceAppearance = readJson(path.join(sourceRoot, 'appearance.json'))
const sourceCorePlugins = readJson(path.join(sourceRoot, 'core-plugins.json'))
const sourceApp = readJson(path.join(sourceRoot, 'app.json'))

const nextAppearance = {
  cssTheme: sourceAppearance.cssTheme ?? '',
  accentColor: sourceAppearance.accentColor ?? '#7c83bb',
  theme: sourceAppearance.theme ?? 'system',
  enabledCssSnippets: sourceAppearance.enabledCssSnippets ?? [],
  nativeMenus: Boolean(sourceAppearance.nativeMenus),
  baseFontSize: sourceAppearance.baseFontSize ?? 14,
  monospaceFontFamily:
    sourceAppearance.monospaceFontFamily ?? 'JetBrains Maple Mono,JetBrains Mono,Consolas',
  translucency: Boolean(sourceAppearance.translucency)
}

const nextApp = {
  useMarkdownLinks: Boolean(sourceApp.useMarkdownLinks),
  newFileLocation: sourceApp.newFileLocation ?? 'current',
  newLinkFormat: sourceApp.newLinkFormat ?? 'relative',
  alwaysUpdateLinks: Boolean(sourceApp.alwaysUpdateLinks),
  readableLineLength: Boolean(sourceApp.readableLineLength),
  showLineNumber: Boolean(sourceApp.showLineNumber),
  autoConvertHtml: Boolean(sourceApp.autoConvertHtml),
  pdfExportSettings: sourceApp.pdfExportSettings ?? {
    includeName: true,
    pageSize: 'Letter',
    landscape: false,
    margin: '0',
    downscalePercent: 100
  },
  propertiesInDocument: sourceApp.propertiesInDocument ?? 'visible',
  vimMode: Boolean(sourceApp.vimMode),
  promptDelete: Boolean(sourceApp.promptDelete),
  strictLineBreaks: Boolean(sourceApp.strictLineBreaks),
  showInlineTitle: Boolean(sourceApp.showInlineTitle),
  showUnsupportedFiles: sourceApp.showUnsupportedFiles ?? true
}

writeJson(path.join(targetRoot, 'appearance.json'), nextAppearance)
writeJson(path.join(targetRoot, 'core-plugins.json'), sourceCorePlugins)
writeJson(path.join(targetRoot, 'app.json'), nextApp)

for (const snippetName of nextAppearance.enabledCssSnippets) {
  const sourcePath = path.join(sourceRoot, 'snippets', `${snippetName}.css`)
  const targetPath = path.join(targetRoot, 'snippets', `${snippetName}.css`)
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath)
  }
}

console.log(`Synced Obsidian appearance/config into ${targetRoot}`)

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}
