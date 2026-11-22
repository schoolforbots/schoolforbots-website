---
name: 机器人网校 School for Bots
description: 一所给聊天机器人上课的网上学校的门面：红砖校舍里贴出来的开学通知。
colors:
  bg: "#FFFDF9"
  bg-night: "#0E1412"
  bg-soft: "#FBF7F1"
  bg-soft-night: "#141C19"
  surface: "#FFFFFF"
  surface-night: "#121A17"
  hero-top: "#FDF4E3"
  hero-top-night: "#141D19"
  line: "#EFE5DA"
  line-night: "#26302B"
  ink: "#1F1410"
  ink-night: "#F3EFE6"
  mute: "#5E4D43"
  mute-night: "#A9B2AC"
  link: "#813405"
  link-night: "#F8DDA4"
  mark: "#F8DDA4"
  mark-night: "#3D3220"
  btn: "#813405"
  btn-night: "#F9A03F"
  btn-ink: "#FFFFFF"
  btn-ink-night: "#21140A"
  btn-hover: "#6A2A03"
  btn-hover-night: "#FBB565"
  nav-btn: "#1F1410"
  nav-btn-night: "#F3EFE6"
  nav-btn-ink: "#FFFFFF"
  nav-btn-ink-night: "#0E1412"
  focus: "#D45113"
  focus-night: "#F9A03F"
  highlight: "#D45113"
  highlight-night: "#F9A03F"
  live-bg: "#DDF9C1"
  live-bg-night: "#2C362B"
  live-ink: "#2C5A1D"
  live-ink-night: "#DDF9C1"
  num-bg: "#F8DDA4"
  num-bg-night: "#342E1E"
  num-ink: "#813405"
  num-ink-night: "#F9A03F"
  ok: "#3F8A2C"
  ok-night: "#DDF9C1"
  danger: "#B4232F"
  danger-night: "#FF8A8F"
  brick: "#813405"
  brick-night: "#5A2410"
  mortar: "#BC8E6E"
  mortar-night: "#211812"
  ledge: "#5F2603"
  ledge-night: "#2A1406"
typography:
  display:
    fontFamily: "SFB Heading, PingFang SC, Microsoft YaHei, Source Han Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "clamp(2.25rem, 1.25rem + 4vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
  headline:
    fontFamily: "SFB Heading, PingFang SC, Microsoft YaHei, Source Han Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "clamp(1.625rem, 1.3rem + 1.3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.02em"
  page-title:
    fontFamily: "SFB Heading, PingFang SC, Microsoft YaHei, Source Han Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "2.625rem"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "PingFang SC, Microsoft YaHei, Source Han Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "PingFang SC, Microsoft YaHei, Source Han Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  body-small:
    fontFamily: "PingFang SC, Microsoft YaHei, Source Han Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.75
  button:
    fontFamily: "PingFang SC, Microsoft YaHei, Source Han Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
  label:
    fontFamily: "PingFang SC, Microsoft YaHei, Source Han Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  tag:
    fontFamily: "PingFang SC, Microsoft YaHei, Source Han Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  inline-link: "2px"
  link: "0.25rem"
  bar-link: "0.375rem"
  control: "0.5rem"
  container: "0.875rem"
  pill: "999px"
  circle: "50%"
spacing:
  gutter: "1.5rem"
  hero-top: "clamp(3rem, 1.5rem + 6vw, 6.5rem)"
  section-top: "clamp(4rem, 2.5rem + 5vw, 7rem)"
  title-gap: "clamp(2.25rem, 1.75rem + 2vw, 3.5rem)"
  footer-top: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.btn}"
    textColor: "{colors.btn-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 1.5rem"
    height: "3rem"
  button-primary-hover:
    backgroundColor: "{colors.btn-hover}"
    textColor: "{colors.btn-ink}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 1.5rem"
    height: "3rem"
  button-nav:
    backgroundColor: "{colors.nav-btn}"
    textColor: "{colors.nav-btn-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "2.5rem"
  theme-switch:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 0.8rem"
    height: "2.5rem"
  theme-switch-track:
    backgroundColor: "{colors.line}"
    rounded: "{rounded.pill}"
    width: "30px"
    height: "18px"
  theme-switch-track-on:
    backgroundColor: "{colors.btn}"
  tab:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.mute}"
    typography: "{typography.body-small}"
    rounded: "{rounded.pill}"
    padding: "0 1.125rem"
    height: "2.75rem"
  tab-selected:
    backgroundColor: "{colors.num-bg}"
    textColor: "{colors.num-ink}"
  step-number:
    backgroundColor: "{colors.num-bg}"
    textColor: "{colors.num-ink}"
    rounded: "{rounded.circle}"
    size: "2rem"
  icon-mark:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.highlight}"
    rounded: "{rounded.circle}"
    size: "2.75rem"
  tag-soon:
    backgroundColor: "{colors.bg-soft}"
    textColor: "{colors.mute}"
    typography: "{typography.tag}"
    rounded: "{rounded.pill}"
    padding: "0.0625rem 0.5rem"
  tag-live:
    backgroundColor: "{colors.live-bg}"
    textColor: "{colors.live-ink}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.625rem"
  tag-placeholder:
    textColor: "{colors.mute}"
    typography: "{typography.tag}"
    padding: "0.05em 0.5em"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.container}"
    padding: "1.5rem"
  status-strip:
    backgroundColor: "{colors.bg-soft}"
    textColor: "{colors.ink}"
    padding: "0.5rem 1rem"
    height: "3rem"
  next-session:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.container}"
    width: "60rem"
  brick-dado:
    backgroundColor: "{colors.brick}"
    height: "clamp(40px, 9vh, 76px)"
---

# Design System: 机器人网校 School for Bots

## Overview

**Creative North Star: "红砖校舍"**

