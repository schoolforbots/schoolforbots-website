import { fetchJson } from '../status/fetch-json'
import {
  articleId,
  parseRulesResponse,
  parseRulesText,
  splitArticleRefs,
  type RulesBlock,
  type SchoolRules,
} from './parse'

interface Deps {
  fetch: typeof fetch
  timeoutMs: number
  rulesUrl: string
  serverRepo: string
  calendarCors: boolean
}

function make<K extends keyof HTMLElementTagNameMap>(el: HTMLElement, tag: K, text?: string, cls?: string) {
  const node = el.ownerDocument.createElement(tag)
  if (text !== undefined) node.textContent = text
  if (cls) node.className = cls
  return node
}

function link(el: HTMLElement, text: string, href: string, cls?: string) {
  const a = make(el, 'a', text, cls)
  a.href = href
  return a
}

// Text with every mention of a known article (第 22 条) linking to it.
function withRefs(el: HTMLElement, parent: HTMLElement, text: string, known: Set<number>) {
  for (const piece of splitArticleRefs(text, known)) {
    if ('article' in piece) parent.appendChild(link(el, piece.text, `#${articleId(piece.article)}`, 'rules-ref'))
    else parent.appendChild(el.ownerDocument.createTextNode(piece.text))
  }
}

// 目录: each part with its chapters, and the other sections, as links.
function contents(el: HTMLElement, blocks: RulesBlock[]): HTMLElement | null {
  const top = make(el, 'ol')
  let chapters: HTMLElement | null = null
  for (const b of blocks) {
    if (b.type === 'part' || b.type === 'section') {
      const li = make(el, 'li')
      li.appendChild(link(el, b.type === 'part' ? `${b.label} ${b.title}` : b.title, `#${b.id}`))
      top.appendChild(li)
      chapters = null
      if (b.type === 'part') {
        chapters = make(el, 'ol')
        li.appendChild(chapters)
      }
    } else if (b.type === 'chapter' && chapters) {
      const li = make(el, 'li')
      li.appendChild(link(el, b.numeral ? `${b.numeral}、${b.title}` : b.title, `#${b.id}`))
      chapters.appendChild(li)
    }
  }
  if (top.children.length < 2) return null
  const nav = make(el, 'nav', undefined, 'rules-contents')
  nav.setAttribute('aria-label', '校规目录')
  nav.append(make(el, 'p', '目录', 'rules-contents-title'), top)
  return nav
}

function renderBlocks(el: HTMLElement, blocks: RulesBlock[], known: Set<number>): HTMLElement {
  const body = make(el, 'div', undefined, 'rules-body')
  let list: HTMLElement | null = null
  let terms: HTMLElement | null = null
  for (const block of blocks) {
    if (block.type !== 'li') list = null
    if (block.type !== 'term') terms = null
    switch (block.type) {
      case 'part': {
        const h = make(el, 'h2', undefined, 'rules-part')
        h.id = block.id
        h.append(make(el, 'span', block.label, 'rules-part-label'), make(el, 'span', block.title, 'rules-part-title'))
        body.appendChild(h)
        break
      }
      case 'section': {
        const h = make(el, 'h2', block.title, 'rules-section')
        h.id = block.id
        body.appendChild(h)
        break
      }
      case 'chapter': {
        const h = make(el, 'h3', undefined, 'rules-chapter')
        h.id = block.id
        if (block.numeral) h.appendChild(make(el, 'span', block.numeral, 'rules-numeral'))
        h.appendChild(make(el, 'span', block.title))
        body.appendChild(h)
        break
      }
      case 'article': {
        const art = make(el, 'div', undefined, 'rules-article')
        art.id = articleId(block.n)
        art.appendChild(link(el, `第 ${block.n} 条`, `#${articleId(block.n)}`, 'rules-article-no'))
        const text = make(el, 'div', undefined, 'rules-article-text')
        for (const line of block.lines.filter((l) => l !== '')) {
          const p = make(el, 'p')
          withRefs(el, p, line, known)
          text.appendChild(p)
        }
        art.appendChild(text)
        body.appendChild(art)
        break
      }
      case 'term': {
        if (!terms) {
          terms = make(el, 'dl', undefined, 'rules-terms')
          body.appendChild(terms)
        }
        terms.append(make(el, 'dt', block.term), make(el, 'dd', block.definition))
        break
      }
      case 'li': {
        if (!list) {
          list = make(el, 'ul')
          body.appendChild(list)
        }
        const li = make(el, 'li')
        withRefs(el, li, block.text, known)
        list.appendChild(li)
        break
      }
      case 'p': {
        const p = make(el, 'p', undefined, 'rules-clause')
        block.lines.forEach((line, i) => {
          if (i > 0) p.appendChild(make(el, 'br'))
          withRefs(el, p, line, known)
        })
        body.appendChild(p)
        break
      }
    }
  }
  return body
}

