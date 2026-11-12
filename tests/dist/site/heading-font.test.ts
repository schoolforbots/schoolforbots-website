import { readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { displayTitleSelector } from '../../../src/config/display-titles.mjs'
import { distExists, distPath, listDist, readDist, readPage } from '../helpers'

const hasFont = distExists('fonts/heading.woff2')

describe('heading font', () => {
  it.skipIf(!hasFont)('the heading font is at most 150 KB', () => {
    expect(statSync(distPath('fonts/heading.woff2')).size).toBeLessThanOrEqual(150 * 1024)
  })

  it('the build produces the font and the list of characters it was cut for', () => {
    expect(hasFont).toBe(true)
    expect(distExists('fonts/heading.chars.txt')).toBe(true)
  })

  // Proves the subset request covers the large titles; it does not read the font's own cmap.
  it.skipIf(!hasFont)('every large-title character in the built pages is in the subset request', () => {
    const requested = new Set(readDist('fonts/heading.chars.txt'))
    const missing = new Set<string>()
    for (const file of listDist('.html')) {
      for (const title of readPage(`/${file}`).querySelectorAll(displayTitleSelector)) {
        for (const ch of (title.textContent ?? '').replace(/\s+/g, '')) {
          if (!requested.has(ch)) missing.add(`${ch} (${file})`)
        }
      }
    }
    expect([...missing]).toEqual([])
  })

  it('the heading font applies to the large titles only', () => {
    const page = readPage('/')
    const headingRules = [...page.querySelectorAll('style')]
      .map((s) => s.textContent ?? '')
      .join('\n')
      .match(/[^{}]+\{[^}]*--sfb-font-heading[^}]*\}/g) ?? []
    const css = [...listDist('.css').map((f) => readDist(f)), ...headingRules].join('\n')
    const selectors = [...css.matchAll(/([^{}]+)\{[^}]*font-family:\s*var\(--sfb-font-heading\)/g)].map((m) =>
      m[1].replace(/\s+/g, ' ').trim(),
    )
    expect(selectors).toEqual([displayTitleSelector])
  })

  it('docs content headings and the table of contents heading are not large titles', () => {
    const page = readPage('/docs/enroll/register/')
    const content = [...page.querySelectorAll('.sl-markdown-content h2, .sl-markdown-content h3')]
    expect(content.length).toBeGreaterThan(0)
    expect(content.filter((h) => h.matches(displayTitleSelector)).map((h) => h.outerHTML)).toEqual([])
    const titles = new Set(page.querySelectorAll(displayTitleSelector))
    const others = [...page.querySelectorAll('h2, h3, h4')].filter((h) => !titles.has(h))
    expect(others.length).toBeGreaterThan(0)
    expect(page.querySelectorAll('h1')).toHaveLength(1)
  })
})

describe('heading font licence', () => {
  it('ships the OFL text next to the font, unchanged', () => {
    expect(distExists('fonts/OFL.txt')).toBe(true)
    expect(readDist('fonts/OFL.txt')).toBe(readFileSync('fonts-src/OFL.txt', 'utf8'))
  })

  it.skipIf(!hasFont)('keeps the licence name records (IDs 13 and 14) in the subset', async () => {
    // wawoff2 is already installed (subset-font depends on it); it has no type declarations.
    const { decompress } = createRequire(import.meta.url)('wawoff2') as { decompress(b: Uint8Array): Promise<Uint8Array> }
    const sfnt = Buffer.from(await decompress(readFileSync(distPath('fonts/heading.woff2'))))
    const tables = sfnt.readUInt16BE(4)
    let nameOffset = -1
    for (let i = 0; i < tables; i++) {
      const rec = 12 + i * 16
      if (sfnt.toString('latin1', rec, rec + 4) === 'name') nameOffset = sfnt.readUInt32BE(rec + 8)
    }
    expect(nameOffset).toBeGreaterThan(0)
    const count = sfnt.readUInt16BE(nameOffset + 2)
    const ids = new Set<number>()
    for (let i = 0; i < count; i++) ids.add(sfnt.readUInt16BE(nameOffset + 6 + i * 12 + 6))
    expect(ids.has(13)).toBe(true)
    expect(ids.has(14)).toBe(true)
  })
})