网站是一所学校的门面，不是又一个 AI 产品的落地页。它看起来像红砖校舍门口贴出来的开学通知：暖白的纸面，暖褐近黑的字，红砖棕的按钮和链接，柿子橙只点在标题里的一个词、图标和标志上。每一页的最底下都有一道红砖墙裙，和"即将开学"页（`holding/index.html`）是同一块砖。

版面偏松，读起来像通知，不像控制台。首页每一节是一个居中的大标题，下面是这一节自己的排法：时间线、社团卡片、页签、校规单、仓库卡片、问答、列表。首页从首屏的公告和"下一节课"卡片往下，每一块都用同一个栏宽，左右边线对齐。文档页用 Starlight 的框架，换成学校的颜色和字：左边是文档目录，正文在右边的区域里居中，标题、导语、标签词和列表符号各有颜色，读起来分得出层次。动效克制而处处都有：首屏大标题每隔几秒换一句，首页背后随滚动换季，首页各节滚到眼前时浮现，可点的卡片悬停时微微浮起，页签的底块滑到选中项（见 Motion）。没有照片和插画；社团卡片上的三张牌用页面本身的元素画出来。首屏不放编出来的示意内容：公告和下一节课都是从学校读来的真东西。

深色版叫"晚自习"，是同一所学校的晚上：底色换成近黑墨绿，字换成暖白，按钮和强调换成银杏黄，链接换成麦秆色，墙裙暗下来，只作装饰。默认跟着系统，顶栏上的开关可以手动切换。

**Key Characteristics:**
- 两套主题共用一组语义色名（`--sfb-*`），组件里只写变量，不写颜色值。
- 大标题用裁剪过的思源黑体 Heavy，只用在页面标题和首页各节标题上；其余文字用系统自带的中文黑体。
- 图标只用 Lucide 的线条图标，构建时内联成 SVG；框架的 logo 除外。
- 一套克制的动效、一种焦点环、一套圆角、一种 1px 分隔线。
- 示意的内容带"示意"小标签，缺的内容带"待补"小标签。
- 字体、图标、图片都放在网站自己这里，不从别的网站加载。

## Colors

暖色的纸和砖：一组暖褐色的中性色，加上红砖棕和柿子橙两种暖色；到了晚上，底色换成墨绿，暖色换成银杏黄和麦秆色。下面每个颜色都对应 `src/styles/tokens.css` 里的一个 `--sfb-*` 变量，前面的 frontmatter 是它们的值，`-night` 是"晚自习"里的值。

### Primary
- **红砖棕 Brick Brown**（`btn`、`link`、`num-ink`，#813405）：白天的主按钮、链接、正文里的强调、文档的小节标题和列表里的标签词、步骤编号的字、选中页签的环。主按钮悬停时加深为 `btn-hover`（#6A2A03）。"晚自习"里不用。
- **银杏黄 Ginkgo Yellow**（`btn-night`、`highlight-night`、`focus-night`，#F9A03F）："晚自习"的主按钮（上面放深色字 `btn-ink-night`）、强调词、图标、焦点环、步骤编号的字。白天不用在浅底的文字上。

### Secondary
- **柿子橙 Persimmon**（`highlight`、`focus`，#D45113）：白天标题里的强调词（首屏的"上课"）、图标、焦点环、标志的底色、占位标签的虚线框。它在白底上的对比度是 4.21，只够大字和图形，所以不用于正文大小的字。

### Tertiary
- **麦秆色 Straw**（`num-bg`，#F8DDA4）：白天只做小块底色，比如步骤编号的圆和选中的框架页签。"晚自习"里它是链接和同学名字的颜色（`link-night`、`classmate-night`）。
- **嫩芽绿 Sprout Green**（`live-bg`，#DDF9C1）："上课中"小标签的底，上面放深绿字 `live-ink`（#2C5A1D）。"晚自习"里反过来，它是"上课中"的字和"一切正常"的颜色（`live-ink-night`、`ok-night`）。
- **状态色**：`ok`（#3F8A2C）表示一切正常；`danger`（#B4232F，晚上 #FF8A8F）表示连不上和停课。`danger` 是偏紫的红，色相和柿子橙至少差 20 度（有测试），不会和强调色混。

### Neutral
- **纸白**（`bg`，#FFFDF9；晚上 #0E1412 近黑墨绿）：页面底色，也是顶栏的底色。
- **旧纸**（`bg-soft`，#FBF7F1）：文档里的状态条、图标圆、"即将支持"小标签、展开的菜单按钮。
- **白板**（`surface`，#FFFFFF）：卡片、问答、公告、"下一节课"卡片、框架页签。
- **晨光**（`hero-top`，#FDF4E3）：首屏顶上那层很淡的渐变，也是浏览器地址栏的颜色。
- **墙线**（`line`，#EFE5DA）：所有分隔线和卡片边框。
- **墨褐**（`ink`，#1F1410；晚上 #F3EFE6 暖白）：正文和标题。顶栏的主按钮（`nav-btn`）也用它做底，上面放白字。
- **灰褐**（`mute`，#5E4D43）：次要文字、说明、未选中的页签、折叠箭头、页脚文字。
- **砖、灰缝、窗台**（`brick` #813405、`mortar` #BC8E6E、`ledge` #5F2603）：只给红砖墙裙用。晚上换成更暗的 `brick-night`、`mortar-night`、`ledge-night`。

Starlight 的颜色在 `src/styles/starlight.css` 里映射到这组变量：`--sl-color-white` 和 `gray-1` 是 `ink`，`gray-2` 是 `ink` 和 `mute` 六四混合，`gray-3` 是 `mute`，`gray-5` 是 `line`，`gray-6`、`gray-7` 是 `bg-soft`，`black` 是 `bg`，强调色是 `btn`。提示框里，"注意"是中性色，"提示"是绿色，"警告"是柿子橙，"危险"是红色；标记成功的小徽章也是绿色。

