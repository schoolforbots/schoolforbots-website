// Fills the homepage's [data-next-session] card with the lesson under way or
// coming next (lib/school/next-session.ts), and reads it again when that lesson
// starts and when it ends, so an open page moves on by itself.
import { site } from '../../config/site'
import { divisionNames, resolveNextSession, slotNames, type NextSession, type NextSessionView } from './next-session'
import { schoolDayName, schoolParts } from './time'

const MAX_WAIT_MS = 60 * 60 * 1000

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function sessionNodes(s: NextSession, now: Date): Node[] {
  const start = new Date(s.startsAt)
  const head = el('div', 'head')
  const badge = el('span', s.inProgress ? 'badge live' : 'badge', s.inProgress ? '正在上课' : '下一节课')
  const when = el('p', 'when')
  when.append(
    el('span', 'day', `${schoolDayName(start, now)} ${schoolParts(start).clock}–${schoolParts(new Date(s.endsAt)).clock}`),
    el('span', 'slot', slotNames[s.slot]),
  )
  const doors = el('p', 'doors', s.inProgress ? `${schoolParts(new Date(s.endsAt)).clock} 下课` : `${schoolParts(new Date(s.doorsOpenAt)).clock} 开门`)
  head.append(badge, when, doors)

  if (s.divisions.length === 0) {
    return [head, el('p', 'quiet', '这个时段还没有班级。')]
  }
  const grid = el('ul', 'divisions')
  for (const d of s.divisions) {
    const li = el('li')
    const top = el('div', 'division-head')
    top.append(el('span', 'division', divisionNames[d.division]))
    if (s.kind === 'lesson' && d.subject) top.append(el('span', 'subject', d.subject))
    li.append(top)
    if (s.kind === 'study') li.append(el('p', 'topic quiet', '自习：回顾这一周的课'))
    else if (d.title) li.append(el('p', 'topic', d.title))
    else li.append(el('p', 'topic quiet', '备课中'))
    grid.append(li)
  }
  return [head, grid]
}

export function renderNextSession(root: HTMLElement, view: NextSessionView, now: Date): void {
  root.dataset.state = view.kind
  const body = root.querySelector<HTMLElement>('[data-next-session-body]')
  if (!body) return
  if (view.kind === 'session') body.replaceChildren(...sessionNodes(view.session, now))
  else if (view.kind === 'none') body.replaceChildren(el('p', 'quiet', '近期没有课。开学和假期的安排见公告。'))
  else body.replaceChildren(el('p', 'quiet', '暂时连不上学校，下一节课的安排读不到。'))
}

// When to read again: as the lesson starts or ends, or in an hour at most.
function nextCheck(view: NextSessionView, now: number): number {
  if (view.kind !== 'session') return MAX_WAIT_MS
  const marks = [view.session.startsAt, view.session.endsAt].map((t) => Date.parse(t) - now).filter((ms) => ms > 0)
  return Math.min(MAX_WAIT_MS, ...marks.map((ms) => ms + 5000))
}

export function mountNextSession(): void {
  const root = document.querySelector<HTMLElement>('[data-next-session]')
  if (!root) return
  const load = async () => {
    let view: NextSessionView
    try {
      view = site.calendarCors
        ? await resolveNextSession({
            url: `${site.api}/v1/next-session`,
            timeoutMs: site.statusTimeoutMs,
            fetch: (input, init) => fetch(input, init),
          })
        : { kind: 'unreachable' }
    } catch {
      view = { kind: 'unreachable' }
    }
    renderNextSession(root, view, new Date())
    window.setTimeout(load, nextCheck(view, Date.now()))
  }
  void load()
}
