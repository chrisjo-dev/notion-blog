import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
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
} catch {
  // .env not found, use existing env vars
}

const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY;
const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL || 'https://api.openclaw.io/v1/chat/completions';
const OPENCLAW_MODEL = process.env.OPENCLAW_MODEL || 'gpt-4o-mini';
const DRY_RUN = process.argv.includes('--dry-run');

if (!OPENCLAW_API_KEY && !DRY_RUN) {
  console.error('Error: OPENCLAW_API_KEY must be set in environment variables');
  process.exit(1);
}

// Paths
const POSTS_DIR = path.join(__dirname, '..', 'src', 'content', 'posts');
const POSTS_EN_DIR = path.join(__dirname, '..', 'src', 'content', 'posts-en');
const CACHE_FILE = path.join(__dirname, '..', '.translation-cache.json');

// Cache: { notionId: { contentHash, koreanSlug, englishSlug, englishTitle } }
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

// Slug generation
function sanitizeEnglishSlug(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

const slugCache = new Map();
function generateUniqueSlug(title) {
  const baseSlug = sanitizeEnglishSlug(title);
  if (!slugCache.has(baseSlug)) {
    slugCache.set(baseSlug, 1);
    return baseSlug;
  }
  const count = slugCache.get(baseSlug);
  slugCache.set(baseSlug, count + 1);
  return `${baseSlug}-${count}`;
}

// Content hash for incremental check
function computeHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

// Parse markdown file into frontmatter and body
function parseMarkdown(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
  if (!match) return null;

  const frontmatterStr = match[1];
  const body = match[2];

  // Simple YAML parser for our known frontmatter format
  const fm = {};
  let currentArray = null;
  let currentKey = null;

  for (const line of frontmatterStr.split('\n')) {
    const arrayItem = line.match(/^\s+-\s+"(.*)"/);
    if (arrayItem && currentKey) {
      if (!fm[currentKey]) fm[currentKey] = [];
      fm[currentKey].push(arrayItem[1]);
      continue;
    }

    const kv = line.match(/^(\w+):\s*"(.*)"/);
    if (kv) {
      fm[kv[1]] = kv[2];
      currentKey = null;
      continue;
    }

    const kvNum = line.match(/^(\w+):\s*(\d+)$/);
    if (kvNum) {
      fm[kvNum[1]] = parseInt(kvNum[2]);
      currentKey = null;
      continue;
    }

    const arrayStart = line.match(/^(\w+):$/);
    if (arrayStart) {
      currentKey = arrayStart[1];
      fm[currentKey] = [];
      continue;
    }
  }

  return { frontmatter: fm, body };
}

// Markdown preservation: extract code blocks, images, URLs into placeholders
function extractPlaceholders(markdown) {
  const placeholders = [];
  let processed = markdown;

  // Extract image markdown ![alt](url)
  processed = processed.replace(/!\[[^\]]*\]\([^)]+\)/g, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `__IMAGE_${idx}__`;
  });

  // Extract link markdown [text](url) — preserve URLs
  processed = processed.replace(/\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `__LINK_${idx}__`;
  });

  return { processed, placeholders };
}

// Restore placeholders after translation
function restorePlaceholders(translated, placeholders) {
  let result = translated;
  for (let i = 0; i < placeholders.length; i++) {
    const patterns = [
      `__CODE_BLOCK_${i}__`,
      `__INLINE_CODE_${i}__`,
      `__IMAGE_${i}__`,
      `__LINK_${i}__`,
    ];
    for (const pattern of patterns) {
      if (result.includes(pattern)) {
        result = result.replace(pattern, placeholders[i]);
        break;
      }
    }
  }
  return result;
}

// Validate placeholders were all restored
function validateRestoration(original, restored, placeholders) {
  const missing = [];
  for (let i = 0; i < placeholders.length; i++) {
    const patterns = [`__CODE_BLOCK_${i}__`, `__INLINE_CODE_${i}__`, `__IMAGE_${i}__`, `__LINK_${i}__`];
    for (const pattern of patterns) {
      if (restored.includes(pattern)) {
        missing.push(pattern);
      }
    }
  }
  return missing;
}

