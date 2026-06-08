import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appDir = path.join(root, '.next', 'server', 'app');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = packageJson.version;
const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://iw.vidocat.com').replace(/\/$/, '');

const htmlPages = [
  {
    route: '/',
    file: path.join(appDir, 'index.html'),
    canonical: siteUrl,
    alternates: {
      'zh-CN': siteUrl,
      en: `${siteUrl}/en`,
    },
    english: false,
  },
  {
    route: '/compress',
    file: path.join(appDir, 'compress.html'),
    canonical: `${siteUrl}/compress`,
    alternates: {
      'zh-CN': `${siteUrl}/compress`,
      en: `${siteUrl}/en/compress`,
    },
    english: false,
  },
  {
    route: '/metadata',
    file: path.join(appDir, 'metadata.html'),
    canonical: `${siteUrl}/metadata`,
    alternates: {
      'zh-CN': `${siteUrl}/metadata`,
      en: `${siteUrl}/en/metadata`,
    },
    english: false,
  },
  {
    route: '/en',
    file: path.join(appDir, 'en.html'),
    canonical: `${siteUrl}/en`,
    alternates: {
      'zh-CN': siteUrl,
      en: `${siteUrl}/en`,
    },
    english: true,
  },
  {
    route: '/en/compress',
    file: path.join(appDir, 'en', 'compress.html'),
    canonical: `${siteUrl}/en/compress`,
    alternates: {
      'zh-CN': `${siteUrl}/compress`,
      en: `${siteUrl}/en/compress`,
    },
    english: true,
  },
  {
    route: '/en/metadata',
    file: path.join(appDir, 'en', 'metadata.html'),
    canonical: `${siteUrl}/en/metadata`,
    alternates: {
      'zh-CN': `${siteUrl}/metadata`,
      en: `${siteUrl}/en/metadata`,
    },
    english: true,
  },
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function readRequired(file, label) {
  if (!existsSync(file)) {
    fail(`${label} missing: ${path.relative(root, file)}`);
    return '';
  }
  return readFileSync(file, 'utf8');
}

function readMeta(file) {
  const metaFile = file.replace(/\.html$/, '.meta');
  if (!existsSync(metaFile)) return null;

  try {
    return JSON.parse(readFileSync(metaFile, 'utf8'));
  } catch {
    fail(`Invalid meta JSON: ${path.relative(root, metaFile)}`);
    return null;
  }
}

function getLinkTags(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
}

function getAttr(tag, name) {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`, 'i'));
  return match?.[1] ?? '';
}

function hasCanonical(html, href) {
  return getLinkTags(html).some((tag) => getAttr(tag, 'rel') === 'canonical' && getAttr(tag, 'href') === href);
}

function hasAlternate(html, hrefLang, href) {
  return getLinkTags(html).some((tag) => (
    getAttr(tag, 'rel') === 'alternate' &&
    getAttr(tag, 'hrefLang') === hrefLang &&
    getAttr(tag, 'href') === href
  ));
}

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number.parseInt(value, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

function visibleText(html) {
  const body = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  return decodeEntities(body)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

for (const page of htmlPages) {
  const html = readRequired(page.file, page.route);
  const meta = readMeta(page.file);

  if (meta?.status && meta.status !== 200) {
    fail(`${page.route} expected status 200, got ${meta.status}`);
  }

  if (!html.includes(`v<!-- -->${version}`) && !html.includes(`v${version}`)) {
    fail(`${page.route} missing visible version ${version}`);
  }

  if (!hasCanonical(html, page.canonical)) {
    fail(`${page.route} missing canonical ${page.canonical}`);
  }

  for (const [hrefLang, href] of Object.entries(page.alternates)) {
    if (!hasAlternate(html, hrefLang, href)) {
      fail(`${page.route} missing alternate ${hrefLang} ${href}`);
    }
  }

  if (page.english) {
    const text = visibleText(html).replaceAll('中文', '');
    const cjk = text.match(/[\u3400-\u9fff]+/g);
    if (cjk) {
      fail(`${page.route} has visible CJK text outside language switch: ${[...new Set(cjk)].slice(0, 8).join(', ')}`);
    }
  }
}

const sitemapFile = path.join(appDir, 'sitemap.xml.body');
const sitemapMeta = readMeta(path.join(appDir, 'sitemap.xml.html'));
const sitemap = readRequired(sitemapFile, '/sitemap.xml');

if (sitemapMeta?.status !== 200) {
  fail(`/sitemap.xml expected status 200, got ${sitemapMeta?.status ?? 'missing meta status'}`);
}

for (const route of ['', '/compress', '/metadata', '/en', '/en/compress', '/en/metadata']) {
  const url = `${siteUrl}${route}`;
  if (!sitemap.includes(url)) {
    fail(`/sitemap.xml missing ${url}`);
  }
}

const llmsFile = path.join(root, 'public', 'llms.txt');
const llms = readRequired(llmsFile, '/llms.txt');

for (const route of ['/', '/compress', '/metadata', '/en', '/en/compress', '/en/metadata']) {
  const url = route === '/' ? `${siteUrl}/` : `${siteUrl}${route}`;
  if (!llms.includes(url)) {
    fail(`/llms.txt missing ${url}`);
  }
}

if (failures.length > 0) {
  console.error(`HTML smoke check failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`HTML smoke check passed for ${htmlPages.length} pages, sitemap.xml, and llms.txt.`);
