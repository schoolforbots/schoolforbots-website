import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
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

  it.skipIf(!hasFont)('keeps the copyright and licence records (name IDs 0, 13, 14) exactly as in the source font', async () => {
    const notices = (records: NameRecord[]) => records.filter((r) => [0, 13, 14].includes(r.id))
    const built = notices(nameRecords(await builtFont()))
    expect(new Set(built.map((r) => r.id))).toEqual(new Set([0, 13, 14]))
    expect(built).toEqual(notices(nameRecords(sourceFont())))
  })
})

// The SIL OFL reserves the name "Source" for unmodified copies, and the subset is a modified copy.
describe('heading font names', () => {
  it.skipIf(!hasFont)('no name record says "Source" except the copyright, trademark and licence notices', async () => {
    const names = nameRecords(await builtFont()).filter((r) => ![0, 7, 13, 14].includes(r.id))
    expect(names.map((r) => r.id)).toEqual(expect.arrayContaining([1, 3, 4, 6, 16, 17]))
    expect(names.filter((r) => r.text.includes('Source'))).toEqual([])
  })

  it.skipIf(!hasFont)('names the face SFB Heading, weight Heavy', async () => {
    const records = nameRecords(await builtFont())
    const texts = (id: number) => [...new Set(records.filter((r) => r.id === id).map((r) => r.text))]
    expect(texts(16)).toEqual(['SFB Heading'])
    expect(texts(17)).toEqual(['Heavy'])
    // Name IDs 1 and 2 only know Regular, Italic, Bold and Bold Italic, so the weight goes in the family.
    expect(texts(1)).toEqual(['SFB Heading Heavy'])
    expect(texts(2)).toEqual(['Regular'])
    expect(texts(4)).toEqual(['SFB Heading Heavy'])
    expect(texts(6)).toEqual(['SFBHeading-Heavy'])
  })

  it.skipIf(!hasFont)('renames the CFF font names too, leaving the copyright notice as it was', async () => {
    const built = cffStrings(await builtFont())
    expect(built.names).toEqual(['SFBHeading-Heavy'])
    expect(built.strings).toEqual(expect.arrayContaining(['SFB Heading', 'SFB Heading Heavy']))
    const source = cffStrings(sourceFont())
    expect(built.strings.filter((s) => s.includes('Source'))).toEqual(source.strings.filter((s) => s.startsWith('Copyright')))
  })
})

// wawoff2 has no type declarations.
const { decompress } = createRequire(import.meta.url)('wawoff2') as { decompress(b: Uint8Array): Promise<Uint8Array> }

async function builtFont(): Promise<Buffer> {
  return Buffer.from(await decompress(readFileSync(distPath('fonts/heading.woff2'))))
}

function sourceFont(): Buffer {
  const file = readdirSync('fonts-src').find((f) => /\.(otf|ttf)$/i.test(f))
  if (!file) throw new Error('no font in fonts-src/')
  return readFileSync(join('fonts-src', file))
}

// The table with the given tag, from an .otf or a decompressed .woff2.
function table(sfnt: Buffer, tag: string): Buffer {
  for (let i = 0; i < sfnt.readUInt16BE(4); i++) {
    const rec = 12 + i * 16
    if (sfnt.toString('latin1', rec, rec + 4) === tag) {
      const offset = sfnt.readUInt32BE(rec + 8)
      return sfnt.subarray(offset, offset + sfnt.readUInt32BE(rec + 12))
    }
  }
  throw new Error(`no ${tag} table`)
}

interface NameRecord {
  platform: number
  encoding: number
  language: number
  id: number
  text: string
}

// Every record of the name table. Mac records (platform 1) are single-byte; the others are UTF-16BE.
function nameRecords(sfnt: Buffer): NameRecord[] {
  const name = table(sfnt, 'name')
  const storage = name.readUInt16BE(4)
  return Array.from({ length: name.readUInt16BE(2) }, (_, i) => {
    const [platform, encoding, language, id, length, offset] = [0, 2, 4, 6, 8, 10].map((k) => name.readUInt16BE(6 + i * 12 + k))
    const bytes = Buffer.from(name.subarray(storage + offset, storage + offset + length))
    return { platform, encoding, language, id, text: platform === 1 ? bytes.toString('latin1') : bytes.swap16().toString('utf16le') }
  })
}

// The CFF table's Name INDEX (the PostScript name) and String INDEX (family, full and FDArray font names, notices).
function cffStrings(sfnt: Buffer): { names: string[]; strings: string[] } {
  const cff = table(sfnt, 'CFF ')
  const index = (pos: number) => {
    const count = cff.readUInt16BE(pos)
    if (count === 0) return { items: [], end: pos + 2 }
    const size = cff[pos + 2]
    const offset = (i: number) => cff.readUIntBE(pos + 3 + i * size, size)
    // Offsets count from 1, from the byte before the data.
    const base = pos + 2 + (count + 1) * size
    const items = Array.from({ length: count }, (_, i) => cff.toString('latin1', base + offset(i), base + offset(i + 1)))
    return { items, end: base + offset(count) }
  }
  const names = index(cff[2])
  const topDicts = index(names.end)
  return { names: names.items, strings: index(topDicts.end).items }
}
