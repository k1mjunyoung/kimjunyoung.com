import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, body: content };

  const yaml = match[1];
  const data = {};

  for (const line of yaml.split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && val) data[key] = val;
  }

  return { data, body: content.slice(match[0].length) };
}

function buildIndex(lang) {
  const postsDir = path.join(ROOT, 'ko', '_posts');
  if (!fs.existsSync(postsDir)) return [];

  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));
  const items = [];

  for (const filename of files) {
    const raw = fs.readFileSync(path.join(postsDir, filename), 'utf-8');
    const { data, body } = parseFrontMatter(raw);

    if (data.published === 'false') continue;

    const permalink = data.permalink ?? '';
    const slug =
      permalink.split('/').filter(Boolean).pop() ||
      filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');

    const url = `/post/${slug}`;
    const description = data.description ?? body.replace(/[#*`>\[\]]/g, '').slice(0, 500).trim();

    const categories = (data.categories ?? '').split(',').map((s) => s.trim());
    const full_remote = categories.includes('full_remote') ? '풀 리모트 👌' : '';
    const ja_required = categories.includes('ja_required') ? '일본어 필요' : '';

    items.push({
      title: data.title ?? '',
      url,
      description,
      full_remote,
      ja_required,
    });
  }

  return items;
}

const publicDir = path.join(ROOT, 'public');
fs.mkdirSync(publicDir, { recursive: true });

const koIndex = buildIndex('ko');
fs.writeFileSync(
  path.join(publicDir, 'search-ko.json'),
  JSON.stringify(koIndex, null, 2),
  'utf-8'
);

console.log(`[build-search] search-ko.json: ${koIndex.length} entries`);
