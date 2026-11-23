// The next school day, read in the browser from the school's GET /v1/next-school-day:
// today until its last slot is dismissed, or else the next school day (weekend
// study days included); its three slots' times, the same for every division, and
// each of the three divisions' lesson or study hall, whether or not anyone is in
// its classes yet. Only what the school writes itself; nothing about students.
import { fetchJson } from '../status/fetch-json'

export type Slot = 'morning' | 'afternoon' | 'evening'
export type Division = 'primary' | 'junior' | 'senior'
export type Kind = 'lesson' | 'study'

export interface SchoolDay {
  date: string
  kind: Kind
  slots: { slot: Slot; startsAt: string; endsAt: string; doorsOpenAt: string }[]
  divisions: { division: Division; kind: Kind; subject: string | null; title: string | null }[]
}

export type SchoolDayView =
  | { kind: 'day'; day: SchoolDay }
  // The school answered: a break with no reopening day set yet.
  | { kind: 'none' }
  | { kind: 'unreachable' }

export const slotNames: Record<Slot, string> = { morning: '上午班', afternoon: '下午班', evening: '晚班' }
export const divisionNames: Record<Division, string> = { primary: '小学部', junior: '初中部', senior: '高中部' }

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isTime = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const isStringOrNull = (v: unknown): v is string | null => v === null || typeof v === 'string'
const isKind = (v: unknown): v is Kind => v === 'lesson' || v === 'study'
const isSlot = (v: unknown): v is Slot => v === 'morning' || v === 'afternoon' || v === 'evening'
const isDivision = (v: unknown): v is Division => v === 'primary' || v === 'junior' || v === 'senior'

export function parseSchoolDay(body: unknown): SchoolDay | null | undefined {
  if (!isObject(body) || !('day' in body)) return undefined
  const d = body.day
  if (d === null) return null
  if (!isObject(d)) return undefined
  const { date, kind, slots, divisions } = d
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined
  if (!isKind(kind) || !Array.isArray(slots) || !Array.isArray(divisions)) return undefined
  const slotList: SchoolDay['slots'] = []
  for (const s of slots) {
    if (!isObject(s) || !isSlot(s.slot)) return undefined
    if (!isTime(s.startsAt) || !isTime(s.endsAt) || !isTime(s.doorsOpenAt)) return undefined
    slotList.push({ slot: s.slot, startsAt: s.startsAt, endsAt: s.endsAt, doorsOpenAt: s.doorsOpenAt })
  }
  const divisionList: SchoolDay['divisions'] = []
  for (const v of divisions) {
    if (!isObject(v) || !isDivision(v.division) || !isKind(v.kind)) return undefined
    if (!isStringOrNull(v.subject) || !isStringOrNull(v.title)) return undefined
    divisionList.push({ division: v.division, kind: v.kind, subject: v.subject, title: v.title })
  }
  return { date, kind, slots: slotList, divisions: divisionList }
}

export async function resolveSchoolDay(src: { url: string; timeoutMs: number; fetch: typeof fetch }): Promise<SchoolDayView> {
  const out = await fetchJson(src.url, { fetch: src.fetch, timeoutMs: src.timeoutMs })
  if (out.kind !== 'ok') return { kind: 'unreachable' }
  const day = parseSchoolDay(out.body)
  if (day === undefined) return { kind: 'unreachable' }
  return day ? { kind: 'day', day } : { kind: 'none' }
}
