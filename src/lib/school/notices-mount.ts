// Fills every [data-notice-list] on the page with the school's notices. A list
// is either brief (the homepage: a line per notice, linking to it on the notices
// page) or full (the notices page: each notice with its text, at #notice-<id>).
import { site } from '../../config/site'
import { safeSessionStorage } from '../status/mount'
import { renderBody } from './notice-body'
import { readCachedNotices, resolveNotices, writeCachedNotices, type Notice, type NoticesView } from './notices'
import { schoolDateTime, schoolSpan } from './time'

const CACHE_MS = 60_000
export const noticesPage = '/docs/notices/'
export const noticeAnchor = (id: number) => `notice-${id}`

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function stamp(n: Notice, now: Date): HTMLTimeElement {
  const t = el('time', 'when', schoolDateTime(new Date(n.publishedAt), now))
  t.dateTime = n.publishedAt
  return t
}

function maintenanceTag(): HTMLElement {
  return el('span', 'tag', '维护')
}

function brief(list: Notice[], now: Date): HTMLElement {
  const ul = el('ul', 'rows')
  for (const n of list) {
    const a = el('a')
    a.href = `${noticesPage}#${noticeAnchor(n.id)}`
    const title = el('span', 'title', n.title)
    a.append(stamp(n, now), title)
    if (n.kind === 'maintenance') title.append(maintenanceTag())
    const li = el('li')
    li.append(a)
    ul.append(li)
  }
  return ul
}

function full(list: Notice[], now: Date): HTMLElement {
  const wrap = el('div', 'full')
  for (const n of list) {
    const article = el('article', 'notice')
    article.id = noticeAnchor(n.id)
    const h = el('h2', 'notice-title', n.title)
    if (n.kind === 'maintenance') h.append(maintenanceTag())
    const meta = el('p', 'meta')
    meta.append('发布于 ', stamp(n, now))
    if (n.updatedAt) meta.append(`，${schoolDateTime(new Date(n.updatedAt), now)} 更新`)
    article.append(h, meta)
    if (n.window) {
      const when = el('p', 'window')
      when.append(el('strong', undefined, '维护时间：'), schoolSpan(new Date(n.window.startsAt), n.window.endsAt ? new Date(n.window.endsAt) : null, now))
      article.append(when)
    }
    const body = el('div', 'body')
    body.append(renderBody(document, n.body))
    article.append(body)
    wrap.append(article)
  }
  return wrap
}

function stateLine(text: string, link?: { href: string; label: string }): HTMLElement {
  const p = el('p', 'state', text)
  if (link) {
    const a = el('a', 'hl', link.label)
    a.href = link.href
    p.append(' ', a)
  }
  return p
}

export function renderNotices(root: HTMLElement, view: NoticesView, now: Date): void {
  const mode = root.dataset.mode === 'full' ? 'full' : 'brief'
  const limit = Number(root.dataset.limit) || Infinity
  root.replaceChildren()
  root.dataset.state = view.kind
  if (view.kind === 'unreachable') {
    root.append(stateLine('暂时连不上学校，公告读不到。', { href: '/docs/help/cannot-connect/', label: '怎么办' }))
    return
  }
  if (view.kind === 'sentinel') {
    root.append(stateLine(`暂时连不上学校。下面是 ${schoolDateTime(new Date(view.fetchedAt), now)} 留下的最近几条公告。`))
  }
  const list = view.notices.slice(0, limit)
  if (list.length === 0) {
    root.append(stateLine('还没有公告。'))
    return
  }
  root.append(mode === 'full' ? full(list, now) : brief(list, now))
}

export async function mountAllNoticeLists(): Promise<void> {
  const roots = [...document.querySelectorAll<HTMLElement>('[data-notice-list]')]
  if (roots.length === 0) return
  const url = `${site.api}/v1/notices?limit=50`
  const storage = safeSessionStorage()
  let view: NoticesView
  try {
    view =
      readCachedNotices(storage, { now: Date.now(), maxAgeMs: CACHE_MS, url }) ??
      (await resolveNotices({
        schoolReadable: site.calendarCors,
        noticesUrl: url,
        statusFileUrl: site.statusFile,
        timeoutMs: site.statusTimeoutMs,
        fetch: (input, init) => fetch(input, init),
      }))
    writeCachedNotices(storage, view, { now: Date.now(), url })
  } catch {
    view = { kind: 'unreachable' }
  }
  const now = new Date()
  for (const root of roots) renderNotices(root, view, now)
  // A link to one notice lands on it once the list is drawn.
  const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null
  target?.scrollIntoView()
}
