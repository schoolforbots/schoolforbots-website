// Cuts the heading font in fonts-src/ down to the characters the large titles
// (src/config/display-titles.mjs) use in the built pages (dist/**/*.html) and
// writes dist/fonts/heading.woff2, plus dist/fonts/heading.chars.txt listing the
// characters requested. The font's licence travels with it: the copyright and the
// licence (name IDs 0, 13 and 14) are kept in the subset, and fonts-src/OFL.txt is
// copied to dist/fonts/OFL.txt. The SIL OFL reserves the name "Source" for unmodified
// copies, so the subset is renamed SFB Heading, the name the CSS already uses.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Window } from 'happy-dom'
import subsetFont from 'subset-font'
import wawoff2 from 'wawoff2'
import { displayTitleSelector } from '../src/config/display-titles.mjs'
import { renameFont } from './rename-font.mjs'

const srcDir = 'fonts-src'
const distDir = 'dist'
const outDir = join(distDir, 'fonts')

function fail(message) {
  console.error(`subset-heading-font: ${message}`)
  process.exit(1)
}

if (!existsSync(distDir)) fail('dist/ does not exist; run `astro build` first.')
const sources = existsSync(srcDir) ? readdirSync(srcDir).filter((f) => /\.(otf|ttf)$/i.test(f)) : []
if (sources.length !== 1) {
  fail(`expected exactly one .otf or .ttf font in ${srcDir}/, found ${sources.length}.`)
}

const htmlFiles = readdirSync(distDir, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.html'))
const chars = new Set()
// Basic Latin, so a heading edited in the browser or a number still has glyphs.
for (let code = 0x21; code < 0x7f; code++) chars.add(String.fromCharCode(code))
const parser = new new Window().DOMParser()
for (const file of htmlFiles) {
  const page = parser.parseFromString(readFileSync(join(distDir, file), 'utf8'), 'text/html')
  for (const title of page.querySelectorAll(displayTitleSelector)) {
    for (const ch of title.textContent ?? '') if (!/\s/.test(ch)) chars.add(ch)
  }
}

const text = [...chars].join('')
const subset = await subsetFont(readFileSync(join(srcDir, sources[0])), text, {
  targetFormat: 'sfnt',
  // Name records not listed here are dropped. Kept: the copyright (0) and the licence description and
  // URL (13, 14), which the SIL OFL asks for; the version (5); and the font's names, renamed below.
  preserveNameIds: [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17],
})
const renamed = renameFont(subset, {
  // Name IDs 1 and 2 only know Regular, Italic, Bold and Bold Italic, so a Heavy face puts its weight
  // in the family (1) and stays Regular (2); IDs 16 and 17 carry the family and the weight.
  names: {
    1: 'SFB Heading Heavy',
    3: 'SFB Heading Heavy subset',
    4: 'SFB Heading Heavy',
    6: 'SFBHeading-Heavy',
    16: 'SFB Heading',
    17: 'Heavy',
  },
  cff: { fontName: 'SFBHeading-Heavy', fullName: 'SFB Heading Heavy', familyName: 'SFB Heading' },
})
const font = Buffer.from(await wawoff2.compress(renamed))
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'heading.woff2'), font)
writeFileSync(join(outDir, 'heading.chars.txt'), text)
copyFileSync(join(srcDir, 'OFL.txt'), join(outDir, 'OFL.txt'))
console.log(`subset-heading-font: ${chars.size} characters, ${(font.length / 1024).toFixed(1)} KB -> ${join(outDir, 'heading.woff2')}`)
