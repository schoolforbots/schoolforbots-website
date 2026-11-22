import { describe, expect, it } from 'vitest'
import { schoolDateTime, schoolDayName, schoolSpan } from '../../../src/lib/school/time'

const at = (iso: string) => new Date(iso)
const now = at('2026-11-22T10:00:00+08:00')

describe('school time', () => {
  it('writes moments in Beijing time, the year only when it is not this year', () => {
    expect(schoolDateTime(at('2026-11-20T18:30:00+08:00'), now)).toBe('11月20日 18:30')
    // 23:30 UTC on the 21st is 07:30 on the 22nd in Beijing.
    expect(schoolDateTime(at('2026-11-21T23:30:00Z'), now)).toBe('11月22日 07:30')
    expect(schoolDateTime(at('2025-12-31T09:05:00+08:00'), now)).toBe('2025年12月31日 09:05')
  })

  it("shows the school's UTC strings in Beijing time, across midnight too", () => {
    expect(schoolDateTime(at('2026-11-20T10:30:00.000Z'), now)).toBe('11月20日 18:30')
    expect(schoolSpan(at('2026-11-23T18:00:00.000Z'), at('2026-11-23T19:00:00.000Z'), now)).toBe('11月24日 02:00–03:00')
  })

  it('names today and tomorrow, and other days with their weekday', () => {
    expect(schoolDayName(at('2026-11-22T19:30:00+08:00'), now)).toBe('今天')
    expect(schoolDayName(at('2026-11-23T08:00:00+08:00'), now)).toBe('明天')
    expect(schoolDayName(at('2026-11-24T08:00:00+08:00'), now)).toBe('11月24日 周二')
  })

  it('writes a span on one day, across days, or open-ended', () => {
    expect(schoolSpan(at('2026-11-24T02:00:00+08:00'), at('2026-11-24T03:00:00+08:00'), now)).toBe('11月24日 02:00–03:00')
    expect(schoolSpan(at('2026-11-24T23:00:00+08:00'), at('2026-11-25T01:00:00+08:00'), now)).toBe('11月24日 23:00 – 11月25日 01:00')
    expect(schoolSpan(at('2026-11-24T02:00:00+08:00'), null, now)).toBe('11月24日 02:00 起')
  })
})
