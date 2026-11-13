// Renames an OpenType font given as sfnt bytes (an .otf or .ttf, not a .woff2). It rewrites the
// chosen records of the name table, on every platform and in every language, and, if the font has
// a CFF table, the CFF font names: the Name INDEX, FullName and FamilyName in the Top DICT, and the
// FontName of each FDArray font. Everything else, notices included, is copied as it is.

/**
 * @param {Buffer} sfnt
 * @param {{ names: Record<number, string>, cff: { fontName: string, fullName: string, familyName: string } }} rename
 *   `names` maps a name ID to its new text; IDs the font does not have are skipped.
 * @returns {Buffer}
 */
export function renameFont(sfnt, { names, cff }) {
  const tables = new Map()
  for (let i = 0; i < sfnt.readUInt16BE(4); i++) {
    const rec = 12 + i * 16
    const offset = sfnt.readUInt32BE(rec + 8)
    tables.set(sfnt.toString('latin1', rec, rec + 4), sfnt.subarray(offset, offset + sfnt.readUInt32BE(rec + 12)))
  }
  tables.set('name', renameNameTable(tables.get('name'), names))
  if (tables.has('CFF ')) tables.set('CFF ', renameCff(tables.get('CFF '), cff))
  return writeSfnt(sfnt.readUInt32BE(0), tables)
}

function renameNameTable(table, names) {
  const format = table.readUInt16BE(0)
  if (format !== 0) throw new Error(`name table format ${format} is not supported`)
  const count = table.readUInt16BE(2)
  const storage = table.readUInt16BE(4)
  const header = Buffer.alloc(6 + count * 12)
  header.writeUInt16BE(count, 2)
  header.writeUInt16BE(header.length, 4)
  const strings = []
  let offset = 0
  for (let i = 0; i < count; i++) {
    const rec = 6 + i * 12
    table.copy(header, rec, rec, rec + 8) // platform, encoding, language and name IDs
    const platform = table.readUInt16BE(rec)
    const text = names[table.readUInt16BE(rec + 6)]
    const start = storage + table.readUInt16BE(rec + 10)
    const bytes = text === undefined ? table.subarray(start, start + table.readUInt16BE(rec + 8)) : encodeName(platform, text)
    header.writeUInt16BE(bytes.length, rec + 8)
    header.writeUInt16BE(offset, rec + 10)
    strings.push(bytes)
    offset += bytes.length
  }
  return Buffer.concat([header, ...strings])
}

// Mac records (platform 1) are single-byte, and ASCII reads the same in all their encodings;
// Unicode and Windows records are UTF-16BE.
function encodeName(platform, text) {
  if (platform !== 1) return Buffer.from(text, 'utf16le').swap16()
  if (!/^[\x20-\x7e]*$/.test(text)) throw new Error(`"${text}" is not ASCII, so it cannot go in a Mac name record`)
  return Buffer.from(text, 'latin1')
}

// A CFF table starts with a header, then the Name INDEX, the Top DICT INDEX, the String INDEX and the
// Global Subr INDEX, one after the other; the rest (charset, CharStrings, FDSelect, FDArray, Private
// DICTs) is found through offsets from the start of the table. New names change the size of the Name
// and String INDEXes, so the rest moves by that much, and every offset to it is rewritten in the same
// number of bytes, which keeps the DICTs the same size.
function renameCff(cff, { fontName, fullName, familyName }) {
  const nameIndex = readIndex(cff, cff[2])
  const topIndex = readIndex(cff, nameIndex.end)
  const stringIndex = readIndex(cff, topIndex.end)
  const rest = readIndex(cff, stringIndex.end).end
  if (nameIndex.items.length !== 1) throw new Error('expected one font in the CFF table')
  const oldFontName = cff.toString('latin1', nameIndex.items[0].start, nameIndex.items[0].end)

  // String IDs below 391 are the standard strings, built into every CFF reader.
  const strings = stringIndex.items.map(({ start, end }) => cff.subarray(start, end))
  const setString = (sid, text) => {
    if (sid < 391) throw new Error(`cannot rename the standard CFF string ${sid}`)
    strings[sid - 391] = Buffer.from(text, 'latin1')
  }
  const top = parseDict(cff, topIndex.items[0])
  if (top.has(2)) setString(top.get(2)[0].value, fullName)
  if (top.has(3)) setString(top.get(3)[0].value, familyName)
  const fonts = top.has(1236) ? readIndex(cff, top.get(1236)[0].value).items.map((dict) => parseDict(cff, dict)) : []
  for (const font of fonts) {
    const sid = font.get(1238)?.[0].value ?? 0
    const name = sid < 391 ? '' : strings[sid - 391].toString('latin1')
    // SourceHanSansCN-Heavy-Ideographs becomes SFBHeading-Heavy-Ideographs.
    if (name.startsWith(oldFontName)) setString(sid, fontName + name.slice(oldFontName.length))
  }

  const newNameIndex = writeIndex([Buffer.from(fontName, 'latin1')])
  const newStringIndex = writeIndex(strings)
  const shift = newNameIndex.length - (nameIndex.end - cff[2]) + newStringIndex.length - (stringIndex.end - topIndex.end)
  const out = Buffer.from(cff)
  const move = (operand) => {
    if (operand.value < rest) throw new Error(`CFF offset ${operand.value} points before the data that moves`)
    encodeInt(operand.value + shift, operand.size).copy(out, operand.pos)
  }
  // A charset of 0 to 2 or an Encoding of 0 or 1 names a built-in table rather than an offset.
  if (top.has(15) && top.get(15)[0].value > 2) move(top.get(15)[0])
  if (top.has(16) && top.get(16)[0].value > 1) move(top.get(16)[0])
  for (const op of [17, 1236, 1237]) if (top.has(op)) move(top.get(op)[0])
  for (const dict of [top, ...fonts]) if (dict.has(18)) move(dict.get(18)[1]) // Private: size, offset

  return Buffer.concat([
    out.subarray(0, cff[2]),
    newNameIndex,
    out.subarray(nameIndex.end, topIndex.end),
    newStringIndex,
    out.subarray(stringIndex.end),
  ])
}

