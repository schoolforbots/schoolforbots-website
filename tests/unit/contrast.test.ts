import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const css = readFileSync(fileURLToPath(new URL('../../src/styles/tokens.css', import.meta.url)), 'utf8')

type Tokens = Record<string, string>

// The text between the braces of the block that opens with `selector {`.
function block(source: string, selector: string): string {
  const start = source.indexOf(selector)
  if (start === -1) throw new Error(`tokens.css has no block for ${selector}`)
  const open = source.indexOf('{', start)
  const close = source.indexOf('}', open)
  if (open === -1 || close === -1) throw new Error(`tokens.css block for ${selector} is not closed`)
  return source.slice(open + 1, close)
}

function declarations(body: string): Tokens {
  const out: Tokens = {}
  for (const m of body.matchAll(/(--sfb-[a-z-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim()
  return out
}

function parseTokens(source: string): { light: Tokens; dark: Tokens; auto: Tokens } {
  const light = declarations(block(source, ":root {"))
  const dark = declarations(block(source, ":root[data-theme='dark']"))
  const auto = declarations(block(source, ":root:not([data-theme='light'])"))
  for (const [name, tokens] of Object.entries({ light, dark, auto })) {
    if (Object.keys(tokens).length === 0) throw new Error(`tokens.css ${name} block has no tokens`)
  }
  return { light, dark, auto }
}

function channels(hex: string): [number, number, number] {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`not a 6-digit hex colour: ${hex}`)
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number]
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

function hue(hex: string): number {
  const [r, g, b] = channels(hex)
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  const sector = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (sector * 60 + 360) % 360
}

const { light, dark, auto } = parseTokens(css)
const themes: Record<string, Tokens> = { light, dark }

const textPairs: Array<[string, string[]]> = [
  ['ink', ['bg', 'surface']],
  ['mute', ['bg', 'bg-soft', 'surface', 'surface-side', 'hero-top']],
  ['link', ['bg', 'bg-soft', 'surface']],
  ['btn-ink', ['btn', 'btn-hover']],
  ['nav-btn-ink', ['nav-btn']],
  ['teacher', ['surface']],
  ['classmate', ['surface']],
  ['live-ink', ['live-bg']],
  ['num-ink', ['num-bg']],
  ['danger', ['bg', 'bg-soft']],
]

const graphicPairs: Array<[string, string[]]> = [
  ['highlight', ['bg', 'bg-soft', 'surface', 'hero-top']],
  ['logo', ['bg']],
  ['focus', ['bg']],
  ['ok', ['bg', 'bg-soft']],
]

// The brick dado is a graphic in the light theme; at night it is decoration, dim on purpose.
const lightGraphicPairs: Array<[string, string[]]> = [
  ['brick', ['bg']],
  ['ledge', ['bg']],
]

function check(pairs: Array<[string, string[]]>, min: number, only: Record<string, Tokens> = themes): void {
  for (const [name, tokens] of Object.entries(only)) {
    for (const [fg, backs] of pairs) {
      for (const back of backs) {
        const ratio = contrast(tokens[`--sfb-${fg}`], tokens[`--sfb-${back}`])
        expect(ratio, `${name}: ${fg} on ${back} is ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min)
      }
    }
  }
}

describe('colour tokens', () => {
  it('the two dark blocks are the same', () => {
    expect(Object.keys(dark).length).toBeGreaterThan(20)
    expect(auto).toEqual(dark)
  })

  it('both themes define the same tokens', () => {
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort())
  })

  it('colours are plain 6-digit hex', () => {
    for (const tokens of [light, dark]) {
      for (const [name, value] of Object.entries(tokens)) {
        if (name.startsWith('--sfb-font-')) continue
        expect(value, name).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    }
  })

  it('text pairs reach 4.5 in both themes', () => check(textPairs, 4.5))

  it('graphics reach 3 in both themes', () => check(graphicPairs, 3))

  it('the brick dado reaches 3 in the light theme', () => check(lightGraphicPairs, 3, { light }))

  it('danger is a red that differs from 柿子橙', () => {
    const persimmon = hue('#D45113')
    for (const tokens of [light, dark]) {
      const h = hue(tokens['--sfb-danger'])
      const gap = Math.min(Math.abs(h - persimmon), 360 - Math.abs(h - persimmon))
      expect(gap).toBeGreaterThanOrEqual(20)
    }
  })

  it('the contrast function matches known WCAG values', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(contrast('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2)
    expect(contrast('#D45113', '#FFFFFF')).toBeCloseTo(4.21, 2)
  })
})
