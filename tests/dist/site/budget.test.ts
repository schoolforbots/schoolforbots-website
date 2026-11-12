import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { site } from '../../../src/config/site'
import { distExists, distPath, readPage } from '../helpers'

const budget = 300 * 1024

// Files the browser fetches as part of the page; links to other pages, the
// sitemap and the like are not.
const asset = /\.(css|js|mjs|png|jpe?g|gif|webp|avif|svg|ico)$/
// Fonts have their own budget (heading-font.test.ts); search loads its index on demand.
const skipped = (path: string) => path.endsWith('.woff2') || path.startsWith('/pagefind/')

// A same-site address as a path from the site root, or null for anything else.
function sitePath(ref: string, base: string): string | null {
  const url = new URL(ref, new URL(base, site.url))
  return url.origin === new URL(site.url).origin ? decodeURI(url.pathname) : null
}

// `from "./x.js"`, `import "./x.js"`, `import("./x.js")` and the backtick form.
const relativeImport = /(?:\bfrom|\bimport)\s*\(?\s*(["'`])(\.{1,2}\/[^"'`]+)\1/g

// index.html, every same-site stylesheet, script and image it references, and
// every file those scripts import by relative path.
function homepageFiles(): string[] {
  const doc = readPage('/')
  const refs = [
    ...[...doc.querySelectorAll('link[href]')].map((el) => el.getAttribute('href') ?? ''),
    ...[...doc.querySelectorAll('script[src], img[src]')].map((el) => el.getAttribute('src') ?? ''),
    ...[...doc.querySelectorAll('img[srcset], source[srcset]')].flatMap((el) =>
      (el.getAttribute('srcset') ?? '').split(',').map((c) => c.trim().split(/\s+/)[0]),
    ),
  ]
  const files = new Set<string>(['/index.html'])
  const queue = refs
    .map((ref) => sitePath(ref, '/'))
    .filter((p): p is string => p !== null && asset.test(p) && !skipped(p))
  while (queue.length > 0) {
    const file = queue.shift() as string
    if (files.has(file)) continue
    files.add(file)
    if (!/\.m?js$/.test(file)) continue
    for (const [, , spec] of readFileSync(distPath(file.slice(1)), 'utf8').matchAll(relativeImport)) {
      const next = sitePath(spec, file)
      if (next && !skipped(next)) queue.push(next)
    }
  }
  return [...files]
}

describe('page weight', () => {
  it('the homepage is under 300 KB to transfer, fonts excluded', () => {
    const files = homepageFiles()
    for (const file of files) expect(distExists(file.slice(1)), file).toBe(true)
    expect(files.some((f) => f.endsWith('.css'))).toBe(true)
    expect(files.some((f) => f.endsWith('.js'))).toBe(true)
    const sizes = files.map((file) => [file, gzipSync(readFileSync(distPath(file.slice(1)))).length] as const)
    const total = sizes.reduce((sum, [, size]) => sum + size, 0)
    expect(total, sizes.map(([f, s]) => `${f} ${s}`).join('\n')).toBeLessThan(budget)
  })
})
