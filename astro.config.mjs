import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { remarkBookmark } from './src/plugins/remark-bookmark.js';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://yourusername.github.io',
  base: '/blog',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkBookmark],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});
