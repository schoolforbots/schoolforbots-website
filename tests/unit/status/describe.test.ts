import { describe, expect, it } from 'vitest'
import { describeStatus } from '../../../src/lib/status/describe'
import type { SchoolCalendar, StatusView } from '../../../src/lib/status/types'

const base: SchoolCalendar = {
  today: '2026-11-12',
  state: 'in_term',
  breakName: null,
  reopensOn: null,
  openingDay: null,
  maintenance: null,
}
const opts = {
  now: new Date('2026-11-12T12:00:00Z'),
  timeZone: 'Asia/Shanghai',
  statusFileUrl: 'https://status.test/status.json',
  cannotConnectHref: '/help/cannot-connect/',
}
const cal = (c: Partial<SchoolCalendar>): StatusView => ({ kind: 'calendar', calendar: { ...base, ...c } })
const d = (v: StatusView) => describeStatus(v, opts)

describe('describeStatus', () => {
  it('in term says 学期中 and never 今天', () => {
    const r = d(cal({}))
    expect(r).toEqual({ tone: 'ok', text: '学校正常 · 学期中', link: null })
    expect(r.text).not.toContain('今天')
  })

  it('on break with a name and a date', () => {
    const r = d(cal({ today: '2027-01-20', state: 'on_break', breakName: '寒假', reopensOn: '2027-02-16' }))
    expect(r).toEqual({ tone: 'ok', text: '学校正常 · 放假中（寒假），2月16日开学', link: null })
  })

  it('on break without a name drops the brackets', () => {
    expect(d(cal({ state: 'on_break', reopensOn: '2026-12-01' })).text).toBe('学校正常 · 放假中，12月1日开学')
  })

  it('a date in another year shows the year', () => {
    const r = d(cal({ today: '2026-12-30', state: 'on_break', breakName: '元旦', reopensOn: '2027-01-04' }))
    expect(r.text.endsWith('2027年1月4日开学')).toBe(true)
    expect(d(cal({ state: 'not_started', openingDay: '2027-03-01' })).text).toBe('学校正常 · 还没开学，2027年3月1日开学')
  })

  it('no date yet says 开学日期待定', () => {
    expect(d(cal({ state: 'on_break', breakName: '寒假' })).text).toBe('学校正常 · 放假中（寒假），开学日期待定')
    expect(d(cal({ state: 'not_started' })).text).toBe('学校正常 · 还没开学，开学日期待定')
  })

  it('not_started with a date', () => {
    expect(d(cal({ state: 'not_started', openingDay: '2026-12-01' })).text).toBe('学校正常 · 还没开学，12月1日开学')
  })

  it('maintenance without expectedBackAt', () => {
    const m = { message: '升级数据库', since: '2026-11-12T10:00:00Z', expectedBackAt: null }
    expect(d(cal({ maintenance: m }))).toEqual({ tone: 'notice', text: '学校在维护：升级数据库', link: null })
  })

  it('maintenance before expectedBackAt shows the time', () => {
    const m = { message: '升级数据库', since: '2026-11-12T10:00:00Z', expectedBackAt: '2026-11-12T13:30:00Z' }
    expect(d(cal({ state: 'on_break', maintenance: m }))).toEqual({
      tone: 'notice',
      text: '学校在维护：升级数据库（预计 11月12日 21:30 恢复）',
      link: null,
    })
  })

  it('maintenance after expectedBackAt says 维护比预计的久', () => {
    const m = { message: '升级数据库', since: '2026-11-12T08:00:00Z', expectedBackAt: '2026-11-12T11:30:00Z' }
    const r = d(cal({ maintenance: m }))
    expect(r.text).toBe('学校在维护：升级数据库（维护比预计的久，请稍候）')
    expect(r.text).not.toContain('21:30')
    expect(r.text).not.toContain('19:30')
  })

  it('sentinel texts', () => {
    expect(d({ kind: 'sentinel', status: 'ok', message: null })).toEqual({ tone: 'ok', text: '学校正常', link: null })
    expect(d({ kind: 'sentinel', status: 'maintenance', message: '换机器' }).text).toBe('学校在维护：换机器')
    expect(d({ kind: 'sentinel', status: 'maintenance', message: null })).toEqual({ tone: 'notice', text: '学校在维护', link: null })
    expect(d({ kind: 'sentinel', status: 'down', message: '故障' })).toEqual({ tone: 'down', text: '学校暂时连不上：故障', link: null })
    expect(d({ kind: 'sentinel', status: 'down', message: null }).text).toBe('学校暂时连不上')
  })

  it("unreachable-here uses the design's sentence and links to the cannot-connect page", () => {
    expect(d({ kind: 'unreachable-here' })).toEqual({
      tone: 'notice',
      text: '学校在运行，但当前网络连不上学校：可能是网络问题，也可能是部分地区连不上',
      link: { href: '/help/cannot-connect/', label: '连不上学校怎么办' },
    })
  })

  it('unknown says 状态暂时查不到 and links to the status file', () => {
    expect(d({ kind: 'unknown' })).toEqual({
      tone: 'unknown',
      text: '状态暂时查不到',
      link: { href: 'https://status.test/status.json', label: '看状态文件' },
    })
  })
})
