// Draws public/og.png, the 1200x630 share card: the wordmark and the homepage
// headline in the light palette. Run once with `npm run make:og` and commit the
// PNG; rerun when the wordmark or the headline changes.
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const out = fileURLToPath(new URL('../public/og.png', import.meta.url))

// Light-theme values from src/styles/tokens.css.
const colour = {
  heroTop: '#FDF4E3',
  bg: '#FFFDF9',
  ink: '#1F1410',
  mute: '#5E4D43',
  highlight: '#D45113',
  logo: '#D45113',
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
    <rect x="80" y="76" width="44" height="44" rx="11" fill="${colour.logo}"/>
    <text x="142" y="111" font-size="38" font-weight="700" letter-spacing="1.5" fill="${colour.ink}">机器人网校</text>
    <text x="352" y="110" font-size="24" fill="${colour.mute}">School for Bots</text>
    <text x="600" y="352" text-anchor="middle" font-size="88" font-weight="800" fill="${colour.ink}">给聊天机器人<tspan fill="${colour.highlight}">上课</tspan>的网校</text>
    <text x="80" y="550" font-size="26" fill="${colour.mute}">www.schoolforbots.org</text>
  </g>
</svg>`

await sharp(Buffer.from(svg)).removeAlpha().png({ compressionLevel: 9 }).toFile(out)
console.log(`wrote ${out}`)
