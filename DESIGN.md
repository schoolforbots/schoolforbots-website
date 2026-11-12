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
  surface-side: "#FFFAF2"
  surface-side-night: "#0F1613"
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
  logo: "#D45113"
  logo-night: "#F9A03F"
  teacher: "#C24A10"
  teacher-night: "#F9A03F"
  classmate: "#813405"
  classmate-night: "#F8DDA4"
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
  logo: "0.3125rem"
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
  classroom-window:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.container}"
    width: "56rem"
  brick-dado:
    backgroundColor: "{colors.brick}"
    height: "clamp(40px, 9vh, 76px)"
---

# Design System: 机器人网校 School for Bots

## Overview

**Creative North Star: "红砖校舍"**

网站是一所学校的门面，不是又一个 AI 产品的落地页。它看起来像红砖校舍门口贴出来的开学通知：暖白的纸面，暖褐近黑的字，红砖棕的按钮和链接，柿子橙只点在标题里的一个词、图标和标志上。每一页的最底下都有一道红砖墙裙，和"即将开学"页（`holding/index.html`）是同一块砖。

版面偏松，读起来像通知，不像控制台。首页每一节是一个居中的大标题，下面是这一节自己的排法：时间线、页签、校规单、仓库卡片、问答、列表。文档页用 Starlight 的三栏，换成学校的颜色和字。全站只有一处动效：首屏课堂窗口里的四句话依次出现。没有照片、插画和装饰图；首屏的"图"就是一扇课堂窗口，用页面本身的元素画出来。

深色版叫"晚自习"，是同一所学校的晚上：底色换成近黑墨绿，字换成暖白，按钮和强调换成银杏黄，链接换成麦秆色，墙裙暗下来，只作装饰。默认跟着系统，顶栏上的开关可以手动切换。

**Key Characteristics:**
- 两套主题共用一组语义色名（`--sfb-*`），组件里只写变量，不写颜色值。
- 大标题用裁剪过的思源黑体 Heavy，只用在页面标题和首页各节标题上；其余文字用系统自带的中文黑体。
- 图标只用 Lucide 的线条图标，构建时内联成 SVG。
- 一处动效、一种焦点环、一套圆角、一种 1px 分隔线。
- 示意的内容带"示意"小标签，缺的内容带"待补"小标签。
- 字体、图标、图片都放在网站自己这里，不从别的网站加载。

## Colors

暖色的纸和砖：一组暖褐色的中性色，加上红砖棕和柿子橙两种暖色；到了晚上，底色换成墨绿，暖色换成银杏黄和麦秆色。下面每个颜色都对应 `src/styles/tokens.css` 里的一个 `--sfb-*` 变量，前面的 frontmatter 是它们的值，`-night` 是"晚自习"里的值。

### Primary
- **红砖棕 Brick Brown**（`btn`、`link`、`num-ink`，#813405）：白天的主按钮、链接、正文里的强调、步骤编号的字、选中页签的环。主按钮悬停时加深为 `btn-hover`（#6A2A03）。"晚自习"里不用。
- **银杏黄 Ginkgo Yellow**（`btn-night`、`highlight-night`、`focus-night`，#F9A03F）："晚自习"的主按钮（上面放深色字 `btn-ink-night`）、强调词、图标、焦点环、标志、步骤编号的字。白天不用在浅底的文字上。

### Secondary
- **柿子橙 Persimmon**（`highlight`、`focus`、`logo`，#D45113）：白天标题里的强调词（首屏的"上课"）、图标、焦点环、标志色块、占位标签的虚线框。它在白底上的对比度是 4.21，只够大字和图形，所以不用于正文大小的字。课堂窗口里老师的名字是小字，用更深的 `teacher`（#C24A10）。

### Tertiary
- **麦秆色 Straw**（`num-bg`，#F8DDA4）：白天只做小块底色，比如步骤编号的圆和选中的框架页签。"晚自习"里它是链接和同学名字的颜色（`link-night`、`classmate-night`）。
- **嫩芽绿 Sprout Green**（`live-bg`，#DDF9C1）："上课中"小标签的底，上面放深绿字 `live-ink`（#2C5A1D）。"晚自习"里反过来，它是"上课中"的字和"一切正常"的颜色（`live-ink-night`、`ok-night`）。
- **状态色**：`ok`（#3F8A2C）表示一切正常；`danger`（#B4232F，晚上 #FF8A8F）表示连不上和停课。`danger` 是偏紫的红，色相和柿子橙至少差 20 度（有测试），不会和强调色混。

