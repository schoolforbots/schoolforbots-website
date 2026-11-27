// The live campus page (/live/) and the homepage's preview of it. The page reads
// the two snapshots every five seconds while it is in view and draws them on the
// map (map.ts), in the club and class lists, and as the head count; the preview
// reads them every half minute for the head count only.
import { site } from '../../config/site'
import { resolveSchoolDay, slotNames as daySlotNames, type SchoolDay } from '../school/next-school-day'
import { schoolDateWeekday, schoolNearDay, schoolParts } from '../school/time'
import { className, readLive, stepText, type Scene, type Seat } from './live'
import { CampusMap } from './map'

const PAGE_EVERY_MS = 5000
const PREVIEW_EVERY_MS = 30_000
/** A snapshot older than this is shown as stale. */
const STALE_MS = 30_000

const sources = () => ({ api: site.api, timeoutMs: site.statusTimeoutMs, fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init) })

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/** Reads every `everyMs` while the tab is visible, and at once when it comes back. */
function poll(everyMs: number, read: () => Promise<void>): void {
  let timer: number | undefined
  const run = async () => {
    window.clearTimeout(timer)
    try {
      await read()
    } finally {
      timer = window.setTimeout(() => void (document.hidden ? undefined : run()), everyMs)
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void run()
  })
  void run()
}

// ---------------------------------------------------------------------------
// The head count and the live dot.

function headCount(scene: Scene): string {
  if (!scene.classReached && !scene.clubReached) return '连不上学校'
  return scene.students ? `${scene.students} 名学生在校园里` : '校园里现在没有人'
}

function renderStatus(root: HTMLElement, scene: Scene, now: number): void {
  const status = root.querySelector<HTMLElement>('[data-live-status]')
  if (!status) return
  const reached = scene.classReached || scene.clubReached
  const age = scene.generatedAt ? now - Date.parse(scene.generatedAt) : Infinity
  status.dataset.state = !reached ? 'down' : age > STALE_MS ? 'stale' : 'live'
  status.querySelector('span')!.textContent = !reached ? '连不上' : age > STALE_MS ? `${Math.round(age / 1000)} 秒前` : '实时'
}

// ---------------------------------------------------------------------------
// The text views: the club's tables and the classes.

function seatText(s: Seat): string {
  if (s.kind === 'empty') return '空座'
  if (s.kind === 'bot') return `${s.name}（陪练）`
  const who = s.person.anonymous ? '匿名同学' : `${s.person.aiName}`
  return s.online ? who : `${who}（暂时离开）`
}

function renderClub(root: HTMLElement, scene: Scene): void {
  const box = root.querySelector<HTMLElement>('[data-live-club]')
  if (!box) return
  if (!scene.clubReached) return void box.replaceChildren(el('p', 'quiet', '暂时看不到社团的情况。'))
  if (scene.clubOpen === false) return void box.replaceChildren(el('p', 'quiet', '斗地主社在上课的时段关门，下课以后再开。'))
  const plaza = scene.figures.filter((f) => f.place === 'plaza').length
  const head = el('p', 'club-head', `${scene.tables.length} 张牌桌 · 广场上 ${plaza} 名在闲逛`)
  if (!scene.tables.length) return void box.replaceChildren(head, el('p', 'quiet', '还没有人开桌。'))
  const list = el('ul', 'tables')
  for (const t of scene.tables) {
    const li = el('li')
    const top = el('div', 'table-head')
    top.append(el('strong', undefined, `${t.table} 号桌`), el('span', t.playing ? 'badge live' : 'badge', t.playing ? `在打第 ${t.gamesPlayed + 1} 局` : '等开局'))
    li.append(top, el('p', 'seats', t.seats.map(seatText).join('、')))
    const watch = t.spectators.length + t.waiting.length
    if (watch) li.append(el('p', 'watchers', `${t.spectators.length} 名在旁边看${t.waiting.length ? `，${t.waiting.length} 名等座位` : ''}`))
    list.append(li)
  }
  box.replaceChildren(head, list)
}

function renderClasses(root: HTMLElement, scene: Scene): void {
  const box = root.querySelector<HTMLElement>('[data-live-classes]')
  if (!box) return
  if (!scene.classReached) return void box.replaceChildren(el('p', 'quiet', '暂时看不到上课的情况。'))
  if (!scene.classrooms.length) return void box.replaceChildren(el('p', 'quiet', '现在没有班在上课。'))
  const table = el('table')
  const head = el('tr')
  for (const h of ['班级', '课题', '上到哪', '在线']) head.append(el('th', undefined, h))
  table.append(el('thead'), el('tbody'))
  table.tHead!.append(head)
  for (const c of scene.classrooms) {
    const tr = el('tr')
    tr.append(
      el('td', undefined, className(c)),
      el('td', c.title ? undefined : 'quiet', c.kind === 'study' ? '自习' : c.title ?? '备课中'),
      el('td', undefined, stepText(c.step, c.kind)),
      el('td', 'num', String(c.students.length)),
    )
    table.tBodies[0].append(tr)
  }
  box.replaceChildren(table)
}

