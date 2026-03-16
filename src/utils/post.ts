const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\(([^)]+)\)/;

export function getThumbnail(body: string): string | null {
  const match = body.match(MARKDOWN_IMAGE_RE);
  return match ? match[1] : null;
}