### Neutral
- **纸白**（`bg`，#FFFDF9；晚上 #0E1412 近黑墨绿）：页面底色，也是顶栏的底色。
- **旧纸**（`bg-soft`，#FBF7F1）：状态条、图标圆、"即将支持"小标签、展开的菜单按钮。
- **白板**（`surface`，#FFFFFF）：卡片、问答、公告、课堂窗口、框架页签。
- **暖白侧栏**（`surface-side`，#FFFAF2）：课堂窗口左边的班级信息栏。
- **晨光**（`hero-top`，#FDF4E3）：首屏顶上那层很淡的渐变，也是浏览器地址栏的颜色。
- **墙线**（`line`，#EFE5DA）：所有分隔线和卡片边框。
- **墨褐**（`ink`，#1F1410；晚上 #F3EFE6 暖白）：正文和标题。顶栏的主按钮（`nav-btn`）也用它做底，上面放白字。
- **灰褐**（`mute`，#5E4D43）：次要文字、说明、未选中的页签、折叠箭头、页脚文字。
- **砖、灰缝、窗台**（`brick` #813405、`mortar` #BC8E6E、`ledge` #5F2603）：只给红砖墙裙用。晚上换成更暗的 `brick-night`、`mortar-night`、`ledge-night`。

Starlight 的颜色在 `src/styles/starlight.css` 里映射到这组变量：`--sl-color-white` 和 `gray-1` 是 `ink`，`gray-2` 是 `ink` 和 `mute` 六四混合，`gray-3` 是 `mute`，`gray-5` 是 `line`，`gray-6`、`gray-7` 是 `bg-soft`，`black` 是 `bg`，强调色是 `btn`。提示框里，"注意"是中性色，"提示"是绿色，"警告"是柿子橙，"危险"是红色；标记成功的小徽章也是绿色。

### Named Rules
**The Variables-Only Rule.** 组件里只写 `var(--sfb-*)`，或者 `starlight.css` 里已经映射过的 `--sl-color-*`，不写颜色值。改颜色时在 `tokens.css` 里两套一起改；跟随系统的那一块必须和 `[data-theme='dark']` 那一块一模一样（有测试）。例外只有两处：阴影的颜色直接写（白天是暖褐 `rgb(90 40 8 / α)`，晚上是黑色）；浏览器地址栏的颜色（#FDF4E3 和 #141D19）在 `starlight/Head.astro` 和 `starlight/ThemeSelect.astro` 里各写一次，改的时候两处一起改。

**The Straw Wash Rule.** 麦秆色只做很淡的一层或者小块底色。整页的"米色底加赤陶色"不是这所学校的样子。

**The Both-Themes Contrast Rule.** 正文对比度 4.5 以上，大字和图形 3 以上，浅色和"晚自习"都要过。新的颜色组合要加进 `tests/unit/contrast.test.ts`。白天的砖墙裙按图形算，要过 3；晚上的砖墙裙是故意调暗的装饰，不参加对比度检查。

## Typography

**Display Font:** 思源黑体 Heavy（Source Han Sans CN Heavy，在样式里叫 `SFB Heading`），放在网站自己这里，构建时裁剪；退回正文字体
**Body Font:** 系统自带的中文黑体：PingFang SC、Microsoft YaHei、Source Han Sans SC、Noto Sans CJK SC，最后是 sans-serif

**Character:** 很重的黑体做大标题，像校门口的标语和通知的抬头；正文用读者设备上自带的黑体，清楚，也不用下载字体文件。

### Hierarchy
- **Display**（700，`clamp(2.25rem, 1.25rem + 4vw, 4rem)`，行高 1.2，字距 0.02em）：首屏的 h1，首页上只有这一个。强调词只换颜色（白天柿子橙，晚上银杏黄），不换字重。只在"机器人"后面断行：`<wbr>` 加 `word-break: keep-all`。
- **Headline**（700，`clamp(1.625rem, 1.3rem + 1.3vw, 2.25rem)`，行高 1.3，字距 0.02em，居中）：首页各节的标题，带 `data-display-title` 属性。
- **Page title**（Starlight 的 h1：手机上 2.1875rem，50em 以上 2.625rem，行高 1.2）：文档页的标题，用标题字。
- **Section title**（600，Starlight 的 h2、h3 大小，正文字体）：文档正文里的小节标题，不用标题字。
- **Title**（600，1.125rem，行高 1.4）：卡片、步骤、校规单里的 h3。
- **Body**（400，1rem，行高 1.75）：文档正文，正文栏最宽 45rem。首页的说明文字是 0.9375rem、行高 1.75、`mute` 色；首屏导语是 `clamp(1rem, 0.925rem + 0.35vw, 1.1875rem)`、行高 1.8、最宽 30em；问答的答案行高 1.8、最宽 40em。
- **Label**（0.875rem）：顶栏的按钮和开关；顶栏的链接是 0.9375rem，50rem 到 72rem 之间缩到 0.875rem。顶栏主按钮的字是 600。
- **Tag**（0.75rem，行高 1.5）："即将支持"、"示意"、"待补"这些小标签。日期和步骤编号用 `tabular-nums`。

