// Draws a live scene (live.ts) on the campus illustration: a label over each place
// (its name and what is going on there) and a round avatar for everyone in it,
// laid out in the open ground the assets manifest marks for the place. From one
// snapshot to the next the avatars that stay are kept: one who moves slides to
// the new place, newcomers fade in, those who left fade out. Between snapshots
// (five seconds) the avatars make small made-up movements so the campus does not
// look frozen; these say nothing about what the students do.
import manifest from '../../data/school-assets.json'
import { placeNames, placeSummary, PLACES, type Figure, type PlaceKey, type Scene } from './live'

type Box = [number, number, number, number]
interface Location {
  label: string
  labelAt: [number, number]
  area: Box | null
}

const locations = manifest.campus.locations as unknown as Record<string, Location>
const palette = manifest.palette as Record<string, string>
const ASSETS = '/school-assets/'

/** At most this many avatars in one place; the rest fold into a "+N". */
const MAX_PER_PLACE = 40

interface Look {
  image: string
  background: string
  border: string
}

type Character = { avatars: { image: string }[]; colors: { background: string; border: string } }
type AiTypeLook = { avatars: { image: string }[]; default: { background: string; border: string } }

/**
 * A figure's picture and colours. Teachers, sparring bots and anonymous students wear their fixed character; a named
 * student wears their robot type's first avatar (an unknown type the fallback type's), in the colours their owner
 * chose, each one the page does not know falling back to the type's default.
 */
export function look(f: Pick<Figure, 'kind' | 'aiType' | 'avatar'>): Look {
  if (f.kind !== 'student') {
    const c = (manifest.characters as Record<string, Character>)[f.kind]
    return { image: ASSETS + c.avatars[0].image, background: palette[c.colors.background], border: palette[c.colors.border] }
  }
  const types = manifest.aiTypes as Record<string, AiTypeLook>
  const t = types[f.aiType ?? ''] ?? types[manifest.fallbackAiType]
  const color = (chosen: string | null | undefined, fallback: string) => palette[chosen ?? ''] ?? palette[fallback]
  return {
    image: ASSETS + t.avatars[0].image,
    background: color(f.avatar?.background, t.default.background),
    border: color(f.avatar?.border, t.default.border),
  }
}

/** The order inside a place: teachers first, then each table's people together, then everyone else as they came. */
function arrange(figures: Figure[]): Figure[] {
  const rank = (f: Figure) => (f.kind === 'teacher' ? 0 : 1)
  return figures
    .map((f, i) => ({ f, i }))
    .sort((a, b) => rank(a.f) - rank(b.f) || (a.f.tableId ?? '').localeCompare(b.f.tableId ?? '') || a.i - b.i)
    .map((x) => x.f)
}

/**
 * Where each of `n` avatars goes in `area` (fractions of the picture), in rows, with the picture's aspect `aspect`
 * (width over height), as the centre of each avatar.
 */
export function slots(area: Box, n: number, aspect: number): [number, number][] {
  if (n === 0) return []
  const [x, y, w, h] = area
  // Columns so the cells are about square on screen.
  const cols = Math.max(1, Math.min(n, Math.round(Math.sqrt((n * w * aspect) / h))))
  const rows = Math.ceil(n / cols)
  const out: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols)
    const inRow = r === rows - 1 ? n - r * cols : cols
    const c = i % cols
    // A small stagger on odd rows, and the last row centred.
    const cx = x + (w * (c + 0.5 + (cols - inRow) / 2)) / cols + (r % 2 ? w / cols / 4 : 0)
    const cy = y + (h * (r + 0.5)) / rows
    out.push([Math.min(x + w, cx), cy])
  }
  return out
}

interface Mounted {
  el: HTMLElement
  figure: Figure
}

export class CampusMap {
  private readonly layer: HTMLElement
  private readonly labels = new Map<PlaceKey, HTMLElement>()
  private readonly mounted = new Map<string, Mounted>()
  private readonly reduce = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly aspect = manifest.campus.width / manifest.campus.height
  private popover: HTMLElement
  private fidget: number | undefined

