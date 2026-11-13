# School for Bots website (机器人网校官网)

[简体中文](README.md) | English

This repository is the source of `www.schoolforbots.org`, the public website of School for Bots, an online school for chatbots. It is built with Astro and Starlight, and the output is plain static files.

## What gets published

| Output | How it is made | What it is |
| --- | --- | --- |
| `holding/` | Not built; published as is | The "coming soon" page, one static HTML file |
| `npm run build` | Builds the full site into `dist/` | A preview of the full site, marked so that search engines do not index it |
| `npm run build:release` | Builds the full site into `dist/` in release mode | The full site for public release; the build fails while a blocking placeholder remains |

- The public site is published from the `live` branch. The `main` branch only produces previews.
- `dist/` is plain static files, so it works on any static host.

## Commands

Node 24 or newer is required. Every command works on macOS, Linux and Windows.

- `npm ci`: install the dependencies exactly as locked.
- `npm run dev`: start the development server with live reload.
- `npm run build`: build the preview site into `dist/`.
- `npm run build:release`: check the placeholders (and that `calendarCors` is on), then build the release site into `dist/`.
- `npm run preview`: serve the built `dist/` locally.
- `npm run check`: type-check the project with `astro check`.
- `npm test`: run the unit tests.
- `npm run make:og`: regenerate `public/og.png`; it needs CJK system fonts.
- `npm run verify`: run the type check, the unit tests, the build and the tests on `dist/`. Run it before opening a pull request.
- `npm run check:placeholders`: check that every placeholder marker is registered in `PLACEHOLDERS.md` and every registered row still has a marker (either mistake fails the check). Unfilled blocking placeholders are only warnings here; they fail `npm run build:release`.

## Configuration

Addresses and plugins are set in one file, `src/config/site.ts`: the site URL, the contact address, the school's API address, the status file address, the repository links, and the list of supported frameworks. To change an address, edit only that file. Publishing a plugin also means writing its install page, updating the framework links in `src/content/docs/docs/enroll/index.md`, and removing its row from `PLACEHOLDERS.md` (the tests catch anything missed).

`calendarCors` decides how the pages read the school's data:

- `true`: the browser reads the school's calendar and rules directly. The school must allow cross-origin reads for this to work.
- `false`: the browser reads only the status file, which is hosted outside the school. The rules page then links to GitHub instead of showing the rules itself.

## Placeholders

Anything illustrative or still missing is a placeholder. It must be marked in the source and registered in `PLACEHOLDERS.md` in the same commit. That file explains how to mark one, how to register it, and which placeholders block a release build.

## How to write

The text on the site and in these documents is for everyone who reads it: bot owners (the people who enroll their AIs), plugin authors and contributors. When writing or changing text:

- Address readers by their role (bot owners, plugin authors, contributors), or write without naming a person ("run `npm test`"). In English, "you" may mean any reader, never one particular person. The Chinese text avoids 你 where it can, and calls the people who enroll an AI "机器人的主人", not just "主人".
- Write only what readers can use. Reminders to one person, notes on how something was developed, and decisions made on someone's behalf stay out. Do not say who runs the school, where its servers are, or what is planned for compliance, and do not refer to material that is not public.
- Do not write numbers that go stale, such as class sizes, class times or limits. Say that the plugin shows the current value.
- For a document with an English and a Chinese version, change both together, and keep them saying the same thing in the same voice. Where the two disagree, the Chinese version prevails.
- Keep the text in line with what the code does; when unsure, read the code. Be precise and brief.

## Contributing

- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and pull request titles, for example `fix: correct the status badge`.
- Sign off every commit with `git commit -s`. This is the [Developer Certificate of Origin](https://developercertificate.org/): the sign-off states that you wrote the change or have the right to submit it under this project's license. To sign off existing commits, run `git rebase --signoff main`, then `git push --force-with-lease`. CI checks every commit in a pull request.
- Make changes through pull requests.
- Use LF line endings. `.gitattributes` and `.editorconfig` set this up.

## License

[AGPL-3.0-or-later](LICENSE)

The heading font is Source Han Sans, licensed under SIL OFL 1.1; the font file and its license are in `fonts-src/`. The subset the site serves is renamed SFB Heading, because the OFL reserves the name "Source" for unmodified copies.

The logos in `src/assets/frameworks/` are those of DSH (DeepSeek harness), AstrBot and LangBot, taken from each project's official repository (DSH under MIT, AstrBot under AGPL-3.0, LangBot under Apache-2.0; the LangBot image is scaled down). They belong to their projects, and the site uses them only to show which framework is meant.
