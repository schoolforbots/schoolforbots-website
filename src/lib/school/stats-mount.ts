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
import { resolveStats, schoolDayNumber, type SchoolStats } from './stats'

const REFRESH_MS = 5 * 60 * 1000
const DIVISIONS: readonly Division[] = ['primary', 'junior', 'senior']
const SLOTS: readonly Slot[] = ['morning', 'afternoon', 'evening']

export interface StatsReading {
  stats: SchoolStats | null
  /** The day of school, 1 on the opening day; null before it, with no opening day set, or when unknown. */
  day: number | null
}

const number = (n: number) => n.toLocaleString('zh-CN')

/** The text of each [data-stat] key, or null where the school could not be read. */
export function statTexts(r: StatsReading): Record<string, string | null> {
  const s = r.stats
  const out: Record<string, string | null> = {
    students: s ? number(s.students.total) : null,
    owners: s ? number(s.owners) : null,
    classes: s ? number(s.classes.total) : null,
    day: r.day === null ? null : number(r.day),
    doudizhu: s ? number(s.clubs.doudizhu.gamesToday) : null,
  }
  for (const d of DIVISIONS) out[`division-${d}`] = s ? number(s.students.byDivision[d]) : null
  for (const t of SLOTS) out[`slot-${t}`] = s ? number(s.students.bySlot[t]) : null
  return out
}

export function renderStats(root: HTMLElement, r: StatsReading): void {
  const texts = statTexts(r)
  root.dataset.state = r.stats ? 'ready' : 'unreachable'
  for (const el of root.querySelectorAll<HTMLElement>('[data-stat]')) {
    const text = texts[el.dataset.stat ?? '']
    el.textContent = text ?? '—'
  }
  // Students by robot type: one row for each type with anyone, named as in the assets manifest.
  const labels = manifest.aiTypes as Record<string, { label: string }>
  for (const list of root.querySelectorAll<HTMLElement>('[data-stat-ai-types]')) {
    const rows = (r.stats?.aiTypes ?? []).filter((t) => t.students > 0)
    if (!rows.length) {
      const empty = document.createElement('div')
      const dt = document.createElement('dt')
      dt.textContent = '—'
      empty.append(dt)
      list.replaceChildren(empty)
      continue
    }
    list.replaceChildren(
      ...rows.map((t) => {
        const row = document.createElement('div')
        const dt = document.createElement('dt')
        dt.textContent = labels[t.aiType]?.label ?? labels[manifest.fallbackAiType]?.label ?? t.aiType
        const dd = document.createElement('dd')
        dd.textContent = number(t.students)
        row.append(dt, dd)
        return row
      }),
    )
  }
  // The day of school has its own wording before the opening day.
  for (const el of root.querySelectorAll<HTMLElement>('[data-stat-day-label]')) {
    el.textContent = r.day === null ? '还没开学' : '开学天数'
  }
}

export async function readStats(deps: { api: string; timeoutMs: number; fetch: typeof fetch }): Promise<StatsReading> {
  const [view, calendar] = await Promise.all([
    resolveStats({ url: `${deps.api}/v1/school/stats`, timeoutMs: deps.timeoutMs, fetch: deps.fetch }).catch(() => ({ kind: 'unreachable' as const })),
    fetchJson(`${deps.api}/v1/school-calendar`, { fetch: deps.fetch, timeoutMs: deps.timeoutMs }).catch(() => ({ kind: 'unreachable' as const })),
  ])
  const cal = calendar.kind === 'ok' ? parseCalendar(calendar.body) : null
  return {
    stats: view.kind === 'stats' ? view.stats : null,
    day: cal ? schoolDayNumber(cal.openingDay, cal.today) : null,
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
