// Notices are pages in Starlight's docs collection under docs/notices/, one
// file each, named YYYY-MM-DD-slug.md. The collection names an entry after its
// path without the extension, and the folder's index page after the folder.
export const noticesIndexId = 'docs/notices'

export function isNotice(id: string): boolean {
  return id.startsWith(`${noticesIndexId}/`)
}

// The date at the start of the notice's file name. A notice without one fails
// the build rather than landing in the wrong place in the list.
export function noticeDate(id: string): string {
  const name = id.slice(id.lastIndexOf('/') + 1)
  const date = name.match(/^(\d{4})-(\d{2})-(\d{2})(?:-|$)/)
  if (date) {
    const [, y, m, d] = date.map(Number)
    const day = new Date(Date.UTC(y, m - 1, d))
    if (day.getUTCFullYear() === y && day.getUTCMonth() === m - 1 && day.getUTCDate() === d) {
      return date[0].slice(0, 10)
    }
  }
  throw new Error(`The notice "${id}" needs a file name that starts with a real date, as in YYYY-MM-DD-slug.md`)
}

// Notices are written in the school's time zone, Beijing time.
export const schoolTimeZone = 'Asia/Shanghai'

// "2026-11-22" and "21:30" for a moment, in the school's time zone.
function schoolDay(moment: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: schoolTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(moment)
}
function schoolClock(moment: Date): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: schoolTimeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(moment)
}

// The time a notice went out, to the minute ("21:30"), or null when it gives none.
// A time on another day than its file name fails the build, so the list cannot
// show one date and sort by another.
export function noticeTime(id: string, published: Date | undefined): string | null {
  if (!published) return null
  if (Number.isNaN(published.getTime())) throw new Error(`The notice "${id}" has a published time that is not a real time`)
  const day = schoolDay(published)
  if (day !== noticeDate(id)) {
    throw new Error(`The notice "${id}" was published on ${day} (Beijing time), not on the date in its file name`)
  }
  return schoolClock(published)
}

type NoticeEntry = { id: string; data?: { published?: Date } }

// The n most recent notices, newest first: by date, then by time on the same day
// (a notice with a time before one without), then by file name.
export function latestNotices<T extends NoticeEntry>(entries: T[], n: number): T[] {
  const at = (e: T) => e.data?.published?.getTime() ?? -Infinity
  return entries
    .filter((entry) => entry.id !== noticesIndexId)
    .map((entry) => ({ entry, date: noticeDate(entry.id) }))
    .sort((a, b) =>
      a.date !== b.date ? (a.date < b.date ? 1 : -1) : at(b.entry) - at(a.entry) || a.entry.id.localeCompare(b.entry.id),
    )
    .slice(0, n)
    .map(({ entry }) => entry)
}