// Where each entry of the INDEX at `pos` starts and ends, and where the INDEX ends.
function readIndex(cff, pos) {
  const count = cff.readUInt16BE(pos)
  if (count === 0) return { items: [], end: pos + 2 }
  const size = cff[pos + 2]
  const offset = (i) => cff.readUIntBE(pos + 3 + i * size, size)
  // Offsets count from 1, from the byte before the data.
  const base = pos + 2 + (count + 1) * size
  const items = Array.from({ length: count }, (_, i) => ({ start: base + offset(i), end: base + offset(i + 1) }))
  return { items, end: base + offset(count) }
}

function writeIndex(items) {
  const dataSize = items.reduce((sum, item) => sum + item.length, 0)
  const size = dataSize < 0xff ? 1 : dataSize < 0xffff ? 2 : dataSize < 0xffffff ? 3 : 4
  const head = Buffer.alloc(3 + (items.length + 1) * size)
  head.writeUInt16BE(items.length, 0)
  head[2] = size
  let offset = 1
  items.forEach((item, i) => {
    head.writeUIntBE(offset, 3 + i * size, size)
    offset += item.length
  })
  head.writeUIntBE(offset, 3 + items.length * size, size)
  return Buffer.concat([head, ...items])
}

// The DICT from `start` to `end` as a map from operator to operands; the two-byte operators 12 x are
// keyed 1200 + x. Each operand keeps its position in the table and its size in bytes.
function parseDict(cff, { start, end }) {
  const ops = new Map()
  let operands = []
  let p = start
  while (p < end) {
    const b = cff[p]
    const pos = p
    let value = NaN
    if (b <= 21) {
      ops.set(b === 12 ? 1200 + cff[p + 1] : b, operands)
      operands = []
      p += b === 12 ? 2 : 1
      continue
    } else if (b === 28) {
      value = cff.readInt16BE(p + 1)
      p += 3
    } else if (b === 29) {
      value = cff.readInt32BE(p + 1)
      p += 5
    } else if (b === 30) {
      // A real number, in nibbles, ending with the nibble 0xf.
      p++
      while ((cff[p] & 0x0f) !== 0x0f && cff[p] >> 4 !== 0x0f) p++
      p++
    } else if (b >= 32 && b <= 246) {
      value = b - 139
      p += 1
    } else if (b >= 247 && b <= 250) {
      value = (b - 247) * 256 + cff[p + 1] + 108
      p += 2
    } else if (b >= 251 && b <= 254) {
      value = -(b - 251) * 256 - cff[p + 1] - 108
      p += 2
    } else {
      throw new Error(`unexpected byte ${b} in a CFF DICT`)
    }
    operands.push({ value, pos, size: p - pos })
  }
  return ops
}

// A non-negative integer as a DICT operand of exactly `size` bytes.
function encodeInt(value, size) {
  if (size === 1 && value <= 107) return Buffer.from([value + 139])
  if (size === 2 && value >= 108 && value <= 1131) return Buffer.from([247 + ((value - 108) >> 8), (value - 108) & 0xff])
  if (size === 3 && value <= 0x7fff) return Buffer.from([28, value >> 8, value & 0xff])
  if (size === 5) {
    const b = Buffer.alloc(5)
    b[0] = 29
    b.writeInt32BE(value, 1)
    return b
  }
  throw new Error(`CFF offset ${value} does not fit in ${size} bytes`)
}

// Lays the tables out again after the table directory, each padded to four bytes, with fresh checksums.
function writeSfnt(version, tables) {
  const tags = [...tables.keys()].sort()
  const entrySelector = Math.floor(Math.log2(tags.length))
  const dir = Buffer.alloc(12 + tags.length * 16)
  dir.writeUInt32BE(version, 0)
  dir.writeUInt16BE(tags.length, 4)
  dir.writeUInt16BE(2 ** entrySelector * 16, 6)
  dir.writeUInt16BE(entrySelector, 8)
  dir.writeUInt16BE(tags.length * 16 - 2 ** entrySelector * 16, 10)
  const data = []
  let offset = dir.length
  for (const [i, tag] of tags.entries()) {
    const table = Buffer.from(tables.get(tag))
    if (tag === 'head') table.writeUInt32BE(0, 8) // checkSumAdjustment, set below
    const padded = Buffer.concat([table, Buffer.alloc((4 - (table.length % 4)) % 4)])
    dir.write(tag, 12 + i * 16, 'latin1')
    dir.writeUInt32BE(checksum(padded), 12 + i * 16 + 4)
    dir.writeUInt32BE(offset, 12 + i * 16 + 8)
    dir.writeUInt32BE(table.length, 12 + i * 16 + 12)
    data.push(padded)
    offset += padded.length
  }
  const font = Buffer.concat([dir, ...data])
  if (tables.has('head')) {
    const head = dir.readUInt32BE(12 + tags.indexOf('head') * 16 + 8)
    font.writeUInt32BE((0xb1b0afba - checksum(font)) >>> 0, head + 8)
  }
  return font
}

function checksum(bytes) {
  let sum = 0
  for (let i = 0; i < bytes.length; i += 4) sum = (sum + bytes.readUInt32BE(i)) >>> 0
  return sum
}