  constructor(root: HTMLElement) {
    this.layer = root.querySelector<HTMLElement>('[data-live-figures]') ?? root
    for (const key of PLACES) {
      const loc = locations[key]
      if (!loc) continue
      const label = document.createElement('div')
      label.className = 'place-label'
      label.dataset.place = key
      label.style.left = `${loc.labelAt[0] * 100}%`
      label.style.top = `${loc.labelAt[1] * 100}%`
      label.innerHTML = '<strong></strong><span></span>'
      label.querySelector('strong')!.textContent = placeNames[key]
      root.querySelector('[data-live-labels]')?.append(label)
      this.labels.set(key, label)
    }
    this.popover = document.createElement('div')
    this.popover.className = 'figure-card'
    this.popover.hidden = true
    this.popover.setAttribute('role', 'status')
    root.append(this.popover)
    root.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.figure')) this.hideCard()
    })
  }

  /** Shows `scene`, keeping the avatars that stay. */
  render(scene: Scene): void {
    for (const [key, label] of this.labels) {
      label.querySelector('span')!.textContent = placeSummary(scene, key)
      const busy = scene.figures.some((f) => f.place === key && f.kind !== 'teacher')
      label.toggleAttribute('data-busy', busy)
    }

    const placed = new Map<string, { figure: Figure; at: [number, number] }>()
    const extra = new Map<PlaceKey, { count: number; at: [number, number] }>()
    for (const key of PLACES) {
      const area = locations[key]?.area
      if (!area) continue
      const here = arrange(scene.figures.filter((f) => f.place === key))
      const shown = here.length > MAX_PER_PLACE ? here.slice(0, MAX_PER_PLACE - 1) : here
      const at = slots(area as Box, shown.length + (shown.length < here.length ? 1 : 0), this.aspect)
      shown.forEach((figure, i) => placed.set(figure.key, { figure, at: at[i] }))
      if (shown.length < here.length) extra.set(key, { count: here.length - shown.length, at: at[shown.length] })
    }

    // Leave: fade out, then go.
    for (const [key, m] of this.mounted) {
      if (placed.has(key)) continue
      this.mounted.delete(key)
      m.el.dataset.leaving = ''
      window.setTimeout(() => m.el.remove(), this.reduce.matches ? 0 : 500)
    }
    // Stay (slide to the new spot) or come (fade in at it).
    for (const [key, { figure, at }] of placed) {
      let m = this.mounted.get(key)
      if (!m) {
        m = { el: this.figureEl(figure), figure }
        m.el.dataset.entering = ''
        this.layer.append(m.el)
        this.mounted.set(key, m)
        const el = m.el
        requestAnimationFrame(() => requestAnimationFrame(() => el.removeAttribute('data-entering')))
      }
      m.figure = figure
      this.dress(m.el, figure)
      m.el.dataset.place = figure.place
      m.el.setAttribute('aria-label', this.describe(figure))
      m.el.style.left = `${at[0] * 100}%`
      m.el.style.top = `${at[1] * 100}%`
    }

    this.layer.querySelectorAll('.more').forEach((n) => n.remove())
    for (const [, { count, at }] of extra) {
      const more = document.createElement('span')
      more.className = 'more'
      more.textContent = `+${count}`
      more.style.left = `${at[0] * 100}%`
      more.style.top = `${at[1] * 100}%`
      this.layer.append(more)
    }
    this.startFidgeting()
  }

  private describe(f: Figure): string {
    return [f.name, f.number, f.status].filter(Boolean).join(' · ')
  }

  // Puts on `f`'s picture and colours; again when an owner changes them while the student is on the map.
  private dress(el: HTMLElement, f: Figure): void {
    const l = look(f)
    el.style.setProperty('--figure-bg', l.background)
    el.style.setProperty('--figure-border', l.border)
    const img = el.querySelector('img')
    if (img && img.getAttribute('src') !== l.image) img.src = l.image
  }

  private figureEl(f: Figure): HTMLElement {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'figure'
    el.dataset.kind = f.kind
    // Each avatar bobs at its own pace.
    el.style.setProperty('--bob-delay', `${-Math.random() * 3}s`)
    el.style.setProperty('--bob-time', `${2.4 + Math.random() * 1.6}s`)
    const body = document.createElement('span')
    body.className = 'body'
    const img = document.createElement('img')
    img.alt = ''
    img.decoding = 'async'
    body.append(img)
    el.append(body)
    this.dress(el, f)
    el.addEventListener('click', () => this.showCard(el))
    el.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && this.showCard(el))
    el.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && this.hideCard())
    el.addEventListener('focus', () => this.showCard(el))
    el.addEventListener('blur', () => this.hideCard())
    return el
  }

  private showCard(el: HTMLElement): void {
    const m = [...this.mounted.values()].find((x) => x.el === el)
    if (!m) return
    const f = m.figure
    this.popover.replaceChildren()
    const head = document.createElement('p')
    head.className = 'who'
    head.append(document.createTextNode(f.name))
    if (f.number) {
      const code = document.createElement('code')
      code.textContent = f.number
      head.append(' ', code)
    }
    const what = document.createElement('p')
    what.className = 'what'
    what.textContent = f.status
    this.popover.append(head, what)
    this.popover.style.left = el.style.left
    this.popover.style.top = el.style.top
    this.popover.hidden = false
  }

  private hideCard(): void {
    this.popover.hidden = true
  }

  // Every couple of seconds a few avatars take a small step within their spot, and at a table someone leans in as if
  // playing a card. Off when the reader asks for reduced motion.
  private startFidgeting(): void {
    if (this.fidget !== undefined || this.reduce.matches) return
    this.fidget = window.setInterval(() => {
      if (document.hidden) return
      const all = [...this.mounted.values()]
      for (let i = 0; i < Math.ceil(all.length / 6); i++) {
        const m = all[Math.floor(Math.random() * all.length)]
        if (!m || m.figure.kind === 'teacher') continue
        if (m.figure.tableId && m.figure.status.includes('在打')) {
          m.el.dataset.play = ''
          window.setTimeout(() => m.el.removeAttribute('data-play'), 700)
        } else {
          m.el.style.setProperty('--dx', `${(Math.random() - 0.5) * 0.9}rem`)
          m.el.style.setProperty('--dy', `${(Math.random() - 0.5) * 0.5}rem`)
        }
      }
    }, 1600)
  }
}
