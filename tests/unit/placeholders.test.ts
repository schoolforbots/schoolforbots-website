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

describe('placeholder check', () => {
  const marker = { id: 'logo', path: 'src/a.ts', line: 7 }

  it('an unregistered marker is an error in both modes', () => {
    for (const release of [false, true]) {
      const { errors } = checkPlaceholders([], [marker], { release, frameworks: withPlugin })
      expect(errors.join('\n')).toContain('logo')
      expect(errors.join('\n')).toContain('src/a.ts:7')
    }
  })

  it('a registered id with no marker left is an error', () => {
    const { errors } = checkPlaceholders([{ id: 'logo', release: 'allow' }], [], {
      release: false,
      frameworks: withPlugin,
    })
    expect(errors.join('\n')).toContain('过期')
    expect(errors.join('\n')).toContain('logo')
  })

  it('a blocking placeholder is a warning normally and an error on release', () => {
    const registry = [{ id: 'logo', release: 'block' as const }]
    const normal = checkPlaceholders(registry, [marker], { release: false, frameworks: withPlugin })
    expect(normal.errors).toEqual([])
    expect(normal.warnings.join('\n')).toContain('src/a.ts:7')
    const release = checkPlaceholders(registry, [marker], { release: true, frameworks: withPlugin })
    expect(release.errors.join('\n')).toContain('logo')
  })

  it('an allowed placeholder passes release', () => {
    const result = checkPlaceholders([{ id: 'logo', release: 'allow' }], [marker], {
      release: true,
      frameworks: withPlugin,
    })
    expect(result).toEqual({ errors: [], warnings: [] })
  })

  it('release fails when no framework has a plugin', () => {
    const { errors } = checkPlaceholders([], [], {
      release: true,
      frameworks: [{ plugin: null }, { plugin: null }],
    })
    expect(errors.join('\n')).toContain('没有一个框架有插件')
    const normal = checkPlaceholders([], [], { release: false, frameworks: [{ plugin: null }] })
    expect(normal.errors).toEqual([])
  })

  it("the repository's registry and markers agree", async () => {
    const { registry, markers } = await scanRepository(process.cwd())
    const { errors } = checkPlaceholders(registry, markers, { release: false, frameworks: [] })
    expect(errors).toEqual([])
  })
})
