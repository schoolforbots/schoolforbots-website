// A notice's text is a small part of Markdown, written in the school's admin
// pages. The school's admin preview (schoolforbots-server admin/src/notice-markdown.tsx)
// and this page render it by the same rules, so a notice looks the same in both:
//
// 1. Everything is text first: it is turned into DOM nodes, never into an HTML
//    string, so nothing in the text can become markup.
// 2. CRLF and CR read as LF. A line that is empty or only whitespace is blank;
//    blank lines separate blocks, and any number of them is one break.
// 3. Within a block, a line whose first two characters are "- " (nothing before
//    them) is a list item, its text the rest of the line; consecutive items make
//    one list. Every other run of consecutive lines is a paragraph, its lines
//    kept apart by a line break. A list and a paragraph may follow each other
//    without a blank line between them.
// 4. In each line, from the left: [text](https://address) is a link (the address
//    starts with exactly "https://", lower case, and runs to the first ")"; it
//    opens apart from the page with rel="noopener noreferrer"), and **text** is
//    bold. The one that starts further left wins; nothing nests. Anything else
//    (other addresses, an unmatched ** or [) stays plain text.

export type Inline = { kind: 'text'; text: string } | { kind: 'bold'; text: string } | { kind: 'link'; text: string; href: string }
export type Block = { kind: 'p'; lines: Inline[][] } | { kind: 'ul'; items: Inline[][] }

const LINK = String.raw`\[([^\]]+)\]\((https:\/\/[^\s)]+)\)`
const BOLD = String.raw`\*\*(.+?)\*\*`
// The alternation finds the leftmost match, trying the link first at each place.
const INLINE = new RegExp(`${LINK}|${BOLD}`, 'g')

export function parseInline(line: string): Inline[] {
  const out: Inline[] = []
  let from = 0
  for (const m of line.matchAll(INLINE)) {
    if (m.index > from) out.push({ kind: 'text', text: line.slice(from, m.index) })
    const [whole, linkText, href, bold] = m
    if (href !== undefined && linkText !== undefined) out.push({ kind: 'link', text: linkText, href })
    else out.push({ kind: 'bold', text: bold ?? '' })
    from = m.index + whole.length
  }
  if (from < line.length) out.push({ kind: 'text', text: line.slice(from) })
  return out
}

const isBlank = (line: string) => line.trim() === ''
const isItem = (line: string) => line.startsWith('- ')

export function parseBody(body: string): Block[] {
  const blocks: Block[] = []
  let last: Block | undefined
  for (const line of body.replace(/\r\n?/g, '\n').split('\n')) {
    if (isBlank(line)) {
      last = undefined
    } else if (isItem(line)) {
      const item = parseInline(line.slice(2))
      if (last?.kind === 'ul') last.items.push(item)
      else blocks.push((last = { kind: 'ul', items: [item] }))
    } else {
      const text = parseInline(line)
      if (last?.kind === 'p') last.lines.push(text)
      else blocks.push((last = { kind: 'p', lines: [text] }))
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
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
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
