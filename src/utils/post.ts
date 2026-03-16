const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\(([^)]+)\)/;

export function getThumbnail(body: string | undefined): string | null {
  if (!body) return null;
  const match = body.match(MARKDOWN_IMAGE_RE);
  return match ? match[1] : null;
}

export function getCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/\//g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-가-힣]/g, '');
}
