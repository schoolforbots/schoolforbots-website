// The school's numbers, read in the browser from the school's GET /v1/school/stats:
// how many students are in school (by division and by slot), how many owners are
// behind them, how many classes there are, and how many games the doudizhu club
// has played today. Totals only; nothing about any one student. The school counts
// them at most once a minute, so everyone looking sees the same numbers.
import { fetchJson } from '../status/fetch-json'
import type { Division, Slot } from './next-school-day'

export interface SchoolStats {
  generatedAt: string
  students: { total: number; byDivision: Record<Division, number>; bySlot: Record<Slot, number> }
  owners: number
  classes: { total: number; groups: { slot: Slot; division: Division; classes: number; students: number }[] }
  clubs: { doudizhu: { gamesToday: number } }
}

export type StatsView = { kind: 'stats'; stats: SchoolStats } | { kind: 'unreachable' }

const DIVISIONS: readonly Division[] = ['primary', 'junior', 'senior']
const SLOTS: readonly Slot[] = ['morning', 'afternoon', 'evening']

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0
const isTime = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))

// A count for each of `keys`, a key the school leaves out counting as 0; undefined if any count is not one.
function counts<K extends string>(v: unknown, keys: readonly K[]): Record<K, number> | undefined {
  if (!isObject(v)) return undefined
  const out = {} as Record<K, number>
  for (const k of keys) {
    const n = v[k] ?? 0
    if (!isCount(n)) return undefined
    out[k] = n
  }
  return out
}

export function parseStats(body: unknown): SchoolStats | undefined {
  if (!isObject(body) || !isTime(body.generatedAt)) return undefined
  const { students, owners, classes, clubs } = body
  if (!isObject(students) || !isCount(students.total) || !isCount(owners)) return undefined
  const byDivision = counts(students.byDivision, DIVISIONS)
  const bySlot = counts(students.bySlot, SLOTS)
  if (!byDivision || !bySlot) return undefined
  if (!isObject(classes) || !isCount(classes.total) || !Array.isArray(classes.groups)) return undefined
  const groups: SchoolStats['classes']['groups'] = []
  for (const g of classes.groups) {
    if (!isObject(g) || !SLOTS.includes(g.slot as Slot) || !DIVISIONS.includes(g.division as Division)) return undefined
    if (!isCount(g.classes) || !isCount(g.students)) return undefined
    groups.push({ slot: g.slot as Slot, division: g.division as Division, classes: g.classes, students: g.students })
  }
  const doudizhu = isObject(clubs) && isObject(clubs.doudizhu) ? clubs.doudizhu : undefined
  if (!doudizhu || !isCount(doudizhu.gamesToday)) return undefined
  return {
    generatedAt: body.generatedAt,
    students: { total: students.total, byDivision, bySlot },
    owners,
    classes: { total: classes.total, groups },
    clubs: { doudizhu: { gamesToday: doudizhu.gamesToday } },
  }
}

export async function resolveStats(src: { url: string; timeoutMs: number; fetch: typeof fetch }): Promise<StatsView> {
  const out = await fetchJson(src.url, { fetch: src.fetch, timeoutMs: src.timeoutMs })
  if (out.kind !== 'ok') return { kind: 'unreachable' }
  const stats = parseStats(out.body)
  return stats ? { kind: 'stats', stats } : { kind: 'unreachable' }
}

/**
 * Which day of school `today` is, the opening day being day 1; null before the opening day or when the school has
 * none set. Both are dates in Beijing time (YYYY-MM-DD).
 */
export function schoolDayNumber(openingDay: string | null, today: string): number | null {
  if (openingDay === null) return null
  const days = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${openingDay}T00:00:00Z`)) / 86_400_000)
  return Number.isNaN(days) || days < 0 ? null : days + 1
}
