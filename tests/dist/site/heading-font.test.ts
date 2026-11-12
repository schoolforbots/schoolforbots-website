import { statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { distExists, distPath, listDist, readDist, readPage } from '../helpers'

const hasFont = distExists('fonts/heading.woff2')

// The script writes the characters it cut into the font beside it, so the test
// compares the headings in the built pages with that list.
describe('heading font', () => {
  it.skipIf(!hasFont)('the heading font is at most 150 KB', () => {
    expect(statSync(distPath('fonts/heading.woff2')).size).toBeLessThanOrEqual(150 * 1024)
  })

  it('the build produces the font and the list of its characters', () => {
    expect(hasFont).toBe(true)
    expect(distExists('fonts/heading.chars.txt')).toBe(true)
  })

  it.skipIf(!hasFont)('every heading character in the built pages is in the font', () => {
    const covered = new Set(readDist('fonts/heading.chars.txt'))
    const missing = new Set<string>()
    for (const file of listDist('.html')) {
      const page = readPage(`/${file}`)
      for (const h of page.querySelectorAll('h1, h2, h3')) {
        if (h.closest('.rules-root')) continue
        for (const ch of (h.textContent ?? '').replace(/\s+/g, '')) {
          if (!covered.has(ch)) missing.add(`${ch} (${file})`)
        }
      }
    }
    expect([...missing]).toEqual([])
  })
})
