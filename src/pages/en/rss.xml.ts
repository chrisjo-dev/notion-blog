import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts-en');
  const blogPosts = posts
    .filter(post => post.data.category != null)
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  return rss({
    title: 'Chris Blog (English)',
    description: 'Tech blog powered by Notion & Astro — English edition',
    site: String(context.site),
    items: blogPosts.map(post => ({
      title: post.data.title,
      description: post.data.description || '',
      pubDate: new Date(post.data.date),
      // NOTE: '/notion-blog' must match astro.config.mjs base
      link: `/notion-blog/en/posts/${post.slug}/`,
    })),
  });
}
