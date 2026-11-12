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
      components: { Head: './src/components/starlight/Head.astro' },
    }),
  ],
})
