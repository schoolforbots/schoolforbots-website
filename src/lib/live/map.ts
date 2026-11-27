// Draws the live campus (live.ts) on its pictures, in one of four views
// (rooms.ts): the campus, a classroom, the club hall, one table up close. Over the
// picture: labels for the places or tables one can go into, a round avatar for
// everyone, and a small floating panel that says where the reader is, leads back,
// and lists the places and what there is to see in this one; it folds away.
//
// From one snapshot to the next the avatars that stay are kept: one who moves
// slides to the new spot, newcomers fade in, those who left fade out. Changing the
// view starts the picture afresh, with a move between the two: going in, the
// picture zooms towards the building or table and blurs away, and the room comes
// into focus; coming out, the room shrinks and blurs away, and the outer picture
// comes into focus from close on the place just left. Between snapshots (five seconds) the avatars make
// small made-up movements, and at a table up close cards fly to the middle; these
// say nothing about what the students do.
import manifest from '../../data/school-assets.json'
import { placeNames, placeSummary, placeTag, PLACES, type Figure, type PlaceKey, type Scene } from './live'
import { Camera } from './camera'
import { depth, focusPoint, layoutFor, panelFor, roomTitle, type Layout, type Panel, type Point, type View } from './rooms'

export { capacity, slots } from './rooms'

const palette = manifest.palette as Record<string, string>
const ASSETS = '/school-assets/'
const locations = manifest.campus.locations as unknown as Record<string, { label: string; labelAt: Point; reserved?: boolean }>
const PANEL_KEY = 'sfb-live-panel'

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

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

interface Mounted {
  el: HTMLElement
  figure: Figure
}

const MOVE_MS = 420
const EASE = 'cubic-bezier(0.45, 0, 0.25, 1)'

/** The key of what a view shows: a new one means a new picture. */
function shownKey(view: View): string {
  return view.kind === 'table' ? `table:${view.tableId}` : view.kind === 'building' ? `building:${view.room}` : view.kind
}

/** How the stage looks: its zoom, around which point, its blur and how opaque. */
interface Pose {
  scale: number
  at: Point
  blur: number
  opacity: number
}
const SHARP: Pose = { scale: 1, at: [0.5, 0.5], blur: 0, opacity: 1 }

export class LiveMap {
  private readonly picture: HTMLImageElement
  private readonly stage: HTMLElement
  private readonly title: HTMLElement
  private readonly camera: Camera | null
  private moving = false
  private pending = false
  private readonly labelLayer: HTMLElement
  private readonly layer: HTMLElement
  private readonly panelEl: HTMLElement | null
  private readonly mounted = new Map<string, Mounted>()
  private readonly reduce = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly popover: HTMLElement
  private view: View = { kind: 'campus' }
  private shownKind: string | null = null
  private scene: Scene | null = null
  private layout: Layout | null = null
  private fidget: number | undefined
  private tossAt = 0

