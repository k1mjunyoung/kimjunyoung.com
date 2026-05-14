/**
 * 마크다운 → Supabase 마이그레이션 스크립트
 *
 * 사용법:
 *   node scripts/migrate-posts.mjs           # 실제 upsert
 *   node scripts/migrate-posts.mjs --dry-run # 파싱 결과만 출력 (DB 미변경)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 50;

// ── env 로드 ──────────────────────────────────────────────────────────────────

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

// ── 마크다운 파싱 ─────────────────────────────────────────────────────────────

function parsePost(filename, raw) {
  const { data, content } = matter(raw);

  const permalink = data.permalink ?? '';
  const slugFromPermalink = permalink.split('/').filter(Boolean).pop();
  const slugFromFilename = filename
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/\.md$/, '');
  const slug = slugFromPermalink || slugFromFilename;

  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
  const mdImgMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  const thumbnail_url = imgMatch?.[1] ?? mdImgMatch?.[1] ?? null;

  const categories = data.categories
    ? (Array.isArray(data.categories) ? data.categories : String(data.categories).split(','))
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  return {
    slug,
    title: data.title ?? '',
    description: data.description ?? '',
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    categories,
    content,
    thumbnail_url,
    is_public: data.published !== false,
  };
}

// ── 메인 ─────────────────────────────────────────────────────────────────────

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ .env.local에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY가 없습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const postsDir = path.join(ROOT, 'ko', '_posts');
if (!fs.existsSync(postsDir)) {
  console.error(`❌ 포스트 디렉토리 없음: ${postsDir}`);
  process.exit(1);
}

const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));
const records = [];

for (const filename of files) {
  const raw = fs.readFileSync(path.join(postsDir, filename), 'utf-8');
  try {
    records.push(parsePost(filename, raw));
  } catch (err) {
    console.warn(`⚠️  파싱 실패 (건너뜀): ${filename} — ${err.message}`);
  }
}

console.log(`📄 총 ${records.length}개 포스트 파싱 완료`);

if (DRY_RUN) {
  console.log('\n[--dry-run] 첫 3개 미리보기:');
  for (const r of records.slice(0, 3)) {
    const { content: _, ...preview } = r;
    console.log(JSON.stringify(preview, null, 2));
  }
  console.log('\n[--dry-run] DB에 쓰지 않고 종료합니다.');
  process.exit(0);
}

// 배치 upsert (slug 충돌 시 덮어씀)
let inserted = 0;
let failed = 0;

for (let i = 0; i < records.length; i += BATCH_SIZE) {
  const batch = records.slice(i, i + BATCH_SIZE);
  const { error } = await supabase
    .from('post')
    .upsert(batch, { onConflict: 'slug' });

  if (error) {
    console.error(`❌ 배치 ${i}~${i + batch.length - 1} upsert 실패:`, error.message);
    failed += batch.length;
  } else {
    inserted += batch.length;
    console.log(`✅ ${inserted}/${records.length} upsert 완료`);
  }
}

console.log(`\n완료 — 성공: ${inserted}, 실패: ${failed}`);
