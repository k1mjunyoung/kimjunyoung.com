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

async function buildIndex() {
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[build-search] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 누락');
    process.exit(1);
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/post?is_public=eq.true&select=title,slug,description,categories`,
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

  return posts.map((post) => {
    const categories = post.categories ?? [];
    return {
      title: post.title ?? '',
      url: `/post/${post.slug}`,
      description: post.description ?? '',
      full_remote: categories.includes('full_remote') ? '풀 리모트 👌' : '',
      ja_required: categories.includes('ja_required') ? '일본어 필요' : '',
    };
  });
}

const publicDir = path.join(ROOT, 'public');
fs.mkdirSync(publicDir, { recursive: true });

const koIndex = await buildIndex();
fs.writeFileSync(
  path.join(publicDir, 'search-ko.json'),
  JSON.stringify(koIndex, null, 2),
  'utf-8',
);

console.log(`[build-search] search-ko.json: ${koIndex.length}개 항목`);
