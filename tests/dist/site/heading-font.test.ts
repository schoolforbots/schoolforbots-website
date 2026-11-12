import { statSync } from 'node:fs'
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
    const page = readPage('/docs/enroll/')
    const titles = new Set(page.querySelectorAll(displayTitleSelector))
    const others = [...page.querySelectorAll('h2, h3, h4')].filter((h) => !titles.has(h))
    expect(others.length).toBeGreaterThan(0)
    expect(page.querySelectorAll('h1')).toHaveLength(1)
  })
})
