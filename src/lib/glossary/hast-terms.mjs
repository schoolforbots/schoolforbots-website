// Marks the first time each glossary term appears on a docs page: a link to its
// entry on the glossary page, with the one-line explanation as a tooltip.
// Only plain text inside p, li and td counts; headings, links, code, anything
// inside .not-content and components are left alone. Runs on the docs under
// src/content/docs/docs/ only, apart from the glossary page itself: the FAQ
// answers and the homepage are rendered elsewhere, many to a page.
//
// A hast plugin for Sätteri, Astro's Markdown processor, used for .md and .mdx.
import { fileURLToPath } from 'node:url'
import { glossary } from '../../config/glossary.mjs'

export const glossaryRoute = '/docs/glossary/'

const blocks = new Set(['p', 'li', 'td'])
const skipped = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'code', 'pre', 'kbd', 'script', 'style', 'svg', 'button'])

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Every spelling to the term it stands for, longest first so 重新入学 wins over a shorter word inside it.
const spellings = new Map(
  glossary.filter((t) => t.mark !== false).flatMap((t) => [t.term, ...(t.aliases ?? [])].map((s) => [s, t])),
)
const pattern = new RegExp(
  [...spellings.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escape)
    .join('|'),
  'g',
)

const classes = (node) => {
  const c = node.properties?.className
  return Array.isArray(c) ? c : typeof c === 'string' ? c.split(/\s+/) : []
}

function termLink(text, term) {
  return {
    type: 'element',
    tagName: 'a',
    properties: { className: ['term'], href: `${glossaryRoute}#${term.id}`, ariaDescribedBy: `term-tip-${term.id}` },
    children: [
      { type: 'text', value: text },
      {
        type: 'element',
        tagName: 'span',
        // Search results should quote the page, not the tooltip.
        properties: { className: ['term-tip'], role: 'tooltip', id: `term-tip-${term.id}`, dataPagefindIgnore: '' },
        children: [{ type: 'text', value: term.short }],
      },
    ],
  }
}

/**
 * The text split around the terms in it not yet in `seen`, or null when there are none.
 * @param {string} value
 * @param {Set<string>} seen
 */
export function markTerms(value, seen) {
  const parts = []
  let last = 0
  for (const match of value.matchAll(pattern)) {
    const term = spellings.get(match[0])
    if (!term || seen.has(term.id)) continue
    seen.add(term.id)
    if (match.index > last) parts.push({ type: 'text', value: value.slice(last, match.index) })
    parts.push(termLink(match[0], term))
    last = match.index + match[0].length
  }
  if (parts.length === 0) return null
  if (last < value.length) parts.push({ type: 'text', value: value.slice(last) })
  return parts
}

// Text nodes in document order, with whether they sit in a block that may be marked.
function* texts(node, inBlock) {
  for (const child of node.children ?? []) {
    if (child.type === 'text') {
      if (inBlock) yield child
    } else if (child.type === 'element') {
      if (skipped.has(child.tagName) || classes(child).includes('not-content')) continue
      yield* texts(child, inBlock || blocks.has(child.tagName))
    }
    // Components (mdxJsx*), expressions and raw HTML render on their own; leave them be.
  }
}

/** Whether a document is a docs page that gets its terms marked. */
export function marksTermsIn(fileURL) {
  if (!fileURL) return false
  const path = fileURLToPath(fileURL).split('\\').join('/')
  return path.includes('/src/content/docs/docs/') && !/\/docs\/glossary\.mdx?$/.test(path)
}

/** For `hastPlugins`: a fresh plugin per document, so each page marks its own first terms. */
export default function glossaryTerms({ fileURL }) {
  if (!marksTermsIn(fileURL)) return null
  return {
    name: 'glossary-terms',
    before(root, ctx) {
      const seen = new Set()
      for (const text of texts(root, false)) {
        const parts = markTerms(text.value, seen)
        if (parts) ctx.replaceNode(text, parts)
      }
    },
  }
}
