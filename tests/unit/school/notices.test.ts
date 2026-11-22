import { describe, expect, it } from 'vitest'
import {
  parseNotice,
  parseNoticesResponse,
  parseStatusNotices,
  readCachedNotices,
  resolveNotices,
  writeCachedNotices,
} from '../../../src/lib/school/notices'
import { FakeStorage, fakeFetch, general, notice } from './fixtures'

const NOTICES = 'https://api.test/v1/notices?limit=50'
const STATUS = 'https://status.test/status.json'
const sources = (table: Record<string, unknown>, schoolReadable = true) => ({
  schoolReadable,
  noticesUrl: NOTICES,
  statusFileUrl: STATUS,
  timeoutMs: 1000,
  fetch: fakeFetch(table),
})

describe('notices from the school', () => {
  it('reads a notice and refuses malformed ones', () => {
    expect(parseNotice(notice())?.window?.endsAt).toBe('2026-11-23T19:00:00.000Z')
    expect(parseNotice(notice({ window: { startsAt: '2026-11-23T18:00:00.000Z', endsAt: null } }))?.window?.endsAt).toBeNull()
    expect(parseNotice(notice({ id: 0 }))).toBeNull()
    expect(parseNotice(notice({ title: '  ' }))).toBeNull()
    expect(parseNotice(notice({ kind: 'urgent' }))).toBeNull()
    expect(parseNotice(notice({ publishedAt: 'yesterday' }))).toBeNull()
    expect(parseNotice(notice({ window: { startsAt: 'soon', endsAt: null } }))).toBeNull()
  })

  it('drops a whole list when one notice is malformed', () => {
    expect(parseNoticesResponse({ notices: [notice(), general(1, '2026-11-18T20:00:00+08:00')], more: false })?.notices).toHaveLength(2)
    expect(parseNoticesResponse({ notices: [notice(), { id: 'x' }], more: false })).toBeNull()
    expect(parseNoticesResponse({ notices: [] })).toBeNull()
  })

  it("reads the status file's copy, or nothing when it has none", () => {
    const copy = { status: 'down', notices: { fetchedAt: '2026-11-22T02:00:00Z', items: [notice()] } }
    expect(parseStatusNotices(copy)?.notices).toHaveLength(1)
    expect(parseStatusNotices({ status: 'ok', message: null })).toBeNull()
    expect(parseStatusNotices({ notices: null })).toBeNull()
  })

  it('reads the school first, the status file when the school cannot be reached, and says when neither answered', async () => {
    const list = { notices: [notice()], more: false }
    const copy = { status: 'down', notices: { fetchedAt: '2026-11-22T02:00:00Z', items: [notice()] } }
    expect((await resolveNotices(sources({ [NOTICES]: list, [STATUS]: copy }))).kind).toBe('school')
    expect(await resolveNotices(sources({ [NOTICES]: 'fail', [STATUS]: copy }))).toMatchObject({
      kind: 'sentinel',
      fetchedAt: '2026-11-22T02:00:00Z',
    })
    expect((await resolveNotices(sources({ [NOTICES]: 503, [STATUS]: copy }))).kind).toBe('sentinel')
    expect((await resolveNotices(sources({ [NOTICES]: 'fail', [STATUS]: { status: 'down' } }))).kind).toBe('unreachable')
    // When the school does not let web pages read it, only the status file is asked.
    expect((await resolveNotices(sources({ [NOTICES]: list, [STATUS]: copy }, false))).kind).toBe('sentinel')
  })

  it("keeps the school's answer for a minute, never the status file's copy", () => {
    const storage = new FakeStorage()
    const school = { kind: 'school' as const, notices: [parseNotice(notice())!], more: false }
    writeCachedNotices(storage, school, { now: 1000, url: NOTICES })
    expect(readCachedNotices(storage, { now: 30_000, maxAgeMs: 60_000, url: NOTICES })).toEqual(school)
    expect(readCachedNotices(storage, { now: 70_000, maxAgeMs: 60_000, url: NOTICES })).toBeNull()
    expect(readCachedNotices(storage, { now: 30_000, maxAgeMs: 60_000, url: 'https://other.test/v1/notices' })).toBeNull()

    const fresh = new FakeStorage()
    writeCachedNotices(fresh, { kind: 'sentinel', notices: [], fetchedAt: '2026-11-22T02:00:00Z' }, { now: 1000, url: NOTICES })
    writeCachedNotices(fresh, { kind: 'unreachable' }, { now: 1000, url: NOTICES })
    expect(fresh.length).toBe(0)
  })
})