### Named Rules
**The Cut-Font Rule.** 标题字只给 `h1, h2[data-display-title]`。这个选择器写在 `src/config/display-titles.mjs`，样式、裁字脚本和测试都读它。`scripts/subset-heading-font.mjs` 在构建以后把字体裁到这些标题实际用到的字（再加上基本拉丁字符），所以别的文字用它会缺字。新的大标题只要匹配这个选择器，下次构建就会带上它的字；裁好的字体有 150 KB 的上限（有测试）。`npm run dev` 里没有裁好的字体，标题退回正文字体。

**The One-Weight Rule.** 标题字只有 Heavy 一个字重，`font-weight` 改不了它的粗细。要分层次就改字号，不要指望字重。

**The Whole-Phrase Rule.** 短的中文行用 `word-break: keep-all` 加 `overflow-wrap: anywhere`，只在标点和空格处断行；"AI" 和前后的字之间用不断行空格，不让 "AI" 单独掉到下一行。

## Layout

页面框架是 Starlight。顶栏高 4rem，两边留 1.5rem。文档页有三栏：左边的文档目录宽 18.75rem（50rem 以上才在左边），中间的正文栏最宽 45rem，右边的"本页内容"在 72rem 以上出现，窄一些时变成顶栏下面的一条"本页内容"。只有一节的页面（常见问题、校规、公告、收不到验证码、404）不放"本页内容"。

首页用 Starlight 的一栏布局，栏宽 67.5rem。首屏的淡渐变和横跨窗口的状态条用 `border-image` 画到整个窗口宽，页面本身不变宽。状态条以下的每一节都用 `src/components/home/HomeSection.astro`：上面留 `section-top`，居中的大标题，可选的一行导语，隔开 `title-gap` 以后是这一节自己的内容，最后可选一个带箭头的链接。各节靠自己的排法区分，不靠换底色。节里的内容另有宽度：课堂窗口 56rem，开源卡片 54rem，校规单、问答和公告 46rem；窄屏上网格变成一栏，最宽 30rem。

页脚在每一页的最下面，短页面也贴在窗口底部。页脚上面的分隔线和下面的墙裙横跨 `main`：首页是整个窗口，文档页是两侧目录之间的区域。

断点：
- **23rem 以下**：最窄的手机，顶栏收紧间距、"菜单"按钮和名字，让名字、搜索、菜单和文档目录按钮放得下。
- **30rem 以下**：框架页签平分每一行，公告的日期放到标题上面，状态条靠左，插件卡片的小标签换到名字下面。
- **40rem 以下**：课堂窗口的班级信息变成顶上一条。页脚用容器查询，宽于 40rem 时分成左右两栏。
- **48rem 以下**：首页的网格都变成一栏：一天的四步竖着排，三步入学竖着排，开源卡片一张一行。
- **50rem**：Starlight 的分界。以上有左侧文档目录；以下顶栏只留名字、搜索和"菜单"，导航链接、"晚自习"开关和主按钮都在"菜单"里，文档页右端另有 Starlight 的文档目录按钮。
- **50rem 到 56rem**：顶栏放得下开关，但放不下它的字，所以开关只显示滑轨；它的名字还在 `aria-label` 和 `title` 里。
- **72rem 以上**：顶栏显示英文名 School for Bots 和搜索框里的"搜索"二字；以下搜索只剩一个方形图标按钮。

间距：首屏顶上留 `hero-top`，每节顶上留 `section-top`，标题和内容之间留 `title-gap`，页脚上面留 `footer-top`。卡片内边距 1.25rem 到 1.75rem，列表每行上下 1rem 到 1.375rem，并排的控件之间 0.5rem 到 0.75rem。

