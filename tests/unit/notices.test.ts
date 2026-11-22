import { describe, expect, it } from 'vitest'
import { latestNotices, noticeDate, noticeTime } from '../../src/lib/notices'

// Entries as Starlight's docs collection names them: the list page is
// `docs/notices`, each notice is `docs/notices/<file name without .md>`.
const entry = (id: string) => ({ id, data: { title: id } })

describe('notices', () => {
  it('sorts by the date in the file name, newest first, and skips the index', () => {
    const entries = [
      entry('docs/notices/2026-11-20-winter-break'),
      entry('docs/notices'),
      entry('docs/notices/2027-01-05-new-term'),
      entry('docs/notices/2026-12-01-new-rules'),
      entry('docs/notices/2026-10-30-opening'),
    ]
    expect(noticeDate('docs/notices/2026-12-01-new-rules')).toBe('2026-12-01')
    expect(latestNotices(entries, 3).map((e) => e.id)).toEqual([
      'docs/notices/2027-01-05-new-term',
      'docs/notices/2026-12-01-new-rules',
      'docs/notices/2026-11-20-winter-break',
    ])
    expect(latestNotices(entries, 10)).toHaveLength(4)
    expect(latestNotices([entry('docs/notices')], 3)).toEqual([])
    // The input is left as it was.
    expect(entries[0].id).toBe('docs/notices/2026-11-20-winter-break')
  })

  it('a notice whose file name has no date throws', () => {
    expect(() => noticeDate('docs/notices/winter-break')).toThrow(/docs\/notices\/winter-break/)
    expect(() => noticeDate('docs/notices/2026-13-01-new-term')).toThrow(/2026-13-01/)
    expect(() => noticeDate('docs/notices/2026-02-30-new-term')).toThrow(/2026-02-30/)
    expect(() => latestNotices([entry('docs/notices/winter-break')], 3)).toThrow(/winter-break/)
  })
  it('gives the time a notice went out, to the minute, in Beijing time', () => {
    expect(noticeTime('docs/notices/2026-11-22-plugin', new Date('2026-11-22T10:15:00+08:00'))).toBe('10:15')
    // 23:30 UTC on the 21st is 07:30 on the 22nd in Beijing.
    expect(noticeTime('docs/notices/2026-11-22-plugin', new Date('2026-11-21T23:30:00Z'))).toBe('07:30')
    expect(noticeTime('docs/notices/2026-11-22-plugin', undefined)).toBeNull()
  })

  it('a published time on another day than the file name throws', () => {
    expect(() => noticeTime('docs/notices/2026-11-22-plugin', new Date('2026-11-23T00:30:00+08:00'))).toThrow(/2026-11-23/)
    expect(() => noticeTime('docs/notices/2026-11-22-plugin', new Date('nonsense'))).toThrow(/not a real time/)
  })

  it('sorts notices of the same day by their time, newest first', () => {
    const at = (id: string, published?: string) => ({ id, data: { published: published ? new Date(published) : undefined } })
    const entries = [
      at('docs/notices/2026-11-22-a', '2026-11-22T09:00:00+08:00'),
      at('docs/notices/2026-11-22-b', '2026-11-22T18:00:00+08:00'),
      at('docs/notices/2026-11-22-c'),
      at('docs/notices/2026-11-23-d'),
    ]
    expect(latestNotices(entries, 10).map((e) => e.id)).toEqual([
      'docs/notices/2026-11-23-d',
      'docs/notices/2026-11-22-b',
      'docs/notices/2026-11-22-a',
      'docs/notices/2026-11-22-c',
    ])
  })
})
