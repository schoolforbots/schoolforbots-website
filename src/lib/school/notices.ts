// The school's notices, read in the browser. They are written in the school's
// admin pages and served by GET /v1/notices; the status worker copies the latest
// few into status.json, so while the school cannot be reached the notices that
// matter most then (a maintenance) still show. Shapes follow
// schoolforbots-private/docs/superpowers/specs/2026-11-22-public-notices-and-next-lesson.md.
import { fetchJson } from '../status/fetch-json'

export interface Notice {
  id: number
  title: string
  body: string
  kind: 'general' | 'maintenance'
  window: { startsAt: string; endsAt: string | null } | null
  publishedAt: string
  updatedAt: string | null
}

export type NoticesView =
  | { kind: 'school'; notices: Notice[]; more: boolean }
  // From status.json: the school could not be reached, these were copied at fetchedAt.
  | { kind: 'sentinel'; notices: Notice[]; fetchedAt: string }
  | { kind: 'unreachable' }

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isTime = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))

export function parseNotice(v: unknown): Notice | null {
  if (!isObject(v)) return null
  const { id, title, body, kind, window, publishedAt, updatedAt } = v
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 1) return null
  if (typeof title !== 'string' || title.trim() === '' || typeof body !== 'string') return null
  if (kind !== 'general' && kind !== 'maintenance') return null
  if (!isTime(publishedAt) || (updatedAt !== null && !isTime(updatedAt))) return null
  let win: Notice['window'] = null
  if (window !== null) {
    if (!isObject(window) || !isTime(window.startsAt) || (window.endsAt !== null && !isTime(window.endsAt))) return null
    win = { startsAt: window.startsAt, endsAt: window.endsAt as string | null }
  }
  return { id, title, body, kind, window: win, publishedAt, updatedAt: updatedAt as string | null }
}

// A list where any notice is malformed is dropped whole: half a list would read as if the rest were never sent.
function parseList(v: unknown): Notice[] | null {
  if (!Array.isArray(v)) return null
  const out: Notice[] = []
  for (const item of v) {
    const n = parseNotice(item)
    if (!n) return null
    out.push(n)
  }
  return out
}

export function parseNoticesResponse(body: unknown): { notices: Notice[]; more: boolean } | null {
  if (!isObject(body) || typeof body.more !== 'boolean') return null
  const notices = parseList(body.notices)
  return notices ? { notices, more: body.more } : null
}

// status.json's `notices`, or null when it has none (an older status worker, or one that never read any).
export function parseStatusNotices(body: unknown): { notices: Notice[]; fetchedAt: string } | null {
  if (!isObject(body) || !isObject(body.notices)) return null
  const { fetchedAt, items } = body.notices
  if (!isTime(fetchedAt)) return null
  const notices = parseList(items)
  return notices ? { notices, fetchedAt } : null
}

export interface NoticeSources {
  // The school lets web pages read it directly (site.calendarCors); otherwise only status.json is read.
  schoolReadable: boolean
  noticesUrl: string
  statusFileUrl: string
  timeoutMs: number
  fetch: typeof fetch
}

export async function resolveNotices(src: NoticeSources): Promise<NoticesView> {
  if (src.schoolReadable) {
    const out = await fetchJson(src.noticesUrl, { fetch: src.fetch, timeoutMs: src.timeoutMs })
    if (out.kind === 'ok') {
      const list = parseNoticesResponse(out.body)
      if (list) return { kind: 'school', ...list }
    }
  }
  const status = await fetchJson(src.statusFileUrl, { fetch: src.fetch, timeoutMs: src.timeoutMs })
  if (status.kind === 'ok') {
    const copy = parseStatusNotices(status.body)
    if (copy) return { kind: 'sentinel', ...copy }
  }
  return { kind: 'unreachable' }
}

const KEY = 'sfb-notices'

export function readCachedNotices(storage: Storage | null, opts: { now: number; maxAgeMs: number; url: string }): NoticesView | null {
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Record<string, unknown> | null
    if (!isObject(s) || s.v !== 1 || s.url !== opts.url || typeof s.at !== 'number') return null
    const age = opts.now - s.at
    if (age < 0 || age >= opts.maxAgeMs) return null
    const view = s.view as Record<string, unknown>
    if (!isObject(view)) return null
    if (view.kind !== 'school') return null
    const list = parseNoticesResponse(view)
    return list ? { kind: 'school', ...list } : null
  } catch {
    return null
  }
}

// Only answers from the school are kept: a copy from status.json means the school was out of reach, so ask again next time.
export function writeCachedNotices(storage: Storage | null, view: NoticesView, opts: { now: number; url: string }): void {
  if (view.kind !== 'school') return
  try {
    storage?.setItem(KEY, JSON.stringify({ v: 1, at: opts.now, url: opts.url, view }))
  } catch {
    // Storage may be blocked or full; the notices are simply not cached.
  }
}
