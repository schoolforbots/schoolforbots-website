// A notice's text is a small part of Markdown, written in the school's admin
// pages: paragraphs (split by a blank line), lists (lines starting "- "),
// **bold** and [words](https://…) links. It is turned into DOM nodes, never into
// an HTML string, so nothing in the text can become markup; whatever is not one
// of those forms stays plain text.

export type Inline = { kind: 'text'; text: string } | { kind: 'bold'; text: string } | { kind: 'link'; text: string; href: string }
export type Block = { kind: 'p'; lines: Inline[][] } | { kind: 'ul'; items: Inline[][] }

const INLINE = /\*\*(.+?)\*\*|\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)/g

export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push({ kind: 'text', text: text.slice(last, m.index) })
    if (m[1] !== undefined) out.push({ kind: 'bold', text: m[1] })
    else out.push({ kind: 'link', text: m[2], href: m[3] })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) })
  return out
}

export function parseBody(body: string): Block[] {
  const blocks: Block[] = []
  for (const chunk of body.replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter((l) => l !== '')
    if (lines.length === 0) continue
    if (lines.every((l) => l.startsWith('- '))) {
      blocks.push({ kind: 'ul', items: lines.map((l) => parseInline(l.slice(2))) })
    } else {
      blocks.push({ kind: 'p', lines: lines.map(parseInline) })
    }
  }
  return blocks
}

function appendInline(doc: Document, parent: Node, parts: Inline[]): void {
  for (const part of parts) {
    if (part.kind === 'text') parent.appendChild(doc.createTextNode(part.text))
    else if (part.kind === 'bold') {
      const b = doc.createElement('strong')
      b.textContent = part.text
      parent.appendChild(b)
    } else {
      const a = doc.createElement('a')
      a.href = part.href
      a.textContent = part.text
      a.rel = 'noopener'
      parent.appendChild(a)
    }
  }
}

export function renderBody(doc: Document, body: string): DocumentFragment {
  const frag = doc.createDocumentFragment()
  for (const block of parseBody(body)) {
    if (block.kind === 'p') {
      const p = doc.createElement('p')
      block.lines.forEach((line, i) => {
        if (i > 0) p.appendChild(doc.createElement('br'))
        appendInline(doc, p, line)
      })
      frag.appendChild(p)
    } else {
      const ul = doc.createElement('ul')
      for (const item of block.items) {
        const li = doc.createElement('li')
        appendInline(doc, li, item)
        ul.appendChild(li)
      }
      frag.appendChild(ul)
    }
  }
  return frag
}
