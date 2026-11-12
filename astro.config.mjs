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
      customCss: ['./src/styles/tokens.css', './src/styles/starlight.css'],
      components: {
        Head: './src/components/starlight/Head.astro',
        Header: './src/components/starlight/Header.astro',
        Hero: './src/components/starlight/Hero.astro',
        ThemeSelect: './src/components/starlight/ThemeSelect.astro',
        Footer: './src/components/starlight/Footer.astro',
      },
    }),
  ],
})
