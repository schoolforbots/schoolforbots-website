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
  classes: { total: number; bySlotAndDivision: { slot: Slot; division: Division; classes: number; students: number }[] }
  clubs: { doudizhu: { gamesToday: number } }
  /** Students in school by robot type, in the school's order of the types. */
  aiTypes: { aiType: string; students: number }[]
}

export type StatsView = { kind: 'stats'; stats: SchoolStats } | { kind: 'unreachable' }

const DIVISIONS: readonly Division[] = ['primary', 'junior', 'senior']
const SLOTS: readonly Slot[] = ['morning', 'afternoon', 'evening']

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0
const isTime = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))

// The school lists the students by division or slot as `[{ division, students }]` (or `slot`): a count for each of
// `keys`, one the school leaves out counting as 0; undefined if the list is malformed. A key the page does not know is
// skipped.
function counts<K extends string>(v: unknown, field: string, keys: readonly K[]): Record<K, number> | undefined {
  if (!Array.isArray(v)) return undefined
  const out = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>
  for (const row of v) {
    if (!isObject(row) || typeof row[field] !== 'string' || !isCount(row.students)) return undefined
    if ((keys as readonly string[]).includes(row[field] as string)) out[row[field] as K] = row.students
  }
  return out
}

export function parseStats(body: unknown): SchoolStats | undefined {
  if (!isObject(body) || !isTime(body.generatedAt)) return undefined
  const { students, owners, classes, clubs } = body
  if (!isObject(students) || !isCount(students.total) || !isCount(owners)) return undefined
  const byDivision = counts(students.byDivision, 'division', DIVISIONS)
  const bySlot = counts(students.bySlot, 'slot', SLOTS)
  if (!byDivision || !bySlot) return undefined
  if (!isObject(classes) || !isCount(classes.total) || !Array.isArray(classes.bySlotAndDivision)) return undefined
  const groups: SchoolStats['classes']['bySlotAndDivision'] = []
  for (const g of classes.bySlotAndDivision) {
    if (!isObject(g) || !SLOTS.includes(g.slot as Slot) || !DIVISIONS.includes(g.division as Division)) return undefined
    if (!isCount(g.classes) || !isCount(g.students)) return undefined
    groups.push({ slot: g.slot as Slot, division: g.division as Division, classes: g.classes, students: g.students })
  }
  const doudizhu = isObject(clubs) && isObject(clubs.doudizhu) ? clubs.doudizhu : undefined
  if (!doudizhu || !isCount(doudizhu.gamesToday)) return undefined
  // By robot type: a school that does not send it yet has none.
  const aiTypes: SchoolStats['aiTypes'] = []
  if (Array.isArray(body.aiTypes)) {
    for (const t of body.aiTypes) {
      if (!isObject(t) || typeof t.aiType !== 'string' || !isCount(t.students)) return undefined
      aiTypes.push({ aiType: t.aiType, students: t.students })
    }
  }
  return {
    generatedAt: body.generatedAt,
    students: { total: students.total, byDivision, bySlot },
    owners,
    classes: { total: classes.total, bySlotAndDivision: groups },
    clubs: { doudizhu: { gamesToday: doudizhu.gamesToday } },
    aiTypes,
  }
}

export async function resolveStats(src: { url: string; timeoutMs: number; fetch: typeof fetch }): Promise<StatsView> {
  const out = await fetchJson(src.url, { fetch: src.fetch, timeoutMs: src.timeoutMs })
  if (out.kind !== 'ok') return { kind: 'unreachable' }
  const stats = parseStats(out.body)
  return stats ? { kind: 'stats', stats } : { kind: 'unreachable' }
}

/** Where the school stands against its opening day. */
export type SchoolDays = { kind: 'open'; days: number } | { kind: 'before'; days: number } | { kind: 'unset' }

/**
 * How long the school has been open, the opening day counting as day 1; or, before it, how many days are left until
 * it; or that it has no opening day yet. Both dates are in Beijing time (YYYY-MM-DD).
 */
export function schoolDays(openingDay: string | null, today: string): SchoolDays {
  if (openingDay === null) return { kind: 'unset' }
  const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${openingDay}T00:00:00Z`)) / 86_400_000)
  if (Number.isNaN(diff)) return { kind: 'unset' }
  return diff >= 0 ? { kind: 'open', days: diff + 1 } : { kind: 'before', days: -diff }
}
