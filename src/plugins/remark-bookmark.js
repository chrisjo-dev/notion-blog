import { visit } from 'unist-util-visit';

/**
 * Remark plugin to transform [bookmark](url) links into bookmark cards
 */
export function remarkBookmark() {
  return (tree) => {
    let bookmarkCount = 0;
    visit(tree, 'paragraph', (node, index, parent) => {
      // Check if paragraph contains only a link with text "bookmark"
      if (
        node.children.length === 1 &&
        node.children[0].type === 'link' &&
        node.children[0].children.length === 1 &&
        node.children[0].children[0].type === 'text' &&
        node.children[0].children[0].value === 'bookmark'
      ) {
        const url = node.children[0].url;
        bookmarkCount++;
        console.log(`[remarkBookmark] Found bookmark #${bookmarkCount}: ${url}`);

        // Extract domain
        let domain = url;
        try {
          const urlObj = new URL(url);
          domain = urlObj.hostname.replace('www.', '');
        } catch (e) {
          // Invalid URL, keep as is
        }

        const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

        // Replace the paragraph with bookmark card HTML
        parent.children[index] = {
          type: 'html',
          value: `<a href="${url}" target="_blank" rel="noopener noreferrer" class="bookmark-card" data-url="${url}"><div class="bookmark-content"><div class="bookmark-text"><div class="bookmark-title">${url}</div><div class="bookmark-description loading">Loading...</div><div class="bookmark-link"><img src="${favicon}" alt="" class="bookmark-favicon"><span class="bookmark-domain">${domain}</span></div></div><div class="bookmark-image" style="display: none;"><img src="" alt=""></div></div></a>`,
        };
      }
    });
  };
}
