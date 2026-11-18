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

// lib/post-meta.ts의 kstDate와 같은 규칙. 빌드 서버(UTC)에서도 KST 날짜로 만든다
const KST_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** lib/posts/index.ts의 useSupabase와 같은 규칙 */
function useSupabase(env) {
  // Next.js처럼 실제 환경변수가 .env.local보다 우선한다
  const raw = (process.env.USE_SUPABASE ?? env.USE_SUPABASE)?.trim().toLowerCase();
  if (raw === undefined || raw === '' || raw === 'false') return false;
  if (raw === 'true') return true;
  console.error(`[build-search] USE_SUPABASE는 true 또는 false여야 합니다 (현재: "${raw}")`);
  process.exit(1);
}

/** server(Spring) API (USE_SUPABASE=false) */
async function buildIndexFromServer(env) {
  const apiUrl = process.env.API_URL ?? env.API_URL;

  if (!apiUrl) {
    console.error('[build-search] API_URL 누락');
    process.exit(1);
  }

  const url = `${apiUrl.replace(/\/+$/, '')}/api/posts`;
  let res;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (e) {
    console.error(`[build-search] 서버에 연결할 수 없음 (${url}):`, e.cause?.code ?? e.message);
    process.exit(1);
  }

  if (!res.ok) {
    console.error(`[build-search] 서버 요청 실패 (${res.status}):`, await res.text());
    process.exit(1);
  }

  /** server PostSummaryResponse[]: 요약(summary)은 서버가 계산해서 준다 */
  const posts = await res.json();

  return posts.map((post) => ({
    title: post.title ?? '',
    slug: post.slug,
    summary: post.summary ?? '',
    date: post.publishedAt ? KST_DATE.format(new Date(post.publishedAt)) : '',
    tags: post.tags ?? [],
  }));
}

// --- 레거시: Supabase 직접 조회 (USE_SUPABASE=true). lib/posts/supabase.ts와 함께 지운다 ---

// lib/markdown.ts의 extractPreview와 같은 규칙
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

async function buildIndexFromSupabase(env) {
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

  return posts.map((post) => ({
    title: post.title ?? '',
    slug: post.slug,
    summary: post.description?.trim() || preview(post.content ?? '', 120),
    date: post.date ? KST_DATE.format(new Date(post.date)) : '',
    tags: (post.categories ?? []).filter((c) => !LEGACY_TAGS.has(c)),
  }));
}

// 헤더 검색 팔레트(components/SearchPalette.tsx)가 읽는 형식: { title, slug, summary, date, tags }[]
async function buildIndex() {
  const env = loadEnv();
  return useSupabase(env) ? buildIndexFromSupabase(env) : buildIndexFromServer(env);
}

const publicDir = path.join(ROOT, 'public');
fs.mkdirSync(publicDir, { recursive: true });

const koIndex = await buildIndex();
fs.writeFileSync(
  path.join(publicDir, 'search-ko.json'),
  JSON.stringify(koIndex),
  'utf-8',
);

const source = useSupabase(loadEnv()) ? 'supabase' : 'server';
console.log(`[build-search] search-ko.json: ${koIndex.length}개 항목 (${source})`);
