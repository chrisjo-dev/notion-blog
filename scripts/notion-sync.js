import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
try {
  const envContent = await fs.readFile(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join('=').trim();
      }
    }
  });
} catch (error) {
  // .env file not found or error reading it, will use existing env vars
}

// Environment variables
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_ROOT_PAGE_ID = process.env.NOTION_ROOT_PAGE_ID;

if (!NOTION_TOKEN || !NOTION_ROOT_PAGE_ID) {
  console.error('Error: NOTION_TOKEN and NOTION_ROOT_PAGE_ID must be set in environment variables');
  process.exit(1);
}

// Initialize Notion client
const notion = new Client({ auth: NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

// Paths
const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'posts');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'notion');
const CACHE_FILE = path.join(__dirname, '..', '.notion-sync-cache.json');

// Cache: { [notionId]: { lastEdited, slug, fileName } }
async function loadCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveCache(cache) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

// Slug generation with collision handling
const slugCache = new Map();

function sanitizeSlug(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-가-힣]/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function generateUniqueSlug(title) {
  const baseSlug = sanitizeSlug(title);

  if (!slugCache.has(baseSlug)) {
    slugCache.set(baseSlug, 1);
    return baseSlug;
  }

  const count = slugCache.get(baseSlug);
  slugCache.set(baseSlug, count + 1);
  return `${baseSlug}-${count}`;
}