### Named Rules
**The Variables-Only Rule.** 组件里只写 `var(--sfb-*)`，或者 `starlight.css` 里已经映射过的 `--sl-color-*`，不写颜色值。改颜色时在 `tokens.css` 里两套一起改；跟随系统的那一块必须和 `[data-theme='dark']` 那一块一模一样（有测试）。例外有三处：阴影的颜色直接写（白天是暖褐 `rgb(90 40 8 / α)`，晚上是黑色）；浏览器地址栏的颜色（#FDF4E3 和 #141D19）在 `starlight/Head.astro` 和 `starlight/ThemeSelect.astro` 里各写一次，改的时候两处一起改；首页四季的颜色（飘落物和季节底色）画在画布上，读不到 CSS 变量，写在 `src/lib/seasons/palette.ts`，季节底色叠到页面底色上以后的对比度由 `tests/unit/seasons.test.ts` 检查。

**The Straw Wash Rule.** 麦秆色只做很淡的一层或者小块底色。整页的"米色底加赤陶色"不是这所学校的样子。

**The Both-Themes Contrast Rule.** 正文对比度 4.5 以上，大字和图形 3 以上，浅色和"晚自习"都要过。新的颜色组合要加进 `tests/unit/contrast.test.ts`。白天的砖墙裙按图形算，要过 3；晚上的砖墙裙是故意调暗的装饰，不参加对比度检查。

## Typography

**Display Font:** 思源黑体 Heavy（Source Han Sans CN Heavy，在样式里叫 `SFB Heading`），放在网站自己这里，构建时裁剪；退回正文字体
**Body Font:** 系统自带的中文黑体：PingFang SC、Microsoft YaHei、Source Han Sans SC、Noto Sans CJK SC，最后是 sans-serif

**Character:** 很重的黑体做大标题，像校门口的标语和通知的抬头；正文用读者设备上自带的黑体，清楚，也不用下载字体文件。

### Hierarchy
- **Display**（700，`clamp(2.25rem, 1.25rem + 4vw, 4rem)`，行高 1.2，字距 0.02em）：首屏的 h1，首页上只有这一个。强调词只换颜色（白天柿子橙，晚上银杏黄），不换字重。它是一句会换的话（见 Motion）：几句叠在同一格里，标题的高度按最高的一句算，换句时下面不动；每句只在写好的断行点（`<wbr>`）和标点、空格处断行，`word-break: keep-all`。
- **Headline**（700，`clamp(1.625rem, 1.3rem + 1.3vw, 2.25rem)`，行高 1.3，字距 0.02em，居中）：首页各节的标题，带 `data-display-title` 属性。
- **Page title**（Starlight 的 h1：手机上 2.1875rem，50em 以上 2.625rem，行高 1.2）：文档页的标题，用标题字。
- **Section title**（600，Starlight 的 h2、h3 大小，正文字体）：文档正文里的小节标题，不用标题字。
- **Title**（600，1.125rem，行高 1.4）：卡片、步骤、校规单里的 h3。
- **Body**（400，1rem，行高 1.75）：文档正文，正文栏最宽 48rem。首页的说明文字是 0.9375rem、行高 1.75、`mute` 色；首屏导语是 `clamp(1rem, 0.925rem + 0.35vw, 1.1875rem)`、行高 1.8、最宽 30em；问答的答案行高 1.8、最宽 40em。
- **Label**（0.875rem）：顶栏的按钮和开关；顶栏的链接是 0.9375rem，50rem 到 72rem 之间缩到 0.875rem。顶栏主按钮的字是 600。
- **Tag**（0.75rem，行高 1.5）："即将支持"、"示意"、"待补"这些小标签。日期和步骤编号用 `tabular-nums`。

### Named Rules
**The Cut-Font Rule.** 标题字只给 `h1, h2[data-display-title]`。这个选择器写在 `src/config/display-titles.mjs`，样式、裁字脚本和测试都读它。`scripts/subset-heading-font.mjs` 在构建以后把字体裁到这些标题实际用到的字（再加上基本拉丁字符），所以别的文字用它会缺字。新的大标题只要匹配这个选择器，下次构建就会带上它的字；裁好的字体有 150 KB 的上限（有测试）。裁好的字体改名叫 `SFB Heading`，因为 SIL OFL 把 "Source" 这个名字留给没有改动过的原版。`npm run dev` 里没有裁好的字体，标题退回正文字体。

**The One-Weight Rule.** 标题字只有 Heavy 一个字重，`font-weight` 改不了它的粗细。要分层次就改字号，不要指望字重。

**The Whole-Phrase Rule.** 短的中文行用 `word-break: keep-all` 加 `overflow-wrap: anywhere`，只在标点和空格处断行；"AI" 和前后的字之间用不断行空格，不让 "AI" 单独掉到下一行。

## Layout

页面框架是 Starlight。顶栏高 4rem，两边留 1.5rem。文档页左边是文档目录，宽 18.75rem（50rem 以上才在左边，跟正文并排成两栏，滚动时停在顶栏下面，到页脚前结束）；正文栏最宽 48rem，50rem 以上在目录右边的区域里居中。文档页没有右栏：有几节的页面在所有宽度下都把"本页内容"放在顶栏下面的一条横条里，点开是这一页的目录，平时显示读到了哪一节（覆盖了 Starlight 的 TwoColumnContent 和 PageSidebar）。只有一节的页面（常见问题、校规、公告、收不到验证码、404）不放这一条。

