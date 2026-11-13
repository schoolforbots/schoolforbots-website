// The falling seasons behind the homepage: cherry petals in spring, leaves in
// summer, ginkgo leaves in autumn and snow in winter, with a faint wash of the
// season's colour. One season at a time; it changes with the scroll position.
import { PARTICLES, WASH, type Theme } from './palette'
import { seasonAt, type Season } from './season'

const FADE_IN = 0.6 // seconds
const FADE_OUT = 0.45
const WASH_TIME = 0.6
const SPRITE = 64 // px square that each shape is drawn into once
const UNIT = 48 // px of the shape's unit box inside a sprite, leaving room for the soft edge

// Fall speed in px/s before depth: ginkgo leaves fastest, snow slowest.
const FALL: Record<Season, [number, number]> = {
  spring: [36, 65],
  summer: [44, 75],
  autumn: [49, 86],
  winter: [21, 44],
}

// Size in px before depth. Snow is mostly soft dots, with some six-armed flakes.
const SIZE: Record<Season | 'flake', [number, number]> = {
  spring: [15, 23],
  summer: [18, 28],
  autumn: [20, 30],
  winter: [6, 11],
  flake: [15, 22],
}

interface Particle {
  season: Season
  shade: number
  flake: boolean
  x: number
  y: number
  z: number // depth, 0.4 to 1: nearer is bigger, faster and more opaque
  size: number
  vy: number
  swayAmp: number
  swayFreq: number
  swayPhase: number
  rot: number
  rotSpeed: number
  flip: number
  flipSpeed: number
  alpha: number
  delay: number
  leaving: boolean
}

type Wash = [number, number, number, number]
type Sprites = Record<Season | 'flake', HTMLCanvasElement[]>

// ---------- shapes, in a unit box centred on 0,0 ----------

function petal(): Path2D {
  const p = new Path2D()
  p.moveTo(-0.05, 0.47)
  p.bezierCurveTo(-0.26, 0.38, -0.46, 0.06, -0.42, -0.2)
  p.bezierCurveTo(-0.38, -0.43, -0.17, -0.5, -0.07, -0.42)
  p.quadraticCurveTo(-0.025, -0.37, 0, -0.35)
  p.quadraticCurveTo(0.025, -0.37, 0.07, -0.42)
  p.bezierCurveTo(0.17, -0.5, 0.38, -0.43, 0.42, -0.2)
  p.bezierCurveTo(0.46, 0.06, 0.26, 0.38, 0.05, 0.47)
  p.quadraticCurveTo(0, 0.5, -0.05, 0.47)
  p.closePath()
  return p
}

function leaf(): Path2D {
  const p = new Path2D()
  p.moveTo(0, -0.5)
  p.bezierCurveTo(0.21, -0.42, 0.37, -0.18, 0.35, 0.06)
  p.bezierCurveTo(0.33, 0.3, 0.16, 0.45, 0, 0.5)
  p.bezierCurveTo(-0.16, 0.45, -0.33, 0.3, -0.35, 0.06)
  p.bezierCurveTo(-0.37, -0.18, -0.21, -0.42, 0, -0.5)
  p.closePath()
  return p
}

function ginkgo(): Path2D {
  const p = new Path2D()
  p.moveTo(0, 0.28)
  p.bezierCurveTo(-0.12, 0.12, -0.52, -0.06, -0.5, -0.3)
  p.quadraticCurveTo(-0.3, -0.56, -0.06, -0.45)
  p.quadraticCurveTo(-0.02, -0.38, 0, -0.32)
  p.quadraticCurveTo(0.02, -0.38, 0.06, -0.45)
  p.quadraticCurveTo(0.3, -0.56, 0.5, -0.3)
  p.bezierCurveTo(0.52, -0.06, 0.12, 0.12, 0, 0.28)
  p.closePath()
  return p
}

function flake(): Path2D {
  const p = new Path2D()
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3
    const [c, s] = [Math.cos(a), Math.sin(a)]
    p.moveTo(0, 0)
    p.lineTo(c * 0.46, s * 0.46)
    for (const d of [0.2, 0.33]) {
      for (const turn of [0.8, -0.8]) {
        p.moveTo(c * d, s * d)
        p.lineTo(c * d + Math.cos(a + turn) * 0.12, s * d + Math.sin(a + turn) * 0.12)
      }
    }
  }
  return p
}

// ---------- sprites: each shape drawn once, shaded, with a soft edge ----------

function sprite(draw: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const cv = document.createElement('canvas')
  cv.width = cv.height = SPRITE
  const c = cv.getContext('2d')
  if (c) {
    c.translate(SPRITE / 2, SPRITE / 2)
    c.scale(UNIT, UNIT)
    draw(c)
  }
  return cv
}