// Download image and return local path (skip if already exists)
async function downloadImage(url, pageId, imageName) {
  const ext = path.extname(new URL(url).pathname) || '.png';
  const fileName = `${imageName}${ext}`;
  const pageDir = path.join(IMAGES_DIR, pageId);
  const filePath = path.join(pageDir, fileName);
  const localPath = `/notion-blog/images/notion/${pageId}/${fileName}`;

  // Skip if image already exists
  try {
    await fs.access(filePath);
    return localPath;
  } catch {
    // File doesn't exist, proceed with download
  }

  await fs.mkdir(pageDir, { recursive: true });

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadImage(response.headers.location, pageId, imageName)
          .then(resolve)
          .catch(reject);
        return;
      }

      const fileStream = fsSync.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(localPath);
      });

      fileStream.on('error', (err) => {
        fs.unlink(filePath).catch(() => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

// Process markdown content and download images
async function processMarkdownContent(mdString, pageId) {
  let imageCounter = 0;

  // Handle both string and object (with .parent property)
  let markdown = '';
  if (typeof mdString === 'string') {
    markdown = mdString;
  } else if (mdString && typeof mdString === 'object') {
    markdown = mdString.parent || '';
  }

  // Find all image URLs in markdown
  const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g;
  let match;
  const replacements = [];

  while ((match = imageRegex.exec(markdown)) !== null) {
    const [fullMatch, altText, imageUrl] = match;
    imageCounter++;

    try {
      const localPath = await downloadImage(imageUrl, pageId, `image-${imageCounter}`);
      replacements.push({ original: fullMatch, replacement: `![${altText}](${localPath})` });
    } catch (error) {
      console.warn(`Warning: Failed to download image ${imageUrl}:`, error.message);
    }
  }

  // Apply all replacements
  for (const { original, replacement } of replacements) {
    markdown = markdown.replace(original, replacement);
  }

  return markdown;
}

// Extract description from markdown content
function extractDescription(markdown, maxLength = 150) {
  const plainText = markdown
    .replace(/#{1,6}\s+/g, '')
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/[*_~]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength).trim() + '...';
}

// Get page title
function getPageTitle(page) {
  const titleProperty = page.properties.title || page.properties.Title || page.properties.Name;

  if (!titleProperty) {
    return 'Untitled';
  }

  if (titleProperty.type === 'title' && titleProperty.title.length > 0) {
    return titleProperty.title[0].plain_text;
  }

  return 'Untitled';
}

// Fetch all child pages recursively from a parent page
async function fetchChildPages(blockId, parentInfo = null, level = 0) {
  try {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
    });

    const allPages = [];

    for (const block of response.results) {
      if (block.type === 'child_page') {
        const page = await notion.pages.retrieve({ page_id: block.id });
        const pageTitle = getPageTitle(page);

        const hierarchy = parentInfo ? [...parentInfo.hierarchy, pageTitle] : [pageTitle];
        const tags = parentInfo ? [...parentInfo.tags] : [];

        const pageInfo = {
          page,
          parent: parentInfo ? parentInfo.id : null,
          parentTitle: parentInfo ? parentInfo.title : null,
          hierarchy,
          tags,
          level,
          id: page.id,
          title: pageTitle,
        };

        allPages.push(pageInfo);

        const childPages = await fetchChildPages(page.id, pageInfo, level + 1);
        allPages.push(...childPages);
      }
    }

    return allPages;
  } catch (error) {
    console.error('Error fetching child pages from Notion:', error.message);
    throw error;
  }
}

// Fetch all pages from the root page
async function fetchPages() {
  try {
    console.log('Fetching pages recursively from root page...');
    const pagesInfo = await fetchChildPages(NOTION_ROOT_PAGE_ID);

    console.log('\nPage hierarchy:');
    pagesInfo.forEach(info => {
      const indent = '  '.repeat(info.level);
      const category = info.parentTitle ? ` [${info.parentTitle}]` : '';
      console.log(`${indent}- ${info.title}${category} (level ${info.level})`);
    });

    return pagesInfo;
  } catch (error) {
    console.error('Error fetching pages from Notion:', error.message);
    throw error;
  }
}

// Convert Notion page to markdown file
async function convertPageToMarkdown(pageInfo) {
  const { page, parent, parentTitle, hierarchy, tags, level } = pageInfo;
  const pageId = page.id.replace(/-/g, '');
  const title = getPageTitle(page);
  const createdTime = page.created_time;
  const slug = generateUniqueSlug(title);

  const categoryInfo = parentTitle ? ` [${parentTitle}]` : '';
  console.log(`Processing: ${title}${categoryInfo}`);

  try {
    const mdBlocks = await n2m.pageToMarkdown(page.id);

    const filteredBlocks = mdBlocks.filter(block => {
      return block.type !== 'child_page';
    });

    const mdString = n2m.toMarkdownString(filteredBlocks);

    let content = await processMarkdownContent(mdString, pageId);

    const description = extractDescription(content);

    const allTags = hierarchy.length > 1 ? hierarchy.slice(0, -1) : [];

    const frontmatterData = {
      title: title.replace(/"/g, '\\"'),
      description: description.replace(/"/g, '\\"'),
      date: createdTime,
      notionId: pageId,
    };

    if (parentTitle) {
      frontmatterData.category = parentTitle.replace(/"/g, '\\"');
    }

    if (allTags.length > 0) {
      frontmatterData.tags = allTags;
    }

    if (hierarchy.length > 0) {
      frontmatterData.hierarchy = hierarchy;
    }

    if (parent) {
      frontmatterData.parent = parent.replace(/-/g, '');
    }

    frontmatterData.level = level;

    let frontmatter = '---\n';
    frontmatter += `title: "${frontmatterData.title}"\n`;
    frontmatter += `description: "${frontmatterData.description}"\n`;
    frontmatter += `date: "${frontmatterData.date}"\n`;
    frontmatter += `notionId: "${frontmatterData.notionId}"\n`;

    if (frontmatterData.category) {
      frontmatter += `category: "${frontmatterData.category}"\n`;
    }

    if (frontmatterData.tags && frontmatterData.tags.length > 0) {
      frontmatter += `tags:\n`;
      frontmatterData.tags.forEach(tag => {
        frontmatter += `  - "${tag.replace(/"/g, '\\"')}"\n`;
      });
    }

    if (frontmatterData.hierarchy && frontmatterData.hierarchy.length > 0) {
      frontmatter += `hierarchy:\n`;
      frontmatterData.hierarchy.forEach(item => {
        frontmatter += `  - "${item.replace(/"/g, '\\"')}"\n`;
      });
    }

    if (frontmatterData.parent) {
      frontmatter += `parent: "${frontmatterData.parent}"\n`;
    }

    frontmatter += `level: ${frontmatterData.level}\n`;
    frontmatter += `---\n\n`;

    const fullContent = frontmatter + content;

    const fileName = `${slug}.md`;
    const filePath = path.join(CONTENT_DIR, fileName);
    await fs.writeFile(filePath, fullContent, 'utf-8');

    console.log(`  ✓ Saved: ${fileName}`);

    return { slug, fileName, notionId: pageId };
  } catch (error) {
    console.error(`  ✗ Failed to process "${title}":`, error.message);
    return null;
  }
}

// Main sync function
async function syncNotion() {
  console.log('Starting Notion sync...\n');

  try {
    await fs.mkdir(CONTENT_DIR, { recursive: true });
    await fs.mkdir(IMAGES_DIR, { recursive: true });

    // Load cache
    const cache = await loadCache();
    console.log(`Cache loaded: ${Object.keys(cache).length} entries\n`);

    // Fetch all page metadata
    const pagesInfo = await fetchPages();
    console.log(`\nFound ${pagesInfo.length} total pages\n`);

    // Determine which pages need processing
    const currentNotionIds = new Set();
    const toProcess = [];
    const toSkip = [];

    for (const pageInfo of pagesInfo) {
      const notionId = pageInfo.page.id.replace(/-/g, '');
      const lastEdited = pageInfo.page.last_edited_time;
      currentNotionIds.add(notionId);

      const cached = cache[notionId];
      if (cached && cached.lastEdited === lastEdited) {
        // Page unchanged — register slug to avoid collisions
        generateUniqueSlug(pageInfo.title);
        toSkip.push(pageInfo);
      } else {
        toProcess.push(pageInfo);
      }
    }

    console.log(`Changed: ${toProcess.length}, Unchanged: ${toSkip.length}\n`);

    // Delete files for pages removed from Notion
    const removedIds = Object.keys(cache).filter(id => !currentNotionIds.has(id));
    for (const id of removedIds) {
      const cached = cache[id];
      if (cached?.fileName) {
        const filePath = path.join(CONTENT_DIR, cached.fileName);
        try {
          await fs.unlink(filePath);
          console.log(`  ✗ Removed: ${cached.fileName} (deleted from Notion)`);
        } catch {
          // File already gone
        }
      }
      // Clean up image directory
      const imgDir = path.join(IMAGES_DIR, id);
      try {
        await fs.rm(imgDir, { recursive: true });
      } catch {
        // Directory already gone
      }
      delete cache[id];
    }

    // Process only changed pages
    const results = [];
    for (const pageInfo of toProcess) {
      const result = await convertPageToMarkdown(pageInfo);
      if (result) {
        results.push(result);
        // Update cache
        const notionId = pageInfo.page.id.replace(/-/g, '');
        cache[notionId] = {
          lastEdited: pageInfo.page.last_edited_time,
          slug: result.slug,
          fileName: result.fileName,
        };
      }
    }

    // Save updated cache
    await saveCache(cache);

    console.log(`\n✓ Processed ${results.length} changed pages, skipped ${toSkip.length} unchanged`);
    if (removedIds.length > 0) {
      console.log(`✓ Removed ${removedIds.length} deleted pages`);
    }
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}

// Run sync
syncNotion()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