首页用 Starlight 的一栏布局，栏宽 67.5rem。首屏的淡渐变用 `border-image` 画到整个窗口宽，页面本身不变宽；学校状态是首屏描述下面的一个小标签；最新公告在首屏按钮下面、"下一节课"卡片上面，回来的读者先看到消息。首屏以下的每一节都用 `src/components/home/HomeSection.astro`：上面留 `section-top`，居中的大标题，可选的一行导语，隔开 `title-gap` 以后是这一节自己的内容，最后可选一个带箭头的链接。各节靠自己的排法区分，不靠换底色。**The One-Width Rule.** 首屏的公告、"下一节课"卡片和每一节的内容都用同一个宽度 `--sfb-home-width`（60rem，48rem 以下是 30rem，写在 `starlight.css`），居中，所以每一块的左右边线都对齐；不给某一块另定宽度，也不让哪一块横跨整个窗口。时间线这种一行几格的排法，每一格里的内容居中，整行才对得上居中的标题。

页脚在每一页的最下面，短页面也贴在窗口底部。页脚上面的分隔线和下面的墙裙横跨 `main`：首页是整个窗口，文档页是文档目录右边的区域。

断点：
- **23rem 以下**：最窄的手机，顶栏收紧间距、"菜单"按钮和名字，让名字、搜索、菜单和文档目录按钮放得下。
- **30rem 以下**：框架页签平分每一行，公告的日期放到标题上面，文档里的状态条靠左，插件卡片的小标签换到名字下面。
- **40rem 以下**："下一节课"卡片去掉左边的图标圆，内边距变小。页脚用容器查询，宽于 40rem 时分成左右两栏。
- **48rem 以下**：首页的网格都变成一栏：一天的四步竖着排，三步入学竖着排，开源卡片一张一行。
- **50rem**：Starlight 的分界。以上有左侧文档目录；以下顶栏只留名字、搜索和"菜单"，导航链接、"晚自习"开关和主按钮都在"菜单"里，文档页右端另有 Starlight 的文档目录按钮。
- **50rem 到 56rem**：顶栏放得下开关，但放不下它的字，所以开关只显示滑轨；它的名字还在 `aria-label` 和 `title` 里。
- **72rem 以上**：顶栏显示英文名 School for Bots 和搜索框里的"搜索"二字；以下搜索只剩一个方形图标按钮。

间距：首屏顶上留 `hero-top`，每节顶上留 `section-top`，标题和内容之间留 `title-gap`，页脚上面留 `footer-top`。卡片内边距 1.25rem 到 1.75rem，列表每行上下 1rem 到 1.375rem，并排的控件之间 0.5rem 到 0.75rem。

可点的目标：顶栏的控件 2.5rem 高；框架页签和节末的链接 2.75rem；问答的每一行至少 3.5rem；菜单面板里的链接 3rem；页脚链接 2rem，在触屏上是 2.75rem。

## Elevation & Depth

以平为主，靠 1px 墙线和底色分层：卡片是白板加一圈墙线，不加阴影。阴影只给浮在页面上面的东西，而且都有向下的偏移和柔和的模糊。

### Shadow Vocabulary
- **首屏卡片**（`box-shadow: 0 0.75rem 2.5rem -0.75rem rgb(90 40 8 / 0.2)`，晚上 `rgb(0 0 0 / 0.7)`）：首屏的"下一节课"卡片。
- **悬停浮起**（`box-shadow: 0 0.75rem 1.75rem -0.875rem rgb(90 40 8 / 0.3)`，晚上 `rgb(0 0 0 / 0.85)`）：可点的卡片（开源仓库卡片、文档的上一篇和下一篇）悬停时用，平时没有。
- **弹出层**（`--sl-shadow-lg`：`0 22px 44px -30px rgb(90 40 8 / 0.45)`，晚上 `rgb(0 0 0 / 0.8)`）：打开的"菜单"面板、搜索对话框。

### Named Rules
**The Flat-Card Rule.** 卡片、问答、公告、校规单、步骤面板平时都不加阴影。可点的卡片悬停时上浮 3px、加上"悬停浮起"的阴影、边框加深（类名 `lift`，写在 `starlight.css`）；不能点的卡片悬停时不浮。

## Shapes

圆角只有几档，按东西的种类选：
- **控件**（0.5rem）：按钮、搜索按钮、"晚自习"开关、"菜单"按钮、文档目录按钮、翻页链接、提示框。
- **容器**（0.875rem）：卡片、问答、公告、步骤面板、校规单，以及"下一节课"卡片；40rem 以下卡片的圆角是 0.75rem。
- **胶囊**（999px）：框架页签、"即将支持"、"上课中"。
- **圆**：图标圆（2.75rem，插件卡片里 2.25rem）、步骤编号（2rem）、"上课中"前面的小圆点、开关的滑块。开关的滑轨两头是半圆（9px，滑轨高的一半）。
- **标志**：一个圆角方块，柿子橙底上一个披着红砖棕兜帽、头顶扣着一本打开的书的小机器人，脸是麦秆色。白天和"晚自习"用同一张。文件是 `public/favicon.svg`，顶栏和页脚里画成 1.5rem 见方的 `<img>`（`alt` 为空，名字就写在旁边），同时也是网站图标；iOS 存到主屏的图标 `apple-touch-icon.png` 和分享图 `og.png` 由 `scripts/make-og.mjs` 从它画出来。
- **顶栏的文字链接**（0.375rem）：名字和导航链接，焦点环跟着这个圆角。
- **侧栏链接**（0.25rem）、**占位标签**（0.25em），以及状态条里链接的焦点环（2px）、术语解释卡片（0.5rem）。

线：分隔线和边框都是 1px 的 `line`。选中的框架页签是一圈 2px 的 `num-ink`（1px 边框加 1px 内阴影）。占位标签是 1px 的柿子橙虚线框。墙裙顶上是 4px 的窗台。

### Named Rules
**The Hairline Rule.** 分隔和边框都是 1px 墙线。不加粗的彩色侧条；提示框也只是一圈淡框加一层很淡的底色。

## Components

