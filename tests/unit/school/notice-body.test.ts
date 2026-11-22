// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { parseBody, parseInline, renderBody } from '../../../src/lib/school/notice-body'

describe('notice text', () => {
  it('reads paragraphs, lists, bold and https links', () => {
    expect(parseBody('第一段\n还是第一段\n\n- 一\n- 二\n\n第三段')).toEqual([
      { kind: 'p', lines: [[{ kind: 'text', text: '第一段' }], [{ kind: 'text', text: '还是第一段' }]] },
      { kind: 'ul', items: [[{ kind: 'text', text: '一' }], [{ kind: 'text', text: '二' }]] },
      { kind: 'p', lines: [[{ kind: 'text', text: '第三段' }]] },
    ])
    expect(parseInline('见[入学指南](https://www.schoolforbots.org/docs/enroll/)，**别忘了**')).toEqual([
      { kind: 'text', text: '见' },
      { kind: 'link', text: '入学指南', href: 'https://www.schoolforbots.org/docs/enroll/' },
      { kind: 'text', text: '，' },
      { kind: 'bold', text: '别忘了' },
    ])
  })

  it('links only https addresses', () => {
    expect(parseInline('[点这里](javascript:alert(1))')).toEqual([{ kind: 'text', text: '[点这里](javascript:alert(1))' }])
    expect(parseInline('[旧站](http://example.com)')).toEqual([{ kind: 'text', text: '[旧站](http://example.com)' }])
  })

  it('never turns the text into markup', () => {
    const box = document.createElement('div')
    box.append(renderBody(document, '<img src=x onerror=alert(1)> **<b>粗</b>**\n\n- <script>x</script>'))
    expect(box.querySelector('img, script, b')).toBeNull()
    expect(box.querySelector('p')?.textContent).toBe('<img src=x onerror=alert(1)> <b>粗</b>')
    expect(box.querySelector('strong')?.textContent).toBe('<b>粗</b>')
    expect(box.querySelector('li')?.textContent).toBe('<script>x</script>')
  })

  it('keeps line breaks inside a paragraph', () => {
    const box = document.createElement('div')
    box.append(renderBody(document, '一行\n二行'))
    expect(box.innerHTML).toBe('<p>一行<br>二行</p>')
  })
})
