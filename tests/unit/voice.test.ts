import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../../', import.meta.url))

// The copy and code under src/, as paths relative to the repo.
const sources = (readdirSync(join(root, 'src'), { recursive: true, encoding: 'utf8' }) as string[])
  .map((f) => `src/${f.split('\\').join('/')}`)
  .filter((f) => /\.(astro|md|mdx|ts)$/.test(f))
  .sort()

const scanned = [...sources, 'holding/index.html']

// `file:line: text` for every line of the files that matches.
function find(files: string[], pattern: RegExp): string[] {
  return files.flatMap((file) =>
    readFileSync(join(root, file), 'utf8')
      .split(/\r?\n/)
      .flatMap((line, i) => (pattern.test(line) ? [`${file}:${i + 1}: ${line.trim()}`] : [])),
  )
}

describe('voice', () => {
  it('scans the copy', () => {
    expect(sources.some((f) => f.startsWith('src/content/docs/'))).toBe(true)
    expect(sources.some((f) => f.endsWith('.astro'))).toBe(true)
  })

  it('no 你 in the copy', () => {
    expect(find(scanned, /你/)).toEqual([])
  })

  it('主人 only as 机器人的主人 or 主人名', () => {
    expect(find(scanned, /(?<!机器人的)主人(?!名)/)).toEqual([])
  })

  it('no clock times in the content', () => {
    const content = sources.filter((f) => f.startsWith('src/content/'))
    expect(find(content, /\d{1,2}:\d{2}/)).toEqual([])
  })

  it('no IPv4 address anywhere', () => {
    expect(find(scanned, /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/)).toEqual([])
  })
})