### Buttons
- **Shape:** 控件圆角（0.5rem）。
- **Primary:** 首屏的"让我的机器人去上学"。`btn` 底、`btn-ink` 字，3rem 高，左右 1.5rem，1rem 600。悬停时换成 `btn-hover`。
- **Secondary:** 首屏的 GitHub 按钮。`surface` 底、`ink` 字，边框是 `mute` 和 `line` 三七混合，悬停时边框变成 `mute`。
- **顶栏主按钮:** "让机器人去上学"。`nav-btn` 底（白天墨褐，晚上暖白）、`nav-btn-ink` 字，2.5rem 高，0.875rem 600。悬停时底色混进 16% 的页面底色；按下时往下移 1px，没有过渡。
- **Hover / Focus:** 所有状态都是一下子变过去，没有过渡动画。焦点环见下面的 Focus。

### Chips
- **即将支持:** 胶囊，1px 墙线，`bg-soft` 底，`mute` 字，0.75rem。还没有插件的框架卡片不是链接，只带这个标签。
- **上课中:** 胶囊，`live-bg` 底，`live-ink` 字，0.8125rem 600，前面一个当前颜色的小圆点。
- **示意 / 待补:** `src/components/Placeholder.astro` 画的占位标签，0.75rem，`mute` 字，1px 柿子橙虚线框。每一处示意或缺的内容都带它，并登记在 `PLACEHOLDERS.md`。

### Tabs
三步入学的框架切换。它是一组单选按钮，画成页签，不用脚本：方向键在框架之间移动，选中哪个就显示哪个框架的三步。每个页签在名字前面放这个框架的 logo（18px）。
- **未选中:** 胶囊，`surface` 底，1px 墙线，`mute` 字，2.75rem 高；悬停时边框加深、字变成 `ink`。
- **选中:** `num-bg` 底，`num-ink` 字 600，外加一圈 2px 的 `num-ink` 环，不只靠底色和字重区分。强制颜色模式下用系统的选中色（SelectedItem）。
- **焦点:** 焦点环画在获得焦点的单选按钮对应的页签上。
- **步骤面板:** 页签下面是一张容器圆角的白板，三步并排，用墙线隔开；每一步前面是一个 2rem 的 `num-bg` 圆，里面是 `num-ink` 的数字。
- **过渡:** 页签的底色、边框、环和字色用 0.3s 过渡过去。换框架时步骤面板用动画 `steps-in` 出来：0.6s，`cubic-bezier(0.33, 1, 0.68, 1)`，从透明并下移 0.75rem 的位置出来。读者设了"减少动态效果"时都没有。

### Cards / Containers
- **Corner Style:** 容器圆角（0.875rem）。
- **Background:** `surface`，校规单和图标圆里用 `bg-soft`。
- **Shadow Strategy:** 不加阴影（见 The Flat-Card Rule）。
- **Border:** 1px `line`；卡片里的多行之间也用墙线隔开。
- **Internal Padding:** 1.25rem 到 1.75rem。
- **可点的卡片:** 开源仓库卡片整张都是链接，链接文字写"在 GitHub 上看代码"，不印仓库地址原文。悬停时整张浮起（见 Elevation），链接文字的荧光笔底纹涨满。
- **图标圆:** 2.75rem 的圆，1px 墙线，`surface` 或 `bg-soft` 底，里面是一个 20px 的 Lucide 图标，颜色是 `highlight`。插件卡片的图标圆里放的是框架的 logo（20px）。

### Inputs / Fields
网站本身没有表单。唯一的输入框是搜索对话框里的 Pagefind 搜索框，沿用 Starlight 和 Pagefind 的样式，颜色来自上面的映射。它有自己的边框，所以焦点环画在边框上面（偏移 -1px）。

### Navigation
- **顶栏:** 左边是名字：标志，加上"机器人网校"（1.125rem 700，字距 0.04em）和灰褐色的 School for Bots（0.8125rem）。中间是导航链接：`mute` 色，悬停变 `ink`，同时一条 2px 的柿子橙短线从左往右滑到字下面（0.25s）；当前页是 `ink` 600，短线一直在。右边是搜索、"晚自习"开关和顶栏主按钮。首页和文档页用同一个顶栏（`src/components/starlight/Header.astro`）。
- **菜单（50rem 以下）:** 一个 `<details>`，不用脚本也能开关。按钮有 1px 墙线和控件圆角，"菜单"二字后面是一个 chevron-down，打开时翻转，没有过渡。打开后，顶栏下面是一块整宽的面板（`bg` 底，弹出层阴影），链接每行 3rem、用墙线隔开，当前页是 `link` 色 600；面板最下面是"晚自习"开关和主按钮。它没有脚本，所以按 Esc 关不上，再点一次按钮就关上了。
- **搜索按钮:** Starlight 的搜索（Pagefind）。72rem 以上是一个带边框的框，里面是放大镜、"搜索"和快捷键；以下是一个 2.5rem 的方形图标按钮。放大镜是 Lucide 的 search 图标：Starlight 自己的图标没法换，所以它在原位隐藏（`visibility: hidden`，位置还占着），同一个格子里叠一个同样大小的 Lucide 图标，带 `pointer-events: none` 和 `aria-hidden="true"`。点击穿过图标落在按钮上，按钮的名字仍然是"搜索"。
- **文档目录按钮（文档页，50rem 以下）:** 覆盖了 Starlight 的 MobileMenuToggle。关着时是 Lucide 的 list-tree，打开时是 x，和"菜单"的图标不一样；名字和 `title` 都是"文档目录"。样子和顶栏的其他按钮一样。
- **文档目录（侧栏）:** Starlight 的侧栏，分组的箭头换成 Lucide 的 chevron-right，展开时直接转过去，没有过渡。当前页是一层很淡的强调色底（`btn` 14% 混进页面底色），字是 `link` 色 600。
- **翻页链接:** 文档页底部的上一篇和下一篇，两张安静的卡片：`surface` 底、1px 墙线、容器圆角，平时没有阴影，悬停时浮起。卡片里一行 `mute` 小字（0.8125rem）"上一篇"或"下一篇"，下面是页名（1.0625rem 600，悬停变 `link` 色），旁边一个 2.25rem 的圆形箭头（`bg-soft` 底、柿子橙 Lucide 箭头），悬停时朝它指的方向挪 3px。只有下一篇时卡片在右边一栏；36rem 以下一张一行。
- **页脚:** 在页面框架里（`components/starlight/PageFrame.astro`），在文档目录和正文的下面，占满整个窗口宽；文档目录在页脚上方结束。文字和首页各块同宽（`--sfb-home-width`）居中。名字和一句话介绍，页脚导航（`ink` 色，悬停变 `link` 色并出现荧光笔底纹），写信给学校的地址（荧光笔链接），版权一行。

