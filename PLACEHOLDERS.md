# 占位清单

网站里凡是示意性的、或者还缺真货的东西，都算占位，比如还没画的校徽、示意用的对话、还没发布的插件安装步骤。占位必须标出来，也必须在本文件登记，这样谁都能看出哪些内容还不是真的。

## 怎么标

扫描只认两种标记，`id` 只能用小写字母、数字和连字符：

- 在 `.astro` 或 `.mdx` 里用组件 `Placeholder`，写成 `id="logo" kind="待补"` 这样的属性，`kind` 取 `待补` 或 `示意`。它可以包住内容，页面上会在后面显示一个小标签。
- 在任何注释里写 `@placeholder(` 加 id 加 `)`，比如 `@placeholder(logo)`。TypeScript、CSS、Astro 的 frontmatter、Markdown 的 HTML 注释、SVG 注释都行。没有文字位置的东西（配置值、图片）用这一种。

扫描范围是 `src/`、`public/`、`holding/` 下的 `.astro .md .mdx .ts .mjs .css .svg .json` 文件，以及根目录的 `astro*.mjs`。

## 怎么登记

在下面的表里加一行，和标记放在同一次提交里：

- `id`：和标记里的一致。
- `是什么`：这个占位代表什么。
- `在哪`：它出现在哪个页面或文件。
- `正式发布`：只能填 `拦` 或 `允许`。

`npm run check:placeholders` 会核对标记和登记：标记没登记、登记的 id 已经没有标记，都算错误。

## 拦和允许

- `拦`：占位没填好之前，`npm run build:release` 会失败。日常的 `npm run check:placeholders` 只给警告。
- `允许`：占位可以带着上线，正式发布也照常通过。

`npm run build:release` 还要求至少有一个框架的插件已经发布，否则同样失败。

## 填好以后

占位被真货替换后，把标记和表里这一行一起删掉。只删标记不删这一行，登记就过期了，检查会报错。

| id | 是什么 | 在哪 | 正式发布 |
| --- | --- | --- | --- |
| logo | 文字标、网站图标和分享图，换成图形标志时一起换 | `src/components/Wordmark.astro`（页头和页脚）、`public/favicon.svg`、`public/og.png`（由 `scripts/make-og.mjs` 生成，`src/components/starlight/Head.astro` 引用） | 拦 |