function render(el: HTMLElement, rules: SchoolRules, serverRepo: string) {
  const blocks = parseRulesText(rules.text)
  const known = new Set(blocks.flatMap((b) => (b.type === 'article' ? [b.n] : [])))
  const out: HTMLElement[] = []

  const summary = make(el, 'div', undefined, 'rules-summary')
  summary.appendChild(make(el, 'p', `当前版本：${rules.version}`, 'rules-version'))
  const changes = make(el, 'p', undefined, 'rules-changes')
  changes.appendChild(make(el, 'strong', '本次修改：'))
  withRefs(el, changes, rules.changes, known)
  summary.appendChild(changes)
  out.push(summary)

  const nav = contents(el, blocks)
  if (nav) out.push(nav)
  out.push(renderBlocks(el, blocks, known))

  const older = rules.versions.filter((v) => v !== rules.version).sort().reverse()
  if (older.length > 0) {
    const sec = make(el, 'div', undefined, 'rules-older')
    sec.appendChild(make(el, 'h2', '以前的版本'))
    const ul = make(el, 'ul')
    for (const v of older) {
      const li = make(el, 'li')
      li.appendChild(link(el, v, `${serverRepo}/blob/main/school-rules/${v}.md`))
      ul.appendChild(li)
    }
    sec.appendChild(ul)
    out.push(sec)
  }

  const src = make(el, 'p')
  src.appendChild(link(el, '原文', rules.url, 'rules-source'))
  out.push(src)

  el.replaceChildren(...out)
}

// The rules arrive after the page has loaded, so the browser's own :target does
// not pick up an article named in the address: mark it, and land on it.
function markTarget(el: HTMLElement) {
  const win = el.ownerDocument.defaultView
  const id = win?.location.hash ? decodeURIComponent(win.location.hash.slice(1)) : ''
  for (const old of el.querySelectorAll('.rules-targeted')) old.classList.remove('rules-targeted')
  const target = id ? [...el.querySelectorAll<HTMLElement>('[id]')].find((node) => node.id === id) : undefined
  if (!target) return
  if (target.classList.contains('rules-article')) target.classList.add('rules-targeted')
  target.scrollIntoView?.()
}

export async function mountRules(el: HTMLElement, deps: Deps): Promise<void> {
  if (!deps.calendarCors) return
  const outcome = await fetchJson(deps.rulesUrl, { fetch: deps.fetch, timeoutMs: deps.timeoutMs })
  const rules = outcome.kind === 'ok' ? parseRulesResponse(outcome.body) : null
  if (rules) {
    render(el, rules, deps.serverRepo)
    markTarget(el)
    el.ownerDocument.defaultView?.addEventListener('hashchange', () => markTarget(el))
    return
  }
  // Change the text of the loading line in place, so screen readers announce it.
  const failed = '校规暂时读不到，可以在 GitHub 上看。'
  const status = el.querySelector<HTMLElement>('[data-rules-status]')
  if (status) {
    status.textContent = failed
  } else {
    const p = make(el, 'p', failed)
    p.setAttribute('role', 'status')
    p.dataset.rulesStatus = ''
    el.replaceChildren(p)
  }
}