// A halo in the shape's own colour blurs its edge by about a pixel on screen.
function soften(c: CanvasRenderingContext2D, colour: string) {
  c.shadowColor = colour
  c.shadowBlur = 4
}

function vein(c: CanvasRenderingContext2D, colour: string, width: number, path: () => void) {
  c.shadowBlur = 0
  c.strokeStyle = colour
  c.lineWidth = width
  c.lineCap = 'round'
  c.beginPath()
  path()
  c.stroke()
}

function makeSprites(theme: Theme): Sprites {
  const pal = PARTICLES[theme]
  const shapes = { petal: petal(), leaf: leaf(), ginkgo: ginkgo(), flake: flake() }
  return {
    spring: pal.spring.map(([inner, outer]) =>
      sprite((c) => {
        const g = c.createLinearGradient(0, -0.5, 0, 0.5)
        g.addColorStop(0, inner)
        g.addColorStop(1, outer)
        soften(c, outer + '99')
        c.fillStyle = g
        c.fill(shapes.petal)
      }),
    ),
    summer: pal.summer.map(([inner, outer]) =>
      sprite((c) => {
        const g = c.createLinearGradient(-0.35, 0, 0.35, 0)
        g.addColorStop(0, inner)
        g.addColorStop(1, outer)
        soften(c, outer + '99')
        c.fillStyle = g
        c.fill(shapes.leaf)
        vein(c, 'rgb(255 255 255 / 0.28)', 0.035, () => {
          c.moveTo(0, -0.38)
          c.quadraticCurveTo(0.03, 0.05, 0, 0.44)
        })
      }),
    ),
    autumn: pal.autumn.map(([inner, outer]) =>
      sprite((c) => {
        const g = c.createRadialGradient(0, 0.28, 0.05, 0, 0.28, 0.85)
        g.addColorStop(0, outer)
        g.addColorStop(1, inner)
        soften(c, outer + '99')
        c.fillStyle = g
        c.fill(shapes.ginkgo)
        vein(c, outer, 0.05, () => {
          c.moveTo(0, 0.26)
          c.quadraticCurveTo(0.03, 0.42, 0.01, 0.6)
        })
      }),
    ),
    winter: pal.winter.map(([inner, outer]) =>
      sprite((c) => {
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 0.5)
        g.addColorStop(0, inner)
        g.addColorStop(0.55, outer)
        g.addColorStop(1, outer + '00')
        c.fillStyle = g
        c.beginPath()
        c.arc(0, 0, 0.5, 0, Math.PI * 2)
        c.fill()
      }),
    ),
    flake: pal.winter.map(([, outer]) =>
      sprite((c) => {
        soften(c, outer)
        c.strokeStyle = outer
        c.lineWidth = 0.075
        c.lineCap = 'round'
        c.stroke(shapes.flake)
      }),
    ),
  }
}

// ---------- the animation ----------