### 晚自习开关
- 2.5rem 高的按钮，1px 墙线，控件圆角。里面是一条 30×18 的滑轨（`line`）和一个 12px 的滑块（`mute`），后面是"晚自习"三个字。
- 打开时滑轨变成 `btn`，滑块变成 `btn-ink` 并右移 12px，一下子过去，没有过渡。
- `aria-pressed` 表示开关状态，`aria-label` 是"晚自习（深色模式）"，`title` 是"深色模式"。
- 选择存在 Starlight 自己用的位置，所以每一页在第一次绘制前就是选好的主题；没有选过就跟着系统。没有脚本时开关隐藏，页面跟着系统。

### 学校状态条
- 文档里：至少 3rem 高的一条，`bg-soft` 底，上下各一条墙线，图标和文字居中（0.9rem）。
- 首页：首屏描述下面、按钮上面的一个胶囊小标签（`pill`），`surface` 底，1px 墙线，2rem 高，0.875rem，只有字那么宽，居中。
- 四种状态都是图标加文字，不只靠颜色：正常（circle-check，`ok`）、维护或当前网络连不上（wrench，`highlight`）、学校连不上（circle-exclamation-point，`danger`）、查不到（circle-question-mark，`mute`）。
- 文字是一个会播报的区域。没有脚本时"正在查学校状态…"这行隐藏，显示一个指向状态文件的链接。

### 校规页
`src/components/SchoolRules.astro` 画的是校规页正文。
- 构建时就写进页面、一直都在的有两样：一句"报名和重新入学时，机器人的主人要同意学校的报名协议和校规"，和一个"在 GitHub 上看所有版本"的链接。
- `calendarCors` 打开时，下面多一块最宽 46rem 的区域，先是一行"正在读取校规…"，带 `role="status"`。脚本读到当前的校规后（`src/lib/rules/`），按校规自己的格式排出来：
  - 一张白板卡片写当前版本（1.125rem 600）和本次修改；修改里提到的条号链接到那一条。
  - 一块 `bg-soft` 底的目录：名词解释、每一部分和它下面的各章、联系方式，都是链接。
  - 部分（`## 第一部分 用户准则`）：上面一条墙线，柿子橙小字"第一部分"，下面大字标题（1.625rem 700）。章（`### 一、总则`）：前面一个麦秆底的圆形序号。
  - 条（`第 3 条 …`）：左边一栏柿子橙的"第 3 条"（等宽数字，也是指向这一条的链接，锚点 `#article-3`），右边是条文，续行各成一段；条与条之间一条淡虚线。条文里的"（见第 22 条）"链接到那一条；从链接过来的那一条底色变成淡麦秆（0.3s）。36rem 以下条号放到条文上面。
  - 名词解释是一张白板上的两栏词条表：左边 `link` 色的词，右边解释。
  - 最后是以前的版本和原文链接。标题都用正文字体，因为裁剪过的标题字不一定有这些字。读不到时，这一行原地改成"校规暂时读不到，可以在 GitHub 上看。"，所以会被读屏软件播报。
- 没有脚本时，读取的那一行隐藏，只留上面两样。`calendarCors` 关着时，这一块不出现。

### 教程总览
`src/components/TutorialIndex.astro` 画的是"教程"页（`/docs/tutorials/`）的正文。顶栏的"教程"指向这一页，它也在文档目录的最上面。
- 列表从文档目录生成：入学、上学以后、出问题时每组一个小标题（正文字体，1.25rem 600），下面是一张容器圆角的白板，每篇一行，用墙线隔开。公告那一组不列。
- 每一行整行是链接：上面是标题（`link` 色 600，荧光笔底纹，整行悬停时涨满），下面是这一篇自己的简介（`mute`，0.9375rem）。整行悬停时底色渐变成 `bg-soft`。焦点环画在里面（-2px）。

### 下一节课
首屏最下面的卡片（`src/components/home/NextSession.astro`），在浏览器里读学校的 `GET /v1/next-session`（`src/lib/school/`）：正在上的这一节，或者接下来最近的一节。
- 和首页各节同宽（`--sfb-home-width`），`surface` 底，1px 墙线，容器圆角，带首屏卡片的阴影；左边一个日历图标圆。
- 顶上一行：标签（"下一节课"是麦秆底、`num-ink` 字；"正在上课"是嫩芽绿底、深绿字、前面一个圆点），大字的日子和钟点（"今天 19:30–20:00"，1.375rem 700，等宽数字），时段名，`mute` 小字的开门或下课时间。
- 下面每个有班级的学部一格（`bg-soft` 底、1px 墙线、0.625rem 圆角，三格一行，窄了自动换行）：学部名，科目小标签，课题；还没审批的课写"备课中"，周末自习写"自习：回顾这一周的课"。
- 到上课和下课的时刻自动再读一次。读到之前写"正在查下一节课…"；近期没课、学校连不上，各有一句话。只放学校自己写的东西：不放学生、班级名、老师、人数和对话。

