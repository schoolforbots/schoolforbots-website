// Cuts the heading font in fonts-src/ down to the characters that h1-h3 use in
// the built pages (dist/**/*.html) and writes dist/fonts/heading.woff2, plus
// dist/fonts/heading.chars.txt listing those characters. The rules page renders
// its headings in the browser in the body font, so none of them reach dist/.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import subsetFont from 'subset-font'

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

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
function decode(text) {
  return text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (whole, dec, hex, name) => {
    if (dec) return String.fromCodePoint(Number(dec))
    if (hex) return String.fromCodePoint(parseInt(hex, 16))
    return entities[name.toLowerCase()] ?? whole
  })
}

const htmlFiles = readdirSync(distDir, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.html'))
const chars = new Set()
// Basic Latin, so a heading edited in the browser or a number still has glyphs.
for (let code = 0x21; code < 0x7f; code++) chars.add(String.fromCharCode(code))
for (const file of htmlFiles) {
  const html = readFileSync(join(distDir, file), 'utf8')
  for (const [, inner] of html.matchAll(/<h[123](?:\s[^>]*)?>([\s\S]*?)<\/h[123]>/g)) {
    const text = decode(inner.replace(/<[^>]*>/g, ''))
    for (const ch of text) if (!/\s/.test(ch)) chars.add(ch)
  }
}

const text = [...chars].join('')
const font = await subsetFont(readFileSync(join(srcDir, sources[0])), text, { targetFormat: 'woff2' })
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'heading.woff2'), font)
writeFileSync(join(outDir, 'heading.chars.txt'), text)
console.log(`subset-heading-font: ${chars.size} characters, ${(font.length / 1024).toFixed(1)} KB -> ${join(outDir, 'heading.woff2')}`)
