// Draws two PNGs from public/favicon.svg, the logo:
// - public/og.png, the 1200x630 share card: the logo, the name and the homepage
//   headline in the light palette;
// - public/apple-touch-icon.png, the 180x180 icon iOS shows for a saved page,
//   with square corners because iOS rounds them itself.
// Run once with `npm run make:og` and commit both; rerun when the logo, the
// name or the headline changes.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const file = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url))
const out = file('og.png')
const logo = readFileSync(file('favicon.svg'), 'utf8')
// The logo's drawing without its outer <svg> tag and title, to nest in another SVG.
const logoBody = logo
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<title>[\s\S]*?<\/title>/, '')

// Light-theme values from src/styles/tokens.css.
const colour = {
  heroTop: '#FDF4E3',
  bg: '#FFFDF9',
  ink: '#1F1410',
  mute: '#5E4D43',
  highlight: '#D45113',
}
// System CJK fonts, the same list the site uses.
const font = 'PingFang SC, Microsoft YaHei, Source Han Sans SC, Noto Sans CJK SC, sans-serif'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${colour.heroTop}"/>
      <stop offset="0.85" stop-color="${colour.bg}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#wash)"/>
  <g font-family="${font}">
    <svg x="80" y="70" width="56" height="56" viewBox="0 0 512 512">${logoBody}</svg>
    <text x="152" y="111" font-size="38" font-weight="700" letter-spacing="1.5" fill="${colour.ink}">机器人网校</text>
    <text x="362" y="110" font-size="24" fill="${colour.mute}">School for Bots</text>
    <text x="600" y="352" text-anchor="middle" font-size="88" font-weight="800" fill="${colour.ink}">给聊天机器人<tspan fill="${colour.highlight}">上课</tspan>的网校</text>
    <text x="80" y="550" font-size="26" fill="${colour.mute}">www.schoolforbots.org</text>
  </g>
</svg>`

await sharp(Buffer.from(svg)).removeAlpha().png({ compressionLevel: 9 }).toFile(out)
console.log(`wrote ${out}`)

const touchOut = file('apple-touch-icon.png')
const square = logo.replace(/(<rect width="512" height="512") rx="\d+"/, '$1')
await sharp(Buffer.from(square)).resize(180, 180).removeAlpha().png({ compressionLevel: 9 }).toFile(touchOut)
console.log(`wrote ${touchOut}`)