  constructor(private readonly root: HTMLElement) {
    this.picture = root.querySelector<HTMLImageElement>('img.scene')!
    this.stage = root.querySelector<HTMLElement>('[data-live-stage]') ?? root
    // The title over a room, at the top middle of the picture; it moves with the picture.
    this.title = el('p', 'room-title')
    this.title.hidden = true
    this.title.setAttribute('aria-live', 'polite')
    this.stage.append(this.title)
    this.labelLayer = root.querySelector<HTMLElement>('[data-live-labels]') ?? root
    this.layer = root.querySelector<HTMLElement>('[data-live-figures]') ?? root
    this.panelEl = root.closest('[data-live-frame]')?.querySelector<HTMLElement>('[data-live-panel]') ?? null
    this.popover = el('div', 'figure-card')
    this.popover.hidden = true
    this.popover.setAttribute('role', 'status')
    root.append(this.popover)
    root.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.figure')) this.hideCard()
    })
    this.setUpPanel()
    // Zoom and drag: the camera moves the layer that holds the stage, within the picture's edges. Set up last: it
    // reports its first position at once, which hides the avatar card.
    const cameraLayer = root.querySelector<HTMLElement>('[data-live-camera]')
    this.camera = cameraLayer ? new Camera(root, cameraLayer, () => this.hideCard()) : null
    const controls = root.closest('[data-live-frame]')?.querySelector<HTMLElement>('[data-zoom-controls]')
    controls?.querySelector('[data-zoom="in"]')?.addEventListener('click', () => this.camera?.zoomBy(1.5))
    controls?.querySelector('[data-zoom="out"]')?.addEventListener('click', () => this.camera?.zoomBy(1 / 1.5))
    controls?.querySelector('[data-zoom="reset"]')?.addEventListener('click', () => this.camera?.reset())
  }

  get currentView(): View {
    return this.layout?.view ?? this.view
  }

  /** Goes to `view`, with a move from the one shown when there is something to move from. */
  async go(view: View): Promise<void> {
    const from = this.layout?.view
    this.view = view
    const scene = this.scene
    if (!scene || !from || this.moving) {
      if (scene && !this.moving) this.render(scene)
      return
    }
    const next = layoutFor(scene, view, new Date())
    if (shownKey(next.view) === this.shownKind || this.reduce.matches) {
      this.render(scene)
      return
    }
    // In: zoom towards the place in the picture shown, then the room comes up from a little close. Out: the room
    // shrinks away, then the outer picture comes from close on the place left. Across: a short blur over.
    const step = Math.sign(depth(next.view) - depth(from))
    const out: Pose =
      step > 0
        ? { scale: 2.4, at: focusPoint(from, next.view, scene), blur: 8, opacity: 0 }
        : step < 0
          ? { scale: 0.8, at: [0.5, 0.5], blur: 8, opacity: 0 }
          : { scale: 1.04, at: [0.5, 0.5], blur: 6, opacity: 0 }
    const into: Pose =
      step > 0
        ? { scale: 1.15, at: [0.5, 0.5], blur: 8, opacity: 0 }
        : step < 0
          ? { scale: 2.4, at: focusPoint(next.view, from, scene), blur: 8, opacity: 0 }
          : { scale: 0.97, at: [0.5, 0.5], blur: 6, opacity: 0 }

    this.moving = true
    this.hideCard()
    // Each view starts from its whole picture.
    this.camera?.reset(false)
    try {
      await this.pose(out, true)
      this.draw(this.scene ?? scene)
      await this.pose(into, false)
      // The new picture loaded before it shows, or it would come up blank.
      await Promise.race([this.picture.decode().catch(() => undefined), new Promise((r) => setTimeout(r, 1500))])
      await this.pose(SHARP, true)
    } finally {
      this.stage.style.transition = ''
      this.moving = false
    }
    if (this.pending && this.scene) {
      this.pending = false
      this.render(this.scene)
    }
  }

  // Puts the stage in `p`, moving there (and waiting for it) or at once.
  private pose(p: Pose, move: boolean): Promise<void> {
    const s = this.stage.style
    s.transition = move ? `transform ${MOVE_MS}ms ${EASE}, filter ${MOVE_MS}ms ${EASE}, opacity ${MOVE_MS}ms ${EASE}` : 'none'
    s.transformOrigin = `${p.at[0] * 100}% ${p.at[1] * 100}%`
    s.transform = p.scale === 1 ? '' : `scale(${p.scale})`
    s.filter = p.blur ? `blur(${p.blur}px)` : ''
    s.opacity = p.opacity === 1 ? '' : String(p.opacity)
    if (!move) {
      void this.stage.offsetWidth
      return Promise.resolve()
    }
    return new Promise((resolve) => setTimeout(resolve, MOVE_MS + 30))
  }

  /** Shows `scene` in the current view, keeping the avatars that stay; while moving between views, after the move. */
  render(scene: Scene): void {
    this.scene = scene
    if (this.moving) {
      this.pending = true
      return
    }
    this.draw(scene)
  }

  private draw(scene: Scene): void {
    const layout = layoutFor(scene, this.view, new Date())
    this.layout = layout
    const kind = shownKey(layout.view)
    if (kind !== this.shownKind) this.changePicture(layout, kind)
    if (layout.view.kind === 'campus') this.campusLabels(scene)
    else this.marks(layout)
    this.place(layout)
    const title = roomTitle(scene, layout)
    this.title.hidden = title === null
    this.title.textContent = title ?? ''
    this.renderPanel(panelFor(scene, layout))
    this.root.dataset.view = layout.view.kind
    this.startFidgeting()
  }

  // A new view: the picture, its proportions and avatar size, and no one carried over from the last one.
  private changePicture(layout: Layout, kind: string): void {
    this.shownKind = kind
    const p = layout.picture
    if (this.picture.getAttribute('src') !== p.image) this.picture.src = p.image
    this.picture.alt = { campus: '学校的鸟瞰图：三个学部的教学楼、社团活动中心、广场和校门', building: '教室：讲台和一排排座位', hall: '社团活动中心的大厅：几张斗地主牌桌', table: '一张斗地主牌桌的近景' }[layout.view.kind]
    this.root.style.aspectRatio = `${p.width} / ${p.height}`
    this.root.style.setProperty('--avatar-size', `${p.avatarSize * 100}cqi`)
    for (const m of this.mounted.values()) m.el.remove()
    this.mounted.clear()
    this.layer.replaceChildren()
    this.labelLayer.replaceChildren()
    this.hideCard()
  }

  // The campus: every place gets its name; the ones people go to say how many are there, and the buildings lead in.
  private campusLabels(scene: Scene): void {
    if (!this.labelLayer.childElementCount) {
      for (const [key, loc] of Object.entries(locations)) {
        const live = (PLACES as readonly string[]).includes(key) && !loc.reserved
        const enter = live && key !== 'plaza'
        const label = enter ? el('a', 'place-label') : el('div', 'place-label')
        if (enter) (label as HTMLAnchorElement).href = key === 'club' ? '#club' : `#${key}`
        label.dataset.place = key
        // labelAt is the middle of the label's bottom edge: the label sits just above the place's ground.
        label.dataset.anchor = 'bottom'
        if (!live) label.dataset.quiet = ''
        label.style.left = `${loc.labelAt[0] * 100}%`
        label.style.top = `${loc.labelAt[1] * 100}%`
        label.append(el('strong', undefined, loc.label || placeNames[key as PlaceKey] || key))
        if (live) label.append(el('span'))
        this.labelLayer.append(label)
      }
    }
    for (const key of PLACES) {
      const label = this.labelLayer.querySelector<HTMLElement>(`[data-place="${key}"]`)
      if (!label) continue
      // One short line on the map (the name and a count), so the label covers as little as it can; the whole line
      // on pointing at it.
      const tag = placeTag(scene, key)
      const span = label.querySelector('span')!
      span.textContent = tag
      span.hidden = tag === ''
      label.title = `${label.querySelector('strong')!.textContent} · ${placeSummary(scene, key)}`
      label.toggleAttribute('data-busy', scene.figures.some((f) => f.place === key && f.kind !== 'teacher'))
    }
  }

  // Inside: a label over each table of the hall, leading to it up close.
  private marks(layout: Layout): void {
    this.labelLayer.replaceChildren(
      ...layout.marks.map((m) => {
        const a = el('a', 'place-label')
        a.href = m.href
        a.title = m.title
        a.style.left = `${m.at[0] * 100}%`
        a.style.top = `${m.at[1] * 100}%`
        a.toggleAttribute('data-busy', m.busy)
        a.append(el('strong', undefined, m.name), el('span', undefined, m.tag))
        return a
      }),
    )
  }

  private place(layout: Layout): void {
    const placed = new Map(layout.placed.map((p) => [p.figure.key, p]))
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
        const node = m.el
        requestAnimationFrame(() => requestAnimationFrame(() => node.removeAttribute('data-entering')))
      }
      m.figure = figure
      this.dress(m.el, figure)
      m.el.dataset.place = figure.place
      m.el.dataset.role = figure.role
      m.el.setAttribute('aria-label', [figure.name, figure.number, figure.status].filter(Boolean).join(' · '))
      m.el.style.left = `${at[0] * 100}%`
      m.el.style.top = `${at[1] * 100}%`
    }
    this.layer.querySelectorAll('.more').forEach((n) => n.remove())
    for (const { count, at } of layout.extra) {
      const more = el('span', 'more', `+${count}`)
      more.style.left = `${at[0] * 100}%`
      more.style.top = `${at[1] * 100}%`
      this.layer.append(more)
    }
  }

  // ---------------------------------------------------------------------------
  // The floating panel.

  private setUpPanel(): void {
    const panel = this.panelEl
    if (!panel) return
    const toggle = panel.querySelector<HTMLButtonElement>('[data-panel-toggle]')
    // Folded or open as the reader left it; the first time, folded on a narrow screen, where it would cover the picture.
    let folded = matchMedia('(max-width: 40rem)').matches
    try {
      const kept = sessionStorage.getItem(PANEL_KEY)
      if (kept) folded = kept === 'folded'
    } catch {
      // No storage: the default above.
    }
    const set = (fold: boolean, keep: boolean) => {
      panel.toggleAttribute('data-folded', fold)
      toggle?.setAttribute('aria-expanded', String(!fold))
      if (!keep) return
      try {
        sessionStorage.setItem(PANEL_KEY, fold ? 'folded' : 'open')
      } catch {
        // Not remembered.
      }
    }
    set(folded, false)
    toggle?.addEventListener('click', () => set(!panel.hasAttribute('data-folded'), true))
  }

  private renderPanel(p: Panel): void {
    const panel = this.panelEl
    if (!panel) return
    const where = panel.querySelector<HTMLElement>('[data-panel-where]')
    if (where) where.textContent = p.trail[p.trail.length - 1].name
    const body = panel.querySelector<HTMLElement>('[data-panel-body]')
    if (!body) return

    const trail = el('nav', 'trail')
    trail.setAttribute('aria-label', '当前位置')
    p.trail.forEach((step, i) => {
      if (i) trail.append(el('span', 'sep', '›'))
      if (i < p.trail.length - 1) {
        const a = el('a', undefined, step.name)
        a.href = step.href
        trail.append(a)
      } else trail.append(el('strong', undefined, step.name))
    })

    // Each part in a block of its own: where and the way back; what is shown; what there is to see here (and the pages);
    // the places to go.
    const head = el('div', 'block where-block')
    head.append(trail)
    if (p.back) {
      const back = el('a', 'button back', `← 回到${p.back.name}`)
      back.href = p.back.href
      head.append(back)
    }
    const info = el('div', 'block info-card')
    info.append(...p.info.map((line, i) => el('p', i ? 'info more' : 'info', line)))
    const parts: Node[] = [head, info]
    if (p.here) {
      const here = this.linkList(p.here.title, p.here.count, p.here.links, 'here')
      if (p.pager) here.append(this.pager(p.pager))
      parts.push(here)
    }
    parts.push(this.linkList('去别处', '', p.places, 'places'))
    body.replaceChildren(...parts)
  }

  private pager(p: NonNullable<Panel['pager']>): HTMLElement {
    const nav = el('nav', 'pager')
    nav.setAttribute('aria-label', '翻页')
    const step = (href: string | null, text: string, label: string) => {
      if (!href) {
        const off = el('span', 'button off', text)
        off.setAttribute('aria-hidden', 'true')
        return off
      }
      const a = el('a', 'button', text)
      a.href = href
      a.setAttribute('aria-label', label)
      return a
    }
    nav.append(step(p.prev, '‹', '上一页'), el('span', 'page', `${p.page} / ${p.pages}`), step(p.next, '›', '下一页'))
    return nav
  }

  private linkList(title: string, count: string, links: Panel['places'], className: string): HTMLElement {
    const box = el('section', `block links ${className}`)
    const h = el('h3')
    h.append(el('span', undefined, title))
    if (count) h.append(el('span', 'count', count))
    box.append(h)
    const ul = el('ul')
    for (const l of links) {
      const li = el('li')
      const a = el('a')
      a.href = l.href
      if (l.current) a.setAttribute('aria-current', 'true')
      a.append(el('span', 'name', l.name))
      if (l.tag) a.append(el('span', 'tag', l.tag))
      li.append(a)
      ul.append(li)
    }
    box.append(ul)
    return box
  }

  // ---------------------------------------------------------------------------
  // Avatars.

  // Puts on `f`'s picture and colours; again when an owner changes them while the student is on the map.
  private dress(node: HTMLElement, f: Figure): void {
    const l = look(f)
    node.style.setProperty('--figure-bg', l.background)
    node.style.setProperty('--figure-border', l.border)
    const img = node.querySelector('img')
    if (img && img.getAttribute('src') !== l.image) img.src = l.image
  }

  private figureEl(f: Figure): HTMLElement {
    const node = el('button', 'figure')
    node.type = 'button'
    node.dataset.kind = f.kind
    // Each avatar bobs at its own pace.
    node.style.setProperty('--bob-delay', `${-Math.random() * 3}s`)
    node.style.setProperty('--bob-time', `${2.4 + Math.random() * 1.6}s`)
    const body = el('span', 'body')
    const img = el('img')
    img.alt = ''
    img.decoding = 'async'
    body.append(img)
    node.append(body)
    this.dress(node, f)
    node.addEventListener('click', () => this.showCard(node))
    node.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && this.showCard(node))
    node.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && this.hideCard())
    node.addEventListener('focus', () => this.showCard(node))
    node.addEventListener('blur', () => this.hideCard())
    return node
  }

  private showCard(node: HTMLElement): void {
    const m = [...this.mounted.values()].find((x) => x.el === node)
    if (!m) return
    const f = m.figure
    this.popover.replaceChildren()
    const head = el('p', 'who')
    head.append(document.createTextNode(f.name))
    if (f.number) head.append(' ', el('code', undefined, f.number))
    this.popover.append(head, el('p', 'what', f.status))
    // Placed by where the avatar is on screen, which a zoom or drag has moved from its spot on the picture.
    const r = node.getBoundingClientRect()
    const frame = this.root.getBoundingClientRect()
    this.popover.style.left = `${r.left + r.width / 2 - frame.left}px`
    this.popover.style.top = `${r.top + r.height / 2 - frame.top}px`
    this.popover.hidden = false
  }

  private hideCard(): void {
    this.popover.hidden = true
  }

  // Every couple of seconds a few avatars move a little: on the campus they take a small step; in a classroom someone
  // raises a hand or has a "…" over their head; at a table someone leans in as if playing a card, and up close a card
  // flies to the middle. Off when the reader asks for reduced motion.
  private startFidgeting(): void {
    if (this.fidget !== undefined || this.reduce.matches) return
    this.fidget = window.setInterval(() => {
      if (document.hidden || !this.layout) return
      const all = [...this.mounted.values()].filter((m) => m.figure.kind !== 'teacher')
      const view = this.layout.view.kind
      for (let i = 0; i < Math.ceil(all.length / 6); i++) {
        const m = all[Math.floor(Math.random() * all.length)]
        if (!m) continue
        if (view === 'building') {
          m.el.dataset.gesture = Math.random() < 0.5 ? 'hand' : 'dots'
          window.setTimeout(() => m.el.removeAttribute('data-gesture'), 1500)
        } else if (m.figure.role === 'seated' && m.figure.status.includes('在打')) {
          m.el.dataset.play = ''
          window.setTimeout(() => m.el.removeAttribute('data-play'), 700)
        } else if (view === 'campus') {
          m.el.style.setProperty('--dx', `${(Math.random() - 0.5) * 0.9}rem`)
          m.el.style.setProperty('--dy', `${(Math.random() - 0.5) * 0.5}rem`)
        }
      }
      this.tossCard()
    }, 1600)
  }

  // Up close at a table in play: a card back flies from the next seat to the pile, round the table.
  private tossCard(): void {
    const layout = this.layout
    if (!layout || layout.view.kind !== 'table' || !layout.pile || !layout.playing.length) return
    const from = layout.playing[this.tossAt++ % layout.playing.length]
    const card = el('span', 'toss')
    card.setAttribute('aria-hidden', 'true')
    card.style.left = `${from[0] * 100}%`
    card.style.top = `${from[1] * 100}%`
    this.layer.append(card)
    const pile = layout.pile
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        card.style.left = `${pile[0] * 100}%`
        card.style.top = `${pile[1] * 100}%`
        card.dataset.landed = ''
      }),
    )
    window.setTimeout(() => card.remove(), 1500)
  }
}
