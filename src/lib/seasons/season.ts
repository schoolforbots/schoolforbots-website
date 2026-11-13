// Which season the homepage shows: the page is split into four parts, top to
// bottom, and the season changes as the reader scrolls from one to the next.

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter']

/**
 * The season for a scroll position.
 *
 * `progress` is how far down the page the reader is, 0 at the top and 1 at the
 * bottom. With a `current` season, the season changes only once the reader is
 * `hysteresis` quarters of the page past a seam, so a scroll resting on the
 * seam does not flicker between two seasons.
 */
export function seasonAt(progress: number, current: Season | null, hysteresis = 0.03): Season {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0
  const s = p * SEASONS.length
  const next = SEASONS[Math.min(SEASONS.length - 1, Math.floor(s))]
  if (current === null) return next
  const i = SEASONS.indexOf(current)
  return s > i + 1 + hysteresis || s < i - hysteresis ? next : current
}
