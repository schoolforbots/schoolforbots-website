import { parseCalendar } from './parse'
import type { StatusView } from './types'

const KEY = 'sfb-status'

function validView(v: unknown): StatusView | null {
  if (typeof v !== 'object' || v === null) return null
  const o = v as Record<string, unknown>
  switch (o.kind) {
    case 'calendar': {
      const calendar = parseCalendar(o.calendar)
      return calendar ? { kind: 'calendar', calendar } : null
    }
    case 'sentinel':
      if (o.status !== 'ok' && o.status !== 'maintenance' && o.status !== 'down') return null
      if (o.message !== null && typeof o.message !== 'string') return null
      return { kind: 'sentinel', status: o.status, message: o.message }
    case 'unreachable-here':
      return { kind: 'unreachable-here' }
    default:
      return null
  }
}

export function readCachedView(
  storage: Storage | null,
  opts: { now: number; maxAgeMs: number; calendarCors: boolean },
): StatusView | null {
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Record<string, unknown> | null
    if (typeof s !== 'object' || s === null) return null
    if (s.v !== 1 || s.cors !== opts.calendarCors || typeof s.at !== 'number') return null
    const age = opts.now - s.at
    if (age < 0 || age >= opts.maxAgeMs) return null
    return validView(s.view)
  } catch {
    return null
  }
}

export function writeCachedView(
  storage: Storage | null,
  view: StatusView,
  opts: { now: number; calendarCors: boolean },
): void {
  if (view.kind === 'unknown') return
  try {
    storage?.setItem(KEY, JSON.stringify({ v: 1, at: opts.now, cors: opts.calendarCors, view }))
  } catch {
    // Storage may be blocked or full; the view is simply not cached.
  }
}
