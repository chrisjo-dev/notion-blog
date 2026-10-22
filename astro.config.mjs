import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { remarkBookmark } from './src/plugins/remark-bookmark.js';
import { NOINDEX_POST_SLUGS } from './src/config/noindex-slugs.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.wspace.ai.kr',
  integrations: [sitemap({
    filter: (page) => {
      // Decode percent-encoded characters (Korean slugs are encoded in sitemap URLs)
      const pathname = decodeURIComponent(new URL(page).pathname);
      // Exclude all /en/ pages (all noindex)
      if (pathname.startsWith('/en/')) return false;
      // Exclude noindex post slugs
      return !NOINDEX_POST_SLUGS.some(slug => pathname.includes(`/posts/${slug}/`));
    },
  })],
  markdown: {
    remarkPlugins: [remarkBookmark],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});
