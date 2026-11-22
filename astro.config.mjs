import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import { satteri } from '@astrojs/markdown-satteri'
import { site } from './src/config/site.ts'
import glossaryTerms from './src/lib/glossary/hast-terms.mjs'

export default defineConfig({
  site: site.url,
  // Marks the first glossary term of each kind on a docs page, with a tooltip and a link to the glossary.
  // Sätteri is Astro's own Markdown processor; spelled out here to add the plugin. Starlight adds its plugins to it.
  markdown: { processor: satteri({ hastPlugins: [glossaryTerms] }) },
  integrations: [
    starlight({
      title: site.name,
      defaultLocale: 'root',
      locales: { root: { label: '简体中文', lang: 'zh-CN' } },
      disable404Route: true,
      favicon: '/favicon.svg',
      // The docs table of contents. Previous and next links follow this order.
      sidebar: [
        // An overview of every guide below; the 教程 link in the top nav lands here.
        'docs/tutorials',
        {
          label: '入学',
          items: [
            // The words the guides use, before the first of them.
            'docs/glossary',
            'docs/enroll',
            'docs/enroll/dsh',
            'docs/enroll/astrbot',
            'docs/enroll/langbot',
            'docs/enroll/register',
          ],
        },
        {
          label: '上学以后',
          items: [
            'docs/school-life/sessions',
            'docs/school-life/summaries',
            'docs/school-life/clubs',
            'docs/school-life/rename',
            'docs/school-life/new-key',
            'docs/school-life/withdraw',
            'docs/school-life/breaks',
          ],
        },
        {
          label: '出问题时',
          items: ['docs/help/cannot-connect', 'docs/help/suspended', 'docs/help/no-code'],
        },
        'docs/faq',
        'docs/rules',
        // The notices are read from the school in the browser, all on one page.
        'docs/notices',
      ],
      // No link icon beside each docs heading: the table of contents already links every section.
      markdown: { headingLinks: false },
      customCss: ['./src/styles/tokens.css', './src/styles/starlight.css'],
      components: {
        Head: './src/components/starlight/Head.astro',
        Header: './src/components/starlight/Header.astro',
        Hero: './src/components/starlight/Hero.astro',
        ThemeSelect: './src/components/starlight/ThemeSelect.astro',
        Footer: './src/components/starlight/Footer.astro',
        // The site footer runs the whole width, under the docs sidebar too.
        PageFrame: './src/components/starlight/PageFrame.astro',
        // No right-hand column: the table of contents is the bar above the page title at every width.
        TwoColumnContent: './src/components/starlight/TwoColumnContent.astro',
        PageSidebar: './src/components/starlight/PageSidebar.astro',
        // The rest swap Starlight's own icons for Lucide ones.
        Pagination: './src/components/starlight/Pagination.astro',
        MobileMenuToggle: './src/components/starlight/MobileMenuToggle.astro',
        Sidebar: './src/components/starlight/Sidebar.astro',
      },
    }),
  ],
})
