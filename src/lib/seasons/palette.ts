// The colours of the homepage seasons. The canvas cannot follow CSS variables,
// so they live here; the wash is tested for text contrast in tests/unit/seasons.test.ts.
import type { Season } from './season'

export type Theme = 'light' | 'dark'

/** Each falling shape is shaded from the first colour of a pair to the second. */
export const PARTICLES: Record<Theme, Record<Season, [inner: string, outer: string][]>> = {
  light: {
    spring: [
      ['#FCE4EA', '#F2A9BC'],
      ['#FDEBEF', '#F5BACA'],
      ['#FAD6DF', '#EC98AE'],
    ],
    summer: [
      ['#B5DB86', '#79B152'],
      ['#A6D178', '#669F43'],
      ['#C3E296', '#86BC5C'],
    ],
    autumn: [
      ['#FBC062', '#F09A33'],
      ['#F8CF6A', '#ECA83A'],
      ['#FAB45A', '#E58A2A'],
    ],
    winter: [
      ['#FFFFFF', '#AFC2D4'],
      ['#FFFFFF', '#BCCBDA'],
    ],
  },
  dark: {
    spring: [
      ['#F6CDD8', '#D98CA2'],
      ['#F2BFCB', '#C97A92'],
    ],
    summer: [
      ['#9CC77A', '#5B8A42'],
      ['#8AB86A', '#4F7B39'],
    ],
    autumn: [
      ['#F9B85A', '#D88A2C'],
      ['#F2C35E', '#C98024'],
    ],
    winter: [
      ['#FFFFFF', '#DDE4E8'],
      ['#FFFFFF', '#C9D3DA'],
    ],
  },
}

/** The see-through colour laid over the page background, as red, green, blue (0 to 255) and alpha (0 to 1). */
export const WASH: Record<Theme, Record<Season, [r: number, g: number, b: number, a: number]>> = {
  light: {
    spring: [244, 170, 190, 0.13],
    summer: [150, 200, 110, 0.12],
    autumn: [249, 160, 63, 0.13],
    winter: [185, 212, 240, 0.22],
  },
  dark: {
    spring: [233, 165, 182, 0.06],
    summer: [111, 158, 82, 0.07],
    autumn: [249, 160, 63, 0.06],
    winter: [170, 195, 220, 0.06],
  },
}

/** The solid colour a wash makes over a solid `#RRGGBB` background. */
export function washOver(base: string, [r, g, b, a]: [number, number, number, number]): string {
  const under = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16))
  return (
    '#' +
    [r, g, b]
      .map((c, i) => Math.round(c * a + under[i] * (1 - a)))
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}
