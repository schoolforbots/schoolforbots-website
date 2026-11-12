import type { SchoolCalendar, StatusText, StatusView } from './types'

export interface DescribeOptions {
  now: Date
  timeZone?: string
  statusFileUrl: string
  cannotConnectHref: string
}

// `YYYY-MM-DD` is a calendar date, so it is split rather than parsed into a Date
// (which would shift it by the reader's time zone).
function formatDate(date: string, today: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  if (!m) return date
  const md = `${Number(m[2])}月${Number(m[3])}日`
  return m[1] === today.slice(0, 4) ? md : `${Number(m[1])}年${md}`
}

function formatTime(at: Date, timeZone: string | undefined): string {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('month')}月${get('day')}日 ${get('hour')}:${get('minute')}`
}

function describeCalendar(c: SchoolCalendar, o: DescribeOptions): StatusText {
  if (c.maintenance) {
    const { message, expectedBackAt } = c.maintenance
    let tail = ''
    if (expectedBackAt !== null) {
      const back = new Date(expectedBackAt)
      if (Number.isNaN(back.getTime())) tail = ''
      else if (back.getTime() > o.now.getTime()) tail = `（预计 ${formatTime(back, o.timeZone)} 恢复）`
      else tail = '（维护比预计的久，请稍候）'
    }
    return { tone: 'notice', text: `学校在维护：${message}${tail}`, link: null }
  }
  if (c.state === 'in_term') return { tone: 'ok', text: '学校正常 · 学期中', link: null }
  if (c.state === 'on_break') {
    const name = c.breakName ? `（${c.breakName}）` : ''
    const when = c.reopensOn ? `${formatDate(c.reopensOn, c.today)}开学` : '开学日期待定'
    return { tone: 'ok', text: `学校正常 · 放假中${name}，${when}`, link: null }
  }
  const when = c.openingDay ? `${formatDate(c.openingDay, c.today)}开学` : '开学日期待定'
  return { tone: 'ok', text: `学校正常 · 还没开学，${when}`, link: null }
}

export function describeStatus(view: StatusView, o: DescribeOptions): StatusText {
  switch (view.kind) {
    case 'calendar':
      return describeCalendar(view.calendar, o)
    case 'sentinel':
      if (view.status === 'ok') return { tone: 'ok', text: '学校正常', link: null }
      if (view.status === 'maintenance')
        return { tone: 'notice', text: view.message === null ? '学校在维护' : `学校在维护：${view.message}`, link: null }
      return { tone: 'down', text: view.message === null ? '学校暂时连不上' : `学校暂时连不上：${view.message}`, link: null }
    case 'unreachable-here':
      return {
        tone: 'notice',
        text: '学校在运行，但当前网络连不上学校：可能是网络问题，也可能是部分地区连不上',
        link: { href: o.cannotConnectHref, label: '连不上学校怎么办' },
      }
    case 'unknown':
      return { tone: 'unknown', text: '状态暂时查不到', link: { href: o.statusFileUrl, label: '看状态文件' } }
  }
}