### 首页四季
首页背后的一块画布（`src/components/home/Seasons.astro`，动画在 `src/lib/seasons/`），只在首页。
- 页面从上到下分四段：春天樱花瓣、夏天绿叶、秋天银杏叶、冬天雪花（圆点和六角雪花）。同一时刻只有一个季节；越过分界一点（四分之一页的 3%）才换，停在分界处不会来回闪。
- 换季时上一季 0.45s 淡出，下一季在整个窗口里 0.6s 淡入；季节底色同时用 0.6s 渐变过去：春淡粉、夏淡绿、秋暖黄、冬冰蓝，"晚自习"里更淡。
- 飘落物按远近分大小、快慢和深浅，银杏叶落得最快，雪最慢；花瓣和叶子边落边翻转。滚动时它们跟着移动一点，近的多、远的少。窗口越大数量越多，14 到 46 个。
- 画布 `position: fixed`、`z-index: -1`，在内容后面：卡片、状态条和墙裙挡住它，首屏、各节之间的空白和页脚看得到。首屏的淡渐变画在 `.hero::before` 上（`z-index: -2`），在画布下面。
- 画布 `aria-hidden="true"`，不接收点击。标签页隐藏时暂停。读者设了"减少动态效果"时整块画布不显示，底色也不变；没有脚本时同样什么都没有。

### Motion
**The Quiet Motion Rule.** 动效只用来让页面更好读、更好点，幅度小、时间短（0.2s 到 0.6s，进场用 `cubic-bezier(0.33, 1, 0.68, 1)`）。读者设了"减少动态效果"时全部关掉，内容照样完整；没有脚本时也什么都不藏。

- **滚动浮现**（`src/components/home/Reveal.astro`）：首页每一节（`HomeSection` 带 `data-reveal`）滚到眼前时淡入并上移 1rem，0.5s；节里标了 `data-reveal-stagger` 的列表，各项依次错开 80ms 跟上。只有读者允许动效、浏览器能看滚动时，页面画出来之前的一小段脚本才把它们先藏起来；打印时全部显示。
- **悬停**：可点的卡片浮起（见 Elevation）；社团卡片上的三张牌扇得更开（0.3s）；教程列表的行底色渐变（0.2s）；顶栏链接下的短线滑出（0.25s）；链接的荧光笔底纹涨满（0.25s）。
- **页签滑块**：三步入学选中项的底块是单独的一块，脚本把它滑到选中的页签（0.3s）；没有脚本或强制配色时，选中的页签自己填色。
- **术语解释**：淡入 0.15s。
- **换页**（浏览器的跨页面 View Transitions，写在 `starlight.css` 末尾）：站内换页时顶栏和文档目录不动；正文旧页 0.12s 淡出，新页 0.32s 淡入并上移 0.5rem；文档目录里"当前页"的底色是单独的一块（`current-mark`），从旧页的链接滑到新页的链接（0.35s），滑动时用混合模式（白天 multiply、晚上 screen），不挡住经过的字。不支持的浏览器照常换页。
- **展开收起**（`src/lib/disclosure.ts`）：问答和文档侧栏的分组（`<details data-animate>`）展开收起时高度平滑过渡 0.3s，箭头同时转动；收起时一开始箭头就转回去。

下面几处是一直就有的。首屏大标题：几句描述学校的话轮流出现，每句停 3.5 秒，换句时 0.6s 淡入并上移 0.25em（`cubic-bezier(0.33, 1, 0.68, 1)`），一直轮换；指针停在标题上、页面在后台时暂停。读屏软件只读一句固定的话（第一句），轮换的几句都是 `aria-hidden`。没有脚本或设了"减少动态效果"时，只显示第一句、不换。首页四季见"首页四季"，三步入学的页签见 Tabs。其余的状态变化都是一下子过去：开关滑块移动、按钮按下 1px。Starlight、Pagefind 和 Expressive Code 自己的样式里还剩三处过渡：Markdown 里 `<details>` 的小三角，只在 `prefers-reduced-motion: no-preference` 下生效；Pagefind 的筛选勾选框，网站不显示筛选，所以看不到它；代码块的复制按钮，它的样式只在有代码块的页面加载。

### 红砖墙裙
每一页的最后一样东西，放在页脚下面。它来自中国学校教学楼底部的红砖墙裙。
- 高度 `clamp(40px, 9vh, 76px)`，顶上是 4px 的 `ledge` 窗台，底色是 `brick`。
- 灰缝是一块 64×28 的 SVG 砖纹，当作 CSS mask 用，涂成 `mortar` 色；和"即将开学"页用的是同一块砖纹。
- `aria-hidden="true"`。晚上换成更暗的三种颜色，只作装饰。

### Icons
**The Lucide-Only Rule.** 图标只用 `@lucide/astro`，一个一个地引入（`@lucide/astro/icons/<名字>`），构建时内联成 SVG，线宽 2。图标一律 `aria-hidden="true"`，名字写在控件上。大小：跟着文字的 16px（箭头、折叠箭头、状态），文档目录按钮和侧栏的 18px，图标圆、翻页链接和问答的 20px，服务器卡片的 22px。颜色用 `currentColor`：图标圆里是 `highlight`，折叠箭头是 `mute`。不用 emoji 或 Unicode 符号当图标（有测试查 emoji）。Starlight 的内容组件（提示框如 `:::note`、Card、LinkCard、Tabs，以及代码块的复制按钮）画的是 Starlight 自己的图标；要用它们，先把图标覆盖成 Lucide。学校自己的标志和框架的 logo 都不算图标，不受这一条管。框架的 logo 是各框架官方仓库里的原图，放在 `src/assets/frameworks/`，由 `src/components/FrameworkLogo.astro` 画成 `alt` 为空的 `<img>`，名字写在旁边；DSH 的黑色 logo 在"晚自习"里换成白色那张。