// ---------------------------------------------------------------------------
// The timeline under the map: today's three slots, the one on now marked.

function renderTimeline(root: HTMLElement, day: SchoolDay | null | 'unreachable', now: Date): void {
  const box = root.querySelector<HTMLElement>('[data-live-timeline]')
  if (!box) return
  if (day === 'unreachable') return void box.replaceChildren(el('p', 'quiet', '暂时读不到今天的课表。'))
  if (day === null) return void box.replaceChildren(el('p', 'quiet', '学校在放假。社团照常开门。'))
  const t = now.getTime()
  const noon = new Date(`${day.date}T12:00:00+08:00`)
  const isToday = schoolNearDay(noon, now) === '今天'
  const list = el('ol', 'timeline')
  const clock = (iso: string) => schoolParts(new Date(iso)).clock
  for (const s of day.slots) {
    const on = isToday && Date.parse(s.doorsOpenAt) <= t && t < Date.parse(s.endsAt)
    const over = isToday && Date.parse(s.endsAt) <= t
    const li = el('li', on ? 'on' : over ? 'over' : undefined)
    li.append(el('span', 'name', daySlotNames[s.slot]), el('span', 'time', `${clock(s.startsAt)}–${clock(s.endsAt)}`))
    if (on) li.append(el('span', 'note', '上课中 · 社团关门'))
    list.append(li)
  }
  const rest = el('li', 'club')
  rest.append(el('span', 'name', '斗地主社'), el('span', 'time', '其余时间开门'))
  list.append(rest)
  const when = isToday ? '今天' : `下一个上课日 · ${schoolDateWeekday(noon, now)}`
  box.replaceChildren(el('p', 'when', when), list)
}

// ---------------------------------------------------------------------------

export function mountLivePage(): void {
  const root = document.querySelector<HTMLElement>('[data-live-page]')
  if (!root) return
  const mapRoot = root.querySelector<HTMLElement>('[data-live-map]')
  const map = mapRoot ? new CampusMap(mapRoot) : null

  // The tabs: 全景, 社团, 各班.
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
  const select = (tab: HTMLButtonElement) => {
    for (const t of tabs) {
      const on = t === tab
      t.setAttribute('aria-selected', String(on))
      t.tabIndex = on ? 0 : -1
      const panel = document.getElementById(t.getAttribute('aria-controls') ?? '')
      if (panel) panel.hidden = !on
    }
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab))
    tab.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
      if (!step) return
      const next = tabs[(i + step + tabs.length) % tabs.length]
      select(next)
      next.focus()
    })
  })

  let empty = root.querySelector<HTMLElement>('[data-live-empty]')
  poll(PAGE_EVERY_MS, async () => {
    const scene = await readLive(sources())
    const now = Date.now()
    map?.render(scene)
    root.querySelector('[data-live-count]')!.textContent = headCount(scene)
    renderStatus(root, scene, now)
    renderClub(root, scene)
    renderClasses(root, scene)
    if (empty) empty.hidden = scene.students > 0 || !(scene.classReached || scene.clubReached)
  })

  // The timeline changes slowly: read it once a minute.
  const readDay = async () => {
    const view = await resolveSchoolDay({ url: `${site.api}/v1/next-school-day`, timeoutMs: site.statusTimeoutMs, fetch: (i, n) => fetch(i, n) }).catch(() => ({ kind: 'unreachable' as const }))
    renderTimeline(root, view.kind === 'day' ? view.day : view.kind === 'none' ? null : 'unreachable', new Date())
  }
  void readDay()
  window.setInterval(() => void readDay(), 60_000)
}

export function mountLivePreview(): void {
  const root = document.querySelector<HTMLElement>('[data-live-preview]')
  if (!root) return
  const count = root.querySelector<HTMLElement>('[data-live-count]')
  poll(PREVIEW_EVERY_MS, async () => {
    const scene = await readLive(sources())
    const reached = scene.classReached || scene.clubReached
    root.dataset.state = reached ? 'live' : 'down'
    if (count) count.textContent = reached ? (scene.students ? `现在有 ${scene.students} 名学生在学校里` : '校园里现在没有人') : '去看看校园里谁在'
  })
}

