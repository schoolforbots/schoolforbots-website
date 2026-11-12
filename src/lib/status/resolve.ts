import { fetchJson } from './fetch-json'
import { parseCalendar, parseStatusFile } from './parse'
import type { StatusFile, StatusView } from './types'

export interface StatusSources {
  calendarCors: boolean
  calendarUrl: string
  statusFileUrl: string
  timeoutMs: number
  fetch: typeof fetch
}

async function readSentinel(src: StatusSources): Promise<StatusFile | null> {
  const out = await fetchJson(src.statusFileUrl, { fetch: src.fetch, timeoutMs: src.timeoutMs })
  return out.kind === 'ok' ? parseStatusFile(out.body) : null
}

export async function resolveStatus(src: StatusSources): Promise<StatusView> {
  let calendarReachable = true
  if (src.calendarCors) {
    const out = await fetchJson(src.calendarUrl, { fetch: src.fetch, timeoutMs: src.timeoutMs })
    if (out.kind === 'ok') {
      const calendar = parseCalendar(out.body)
      if (calendar) return { kind: 'calendar', calendar }
    }
    calendarReachable = out.kind !== 'unreachable'
  }
  const sentinel = await readSentinel(src)
  if (!sentinel) return { kind: 'unknown' }
  if (sentinel.status !== 'ok') return { kind: 'sentinel', status: sentinel.status, message: sentinel.message }
  if (!src.calendarCors) return { kind: 'sentinel', status: 'ok', message: null }
  // The school answered no calendar this time: that is not the reader's network.
  return calendarReachable ? { kind: 'unknown' } : { kind: 'unreachable-here' }
}