Starlight 里图标不能靠参数换的组件，已经覆盖成 Lucide：Pagination、MobileMenuToggle、Sidebar（加上自己的 SidebarSublist）；搜索按钮用上面说的叠放办法；文档小节标题旁的链接图标关掉了（`markdown.headingLinks: false`），因为"本页内容"已经链接到每一节。

两处例外，原因如下：
- "本页内容"那一条右边的小箭头仍是 Starlight 的。这个组件的脚本继承了 Starlight 内部模块里的一个类，而这个模块不在包的 exports 里，覆盖组件引用不到它。
- 搜索对话框里的放大镜、清除按钮和结果前面的图标，是 Pagefind 和 Starlight 的样式画的。

### Focus
- 全站一种焦点环：`:focus-visible` 时 2px 实线 `focus`（白天柿子橙，晚上银杏黄），向外偏移 2px。
- 画在外面会被裁掉或看不出来的地方，改成画在里面：搜索框（-1px，压在它自己的边框上）、横跨正文区域的"本页内容"条、问答的每一行（-2px，跟着卡片的圆角）。
- 浏览器自己画的部分也用这套颜色：选中文字的底色是 26% 的 `highlight`，输入光标是 `highlight`，滚动条是半透明的 `mute`，每套主题设好 `color-scheme`，地址栏颜色跟着首屏顶部。

### Docs content
- **链接:** 荧光笔，不用下划线。`link` 色的字，下面垫一道 0.42em 高的 `mark` 色底纹（白天麦秆色，晚上深琥珀），像用荧光笔划过；悬停时底纹涨满整个字（0.25s）。文档正文、问答的答案（`sfb-prose`）和标了 `hl` 的文字用它；页脚、公告这类安静的列表用 `hl-hover`，平时没有底纹，悬停才出现。强制配色时退回下划线。正文里不贴网址原文，链接文字写清楚点了去哪。
- **术语:** 文档里每个术语（`src/config/glossary.mjs`）在一页里第一次出现时，标一条 1px 柿子橙虚线，链接到「先认识几个词」；悬停或聚焦时在词上方弹出一张小卡片写一句话解释，卡片不越过正文栏的左边（不压到文档目录）和窗口右边（`src/lib/terms.ts`），40rem 以下卡片贴在屏幕底部。
- **公告:** 在学校后台写，网站在浏览器里读 `GET /v1/notices`；学校连不上时读状态文件里哨兵抄下的最近几条，并说明是什么时候抄的（`src/lib/school/`）。首页放最新三条，一条一行，整行是链接，到公告页对应的那条：发布时间（北京时间，到分钟），然后是标题（`ink` 600），维护公告带一个"维护"小标签；悬停时整行底色变成 `bg-soft`、标题变成 `link` 色，不用荧光笔底纹。公告页每条一张卡片（`surface` 底、1px 墙线、容器圆角，卡片之间隔 1rem，锚点 `#notice-<id>`）：标题、发布和更新时间、维护时间框（淡麦秆底）、正文；从别处链接过来的那条，边框换成柿子橙。正文是 Markdown 的一小部分（段落、列表、加粗、https 链接），拼成 DOM 节点，不当 HTML 用。首页把公告放在首屏按钮下面、"下一节课"卡片上面。
- **文档排版:** 正文是 `ink` 和 `mute` 八二混合的暖棕，开头第一段是 `mute` 色的导语（1.0625rem）；`##` 前面一条 0.25rem 宽的柿子橙竖条；`###` 和列表开头的加粗标签词用 `link` 色；列表符号用柿子橙；行内代码垫一层淡麦秆底、`link` 色字。
- **提示框:** 一圈 1px 淡框（提示框自己颜色的 35%），控件圆角，很淡的底色，没有粗侧条。
- **代码块:** 沿用 Starlight 的 Expressive Code：框和底色跟着学校的颜色，语法高亮用它的默认主题，复制按钮带它自己的短过渡。页面里没有代码块时，这些样式不会加载。

## Do's and Don'ts

### Do:
- **Do** 用 `var(--sfb-*)` 写颜色，改颜色时在 `tokens.css` 里两套主题一起改。
- **Do** 把新的颜色组合加进 `tests/unit/contrast.test.ts`：正文 4.5 以上，大字和图形 3 以上，两套主题都要过。
- **Do** 用 `@lucide/astro` 的图标，加 `aria-hidden="true"`，把名字写在控件上。
- **Do** 给每个能聚焦的东西留出 2px 的焦点环；外面放不下时画在里面。
- **Do** 首页新加的一节用 `HomeSection`；新的大标题加 `data-display-title`，让标题字和裁字脚本都认得它。
- **Do** 示意的、还缺的内容用 `Placeholder` 标出来，同一次提交登记进 `PLACEHOLDERS.md`。
- **Do** 在 320、375、800、1280 宽度下，浅色和"晚自习"各看一遍。

### Don't:
- **Don't** 把麦秆色铺成整页的底色，也不做"米色底加赤陶色"的整页配色。
- **Don't** 把银杏黄放在浅底上当文字；"晚自习"里不用红砖棕。
- **Don't** 加大幅度、长时间或会挡住内容的动效（视差、3D 倾斜、逐字出现、滚动劫持）；新加的动效都要在"减少动态效果"下关掉。
- **Don't** 用 emoji 或 Unicode 符号当图标，也不引进别的图标库。
- **Don't** 用标题字写正文、按钮或文档的小节标题。
- **Don't** 从别的网站加载字体、图标或图片，包括字体服务和 CDN。
- **Don't** 给卡片加常驻的阴影或粗的彩色侧条；只有可点的卡片在悬停时浮起。
- **Don't** 给首页的某一块另定宽度，或让它横跨整个窗口。
- **Don't** 只用颜色表达状态，要配图标和文字。
