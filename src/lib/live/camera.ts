// Zooming and panning the live map. The camera scales and moves one layer (the
// picture with its labels and avatars) inside the map's frame, and never shows
// past the picture's edges: at 1× the whole picture fills the frame; zoomed in,
// the frame looks at a part of it and can be dragged around within it.
//
// Zoom with the buttons, Ctrl (or ⌘) and the wheel, a double click, or two fingers;
// a plain wheel still scrolls the page. Drag with the mouse or one finger once
// zoomed in. A drag never counts as a click on what it started on.

export const MIN_ZOOM = 1
export const MAX_ZOOM = 4

export interface CameraState {
  scale: number
  /** The layer's offset in pixels: 0 or negative, so the picture always covers the frame. */
  x: number
  y: number
}

/** Keeps a camera within the picture: the scale within bounds, and the offset so that no edge comes inside the frame. */
export function clampCamera(c: CameraState, width: number, height: number): CameraState {
  const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, c.scale))
  const minX = width - width * scale
  const minY = height - height * scale
  return { scale, x: Math.min(0, Math.max(minX, c.x)), y: Math.min(0, Math.max(minY, c.y)) }
}

/** Zooms `c` to `scale` keeping the point (px, py) of the frame where it is. */
export function zoomAt(c: CameraState, scale: number, px: number, py: number, width: number, height: number): CameraState {
  const s = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale))
  const k = s / c.scale
  return clampCamera({ scale: s, x: px - (px - c.x) * k, y: py - (py - c.y) * k }, width, height)
}

export class Camera {
  private state: CameraState = { scale: 1, x: 0, y: 0 }
  private readonly pointers = new Map<number, { x: number; y: number }>()
  private dragged = false
  private pinch: { distance: number; scale: number } | null = null

  constructor(
    private readonly frame: HTMLElement,
    private readonly layer: HTMLElement,
    private readonly onChange: (c: CameraState) => void = () => undefined,
  ) {
    frame.addEventListener('wheel', (e) => this.wheel(e), { passive: false })
    frame.addEventListener('dblclick', (e) => {
      if ((e.target as HTMLElement).closest('a, button')) return
      const r = frame.getBoundingClientRect()
      this.set(zoomAt(this.state, this.state.scale * 2, e.clientX - r.left, e.clientY - r.top, r.width, r.height), true)
    })
    frame.addEventListener('pointerdown', (e) => this.down(e))
    frame.addEventListener('pointermove', (e) => this.move(e))
    for (const type of ['pointerup', 'pointercancel', 'pointerleave'] as const) frame.addEventListener(type, (e) => this.up(e))
    // A drag is not a click: swallow the click that ends one, before the label or avatar under it hears it.
    frame.addEventListener(
      'click',
      (e) => {
        if (!this.dragged) return
        this.dragged = false
        e.preventDefault()
        e.stopPropagation()
      },
      true,
    )
    new ResizeObserver(() => this.set(this.state, false)).observe(frame)
    this.apply(false)
  }

  get scale(): number {
    return this.state.scale
  }

  /** Back to the whole picture. */
  reset(animate = true): void {
    this.set({ scale: 1, x: 0, y: 0 }, animate)
  }

  /** Zooms in or out by `factor` around the middle of the frame. */
  zoomBy(factor: number): void {
    const r = this.frame.getBoundingClientRect()
    this.set(zoomAt(this.state, this.state.scale * factor, r.width / 2, r.height / 2, r.width, r.height), true)
  }

  private set(c: CameraState, animate: boolean): void {
    const r = this.frame.getBoundingClientRect()
    this.state = clampCamera(c, r.width, r.height)
    this.apply(animate)
  }

  private apply(animate: boolean): void {
    const { scale, x, y } = this.state
    const s = this.layer.style
    s.transition = animate ? 'transform 0.25s cubic-bezier(0.33, 1, 0.68, 1)' : 'none'
    s.transformOrigin = '0 0'
    s.transform = scale === 1 ? '' : `translate(${x}px, ${y}px) scale(${scale})`
    this.frame.dataset.zoomed = scale > 1 ? 'true' : 'false'
    this.onChange(this.state)
  }

  private wheel(e: WheelEvent): void {
    // A plain wheel scrolls the page; with Ctrl or ⌘ (and a trackpad's pinch, which comes as Ctrl) it zooms.
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const r = this.frame.getBoundingClientRect()
    this.set(zoomAt(this.state, this.state.scale * Math.exp(-e.deltaY * 0.0025), e.clientX - r.left, e.clientY - r.top, r.width, r.height), false)
  }

  private down(e: PointerEvent): void {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    this.dragged = false
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()]
      this.pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: this.state.scale }
    }
  }

  private move(e: PointerEvent): void {
    const last = this.pointers.get(e.pointerId)
    if (!last) return
    const r = this.frame.getBoundingClientRect()
    if (this.pointers.size === 2 && this.pinch) {
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const [a, b] = [...this.pointers.values()]
      const mid = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top }
      const scale = this.pinch.scale * (Math.hypot(a.x - b.x, a.y - b.y) / this.pinch.distance)
      this.set(zoomAt(this.state, scale, mid.x, mid.y, r.width, r.height), false)
      this.dragged = true
      return
    }
    const dx = e.clientX - last.x
    const dy = e.clientY - last.y
    // Only a zoomed picture moves; at 1× a drag does nothing, so a finger still scrolls the page.
    if (this.state.scale <= 1) return
    if (!this.dragged && Math.hypot(dx, dy) < 4) return
    if (!this.dragged) {
      this.dragged = true
      this.frame.setPointerCapture(e.pointerId)
    }
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    this.set({ ...this.state, x: this.state.x + dx, y: this.state.y + dy }, false)
  }

  private up(e: PointerEvent): void {
    this.pointers.delete(e.pointerId)
    if (this.pointers.size < 2) this.pinch = null
    if (this.frame.hasPointerCapture(e.pointerId)) this.frame.releasePointerCapture(e.pointerId)
  }
}
