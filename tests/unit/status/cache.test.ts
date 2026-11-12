import { describe, expect, it } from 'vitest'
import { readCachedView, writeCachedView } from '../../../src/lib/status/cache'
import type { StatusView } from '../../../src/lib/status/types'

function memory(): Storage {
  const m = new Map<string, string>()
  return {
    get length() {
      return m.size
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  }
}
const view: StatusView = { kind: 'sentinel', status: 'maintenance', message: '维护' }
const MAX = 300000

describe('status cache', () => {
  it('returns a fresh view', () => {
    const s = memory()
    writeCachedView(s, view, { now: 1000, calendarCors: true })
    expect(JSON.parse(s.getItem('sfb-status')!)).toMatchObject({ v: 1, at: 1000, cors: true, view })
    expect(readCachedView(s, { now: 1000 + MAX - 1, maxAgeMs: MAX, calendarCors: true })).toEqual(view)
  })

  it('ignores a view older than maxAgeMs', () => {
    const s = memory()
    writeCachedView(s, view, { now: 1000, calendarCors: true })
    expect(readCachedView(s, { now: 1000 + MAX, maxAgeMs: MAX, calendarCors: true })).toBeNull()
  })

  it('ignores a view written in the future (clock moved back)', () => {
    const s = memory()
    writeCachedView(s, view, { now: 5000, calendarCors: true })
    expect(readCachedView(s, { now: 1000, maxAgeMs: MAX, calendarCors: true })).toBeNull()
  })

  it('ignores a view cached under the other calendarCors', () => {
    const s = memory()
    writeCachedView(s, view, { now: 1000, calendarCors: true })
    expect(readCachedView(s, { now: 1000, maxAgeMs: MAX, calendarCors: false })).toBeNull()
  })

  it('never caches unknown', () => {
    const s = memory()
    writeCachedView(s, { kind: 'unknown' }, { now: 1000, calendarCors: true })
    expect(s.getItem('sfb-status')).toBeNull()
  })

  it('a storage that throws on every call is the same as no storage', () => {
    const boom = () => {
      throw new Error('denied')
    }
    const s = { getItem: boom, setItem: boom, removeItem: boom, clear: boom, key: boom, length: 0 } as unknown as Storage
    expect(() => writeCachedView(s, view, { now: 1, calendarCors: true })).not.toThrow()
    expect(readCachedView(s, { now: 1, maxAgeMs: MAX, calendarCors: true })).toBeNull()
    expect(readCachedView(null, { now: 1, maxAgeMs: MAX, calendarCors: true })).toBeNull()
    expect(() => writeCachedView(null, view, { now: 1, calendarCors: true })).not.toThrow()
  })

  it('ignores garbage in the slot', () => {
    const s = memory()
    for (const g of ['not json', '{}', '{"v":2,"at":1,"cors":true,"view":{"kind":"unknown"}}', '{"v":1,"at":1,"cors":true,"view":{"kind":"zzz"}}', 'null']) {
      s.setItem('sfb-status', g)
      expect(readCachedView(s, { now: 2, maxAgeMs: MAX, calendarCors: true })).toBeNull()
    }
  })
})
