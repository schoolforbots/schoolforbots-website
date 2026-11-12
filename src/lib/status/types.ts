export interface Maintenance {
  message: string
  since: string
  expectedBackAt: string | null
}

export interface SchoolCalendar {
  today: string
  state: 'not_started' | 'in_term' | 'on_break'
  breakName: string | null
  reopensOn: string | null
  openingDay: string | null
  maintenance: Maintenance | null
}

export interface StatusFile {
  status: 'ok' | 'maintenance' | 'down'
  message: string | null
}

export type FetchOutcome = { kind: 'ok'; body: unknown } | { kind: 'bad-response' } | { kind: 'unreachable' }

export type StatusView =
  | { kind: 'calendar'; calendar: SchoolCalendar }
  | { kind: 'sentinel'; status: StatusFile['status']; message: string | null }
  | { kind: 'unreachable-here' }
  | { kind: 'unknown' }

export type Tone = 'ok' | 'notice' | 'down' | 'unknown'

export interface StatusText {
  tone: Tone
  text: string
  link: { href: string; label: string } | null
}
