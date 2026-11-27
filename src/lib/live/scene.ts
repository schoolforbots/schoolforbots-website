// Which campus picture to show now: each scene in the assets manifest has the hours
// it is for in Beijing time ("18:00-06:00" runs past midnight). A scene with no
// picture yet (null) is skipped; with none matching, the night scene shows.
import manifest from '../../data/school-assets.json'
import { schoolParts } from '../school/time'

type Scenes = Record<string, { image: string; hours: string } | null>

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Whether `at` (minutes after midnight) falls in `hours` ("HH:MM-HH:MM", the end not included). */
export function inHours(hours: string, at: number): boolean {
  const [from, to] = hours.split('-').map(minutes)
  return from <= to ? from <= at && at < to : at >= from || at < to
}

export function campusImage(now: Date, scenes: Scenes = manifest.campus.scenes as Scenes): string {
  const [h, m] = schoolParts(now).clock.split(':').map(Number)
  const at = h * 60 + m
  const match = Object.values(scenes).find((s) => s && inHours(s.hours, at))
  return `/school-assets/${(match ?? scenes.night)!.image}`
}

/** Points every img[data-campus-scene] at the picture for now, and again whenever the hour turns. */
export function mountCampusScenes(): void {
  const imgs = [...document.querySelectorAll<HTMLImageElement>('img[data-campus-scene]')]
  if (!imgs.length) return
  const set = () => {
    const src = campusImage(new Date())
    for (const img of imgs) if (img.getAttribute('src') !== src) img.src = src
  }
  set()
  window.setInterval(set, 60_000)
}