const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** Starts the seasons on `canvas`. Does nothing where the browser cannot draw on a canvas. */
export function mountSeasons(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  const root = document.documentElement
  const theme = (): Theme => (root.dataset.theme === 'dark' ? 'dark' : 'light')
  const progress = () => scrollY / Math.max(1, root.scrollHeight - innerHeight)

  let sprites: Record<Theme, Sprites> | null = null
  let W = 0
  let H = 0
  let dpr = 1
  let count = 20
  let parts: Particle[] = []
  let raf = 0
  let last = 0
  let lastScroll = scrollY
  let t = 0
  // set on the first frame, once the browser has restored the scroll position or followed a #link
  let season: Season | null = null
  let washFrom: Wash = [0, 0, 0, 0]
  let wash: Wash = [0, 0, 0, 0]
  let washT = 0

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2)
    W = innerWidth
    H = innerHeight
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    // more on a big window, fewer on a phone
    count = Math.round(Math.min(46, Math.max(14, (W * H) / 28000)))
  }

  function spawn(s: Season, delay: number): Particle {
    const z = rand(0.4, 1)
    const isFlake = s === 'winter' && Math.random() < 0.35
    const [smin, smax] = SIZE[isFlake ? 'flake' : s]
    const [fmin, fmax] = FALL[s]
    const still = s === 'winter'
    return {
      season: s,
      shade: Math.floor(Math.random() * 3),
      flake: isFlake,
      x: rand(-20, W + 20),
      y: rand(-20, H),
      z,
      size: rand(smin, smax) * (0.65 + 0.35 * z),
      vy: rand(fmin, fmax) * (0.55 + 0.45 * z),
      swayAmp: still ? rand(6, 16) : rand(18, 40),
      swayFreq: rand(0.25, 0.7),
      swayPhase: rand(0, Math.PI * 2),
      rot: rand(0, Math.PI * 2),
      rotSpeed: still ? rand(-0.4, 0.4) : rand(-1.2, 1.2),
      flip: rand(0, Math.PI * 2),
      flipSpeed: still ? 0 : rand(1, 2.4),
      alpha: 0,
      delay,
      leaving: false,
    }
  }

  // The old season fades out; the new one fades in across the whole window.
  function enter(s: Season, delay: number) {
    for (const p of parts) p.leaving = true
    for (let i = 0; i < count; i++) parts.push(spawn(s, delay))
    washFrom = [...wash]
    washT = 0
  }

  function step(dt: number) {
    t += dt
    const wind = 14 * Math.sin(t * 0.13) + 6 * Math.sin(t * 0.37)
    // a jump (the Home key, a link to the top) moves things no more than a quick scroll would
    const dy = Math.max(-60, Math.min(60, scrollY - lastScroll))
    lastScroll = scrollY

    const next = seasonAt(progress(), season)
    if (next !== season) {
      // the new season starts to show once the old one is half gone
      enter(next, season ? FADE_OUT / 2 : 0)
      season = next
    }

    washT = Math.min(1, washT + dt / WASH_TIME)
    const ease = 1 - (1 - washT) ** 3
    const goal = WASH[theme()][next]
    wash = washFrom.map((v, i) => v + (goal[i] - v) * ease) as Wash

    for (const p of parts) {
      p.y += p.vy * dt - dy * (0.15 + 0.35 * p.z)
      p.x += (wind * p.z + Math.cos(t * p.swayFreq * 2 * Math.PI + p.swayPhase) * p.swayAmp * 0.9) * dt
      p.rot += p.rotSpeed * dt
      p.flip += p.flipSpeed * dt
      if (p.leaving) p.alpha -= dt / FADE_OUT
      else if (p.delay > 0) p.delay -= dt
      else if (p.alpha < 1) p.alpha = Math.min(1, p.alpha + dt / FADE_IN)
      // wrap round the window, keeping the spacing, so a scroll never empties it
      if (p.y > H + 40) {
        p.y -= H + 80
        p.x = rand(-20, W + 20)
      } else if (p.y < -40) {
        p.y += H + 80
        p.x = rand(-20, W + 20)
      }
      if (p.x > W + 40) p.x = -30
      else if (p.x < -40) p.x = W + 30
    }
    parts = parts.filter((p) => !p.leaving || p.alpha > 0)
  }

  function draw() {
    sprites ??= { light: makeSprites('light'), dark: makeSprites('dark') }
    const set = sprites[theme()]
    ctx!.setTransform(1, 0, 0, 1, 0, 0)
    ctx!.clearRect(0, 0, canvas.width, canvas.height)
    const [r, g, b, a] = wash
    if (a > 0) {
      ctx!.fillStyle = `rgb(${r} ${g} ${b} / ${a})`
      ctx!.fillRect(0, 0, canvas.width, canvas.height)
    }
    for (const p of parts) {
      const alpha = Math.max(0, Math.min(1, p.alpha)) * (0.6 + 0.4 * p.z)
      if (alpha <= 0) continue
      ctx!.globalAlpha = alpha
      const list = p.flake ? set.flake : set[p.season]
      const k = (p.size * dpr) / UNIT
      // leaves turn over as they fall, but never thinner than a third of their width
      const flip = p.flipSpeed ? 0.35 + 0.65 * Math.abs(Math.cos(p.flip)) : 1
      const [c, s] = [Math.cos(p.rot), Math.sin(p.rot)]
      ctx!.setTransform(c * k * flip, s * k * flip, -s * k, c * k, p.x * dpr, p.y * dpr)
      ctx!.drawImage(list[p.shade % list.length], -SPRITE / 2, -SPRITE / 2)
    }
    ctx!.globalAlpha = 1
  }

  function frame(now: number) {
    step(Math.min(0.05, (now - last) / 1000 || 0))
    last = now
    draw()
    raf = requestAnimationFrame(frame)
  }

  function start() {
    if (raf || reduce.matches || document.hidden) return
    last = performance.now()
    lastScroll = scrollY
    raf = requestAnimationFrame(frame)
  }

  function stop() {
    cancelAnimationFrame(raf)
    raf = 0
  }

  resize()
  addEventListener('resize', resize)
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()))
  reduce.addEventListener('change', () => {
    if (!reduce.matches) return start()
    stop()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  })
  start()
}
