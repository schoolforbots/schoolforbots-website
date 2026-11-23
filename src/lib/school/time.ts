// Moments from the school, shown in the school's time zone (Beijing time), the
// way a school notice would write them: 11月20日 18:30, with the year only when
// it is not this year, and 今天 / 明天 where that reads better.

export const schoolTimeZone = 'Asia/Shanghai'

interface Parts {
  year: number
  month: number
  day: number
  weekday: number // 0 Sunday … 6 Saturday
  clock: string // "18:30"
}

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: schoolTimeZone,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function schoolParts(moment: Date): Parts {
  const get = (type: string) => formatter.formatToParts(moment).find((p) => p.type === type)?.value ?? ''
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: WEEKDAYS.indexOf(get('weekday')),
    clock: `${get('hour')}:${get('minute')}`,
  }
}

const sameDay = (a: Parts, b: Parts) => a.year === b.year && a.month === b.month && a.day === b.day

// "11月20日", or "2025年11月20日" in another year than now.
export function schoolDate(moment: Date, now: Date): string {
  const p = schoolParts(moment)
  const n = schoolParts(now)
  return p.year === n.year ? `${p.month}月${p.day}日` : `${p.year}年${p.month}月${p.day}日`
}

// "11月20日 18:30".
export function schoolDateTime(moment: Date, now: Date): string {
  return `${schoolDate(moment, now)} ${schoolParts(moment).clock}`
}

const ZH_WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// "11月24日 周一".
export function schoolDateWeekday(moment: Date, now: Date): string {
  return `${schoolDate(moment, now)} ${ZH_WEEKDAYS[schoolParts(moment).weekday]}`
}

// "今天", "明天", or null for another day.
export function schoolNearDay(moment: Date, now: Date): '今天' | '明天' | null {
  const p = schoolParts(moment)
  if (sameDay(p, schoolParts(now))) return '今天'
  if (sameDay(p, schoolParts(new Date(now.getTime() + 24 * 3600 * 1000)))) return '明天'
  return null
}

// "今天", "明天", or "11月24日 周一".
export function schoolDayName(moment: Date, now: Date): string {
  return schoolNearDay(moment, now) ?? schoolDateWeekday(moment, now)
}

// A span of time: "11月24日 02:00–03:00", "11月24日 23:00 – 11月25日 01:00", or "11月24日 02:00 起".
export function schoolSpan(start: Date, end: Date | null, now: Date): string {
  if (!end) return `${schoolDateTime(start, now)} 起`
  if (sameDay(schoolParts(start), schoolParts(end))) return `${schoolDateTime(start, now)}–${schoolParts(end).clock}`
  return `${schoolDateTime(start, now)} – ${schoolDateTime(end, now)}`
}
