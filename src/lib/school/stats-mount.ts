// Fills every [data-school-stats] block with the school's numbers
// (lib/school/stats.ts) and the day of school (the opening day from
// GET /v1/school-calendar). Each number sits in a [data-stat="..."] element;
// a block shows the ones it has room for. Read once when the page opens and
// again every few minutes while it stays open.
import manifest from '../../data/school-assets.json'
import { site } from '../../config/site'
import { fetchJson } from '../status/fetch-json'
import { parseCalendar } from '../status/parse'
import type { Division, Slot } from './next-school-day'
import { resolveStats, schoolDays, type SchoolDays, type SchoolStats } from './stats'

const REFRESH_MS = 5 * 60 * 1000
const DIVISIONS: readonly Division[] = ['primary', 'junior', 'senior']
const SLOTS: readonly Slot[] = ['morning', 'afternoon', 'evening']

export interface StatsReading {
  stats: SchoolStats | null
  /** How long the school has been open, or how long until it opens; null when the calendar cannot be read. */
  days: SchoolDays | null
}

const number = (n: number) => n.toLocaleString('zh-CN')

/** The number behind each [data-stat] and [data-bar] key, or null where the school could not be read. */
export function statValues(r: StatsReading): Record<string, number | null> {
  const s = r.stats
  const out: Record<string, number | null> = {
    students: s ? s.students.total : null,
    owners: s ? s.owners : null,
    classes: s ? s.classes.total : null,
    day: r.days?.kind === 'open' || r.days?.kind === 'before' ? r.days.days : null,
    doudizhu: s ? s.clubs.doudizhu.gamesToday : null,
  }
  for (const d of DIVISIONS) out[`division-${d}`] = s ? s.students.byDivision[d] : null
  for (const t of SLOTS) out[`slot-${t}`] = s ? s.students.bySlot[t] : null
  return out
}

/** The text of each [data-stat] key, or null where the school could not be read. */
export function statTexts(r: StatsReading): Record<string, string | null> {
  return Object.fromEntries(Object.entries(statValues(r)).map(([k, v]) => [k, v === null ? null : number(v)]))
}

// A bar's length: its share of the largest in its group, so the longest bar fills its track.
function setBars(bars: { el: HTMLElement; value: number | null }[]): void {
  const max = Math.max(0, ...bars.map((b) => b.value ?? 0))
  for (const { el, value } of bars) el.style.width = max > 0 && value ? `${(value / max) * 100}%` : '0'
}

type TypeLook = { label: string; avatars: { image: string }[]; default: { background: string; border: string } }

// One row for a robot type: its avatar in the type's colours, its name, a bar and the count.
function typeRow(aiType: string, students: number): HTMLElement {
  const types = manifest.aiTypes as Record<string, TypeLook>
  const palette = manifest.palette as Record<string, string>
  const t = types[aiType] ?? types[manifest.fallbackAiType]
  const li = document.createElement('li')
  const name = document.createElement('span')
  name.className = 'name'
  const avatar = document.createElement('span')
  avatar.className = 'avatar'
  avatar.style.setProperty('--avatar-bg', palette[t.default.background])
  avatar.style.setProperty('--avatar-border', palette[t.default.border])
  const img = document.createElement('img')
  img.src = `/school-assets/${t.avatars[0].image}`
  img.alt = ''
  img.loading = 'lazy'
  avatar.append(img)
  name.append(avatar, document.createTextNode(types[aiType]?.label ?? t.label ?? aiType))
  const track = document.createElement('span')
  track.className = 'track'
  track.setAttribute('aria-hidden', 'true')
  const bar = document.createElement('span')
  bar.className = 'bar'
  bar.dataset.value = String(students)
  track.append(bar)
  const count = document.createElement('span')
  count.className = 'count'
  count.textContent = number(students)
  li.append(name, track, count)
  return li
}

/** The words of the days tile: the line over the number, the number when it is not a count, and the unit after it. */
export function dayWords(days: SchoolDays | null): { label: string; value: string | null; unit: string } {
  if (days === null) return { label: '已经开学', value: null, unit: '天' }
  if (days.kind === 'unset') return { label: '开学日期', value: '待定', unit: '' }
  return { label: days.kind === 'open' ? '已经开学' : '离开学还有', value: null, unit: '天' }
}

export function renderStats(root: HTMLElement, r: StatsReading): void {
  const texts = statTexts(r)
  const values = statValues(r)
  root.dataset.state = r.stats ? 'ready' : 'unreachable'
  for (const el of root.querySelectorAll<HTMLElement>('[data-stat]')) {
    const text = texts[el.dataset.stat ?? '']
    el.textContent = text ?? '—'
  }
  for (const group of root.querySelectorAll<HTMLElement>('[data-bar-group]')) {
    setBars([...group.querySelectorAll<HTMLElement>('[data-bar]')].map((el) => ({ el, value: values[el.dataset.bar ?? ''] ?? null })))
  }
  // Students by robot type: one row for each type with anyone, in the school's order, named as in the assets manifest.
  for (const list of root.querySelectorAll<HTMLElement>('[data-stat-ai-types]')) {
    const rows = (r.stats?.aiTypes ?? []).filter((t) => t.students > 0)
    if (!rows.length) {
      const empty = document.createElement('li')
      empty.className = 'quiet'
      empty.textContent = '—'
      list.replaceChildren(empty)
      continue
    }
    list.replaceChildren(...rows.map((t) => typeRow(t.aiType, t.students)))
    setBars([...list.querySelectorAll<HTMLElement>('.bar')].map((el) => ({ el, value: Number(el.dataset.value) })))
  }
  // The days tile reads 已经开学 9 天, or 离开学还有 2 天 before the opening day, or 开学日期 待定 with none set.
  const day = dayWords(r.days)
  for (const el of root.querySelectorAll<HTMLElement>('[data-stat-label="day"]')) el.textContent = day.label
  for (const el of root.querySelectorAll<HTMLElement>('[data-stat-unit="day"]')) el.textContent = day.unit
  if (day.value !== null) for (const el of root.querySelectorAll<HTMLElement>('[data-stat="day"]')) el.textContent = day.value
}

export async function readStats(deps: { api: string; timeoutMs: number; fetch: typeof fetch }): Promise<StatsReading> {
  const [view, calendar] = await Promise.all([
    resolveStats({ url: `${deps.api}/v1/school/stats`, timeoutMs: deps.timeoutMs, fetch: deps.fetch }).catch(() => ({ kind: 'unreachable' as const })),
    fetchJson(`${deps.api}/v1/school-calendar`, { fetch: deps.fetch, timeoutMs: deps.timeoutMs }).catch(() => ({ kind: 'unreachable' as const })),
  ])
  const cal = calendar.kind === 'ok' ? parseCalendar(calendar.body) : null
  return {
    stats: view.kind === 'stats' ? view.stats : null,
    days: cal ? schoolDays(cal.openingDay, cal.today) : null,
  }
}

export function mountSchoolStats(): void {
  const roots = [...document.querySelectorAll<HTMLElement>('[data-school-stats]')]
  if (roots.length === 0) return
  const load = async () => {
    const reading = await readStats({ api: site.api, timeoutMs: site.statusTimeoutMs, fetch: (input, init) => fetch(input, init) })
    for (const root of roots) renderStats(root, reading)
    window.setTimeout(load, REFRESH_MS)
  }
  void load()
}
