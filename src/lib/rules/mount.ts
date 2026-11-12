import { fetchJson } from '../status/fetch-json'
import { parseRulesResponse, parseRulesText, type SchoolRules } from './parse'

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

function render(el: HTMLElement, rules: SchoolRules, serverRepo: string) {
  const out: HTMLElement[] = []
  out.push(make(el, 'p', `当前版本：${rules.version}`, 'rules-version'))
  out.push(make(el, 'p', `本次修改：${rules.changes}`, 'rules-changes'))

  const body = make(el, 'div', undefined, 'rules-body')
  let list: HTMLElement | null = null
  for (const block of parseRulesText(rules.text)) {
    if (block.type === 'li') {
      if (!list) {
        list = make(el, 'ul')
        body.appendChild(list)
      }
      list.appendChild(make(el, 'li', block.text))
      continue
    }
    list = null
    if (block.type === 'p') {
      const p = make(el, 'p', undefined, 'rules-clause')
      block.lines.forEach((line, i) => {
        if (i > 0) p.appendChild(make(el, 'br'))
        p.appendChild(el.ownerDocument.createTextNode(line))
      })
      body.appendChild(p)
    } else {
      body.appendChild(make(el, block.type, block.text))
    }
  }
  out.push(body)

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

export async function mountRules(el: HTMLElement, deps: Deps): Promise<void> {
  if (!deps.calendarCors) return
  const outcome = await fetchJson(deps.rulesUrl, { fetch: deps.fetch, timeoutMs: deps.timeoutMs })
  const rules = outcome.kind === 'ok' ? parseRulesResponse(outcome.body) : null
  if (rules) {
    render(el, rules, deps.serverRepo)
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
