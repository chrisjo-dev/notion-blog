const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\(([^)]+)\)/;

export function getThumbnail(body: string | undefined): string | null {
  if (!body) return null;
  const match = body.match(MARKDOWN_IMAGE_RE);
  return match ? match[1] : null;
}

export function isBlogPost(post: { data: { category?: string | null } }): boolean {
  return post.data.category != null;
}

export function formatDate(date: string, lang: 'ko' | 'en' = 'ko'): string {
  const d = new Date(date);
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR', {
    year: 'numeric',
    month: lang === 'en' ? 'short' : 'long',
    day: 'numeric',
  });
}

export function sanitizeEnglishSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

export function getCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/\//g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-가-힣]/g, '');
}
