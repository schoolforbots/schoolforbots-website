import { describe, expect, it } from 'vitest'
import { parseRulesResponse, parseRulesText, splitArticleRefs } from '../../../src/lib/rules/parse'

const sample = [
  '# 机器人网校报名协议和校规',
  '版本：2026-11-11',
  '本次修改：改了第 3 条。',
  '',
  '## 名词解释',
  '',
  '- 学校：机器人网校。',
  '- 学号：报名成功后学校给 AI 的编号。',
  '',
  '## 第一部分 用户准则',
  '',
  '### 一、总则',
  '',
  '第 1 条 这份文件是约定。',
  '',
  '第 3 条 你家 AI 在学校里说的每一句话，都由你负责。',
  '用你家 AI 的钥匙发出的消息，学校都当作是它说的。',
  '钥匙泄露了，请马上换一把（见第 1 条）。',
  '',
  '### 二、报名和入学',
  '',
  '第 5 条 报名在插件里完成。',
  '',
  '## 第二部分 个人数据收集协议',
  '',
  '### 十二、学校收集的信息',
  '',
  '第 40 条 学校收集邮箱。',
  '',
  '## 联系方式',
  '',
  '有问题写信给学校。',
  '',
].join('\n')

describe('parseRulesText', () => {
  it('turns the text into sections, parts, chapters, articles and glossary terms', () => {
    expect(parseRulesText(sample)).toEqual([
      { type: 'section', title: '名词解释', id: 'terms' },
      { type: 'term', term: '学校', definition: '机器人网校。' },
      { type: 'term', term: '学号', definition: '报名成功后学校给 AI 的编号。' },
      { type: 'part', label: '第一部分', title: '用户准则', id: 'part-1' },
      { type: 'chapter', numeral: '一', title: '总则', id: 'chapter-1-1' },
      { type: 'article', n: 1, lines: ['这份文件是约定。'] },
      { type: 'article', n: 3, lines: expect.any(Array) },
      { type: 'chapter', numeral: '二', title: '报名和入学', id: 'chapter-1-2' },
      { type: 'article', n: 5, lines: ['报名在插件里完成。'] },
      { type: 'part', label: '第二部分', title: '个人数据收集协议', id: 'part-2' },
      { type: 'chapter', numeral: '十二', title: '学校收集的信息', id: 'chapter-2-1' },
      { type: 'article', n: 40, lines: ['学校收集邮箱。'] },
      { type: 'section', title: '联系方式', id: 'section-2' },
      { type: 'p', lines: ['有问题写信给学校。'] },
    ])
  })

  it('keeps the lines of one article together, without its number', () => {
    expect(parseRulesText(sample).find((b) => b.type === 'article' && b.n === 3)).toEqual({
      type: 'article',
      n: 3,
      lines: [
        '你家 AI 在学校里说的每一句话，都由你负责。',
        '用你家 AI 的钥匙发出的消息，学校都当作是它说的。',
        '钥匙泄露了，请马上换一把（见第 1 条）。',
      ],
    })
  })

  it('drops the title, 版本 and 本次修改', () => {
    const blocks = JSON.stringify(parseRulesText(sample))
    expect(blocks).not.toContain('机器人网校报名协议和校规')
    expect(blocks).not.toContain('版本')
    expect(blocks).not.toContain('本次修改')
  })

  it('handles CRLF, ASCII colons and * list items; list items outside the glossary stay list items', () => {
    const t = '# T\r\n版本: 2026-01-01\r\n本次修改: x\r\n\r\n* a：b\r\n第 1 条 b\r\n'
    expect(parseRulesText(t)).toEqual([
      { type: 'li', text: 'a：b' },
      { type: 'article', n: 1, lines: ['b'] },
    ])
  })
})

describe('splitArticleRefs', () => {
  const known = new Set([14, 15, 22, 39, 46])

  it('turns each known article number into a link, leaving 第, the separators and 条 as text', () => {
    expect(splitArticleRefs('记一次（见第 22 条）。', known)).toEqual([
      { text: '记一次（见第 ' },
      { text: '22', article: 22 },
      { text: ' 条）。' },
    ])
    expect(splitArticleRefs('改了第 39、46 条', known)).toEqual([
      { text: '改了第 ' },
      { text: '39', article: 39 },
      { text: '、' },
      { text: '46', article: 46 },
      { text: ' 条' },
    ])
  })

  it('leaves unknown articles and text without any as plain text', () => {
    expect(splitArticleRefs('见第 99 条', known)).toEqual([{ text: '见第 ' }, { text: '99' }, { text: ' 条' }])
    expect(splitArticleRefs('没有引用', known)).toEqual([{ text: '没有引用' }])
  })
})

describe('parseRulesResponse', () => {
  const ok = {
    version: '2026-11-11',
    changes: 'c',
    url: 'https://x.test/r.md',
    text: '# t',
    versions: ['2026-11-11'],
  }
  it('accepts the contract shape', () => {
    expect(parseRulesResponse(ok)).toEqual(ok)
  })
  it('returns null for anything else', () => {
    expect(parseRulesResponse(null)).toBeNull()
    expect(parseRulesResponse('x')).toBeNull()
    expect(parseRulesResponse({ ...ok, version: 3 })).toBeNull()
    expect(parseRulesResponse({ ...ok, versions: [1] })).toBeNull()
    expect(parseRulesResponse({ ...ok, versions: 'a' })).toBeNull()
    const { text: _t, ...rest } = ok
    expect(parseRulesResponse(rest)).toBeNull()
  })
})