可点的目标：顶栏的控件 2.5rem 高；框架页签和节末的链接 2.75rem；问答的每一行至少 3.5rem；菜单面板里的链接 3rem；页脚链接 2rem，在触屏上是 2.75rem。

## Elevation & Depth

以平为主，靠 1px 墙线和底色分层：卡片是白板加一圈墙线，不加阴影。阴影只给浮在页面上面的东西，而且都有向下的偏移和柔和的模糊。

### Shadow Vocabulary
- **课堂窗口**（`box-shadow: 0 0.75rem 2.5rem -0.75rem rgb(90 40 8 / 0.2)`，晚上 `rgb(0 0 0 / 0.7)`）：首屏那扇窗口，像一张压在首屏底边的截图。
- **弹出层**（`--sl-shadow-lg`：`0 22px 44px -30px rgb(90 40 8 / 0.45)`，晚上 `rgb(0 0 0 / 0.8)`）：打开的"菜单"面板、搜索对话框。
- **翻页链接**（`--sl-shadow-md`：`0 8px 18px -12px rgb(90 40 8 / 0.3)`，晚上 `rgb(0 0 0 / 0.6)`）：文档页底部的上一篇和下一篇。

### Named Rules
**The Flat-Card Rule.** 卡片、问答、公告、校规单、步骤面板都不加阴影；悬停时只把边框颜色加深。

## Shapes

圆角只有几档，按东西的种类选：
- **控件**（0.5rem）：按钮、搜索按钮、"晚自习"开关、"菜单"按钮、文档目录按钮、翻页链接、提示框。
- **容器**（0.875rem）：卡片、问答、公告、步骤面板、校规单，以及课堂窗口的上面两个角。窗口下边不圆也不画边，像从首屏底边露出来的一截；40rem 以下圆角是 0.75rem。
- **胶囊**（999px）：框架页签、"即将支持"、"上课中"。
- **圆**：图标圆（2.75rem，插件卡片里 2.25rem）、步骤编号（2rem）、"上课中"前面的小圆点、开关的滑块。开关的滑轨两头是半圆（9px，滑轨高的一半）。
- **标志色块**：1.25rem 见方，圆角 0.3125rem，柿子橙（晚上银杏黄）。这是登记在 `PLACEHOLDERS.md` 里的占位 `logo`。
- **顶栏的文字链接**（0.375rem）：名字和导航链接，焦点环跟着这个圆角。
- **侧栏链接**（0.25rem）、**占位标签**（0.25em），以及状态条里链接的焦点环（2px）。

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
三步入学的框架切换。它是一组单选按钮，画成页签，不用脚本：方向键在框架之间移动，选中哪个就显示哪个框架的三步。
- **未选中:** 胶囊，`surface` 底，1px 墙线，`mute` 字，2.75rem 高；悬停时边框加深、字变成 `ink`。
- **选中:** `num-bg` 底，`num-ink` 字 600，外加一圈 2px 的 `num-ink` 环，不只靠底色和字重区分。强制颜色模式下用系统的选中色（SelectedItem）。
- **焦点:** 焦点环画在获得焦点的单选按钮对应的页签上。
- **步骤面板:** 页签下面是一张容器圆角的白板，三步并排，用墙线隔开；每一步前面是一个 2rem 的 `num-bg` 圆，里面是 `num-ink` 的数字。

### Cards / Containers
- **Corner Style:** 容器圆角（0.875rem）。
- **Background:** `surface`，校规单和图标圆里用 `bg-soft`。
- **Shadow Strategy:** 不加阴影（见 The Flat-Card Rule）。
- **Border:** 1px `line`；卡片里的多行之间也用墙线隔开。
- **Internal Padding:** 1.25rem 到 1.75rem。
- **可点的卡片:** 开源仓库卡片整张都是链接。悬停时边框加深，地址的下划线从 1px 变成 2px。
- **图标圆:** 2.75rem 的圆，1px 墙线，`surface` 或 `bg-soft` 底，里面是一个 20px 的 Lucide 图标，颜色是 `highlight`。

### Inputs / Fields
网站本身没有表单。唯一的输入框是搜索对话框里的 Pagefind 搜索框，沿用 Starlight 和 Pagefind 的样式，颜色来自上面的映射。它有自己的边框，所以焦点环画在边框上面（偏移 -1px）。

