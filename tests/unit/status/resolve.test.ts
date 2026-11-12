import { describe, expect, it, vi } from 'vitest'
import { resolveStatus } from '../../../src/lib/status/resolve'

const CAL = 'https://api.test/v1/school-calendar'
const SF = 'https://status.test/status.json'
const calendar = {
  today: '2026-11-12',
  state: 'in_term',
  breakName: null,
  reopensOn: null,
  openingDay: null,
  breaks: [],
  maintenance: null,
}
type Step = { status: number; body: unknown } | 'net'

function run(calendarCors: boolean, cal: Step | null, sf: Step) {
  const f = vi.fn(async (url: string) => {
    const s = url === CAL ? cal : sf
    if (s === 'net' || s === null) throw new TypeError('Failed to fetch')
    return new Response(typeof s.body === 'string' ? s.body : JSON.stringify(s.body), { status: s.status })
  })
  const p = resolveStatus({
    calendarCors,
    calendarUrl: CAL,
    statusFileUrl: SF,
    timeoutMs: 1000,
    fetch: f as unknown as typeof fetch,
  })
  return { p, f }
}
const okCal: Step = { status: 200, body: calendar }
const sfOk: Step = { status: 200, body: { status: 'ok', message: null } }
const sfMaint: Step = { status: 200, body: { status: 'maintenance', message: '维护' } }
const sfDown: Step = { status: 200, body: { status: 'down', message: '故障' } }
const notReady: Step = { status: 503, body: { error: 'not ready' } }

describe('resolveStatus, calendarCors on', () => {
  it('calendar ok and parsed gives calendar', async () => {
    const { p } = run(true, okCal, sfOk)
    expect(await p).toMatchObject({ kind: 'calendar', calendar: { state: 'in_term' } })
  })
  it('does not read the status file when the calendar answers', async () => {
    const { p, f } = run(true, okCal, sfOk)
    await p
    expect(f).toHaveBeenCalledTimes(1)
  })
  it('bad-response calendar and sentinel maintenance/down gives sentinel', async () => {
    expect(await run(true, { status: 429, body: {} }, sfMaint).p).toEqual({ kind: 'sentinel', status: 'maintenance', message: '维护' })
    expect(await run(true, { status: 500, body: '<html>' }, sfDown).p).toEqual({ kind: 'sentinel', status: 'down', message: '故障' })
  })
  it('unparsable calendar (unknown state) and sentinel maintenance gives sentinel', async () => {
    expect(await run(true, { status: 200, body: { ...calendar, state: 'zzz' } }, sfMaint).p).toMatchObject({ kind: 'sentinel' })
  })
  it('bad-response or unparsable calendar and sentinel ok gives unknown, not unreachable-here', async () => {
    expect(await run(true, { status: 429, body: {} }, sfOk).p).toEqual({ kind: 'unknown' })
    expect(await run(true, { status: 200, body: { ...calendar, state: 'zzz' } }, sfOk).p).toEqual({ kind: 'unknown' })
  })
  it('unreachable calendar and sentinel maintenance/down gives sentinel', async () => {
    expect(await run(true, 'net', sfMaint).p).toMatchObject({ kind: 'sentinel', status: 'maintenance' })
    expect(await run(true, 'net', sfDown).p).toMatchObject({ kind: 'sentinel', status: 'down' })
  })
  it('unreachable calendar and sentinel ok gives unreachable-here', async () => {
    expect(await run(true, 'net', sfOk).p).toEqual({ kind: 'unreachable-here' })
  })
  it('calendar without a result and unreadable sentinel gives unknown', async () => {
    expect(await run(true, { status: 500, body: {} }, notReady).p).toEqual({ kind: 'unknown' })
    expect(await run(true, 'net', notReady).p).toEqual({ kind: 'unknown' })
    expect(await run(true, { status: 500, body: {} }, 'net').p).toEqual({ kind: 'unknown' })
    expect(await run(true, 'net', 'net').p).toEqual({ kind: 'unknown' })
  })
})

describe('resolveStatus, calendarCors off', () => {
  it('a readable sentinel gives sentinel', async () => {
    expect(await run(false, null, sfOk).p).toEqual({ kind: 'sentinel', status: 'ok', message: null })
  })
  it('an unreadable sentinel gives unknown', async () => {
    expect(await run(false, null, notReady).p).toEqual({ kind: 'unknown' })
    expect(await run(false, null, 'net').p).toEqual({ kind: 'unknown' })
  })
  it('with calendarCors off the calendar is never requested', async () => {
    const { p, f } = run(false, okCal, sfOk)
    await p
    expect(f).toHaveBeenCalledTimes(1)
    expect(f.mock.calls[0]![0]).toBe(SF)
  })
})
