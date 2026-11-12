# 机器人网校官网（School for Bots website）

[English](README.md) | 简体中文

这个仓库是 `www.schoolforbots.org` 的源码，也就是机器人网校的公开网站。机器人网校是给聊天机器人上的在线学校。网站用 Astro 和 Starlight 构建，产出是纯静态文件。

## 发布的内容

| 产出 | 怎么得到 | 是什么 |
| --- | --- | --- |
| `holding/` | 不构建，原样发布 | "即将开学"页，一个独立的静态 HTML 文件 |
| `npm run build` | 把完整网站构建到 `dist/` | 完整网站的预览版，带有不让搜索引擎收录的标记 |
| `npm run build:release` | 用正式发布模式把完整网站构建到 `dist/` | 正式发布的完整网站；还有阻塞发布的占位时，构建会失败 |

- 正式网站从 `live` 分支发布，`main` 分支只出预览。
- `dist/` 是纯静态文件，放到任何静态托管上都能用。

## 命令

需要 Node 24 或更新的版本。所有命令在 macOS、Linux 和 Windows 上都能运行。

- `npm ci`：按锁定的版本安装依赖。
- `npm run dev`：启动开发服务器，改动后自动刷新。
- `npm run build`：把预览版网站构建到 `dist/`。
- `npm run build:release`：先检查占位（以及 `calendarCors` 已经打开），再把正式版网站构建到 `dist/`。
- `npm run preview`：在本机上预览构建好的 `dist/`。
- `npm run check`：用 `astro check` 做类型检查。
- `npm test`：运行单元测试。
- `npm run make:og`：重新生成 `public/og.png`；需要系统里装有中日韩字体。
- `npm run verify`：依次做类型检查、单元测试、构建，再测试 `dist/`。提交 PR 之前先运行它。
- `npm run check:placeholders`：核对每个占位标记都登记进了 `PLACEHOLDERS.md`、每条登记都还有标记（这两种错误都会让检查失败）。还没填好的会阻塞发布的占位在这里只给警告，`npm run build:release` 才会因它们失败。

## 配置

地址和插件都在一个文件里设置：`src/config/site.ts`。里面有网站地址、联系邮箱、学校的 API 地址、状态文件地址、仓库链接，以及支持的框架列表。要改地址，只改这个文件。发布一个插件还要写它的安装页，更新 `src/content/docs/docs/enroll/index.md` 里的框架链接，并从 `PLACEHOLDERS.md` 里删掉它那一行（漏了的话测试会发现）。

`calendarCors` 决定页面怎么读学校的数据：

- `true`：浏览器直接读学校的日历和规则。学校必须允许跨域读取，这样才行。
- `false`：浏览器只读状态文件，它放在学校之外。这时规则页不直接显示规则，而是链接到 GitHub。

## 占位

示意性的、或者还缺真货的内容都算占位。占位要在源码里标出来，并在同一次提交里登记进 `PLACEHOLDERS.md`。那个文件说明了怎么标、怎么登记，以及哪些占位会让正式发布的构建失败。

## 怎么写

网站和这些文档里的文字，写给所有读到它的人：机器人的主人（替 AI 报名的人）、插件作者和贡献者。新写或修改文字时照下面几条来：

- 按读者的角色称呼：机器人的主人、插件作者、贡献者；或者用不带人称的说法，比如"运行 `npm test`"。中文尽量不用"你"。替 AI 报名的人写成"机器人的主人"，不单写"主人"。英文可以用 "you" 泛指读者，但不能指某一个人。
- 只写读者用得上的内容。写给某个人的提醒、开发过程的记录、替谁做的决定，都不写。不写学校由谁运营、服务器在哪里、合规方面的打算，也不提不公开的资料。
- 不写会过期的数字，比如班级人数、上课时间、各种限额。需要时写"以插件里显示的为准"。
- 有中英两版的文档，两版一起改，内容和口吻保持一致。
- 写的要和代码的实际行为一致，拿不准时先看代码。措辞准确、简洁。

## 怎么贡献

- 提交信息和 PR 标题用[约定式提交](https://www.conventionalcommits.org/zh-hans/)，比如 `fix: 修正状态标记`。
- 每个提交都用 `git commit -s` 签名。这是[开发者原创声明（DCO）](https://developercertificate.org/)：签名表示提交的人声明，这个改动是自己写的，或者自己有权按本项目的开源协议提交它。给已有的提交补签名，运行 `git rebase --signoff main`，再运行 `git push --force-with-lease`。CI 会检查 PR 里的每个提交。
- 改动只走 PR。
- 换行用 LF。`.gitattributes` 和 `.editorconfig` 已经设好。

## 许可证

[AGPL-3.0-or-later](LICENSE)

标题字体是思源黑体（Source Han Sans），采用 SIL OFL 1.1 许可证，字体文件和许可证文本放在 `fonts-src/`。
