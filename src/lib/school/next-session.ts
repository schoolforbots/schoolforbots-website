// The lesson under way or coming next, read in the browser from the school's
// GET /v1/next-session: when, which time slot, which divisions have classes,
// and each division's subject and lesson title. Only what the school writes
// itself; nothing about students. Shape per
// schoolforbots-private/docs/superpowers/specs/2026-11-22-public-notices-and-next-lesson.md.
import { fetchJson } from '../status/fetch-json'

export type Slot = 'morning' | 'afternoon' | 'evening'
export type Division = 'primary' | 'junior' | 'senior'

export interface NextSession {
  date: string
  slot: Slot
  startsAt: string
  endsAt: string
  doorsOpenAt: string
  inProgress: boolean
  kind: 'lesson' | 'study'
  divisions: { division: Division; subject: string | null; title: string | null }[]
}

export type NextSessionView =
  | { kind: 'session'; session: NextSession }
  // The school answered: no lessons in the coming weeks (a break, or before term).
  | { kind: 'none' }
  | { kind: 'unreachable' }

export const slotNames: Record<Slot, string> = { morning: '上午班', afternoon: '下午班', evening: '晚班' }
export const divisionNames: Record<Division, string> = { primary: '小学部', junior: '初中部', senior: '高中部' }

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isTime = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const isStringOrNull = (v: unknown): v is string | null => v === null || typeof v === 'string'

export function parseNextSession(body: unknown): NextSession | null | undefined {
  if (!isObject(body) || !('session' in body)) return undefined
  const s = body.session
  if (s === null) return null
  if (!isObject(s)) return undefined
  const { date, slot, startsAt, endsAt, doorsOpenAt, inProgress, kind, divisions } = s
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined
  if (slot !== 'morning' && slot !== 'afternoon' && slot !== 'evening') return undefined
  if (!isTime(startsAt) || !isTime(endsAt) || !isTime(doorsOpenAt)) return undefined
  if (typeof inProgress !== 'boolean' || (kind !== 'lesson' && kind !== 'study')) return undefined
  if (!Array.isArray(divisions)) return undefined
  const list: NextSession['divisions'] = []
  for (const d of divisions) {
    if (!isObject(d)) return undefined
    if (d.division !== 'primary' && d.division !== 'junior' && d.division !== 'senior') return undefined
    if (!isStringOrNull(d.subject) || !isStringOrNull(d.title)) return undefined
    list.push({ division: d.division, subject: d.subject, title: d.title })
  }
  return { date, slot, startsAt, endsAt, doorsOpenAt, inProgress, kind, divisions: list }
}

export async function resolveNextSession(src: { url: string; timeoutMs: number; fetch: typeof fetch }): Promise<NextSessionView> {
  const out = await fetchJson(src.url, { fetch: src.fetch, timeoutMs: src.timeoutMs })
  if (out.kind !== 'ok') return { kind: 'unreachable' }
  const session = parseNextSession(out.body)
  if (session === undefined) return { kind: 'unreachable' }
  return session ? { kind: 'session', session } : { kind: 'none' }
}
