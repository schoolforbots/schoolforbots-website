// The school rules as the school writes them (school-rules/*.md in the server
// repository): a title, 版本 and 本次修改 lines, then parts (## 第一部分 用户准则),
// other sections (## 名词解释), chapters (### 一、总则) and numbered articles
// (第 3 条 …, one or more lines). This turns the text into those pieces, so the
// page can lay them out as a set of rules rather than as loose paragraphs.

export type RulesBlock =
  | { type: 'part'; label: string; title: string; id: string } // ## 第一部分 用户准则
  | { type: 'section'; title: string; id: string } // ## 名词解释
  | { type: 'chapter'; numeral: string; title: string; id: string } // ### 一、总则
  | { type: 'article'; n: number; lines: string[] } // 第 3 条 …
  | { type: 'term'; term: string; definition: string } // - 学号：报名成功后…
  | { type: 'li'; text: string }
  | { type: 'p'; lines: string[] }

export interface SchoolRules {
  version: string
  changes: string
  url: string
  text: string
  versions: string[]
}

// The version and the changes are shown from the JSON fields, so the matching
// lines (and the title) are left out of the body.
const META = /^(版本|本次修改)[:：]/
const PART = /^(第[一二三四五六七八九十]+部分)\s*(.*)$/
const CHAPTER = /^([一二三四五六七八九十]+)、\s*(.*)$/
const ARTICLE = /^第\s*(\d+)\s*条\s*(.*)$/
// A glossary line: a short term, a colon, its meaning.
const TERM = /^([^：:]{1,12})[：:]\s*(.+)$/

export const articleId = (n: number) => `article-${n}`

export function parseRulesText(text: string): RulesBlock[] {
  const blocks: RulesBlock[] = []
  let lines: string[] | null = null // the block that later lines continue
  let titleSeen = false
  let parts = 0
  let chapters = 0
  let sections = 0
  let inGlossary = false
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!titleSeen && line.startsWith('# ')) {
      titleSeen = true
      continue
    }
    if (META.test(line)) continue
    if (line === '') {
      lines = null
      continue
    }
    if (line.startsWith('## ')) {
      lines = null
      const heading = line.slice(3).trim()
      const part = heading.match(PART)
      if (part) {
        parts++
        chapters = 0
        inGlossary = false
        blocks.push({ type: 'part', label: part[1], title: part[2], id: `part-${parts}` })
      } else {
        sections++
        inGlossary = heading === '名词解释'
        blocks.push({ type: 'section', title: heading, id: inGlossary ? 'terms' : `section-${sections}` })
      }
      continue
    }
    if (line.startsWith('### ')) {
      lines = null
      const heading = line.slice(4).trim()
      const chapter = heading.match(CHAPTER)
      chapters++
      blocks.push({
        type: 'chapter',
        numeral: chapter ? chapter[1] : '',
        title: chapter ? chapter[2] : heading,
        id: `chapter-${parts}-${chapters}`,
      })
      continue
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      lines = null
      const item = line.slice(2).trim()
      const term = inGlossary ? item.match(TERM) : null
      blocks.push(term ? { type: 'term', term: term[1].trim(), definition: term[2] } : { type: 'li', text: item })
      continue
    }
    const article = line.match(ARTICLE)
    if (article) {
      lines = [article[2]]
      blocks.push({ type: 'article', n: Number(article[1]), lines })
    } else if (lines) {
      lines.push(line)
    } else {
      lines = [line]
      blocks.push({ type: 'p', lines })
    }
  }
  return blocks
}

// Splits text at mentions of articles (第 22 条, 第 39、46、61 条), so each number
// can link to its article. Numbers not in `known` stay plain text.
export type RefPiece = { text: string } | { text: string; article: number }

export function splitArticleRefs(text: string, known: Set<number>): RefPiece[] {
  const out: RefPiece[] = []
  let last = 0
  for (const m of text.matchAll(/第\s*(\d+(?:\s*[、,，]\s*\d+)*)\s*条/g)) {
    // Only the numbers become links; 第, the separators and 条 stay text around them.
    let at = m.index + m[0].indexOf(m[1])
    if (at > last) out.push({ text: text.slice(last, at) })
    for (const piece of m[1].split(/(\d+)/).filter((p) => p !== '')) {
      const n = Number(piece)
      out.push(/^\d+$/.test(piece) && known.has(n) ? { text: piece, article: n } : { text: piece })
      at += piece.length
    }
    last = at
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out
}

export function parseRulesResponse(body: unknown): SchoolRules | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  const { version, changes, url, text, versions } = b
  if (typeof version !== 'string' || typeof changes !== 'string') return null
  if (typeof url !== 'string' || typeof text !== 'string') return null
  if (!Array.isArray(versions) || !versions.every((v) => typeof v === 'string')) return null
  return { version, changes, url, text, versions: versions as string[] }
}
