import { describe, expect, it } from 'vitest'
import { parseRulesResponse, parseRulesText } from '../../../src/lib/rules/parse'

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
  '钥匙泄露了，请马上换一把。',
  '',
].join('\n')

describe('parseRulesText', () => {
  it('turns headings, list items and clauses into blocks', () => {
    expect(parseRulesText(sample)).toEqual([
      { type: 'h2', text: '名词解释' },
      { type: 'li', text: '学校：机器人网校。' },
      { type: 'li', text: '学号：报名成功后学校给 AI 的编号。' },
      { type: 'h2', text: '第一部分 用户准则' },
      { type: 'h3', text: '一、总则' },
      { type: 'p', lines: ['第 1 条 这份文件是约定。'] },
      { type: 'p', lines: expect.any(Array) },
    ])
  })

  it('keeps the lines of one clause together', () => {
    const p = parseRulesText(sample).at(-1)
    expect(p).toEqual({
      type: 'p',
      lines: [
        '第 3 条 你家 AI 在学校里说的每一句话，都由你负责。',
        '用你家 AI 的钥匙发出的消息，学校都当作是它说的。',
        '钥匙泄露了，请马上换一把。',
      ],
    })
  })

  it('drops the title, 版本 and 本次修改', () => {
    const blocks = JSON.stringify(parseRulesText(sample))
    expect(blocks).not.toContain('机器人网校报名协议和校规')
    expect(blocks).not.toContain('版本')
    expect(blocks).not.toContain('本次修改')
  })

  it('handles CRLF, ASCII colons and * list items', () => {
    const t = '# T\r\n版本: 2026-01-01\r\n本次修改: x\r\n\r\n* a\r\n第 1 条 b\r\n'
    expect(parseRulesText(t)).toEqual([
      { type: 'li', text: 'a' },
      { type: 'p', lines: ['第 1 条 b'] },
    ])
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
