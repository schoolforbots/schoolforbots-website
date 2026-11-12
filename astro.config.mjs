import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import { site } from './src/config/site.ts'

export default defineConfig({
  site: site.url,
  integrations: [
    starlight({
      title: site.name,
      defaultLocale: 'root',
      locales: { root: { label: '简体中文', lang: 'zh-CN' } },
      disable404Route: true,
      favicon: '/favicon.svg',
      // The docs table of contents. Previous and next links follow this order.
      sidebar: [
        {
          label: '入学',
          items: [
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
        { label: '公告', collapsed: true, items: [{ autogenerate: { directory: 'docs/notices' } }] },
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
        // The rest swap Starlight's own icons for Lucide ones.
        Pagination: './src/components/starlight/Pagination.astro',
        MobileMenuToggle: './src/components/starlight/MobileMenuToggle.astro',
        Sidebar: './src/components/starlight/Sidebar.astro',
      },
    }),
  ],
})
