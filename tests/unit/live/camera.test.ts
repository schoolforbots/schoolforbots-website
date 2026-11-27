import { describe, expect, it } from 'vitest'
import { clampCamera, MAX_ZOOM, zoomAt } from '../../../src/lib/live/camera'

// A frame 800 × 500.
const W = 800
const H = 500

describe('the camera', () => {
  it('never zooms out past the whole picture nor in past the limit', () => {
    expect(clampCamera({ scale: 0.5, x: 0, y: 0 }, W, H).scale).toBe(1)
    expect(clampCamera({ scale: 9, x: 0, y: 0 }, W, H).scale).toBe(MAX_ZOOM)
  })

  it('never shows past the picture: no edge comes inside the frame', () => {
    // At 2× the picture is 1600 × 1000: the offset stays between -800…0 and -500…0.
    expect(clampCamera({ scale: 2, x: 50, y: 20 }, W, H)).toEqual({ scale: 2, x: 0, y: 0 })
    expect(clampCamera({ scale: 2, x: -2000, y: -2000 }, W, H)).toEqual({ scale: 2, x: -800, y: -500 })
    expect(clampCamera({ scale: 2, x: -300, y: -100 }, W, H)).toEqual({ scale: 2, x: -300, y: -100 })
    // At 1× there is nowhere to move.
    expect(clampCamera({ scale: 1, x: -40, y: 30 }, W, H)).toEqual({ scale: 1, x: 0, y: 0 })
  })

  it('zooms around the point under the pointer, keeping it where it is', () => {
    const at = { x: 600, y: 100 }
    const c = zoomAt({ scale: 1, x: 0, y: 0 }, 2, at.x, at.y, W, H)
    // The picture point under the pointer before (600, 100) is still under it after.
    expect((at.x - c.x) / c.scale).toBeCloseTo(600)
    expect((at.y - c.y) / c.scale).toBeCloseTo(100)
    // Zooming back out returns to the whole picture.
    expect(zoomAt(c, 1, 10, 10, W, H)).toEqual({ scale: 1, x: 0, y: 0 })
  })

  it('keeps within the picture when zooming at a corner', () => {
    const c = zoomAt({ scale: 1, x: 0, y: 0 }, 3, W, H, W, H)
    expect(c).toEqual({ scale: 3, x: W - W * 3, y: H - H * 3 })
  })
})