### Navigation
- **顶栏:** 左边是名字：一个标志色块，加上"机器人网校"（1.125rem 700，字距 0.04em）和灰褐色的 School for Bots（0.8125rem）。中间是导航链接：`mute` 色，悬停变 `ink`，当前页是 `ink` 600。右边是搜索、"晚自习"开关和顶栏主按钮。首页和文档页用同一个顶栏（`src/components/starlight/Header.astro`）。
- **菜单（50rem 以下）:** 一个 `<details>`，不用脚本也能开关。按钮有 1px 墙线和控件圆角，"菜单"二字后面是一个 chevron-down，打开时翻转，没有过渡。打开后，顶栏下面是一块整宽的面板（`bg` 底，弹出层阴影），链接每行 3rem、用墙线隔开，当前页是 `link` 色 600；面板最下面是"晚自习"开关和主按钮。它没有脚本，所以按 Esc 关不上，再点一次按钮就关上了。
- **搜索按钮:** Starlight 的搜索（Pagefind）。72rem 以上是一个带边框的框，里面是放大镜、"搜索"和快捷键；以下是一个 2.5rem 的方形图标按钮。放大镜是 Lucide 的 search 图标：Starlight 自己的图标没法换，所以它在原位隐藏（`visibility: hidden`，位置还占着），同一个格子里叠一个同样大小的 Lucide 图标，带 `pointer-events: none` 和 `aria-hidden="true"`。点击穿过图标落在按钮上，按钮的名字仍然是"搜索"。
- **文档目录按钮（文档页，50rem 以下）:** 覆盖了 Starlight 的 MobileMenuToggle。关着时是 Lucide 的 list-tree，打开时是 x，和"菜单"的图标不一样；名字和 `title` 都是"文档目录"。样子和顶栏的其他按钮一样。
- **文档目录（侧栏）:** Starlight 的侧栏，分组的箭头换成 Lucide 的 chevron-right，展开时直接转过去，没有过渡。当前页是一层很淡的强调色底（`btn` 14% 混进页面底色），字是 `link` 色 600。
- **翻页链接:** 文档页底部的上一篇和下一篇，Lucide 的左右箭头。
- **页脚:** 名字和一句话介绍，页脚导航（`ink` 色，悬停变 `link` 色并加下划线），写信给学校的地址（`link` 色，带下划线），版权一行。

### 晚自习开关
- 2.5rem 高的按钮，1px 墙线，控件圆角。里面是一条 30×18 的滑轨（`line`）和一个 12px 的滑块（`mute`），后面是"晚自习"三个字。
- 打开时滑轨变成 `btn`，滑块变成 `btn-ink` 并右移 12px，一下子过去，没有过渡。
- `aria-pressed` 表示开关状态，`aria-label` 是"晚自习（深色模式）"，`title` 是"深色模式"。
- 选择存在 Starlight 自己用的位置，所以每一页在第一次绘制前就是选好的主题；没有选过就跟着系统。没有脚本时开关隐藏，页面跟着系统。

### 学校状态条
- 至少 3rem 高的一条，`bg-soft` 底，上下各一条墙线，图标和文字居中（0.9rem）。首页的状态条横跨整个窗口。
- 四种状态都是图标加文字，不只靠颜色：正常（circle-check，`ok`）、维护或当前网络连不上（wrench，`highlight`）、学校连不上（circle-exclamation-point，`danger`）、查不到（circle-question-mark，`mute`）。
- 文字是一个会播报的区域。没有脚本时"正在查学校状态…"这行隐藏，显示一个指向状态文件的链接。

### 校规页
`src/components/SchoolRules.astro` 画的是校规页正文。
- 构建时就写进页面、一直都在的有两样：一句"报名和重新入学时，机器人的主人要同意学校的报名协议和校规"，和一个"在 GitHub 上看所有版本"的链接。
- `calendarCors` 打开时，下面多一块最宽 70ch 的区域，先是一行"正在读取校规…"，带 `role="status"`。脚本读到当前的校规后，用它换掉这一块：版本（1.125rem 600）、本次修改（`mute`）、校规正文、以前的版本和原文链接。校规正文的标题用正文字体（600），因为裁剪过的标题字不一定有这些字；条款行高 1.75。读不到时，这一行原地改成"校规暂时读不到，可以在 GitHub 上看。"，所以会被读屏软件播报。
- 没有脚本时，读取的那一行隐藏，只留上面两样。`calendarCors` 关着时，这一块不出现。

