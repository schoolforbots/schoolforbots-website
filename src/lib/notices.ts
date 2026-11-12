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

// The n most recent notices, newest first; notices from the same day keep file name order.
export function latestNotices<T extends { id: string }>(entries: T[], n: number): T[] {
  return entries
    .filter((entry) => entry.id !== noticesIndexId)
    .map((entry) => ({ entry, date: noticeDate(entry.id) }))
    .sort((a, b) => (a.date === b.date ? a.entry.id.localeCompare(b.entry.id) : a.date < b.date ? 1 : -1))
    .slice(0, n)
    .map(({ entry }) => entry)
}
