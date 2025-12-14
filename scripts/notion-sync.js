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

// Download image and return local path
async function downloadImage(url, pageId, imageName) {
  const ext = path.extname(new URL(url).pathname) || '.png';
  const fileName = `${imageName}${ext}`;
  const pageDir = path.join(IMAGES_DIR, pageId);
  const filePath = path.join(pageDir, fileName);

  await fs.mkdir(pageDir, { recursive: true });

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        downloadImage(response.headers.location, pageId, imageName)
          .then(resolve)
          .catch(reject);
        return;
      }

      const fileStream = fsSync.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        // Return path relative to public directory
        resolve(`/notion-blog/images/notion/${pageId}/${fileName}`);
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
  // Remove markdown syntax
  const plainText = markdown
    .replace(/#{1,6}\s+/g, '') // Headers
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '') // Images
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // Code
    .replace(/[*_~]/g, '') // Bold, italic, strikethrough
    .replace(/\n+/g, ' ') // Newlines
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
        // Fetch the full page object to get properties
        const page = await notion.pages.retrieve({ page_id: block.id });
        const pageTitle = getPageTitle(page);

        // Build hierarchy information
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

        // Add this page to results
        allPages.push(pageInfo);

        // Recursively fetch children of this page
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

    // Log hierarchy information
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
  const lastEditedTime = page.last_edited_time;
  const slug = generateUniqueSlug(title);

  const categoryInfo = parentTitle ? ` [${parentTitle}]` : '';
  console.log(`Processing: ${title}${categoryInfo}`);

  try {
    // Get markdown blocks
    const mdBlocks = await n2m.pageToMarkdown(page.id);

    // Convert blocks to markdown string
    const mdString = n2m.toMarkdownString(mdBlocks);

    // Process content and download images
    let content = await processMarkdownContent(mdString, pageId);

    // Extract description
    const description = extractDescription(content);

    // Build tags array (all parent categories)
    const allTags = hierarchy.length > 1 ? hierarchy.slice(0, -1) : [];

    // Create frontmatter with hierarchy metadata
    const frontmatterData = {
      title: title.replace(/"/g, '\\"'),
      description: description.replace(/"/g, '\\"'),
      date: lastEditedTime,
      notionId: pageId,
    };

    // Add hierarchy metadata
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

    // Build frontmatter string
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

    // Combine frontmatter and content
    const fullContent = frontmatter + content;

    // Write to file
    const fileName = `${slug}.md`;
    const filePath = path.join(CONTENT_DIR, fileName);
    await fs.writeFile(filePath, fullContent, 'utf-8');

    console.log(`  ✓ Saved: ${fileName}`);

    return { slug, fileName };
  } catch (error) {
    console.error(`  ✗ Failed to process "${title}":`, error.message);
    return null;
  }
}

// Check if there are any changes
async function hasChanges() {
  try {
    const { execSync } = await import('child_process');
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    return status.trim().length > 0;
  } catch (error) {
    // If git command fails, assume there are changes
    return true;
  }
}

// Main sync function
async function syncNotion() {
  console.log('Starting Notion sync...\n');

  try {
    // Create directories
    await fs.mkdir(CONTENT_DIR, { recursive: true });
    await fs.mkdir(IMAGES_DIR, { recursive: true });

    // Clear existing content
    const existingFiles = await fs.readdir(CONTENT_DIR);
    for (const file of existingFiles) {
      if (file.endsWith('.md')) {
        await fs.unlink(path.join(CONTENT_DIR, file));
      }
    }
    console.log('Cleared existing content\n');

    // Fetch and process pages (returns array of pageInfo objects)
    const pagesInfo = await fetchPages();
    console.log(`\nFound ${pagesInfo.length} total pages\n`);

    const results = [];
    for (const pageInfo of pagesInfo) {
      const result = await convertPageToMarkdown(pageInfo);
      if (result) {
        results.push(result);
      }
    }

    console.log(`\n✓ Successfully processed ${results.length} pages`);

    // Check for changes
    const changed = await hasChanges();
    if (changed) {
      console.log('✓ Changes detected');
    } else {
      console.log('✓ No changes detected');
    }

    return changed;
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}

// Run sync
syncNotion()
  .then((changed) => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
