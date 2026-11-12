import { describe, expect, it } from 'vitest'
import {
  checkPlaceholders,
  findMarkers,
  parseRegistry,
  scanRepository,
} from '../../scripts/placeholders.mjs'

const table = (rows: string[]) =>
  ['| id | 是什么 | 在哪 | 正式发布 |', '| --- | --- | --- | --- |', ...rows].join('\n')

const withPlugin = [{ plugin: { repo: 'x/y' } }]

describe('placeholder registry', () => {
  it('parses the registry table', () => {
    const md = table([
      '| hero-dialogue | 教室窗口里的对话 | 首页 | 允许 |',
      '| logo | 校徽 | 页头 | 拦 |',
    ])
    expect(parseRegistry(md)).toEqual([
      { id: 'hero-dialogue', release: 'allow' },
      { id: 'logo', release: 'block' },
    ])
  })

  it('rejects a release column that is neither 拦 nor 允许', () => {
    expect(() => parseRegistry(table(['| logo | 校徽 | 页头 | 也许 |']))).toThrow()
  })

  it('rejects duplicate ids and malformed rows', () => {
    expect(() =>
      parseRegistry(table(['| logo | a | b | 拦 |', '| logo | a | b | 允许 |'])),
    ).toThrow()
    expect(() => parseRegistry(table(['| logo | a | 拦 |']))).toThrow()
  })
})

describe('placeholder markers', () => {
  it('finds both marker forms with their line numbers', () => {
    const files = [
      { path: 'src/a.ts', text: '// @placeholder(logo)\nconst a = 1\n' },
      {
        path: 'src/b.astro',
        text: '<div>\n\n<Placeholder id="install-dsh" kind="待补" />\n</div>',
      },
    ]
    expect(findMarkers(files)).toEqual([
      { id: 'logo', path: 'src/a.ts', line: 1 },
      { id: 'install-dsh', path: 'src/b.astro', line: 3 },
    ])
  })
})

describe('placeholder marker syntax in real files', () => {
  const find = (text: string) => findMarkers([{ path: 'f', text }])

  it('finds a tag that spans several lines at the line of its start', () => {
    const text = 'a\n<Placeholder\n  foo={a > b}\n  id="wrapped"\n  kind="待补"\n/>\n'
    expect(find(text)).toEqual([{ id: 'wrapped', path: 'f', line: 2 }])
  })

  it('accepts a single-quoted id and ignores data-id', () => {
    expect(find("<Placeholder id='single' kind='示意' />")).toEqual([
      { id: 'single', path: 'f', line: 1 },
    ])
    expect(find('<Placeholder data-id="nope" kind="待补" />')).toEqual([])
  })

  it('finds @placeholder in every comment style', () => {
    expect(find('a {}\n/* @placeholder(css-one) */')).toEqual([{ id: 'css-one', path: 'f', line: 2 }])
    expect(find('<!-- @placeholder(html-one) -->')).toEqual([{ id: 'html-one', path: 'f', line: 1 }])
    expect(find('<svg>\n<!-- @placeholder(svg-one) -->\n</svg>')).toEqual([
      { id: 'svg-one', path: 'f', line: 2 },
    ])
    expect(find('---\n// @placeholder(front-one)\nconst x = 1\n---')).toEqual([
      { id: 'front-one', path: 'f', line: 2 },
    ])
  })

  it('counts lines correctly in CRLF text', () => {
    const text = 'a\r\nb\r\n<Placeholder\r\n  id="crlf"\r\n/>\r\n// @placeholder(crlf-two)'
    expect(find(text)).toEqual([
      { id: 'crlf', path: 'f', line: 3 },
      { id: 'crlf-two', path: 'f', line: 6 },
    ])
  })
})

describe('placeholder check', () => {
  const marker = { id: 'logo', path: 'src/a.ts', line: 7 }

  it('an unregistered marker is an error in both modes', () => {
    for (const release of [false, true]) {
      const { errors } = checkPlaceholders([], [marker], { release, frameworks: withPlugin, calendarCors: true })
      expect(errors.join('\n')).toContain('logo')
      expect(errors.join('\n')).toContain('src/a.ts:7')
    }
  })

  it('a registered id with no marker left is an error', () => {
    const { errors } = checkPlaceholders([{ id: 'logo', release: 'allow' }], [], {
      release: false,
      frameworks: withPlugin,
      calendarCors: true,
    })
    expect(errors.join('\n')).toContain('过期')
    expect(errors.join('\n')).toContain('logo')
  })

  it('a blocking placeholder is a warning normally and an error on release', () => {
    const registry = [{ id: 'logo', release: 'block' as const }]
    const normal = checkPlaceholders(registry, [marker], { release: false, frameworks: withPlugin, calendarCors: true })
    expect(normal.errors).toEqual([])
    expect(normal.warnings.join('\n')).toContain('src/a.ts:7')
    const release = checkPlaceholders(registry, [marker], { release: true, frameworks: withPlugin, calendarCors: true })
    expect(release.errors.join('\n')).toContain('logo')
  })

  it('an allowed placeholder passes release', () => {
    const result = checkPlaceholders([{ id: 'logo', release: 'allow' }], [marker], {
      release: true,
      frameworks: withPlugin,
      calendarCors: true,
    })
    expect(result).toEqual({ errors: [], warnings: [] })
  })

  it('release fails when no framework has a plugin', () => {
    const { errors } = checkPlaceholders([], [], {
      release: true,
      frameworks: [{ plugin: null }, { plugin: null }],
      calendarCors: true,
    })
    expect(errors.join('\n')).toContain('没有一个框架有插件')
    const normal = checkPlaceholders([], [], { release: false, frameworks: [{ plugin: null }], calendarCors: true })
    expect(normal.errors).toEqual([])
  })

  it('release fails while calendarCors is off', () => {
    const off = checkPlaceholders([], [], { release: true, frameworks: withPlugin, calendarCors: false })
    expect(off.errors.join('\n')).toContain('calendarCors')
    const on = checkPlaceholders([], [], { release: true, frameworks: withPlugin, calendarCors: true })
    expect(on).toEqual({ errors: [], warnings: [] })
    const normal = checkPlaceholders([], [], { release: false, frameworks: withPlugin, calendarCors: false })
    expect(normal).toEqual({ errors: [], warnings: [] })
  })

  it("the repository's registry and markers agree", async () => {
    const { registry, markers } = await scanRepository(process.cwd())
    const { errors } = checkPlaceholders(registry, markers, { release: false, frameworks: [], calendarCors: false })
    expect(errors).toEqual([])
  })
})
