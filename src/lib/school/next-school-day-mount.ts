// Fills the homepage's [data-next-school-day] card with the next school day
// (lib/school/next-school-day.ts), and reads it again as each slot's doors open
// and as it is dismissed, so an open page marks the slot under way and moves on
// to the next day by itself.
import { site } from '../../config/site'
import { divisionNames, resolveSchoolDay, slotNames, type SchoolDay, type SchoolDayView } from './next-school-day'
import { schoolDateWeekday, schoolNearDay, schoolParts } from './time'

const MAX_WAIT_MS = 60 * 60 * 1000

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const clock = (iso: string) => schoolParts(new Date(iso)).clock

function dayNodes(day: SchoolDay, now: Date): Node[] {
  const t = now.getTime()
  const live = day.slots.some((s) => Date.parse(s.doorsOpenAt) <= t && t < Date.parse(s.endsAt))
  // Noon in Beijing is the same day wherever the reader is.
  const noon = new Date(`${day.date}T12:00:00+08:00`)
  const near = schoolNearDay(noon, now)

  const head = el('div', 'head')
  head.append(el('span', live ? 'badge live' : 'badge', live ? '正在上课' : '下一个上课日'))
  const when = el('p', 'when')
  if (near) when.append(el('span', 'near', near))
  when.append(el('span', 'day', schoolDateWeekday(noon, now)))
  if (day.kind === 'study') when.append(el('span', 'study', '周末自习'))
  head.append(when)

  const slots = el('ul', 'slots')
  slots.setAttribute('aria-label', '上课时间')
  for (const s of day.slots) {
    const over = Date.parse(s.endsAt) <= t
    const going = Date.parse(s.doorsOpenAt) <= t && !over
    const li = el('li', over ? 'over' : going ? 'live' : undefined)
    li.append(el('span', 'slot', slotNames[s.slot]), el('span', 'time', `${clock(s.startsAt)}–${clock(s.endsAt)}`))
    if (over) li.append(el('span', 'note', '已下课'))
    else if (going) li.append(el('span', 'note', '上课中'))
    slots.append(li)
  }

  const grid = el('ul', 'divisions')
  for (const d of day.divisions) {
    const li = el('li')
    const top = el('div', 'division-head')
    top.append(el('span', 'division', divisionNames[d.division]))
    if (d.kind === 'lesson' && d.subject) top.append(el('span', 'subject', d.subject))
    li.append(top)
    if (d.kind === 'study') li.append(el('p', 'topic quiet', '自习：回顾这一周的课'))
    else if (d.title) li.append(el('p', 'topic', d.title))
    else li.append(el('p', 'topic quiet', '备课中'))
    grid.append(li)
  }
  return [head, slots, grid]
}

export function renderSchoolDay(root: HTMLElement, view: SchoolDayView, now: Date): void {
  root.dataset.state = view.kind
  const body = root.querySelector<HTMLElement>('[data-next-school-day-body]')
  if (!body) return
  if (view.kind === 'day') body.replaceChildren(...dayNodes(view.day, now))
  else if (view.kind === 'none') body.replaceChildren(el('p', 'quiet', '学校在放假，开学的日子还没定。定下来以后，这里会显示那一天的课。'))
  else body.replaceChildren(el('p', 'quiet', '暂时连不上学校，下一个上课日的安排读不到。'))
}

// When to read again: as a slot's doors open or it is dismissed, or in an hour at most.
function nextCheck(view: SchoolDayView, now: number): number {
  if (view.kind !== 'day') return MAX_WAIT_MS
  const marks = view.day.slots
    .flatMap((s) => [s.doorsOpenAt, s.endsAt])
    .map((at) => Date.parse(at) - now)
    .filter((ms) => ms > 0)
  return Math.min(MAX_WAIT_MS, ...marks.map((ms) => ms + 5000))
}

export function mountNextSchoolDay(): void {
  const root = document.querySelector<HTMLElement>('[data-next-school-day]')
  if (!root) return
  const load = async () => {
    let view: SchoolDayView
    try {
      view = site.calendarCors
        ? await resolveSchoolDay({
            url: `${site.api}/v1/next-school-day`,
            timeoutMs: site.statusTimeoutMs,
            fetch: (input, init) => fetch(input, init),
          })
        : { kind: 'unreachable' }
    } catch {
      view = { kind: 'unreachable' }
    }
    renderSchoolDay(root, view, new Date())
    window.setTimeout(load, nextCheck(view, Date.now()))
  }
  void load()
}
