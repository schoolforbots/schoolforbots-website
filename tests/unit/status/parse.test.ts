import { describe, expect, it } from 'vitest'
import { parseCalendar, parseStatusFile } from '../../../src/lib/status/parse'

const cal = {
  today: '2026-11-12',
  state: 'in_term',
  breakName: null,
  reopensOn: null,
  openingDay: null,
  breaks: [],
  maintenance: null,
}

describe('parseCalendar', () => {
  it('accepts the documented calendar', () => {
    expect(parseCalendar(cal)).toEqual({
      today: '2026-11-12',
      state: 'in_term',
      breakName: null,
      reopensOn: null,
      openingDay: null,
      maintenance: null,
    })
    const m = { message: '升级', since: '2026-11-12T10:00:00Z', expectedBackAt: null }
    expect(parseCalendar({ ...cal, state: 'on_break', breakName: '寒假', reopensOn: '2027-02-16', maintenance: m })).toMatchObject({
      breakName: '寒假',
      maintenance: m,
    })
  })

  it('rejects an unknown state', () => {
    expect(parseCalendar({ ...cal, state: 'closed' })).toBeNull()
  })

  it('rejects a calendar without the maintenance key', () => {
    const { maintenance: _m, ...rest } = cal
    expect(parseCalendar(rest)).toBeNull()
  })

  it('rejects wrong field types and non-objects', () => {
    expect(parseCalendar({ ...cal, today: 5 })).toBeNull()
    expect(parseCalendar({ ...cal, reopensOn: 5 })).toBeNull()
    expect(parseCalendar({ ...cal, maintenance: { message: 'x', since: 's' } })).toBeNull()
    expect(parseCalendar(null)).toBeNull()
    expect(parseCalendar('x')).toBeNull()
  })
})

describe('parseStatusFile', () => {
  it('accepts ok, maintenance and down', () => {
    expect(parseStatusFile({ status: 'ok', message: null, since: 'x' })).toEqual({ status: 'ok', message: null })
    expect(parseStatusFile({ status: 'maintenance', message: '维护' })).toEqual({ status: 'maintenance', message: '维护' })
    expect(parseStatusFile({ status: 'down', message: null })).toEqual({ status: 'down', message: null })
  })

  it('rejects {"error":"not ready"}', () => {
    expect(parseStatusFile({ error: 'not ready' })).toBeNull()
    expect(parseStatusFile({ status: 'weird', message: null })).toBeNull()
    expect(parseStatusFile({ status: 'ok', message: 3 })).toBeNull()
  })
})