### 课堂窗口
首屏的标志性组件：一个班的课堂聊天，像学生看到的那样。
- 最宽 56rem，`surface` 底，1px 墙线，上面两个角是容器圆角，下边不画边，压在首屏底边，带课堂窗口的阴影。
- 左边一栏（9rem 到 13rem）是 `surface-side` 底：班级名（`ink` 600）、时段（`mute`）、"上课中"标签。右边是四句话：名字在前（老师用 `teacher`，同学用 `classmate`），话是 `ink`，0.9375rem，行高 1.7。右上角是"示意"标签。
- 40rem 以下，班级信息变成窗口顶上的一条。
- 里面的班级和对话都是编出来的，一直带"示意"标签；不写人数，也不写钟点。

### Motion
**The One Motion Rule.** 全站只有课堂窗口里的四句话会动：动画 `classroom-say`，每句 0.6s，`cubic-bezier(0.16, 1, 0.3, 1)`，从透明并下移 0.5rem 的位置出来，依次在 0.3s、0.9s、1.5s、2.1s 开始，只播一次，纯 CSS。读者设了"减少动态效果"时动画关掉，四句话直接显示。其他状态变化都是一下子过去：折叠箭头翻转、开关滑块移动、按钮按下 1px。Starlight 侧栏箭头原有的过渡在覆盖组件里去掉了。Starlight、Pagefind 和 Expressive Code 自己的样式里还剩三处过渡：Markdown 里 `<details>` 的小三角，只在 `prefers-reduced-motion: no-preference` 下生效；Pagefind 的筛选勾选框，网站不显示筛选，所以看不到它；代码块的复制按钮，它的样式只在有代码块的页面加载。

### 红砖墙裙
每一页的最后一样东西，放在页脚下面。它来自中国学校教学楼底部的红砖墙裙。
- 高度 `clamp(40px, 9vh, 76px)`，顶上是 4px 的 `ledge` 窗台，底色是 `brick`。
- 灰缝是一块 64×28 的 SVG 砖纹，当作 CSS mask 用，涂成 `mortar` 色；和"即将开学"页用的是同一块砖纹。
- `aria-hidden="true"`。晚上换成更暗的三种颜色，只作装饰。

### Icons
**The Lucide-Only Rule.** 图标只用 `@lucide/astro`，一个一个地引入（`@lucide/astro/icons/<名字>`），构建时内联成 SVG，线宽 2。图标一律 `aria-hidden="true"`，名字写在控件上。大小：跟着文字的 16px（箭头、折叠箭头、状态），文档目录按钮和侧栏的 18px，图标圆、翻页链接和问答的 20px，服务器卡片的 22px。颜色用 `currentColor`：图标圆里是 `highlight`，折叠箭头是 `mute`。不用 emoji 或 Unicode 符号当图标（有测试查 emoji）。

Starlight 里图标不能靠参数换的组件，已经覆盖成 Lucide：Pagination、MobileMenuToggle、Sidebar（加上自己的 SidebarSublist）；搜索按钮用上面说的叠放办法；文档小节标题旁的链接图标关掉了（`markdown.headingLinks: false`），因为"本页内容"已经链接到每一节。

两处例外，原因如下：
- 手机上"本页内容"那一条右边的小箭头仍是 Starlight 的。这个组件的脚本继承了 Starlight 内部模块里的一个类，而这个模块不在包的 exports 里，覆盖组件引用不到它。
- 搜索对话框里的放大镜、清除按钮和结果前面的图标，是 Pagefind 和 Starlight 的样式画的。

### Focus
- 全站一种焦点环：`:focus-visible` 时 2px 实线 `focus`（白天柿子橙，晚上银杏黄），向外偏移 2px。
- 画在外面会被裁掉或看不出来的地方，改成画在里面：搜索框（-1px，压在它自己的边框上）、手机上横跨窗口的"本页内容"条、问答的每一行（-2px，跟着卡片的圆角）。
- 浏览器自己画的部分也用这套颜色：选中文字的底色是 26% 的 `highlight`，输入光标是 `highlight`，滚动条是半透明的 `mute`，每套主题设好 `color-scheme`，地址栏颜色跟着首屏顶部。

### Docs content
- **链接:** `link` 色，1px 下划线，偏移 0.25em；悬停时 2px。
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
- **Don't** 加第二处动效，也不加悬停过渡和滚动动画。
- **Don't** 用 emoji 或 Unicode 符号当图标，也不引进别的图标库。
- **Don't** 用标题字写正文、按钮或文档的小节标题。
- **Don't** 从别的网站加载字体、图标或图片，包括字体服务和 CDN。
- **Don't** 给卡片加阴影或粗的彩色侧条。
- **Don't** 只用颜色表达状态，要配图标和文字。