// Translate via OpenClaw API
async function translatePost(title, description, proseBody) {
  const systemPrompt = `You are a professional Korean-to-English translator for a technical blog.
Translate the following Korean blog post to natural, fluent English.
Preserve all technical terms accurately. Maintain the original markdown structure (headings, lists, bold, etc.).
Return ONLY a JSON object with this exact format: {"title": "...", "description": "...", "body": "..."}
The body contains placeholder tokens like __IMAGE_0__, __LINK_1__ etc.
Do NOT translate or modify these placeholders. Keep them exactly as-is in their original positions.
For code blocks (``` ... ```), translate any Korean comments or Korean text inside them, but preserve the code structure and syntax.
Do NOT wrap the response in markdown code fences.`;

  const userMessage = `Title: ${title}
Description: ${description || ''}
---
${proseBody}`;

  const response = await fetch(OPENCLAW_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENCLAW_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENCLAW_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from API');
  }

  // Parse JSON response (handle potential markdown fences)
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);
  if (!parsed.title || !parsed.body) {
    throw new Error('Invalid response format: missing title or body');
  }

  return parsed;
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main translation function
async function translateAll() {
  console.log('Starting translation...\n');

  await fs.mkdir(POSTS_EN_DIR, { recursive: true });

  const cache = await loadCache();
  console.log(`Cache loaded: ${Object.keys(cache).length} entries\n`);

  // Read all Korean posts
  const files = await fs.readdir(POSTS_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  const posts = [];
  for (const file of mdFiles) {
    const content = await fs.readFile(path.join(POSTS_DIR, file), 'utf-8');
    const parsed = parseMarkdown(content);
    if (!parsed) continue;

    const { frontmatter, body } = parsed;
    // Filter: only blog posts (has category)
    if (!frontmatter.category) continue;

    const slug = file.replace(/\.md$/, '');
    posts.push({ file, slug, frontmatter, body });
  }

  console.log(`Found ${posts.length} blog posts to process\n`);

  // Determine which posts need translation
  const toTranslate = [];
  const toSkip = [];
  const currentNotionIds = new Set();

  for (const post of posts) {
    const notionId = post.frontmatter.notionId;
    if (!notionId) continue;
    currentNotionIds.add(notionId);

    const contentHash = computeHash(post.frontmatter.title + post.body);
    const cached = cache[notionId];

    if (cached && cached.contentHash === contentHash) {
      // Register slug to avoid collisions
      if (cached.englishSlug) {
        slugCache.set(cached.englishSlug, 1);
      }
      toSkip.push(post);
    } else {
      toTranslate.push({ ...post, contentHash });
    }
  }

  console.log(`To translate: ${toTranslate.length}, Unchanged: ${toSkip.length}\n`);

  if (DRY_RUN) {
    console.log('[DRY RUN] Would translate:');
    toTranslate.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.frontmatter.title} (${p.slug})`);
    });
    console.log('\n[DRY RUN] No API calls made.');
    return;
  }

  // Translate changed posts
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toTranslate.length; i++) {
    const post = toTranslate[i];
    const { frontmatter, body, slug, contentHash } = post;
    const progress = `[${i + 1}/${toTranslate.length}]`;

    console.log(`${progress} Translating: ${frontmatter.title}...`);

    // Extract placeholders
    const { processed: proseBody, placeholders } = extractPlaceholders(body);

    let translated = null;
    let retries = 0;
    const maxRetries = 1;

    while (retries <= maxRetries) {
      try {
        translated = await translatePost(
          frontmatter.title,
          frontmatter.description || '',
          proseBody
        );
        break;
      } catch (error) {
        if (retries < maxRetries) {
          console.warn(`  ⚠ Retry in 3s: ${error.message}`);
          await sleep(3000);
          retries++;
        } else {
          console.error(`  ✗ Failed: ${error.message}`);
          failCount++;
          translated = null;
          break;
        }
      }
    }

    if (!translated) continue;

    // Restore placeholders in body
    const restoredBody = restorePlaceholders(translated.body, placeholders);

    // Validate
    const missing = validateRestoration(body, restoredBody, placeholders);
    if (missing.length > 0) {
      console.warn(`  ⚠ Warning: ${missing.length} unreplaced placeholders: ${missing.join(', ')}`);
    }

    // Generate English slug
    const englishSlug = generateUniqueSlug(translated.title);
    const escapedTitle = translated.title.replace(/"/g, '\\"');
    const escapedDesc = (translated.description || frontmatter.description || '').replace(/"/g, '\\"');

    // Build frontmatter
    let fm = '---\n';
    fm += `title: "${escapedTitle}"\n`;
    fm += `description: "${escapedDesc}"\n`;
    fm += `date: "${frontmatter.date}"\n`;
    fm += `notionId: "${frontmatter.notionId}"\n`;
    fm += `koreanSlug: "${slug}"\n`;

    if (frontmatter.category) {
      fm += `category: "${frontmatter.category}"\n`;
    }
    if (frontmatter.tags && frontmatter.tags.length > 0) {
      fm += 'tags:\n';
      frontmatter.tags.forEach(tag => {
        fm += `  - "${tag.replace(/"/g, '\\"')}"\n`;
      });
    }
    if (frontmatter.hierarchy && frontmatter.hierarchy.length > 0) {
      fm += 'hierarchy:\n';
      frontmatter.hierarchy.forEach(item => {
        fm += `  - "${item.replace(/"/g, '\\"')}"\n`;
      });
    }
    if (frontmatter.parent) {
      fm += `parent: "${frontmatter.parent}"\n`;
    }
    if (frontmatter.level !== undefined) {
      fm += `level: ${frontmatter.level}\n`;
    }
    fm += '---\n\n';

    const fullContent = fm + restoredBody;
    const fileName = `${englishSlug}.md`;
    await fs.writeFile(path.join(POSTS_EN_DIR, fileName), fullContent, 'utf-8');

    console.log(`  ✓ Saved: ${fileName}`);

    // Update cache
    cache[frontmatter.notionId] = {
      contentHash,
      koreanSlug: slug,
      englishSlug,
      englishTitle: translated.title,
    };

    successCount++;

    // Rate limiting delay
    if (i < toTranslate.length - 1) {
      await sleep(1000);
    }
  }

  // Cleanup: only if all translations succeeded (no failures)
  if (failCount === 0) {
    const removedIds = Object.keys(cache).filter(id => !currentNotionIds.has(id));
    for (const id of removedIds) {
      const cached = cache[id];
      if (cached?.englishSlug) {
        const filePath = path.join(POSTS_EN_DIR, `${cached.englishSlug}.md`);
        try {
          await fs.unlink(filePath);
          console.log(`  ✗ Removed: ${cached.englishSlug}.md (Korean source deleted)`);
        } catch {
          // File already gone
        }
      }
      delete cache[id];
    }
    if (removedIds.length > 0) {
      console.log(`Removed ${removedIds.length} orphaned translations`);
    }
  } else {
    console.log(`\n⚠ Skipping cleanup due to ${failCount} translation failures`);
  }

  await saveCache(cache);

  console.log(`\n✓ Translated ${successCount} posts, skipped ${toSkip.length} unchanged, ${failCount} failed`);
}

translateAll()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Translation failed:', error);
    process.exit(1);
  });
