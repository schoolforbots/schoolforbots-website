import { readdir, readFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const ID = /^[a-z0-9-]+$/
const RELEASE = { 拦: 'block', 允许: 'allow' }

export const scanDirs = ['src', 'public', 'holding']
export const scanExtensions = ['.astro', '.md', '.mdx', '.ts', '.mjs', '.css', '.svg', '.json']

/**
 * Reads the registry table in PLACEHOLDERS.md. Throws on a malformed row,
 * an unknown last column or a repeated id.
 * @param {string} markdown
 * @returns {{ id: string; release: 'block' | 'allow' }[]}
 */
export function parseRegistry(markdown) {
  const rows = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|'))
  if (rows.length < 2) throw new Error('PLACEHOLDERS.md 里没有登记表')
  const cells = (row) => row.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
  const header = cells(rows[0])
  if (header.length !== 4 || header[0] !== 'id' || header[3] !== '正式发布') {
    throw new Error('登记表的表头应是：id | 是什么 | 在哪 | 正式发布')
  }
  const registry = []
  const seen = new Set()
  for (const row of rows.slice(2)) {
    const c = cells(row)
    if (c.length !== 4) throw new Error(`登记表的行格式不对：${row}`)
    const [id, , , release] = c
    if (!ID.test(id)) throw new Error(`登记表里的 id 不合规：${id}`)
    if (!(release in RELEASE)) throw new Error(`登记表里 ${id} 的“正式发布”只能是“拦”或“允许”，现在是“${release}”`)
    if (seen.has(id)) throw new Error(`登记表里 id 重复：${id}`)
    seen.add(id)
    registry.push({ id, release: RELEASE[release] })
  }
  return registry
}

// Attributes may be quoted with either quote, hold `>` inside quotes or braces,
// and the tag may span lines. `\sid=` keeps `data-id="x"` from matching.
const tagMarker = /<Placeholder\b(?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*?\sid=(["'])([a-z0-9-]+)\1/g
const commentMarker = /@placeholder\(([a-z0-9-]+)\)/g

/**
 * Finds every placeholder marker. Lines are 1-based; a tag reports the line
 * where `<Placeholder` starts.
 * @param {{ path: string; text: string }[]} files
 * @returns {{ id: string; path: string; line: number }[]}
 */
export function findMarkers(files) {
  const markers = []
  for (const { path, text } of files) {
    const lineAt = (index) => text.slice(0, index).split(/\r\n|\r|\n/).length
    const found = []
    for (const match of text.matchAll(tagMarker)) {
      found.push({ id: match[2], path, index: match.index })
    }
    for (const match of text.matchAll(commentMarker)) {
      found.push({ id: match[1], path, index: match.index })
    }
    found.sort((x, y) => x.index - y.index)
    for (const { id, index } of found) markers.push({ id, path, line: lineAt(index) })
  }
  return markers
}

/**
 * @param {{ id: string; release: 'block' | 'allow' }[]} registry
 * @param {{ id: string; path: string; line: number }[]} markers
 * @param {{ release: boolean; frameworks: { plugin: unknown }[] }} opts
 * @returns {{ errors: string[]; warnings: string[] }}
 */
export function checkPlaceholders(registry, markers, opts) {
  const errors = []
  const warnings = []
  const rows = new Map(registry.map((row) => [row.id, row]))
  for (const m of markers) {
    if (!rows.has(m.id)) {
      errors.push(`${m.path}:${m.line} 占位 ${m.id} 没有在 PLACEHOLDERS.md 里登记`)
    }
  }
  for (const row of registry) {
    const found = markers.filter((m) => m.id === row.id)
    if (found.length === 0) {
      errors.push(`占位 ${row.id} 已经没有标记了，登记已过期，请从 PLACEHOLDERS.md 删掉这一行`)
    } else if (row.release === 'block') {
      for (const m of found) {
        const message = `${m.path}:${m.line} 占位 ${m.id} 还没填好，正式发布前必须填好`
        if (opts.release) errors.push(message)
        else warnings.push(message)
      }
    }
  }
  if (opts.release && !opts.frameworks.some((f) => f.plugin)) {
    errors.push('正式发布需要至少一个框架的插件已经发布：没有一个框架有插件')
  }
  return { errors, warnings }
}

async function walk(dir, root, out) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) await walk(full, root, out)
    else if (scanExtensions.some((ext) => entry.name.endsWith(ext))) out.push(full)
  }
}

/**
 * Reads the registry and every scannable file under `root`.
 * @param {string} root
 * @returns {Promise<{ registry: ReturnType<typeof parseRegistry>; markers: ReturnType<typeof findMarkers> }>}
 */
export async function scanRepository(root) {
  const registry = parseRegistry(await readFile(join(root, 'PLACEHOLDERS.md'), 'utf8'))
  const paths = []
  for (const dir of scanDirs) await walk(join(root, dir), root, paths)
  const rootEntries = await readdir(root, { withFileTypes: true })
  for (const entry of rootEntries) {
    if (entry.isFile() && /^astro.*\.mjs$/.test(entry.name)) paths.push(join(root, entry.name))
  }
  paths.sort()
  const files = []
  for (const path of paths) {
    files.push({ path: relative(root, path).split(sep).join('/'), text: await readFile(path, 'utf8') })
  }
  return { registry, markers: findMarkers(files) }
}
