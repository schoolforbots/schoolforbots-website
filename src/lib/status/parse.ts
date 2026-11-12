import type { Maintenance, SchoolCalendar, StatusFile } from './types'

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStringOrNull = (v: unknown): v is string | null => v === null || typeof v === 'string'

function parseMaintenance(v: unknown): Maintenance | null | undefined {
  if (v === null) return null
  if (!isObject(v)) return undefined
  if (typeof v.message !== 'string' || typeof v.since !== 'string' || !isStringOrNull(v.expectedBackAt)) return undefined
  return { message: v.message, since: v.since, expectedBackAt: v.expectedBackAt }
}

export function parseCalendar(body: unknown): SchoolCalendar | null {
  if (!isObject(body)) return null
  const { today, state, breakName, reopensOn, openingDay } = body
  if (typeof today !== 'string') return null
  if (state !== 'not_started' && state !== 'in_term' && state !== 'on_break') return null
  if (!isStringOrNull(breakName) || !isStringOrNull(reopensOn) || !isStringOrNull(openingDay)) return null
  if (!('maintenance' in body)) return null
  const maintenance = parseMaintenance(body.maintenance)
  if (maintenance === undefined) return null
  return { today, state, breakName, reopensOn, openingDay, maintenance }
}

export function parseStatusFile(body: unknown): StatusFile | null {
  if (!isObject(body)) return null
  const { status, message } = body
  if (status !== 'ok' && status !== 'maintenance' && status !== 'down') return null
  if (!isStringOrNull(message)) return null
  return { status, message }
}
