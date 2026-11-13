import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SEASONS, seasonAt } from '../../src/lib/seasons/season'
import { WASH, washOver, type Theme } from '../../src/lib/seasons/palette'

describe('seasonAt', () => {
  it('splits the page into four seasons, top to bottom', () => {
    expect(SEASONS).toEqual(['spring', 'summer', 'autumn', 'winter'])
    expect(seasonAt(0, null)).toBe('spring')
    expect(seasonAt(0.3, null)).toBe('summer')
    expect(seasonAt(0.6, null)).toBe('autumn')
    expect(seasonAt(1, null)).toBe('winter')
  })

  it('treats a progress outside 0 to 1 as the nearest end', () => {
    expect(seasonAt(-1, null)).toBe('spring')
    expect(seasonAt(Number.NaN, null)).toBe('spring')
    expect(seasonAt(2, null)).toBe('winter')
  })

  it('holds the current season until the reader is clearly past a seam', () => {
    expect(seasonAt(0.252, 'spring')).toBe('spring')
    expect(seasonAt(0.26, 'spring')).toBe('summer')
    expect(seasonAt(0.245, 'summer')).toBe('summer')
    expect(seasonAt(0.24, 'summer')).toBe('spring')
  })

  it('jumps straight to a far season', () => {
    expect(seasonAt(0.9, 'spring')).toBe('winter')
    expect(seasonAt(0, 'winter')).toBe('spring')
  })
})

describe('washOver', () => {
  it('lays a see-through colour over a solid one', () => {
    expect(washOver('#FFFFFF', [0, 0, 0, 0.5])).toBe('#808080')
    expect(washOver('#123456', [255, 0, 0, 0])).toBe('#123456')
    expect(washOver('#000000', [255, 255, 255, 1])).toBe('#FFFFFF')
  })
})

// The season's wash lies over the page background, so text there must still be readable.
describe('contrast over each season', () => {
  const css = readFileSync(fileURLToPath(new URL('../../src/styles/tokens.css', import.meta.url)), 'utf8')
  const block = (selector: string) => {
    const open = css.indexOf('{', css.indexOf(selector))
    return css.slice(open + 1, css.indexOf('}', open))
  }
  const tokens = (body: string) =>
    Object.fromEntries([...body.matchAll(/--sfb-([a-z-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]))
  const themes: Record<Theme, Record<string, string>> = {
    light: tokens(block(':root {')),
    dark: tokens(block(":root[data-theme='dark']")),
  }

  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const contrast = (a: string, b: string) => {
    const [x, y] = [luminance(a), luminance(b)]
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
  }

  for (const theme of ['light', 'dark'] as const) {
    for (const season of SEASONS) {
      it(`${theme}, ${season}: text 4.5, large text and graphics 3`, () => {
        const t = themes[theme]
        for (const ground of ['bg', 'hero-top']) {
          const under = washOver(t[ground], WASH[theme][season])
          for (const ink of ['ink', 'mute', 'link']) {
            expect(contrast(t[ink], under), `${ink} on ${ground}`).toBeGreaterThanOrEqual(4.5)
          }
          expect(contrast(t.highlight, under), `highlight on ${ground}`).toBeGreaterThanOrEqual(3)
        }
      })
    }
  }
})
