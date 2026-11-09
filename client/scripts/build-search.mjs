import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
  return env;
}

// lib/post-meta.ts, lib/markdown.ts의 extractPreview와 같은 규칙
const LEGACY_TAGS = new Set(['full_remote', 'ja_required']);

function preview(content, maxLength) {
  const stripped = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/^\s*[-*>]\s+/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.length > maxLength ? stripped.slice(0, maxLength) + '…' : stripped;
}

async function buildIndex() {
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[build-search] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 누락');
    process.exit(1);
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/post?is_public=eq.true&select=title,slug,description,categories,date,content&order=date.desc`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  );

  if (!res.ok) {
    console.error('[build-search] Supabase 요청 실패:', await res.text());
    process.exit(1);
  }

  const posts = await res.json();

  // 헤더 검색 팔레트(components/SearchPalette.tsx)가 읽는 형식
  return posts.map((post) => ({
    title: post.title ?? '',
    slug: post.slug,
    summary: post.description?.trim() || preview(post.content ?? '', 120),
    date: (post.date ?? '').slice(0, 10),
    tags: (post.categories ?? []).filter((c) => !LEGACY_TAGS.has(c)),
  }));
}

const publicDir = path.join(ROOT, 'public');
fs.mkdirSync(publicDir, { recursive: true });

const koIndex = await buildIndex();
fs.writeFileSync(
  path.join(publicDir, 'search-ko.json'),
  JSON.stringify(koIndex),
  'utf-8',
);

console.log(`[build-search] search-ko.json: ${koIndex.length}개 항목`);
