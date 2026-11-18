import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { extractPreview } from '@/lib/markdown';
import { readMinutes } from '@/lib/post-meta';
import type { AdjacentPosts, Post, PostListItem } from '@/types/post';
import type { PostsSource } from './types';

/**
 * 레거시: Supabase `post` 테이블을 직접 조회하는 구현 (USE_SUPABASE=true)
 *
 * server(Spring) 전환 전 코드(d70d58db의 lib/posts.ts)를 그대로 살리고,
 * 결과만 새 타입(Post, PostListItem)으로 바꾼다. 페이지는 새 타입만 안다.
 * Spring 운영이 안정되면 이 파일, lib/posts/index.ts의 분기,
 * @supabase/supabase-js, NEXT_PUBLIC_SUPABASE_* 를 함께 지운다.
 */

/** 예전 Supabase `post` 테이블 행 (스키마: supabase/migrations) */
interface SupabasePostRow {
  id: number;
  slug: string;
  title: string;
  description: string;
  date: string;
  categories: string[];
  content: string;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// 예전 구인 공고용 카테고리는 태그로 보여주지 않는다
const LEGACY_TAGS = new Set(['full_remote', 'ja_required']);

// 모듈을 불러올 때가 아니라 처음 쓸 때 만든다. server 모드에서는 Supabase 환경변수가 없어도 된다
let client: SupabaseClient | undefined;
function supabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        '[posts/supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 없습니다',
      );
    }
    client = createClient(url, key);
  }
  return client;
}

function toPost(r: SupabasePostRow): Post {
  return {
    slug: r.slug,
    title: r.title,
    description: r.description?.trim() || null,
    tags: (r.categories ?? []).filter((c) => !LEGACY_TAGS.has(c)),
    content: r.content,
    thumbnailUrl: r.thumbnail_url,
    publishedAt: r.date,
    updatedAt: null,
  };
}

/** 서버가 계산해서 주던 summary, readMinutes를 여기서 계산한다. content는 넣지 않는다 */
function toListItem(r: SupabasePostRow): PostListItem {
  const p = toPost(r);
  return {
    slug: p.slug,
    title: p.title,
    summary: p.description ?? extractPreview(r.content, 120),
    tags: p.tags,
    thumbnailUrl: p.thumbnailUrl,
    publishedAt: p.publishedAt,
    readMinutes: readMinutes(r.content),
  };
}

// --- 예전 조회 코드 (그대로) ---

async function fetchAllPosts(): Promise<SupabasePostRow[]> {
  const { data, error } = await supabase()
    .from('post')
    .select('*')
    .eq('is_public', true)
    .order('date', { ascending: false });

  if (error) {
    console.error('[getAllPosts]', error.message);
    return [];
  }
  return data ?? [];
}

async function fetchPostBySlug(slug: string): Promise<SupabasePostRow | undefined> {
  const { data, error } = await supabase()
    .from('post')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();

  if (error) {
    console.error('[getPostBySlug]', error.message);
    return undefined;
  }
  return data ?? undefined;
}

// --- 새 타입으로 변환해서 내보내기 ---

export const supabaseSource = {
  async getAllPosts(): Promise<PostListItem[]> {
    return (await fetchAllPosts()).map(toListItem);
  },

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    const row = await fetchPostBySlug(slug);
    return row && toPost(row);
  },

  /** 목록은 최신순이라 idx-1이 더 최신 글, idx+1이 더 오래된 글 */
  async getAdjacentPosts(slug: string): Promise<AdjacentPosts> {
    const posts = await fetchAllPosts();
    const idx = posts.findIndex((p) => p.slug === slug);
    if (idx === -1) return { newer: null, older: null };

    return {
      newer: idx > 0 ? toListItem(posts[idx - 1]) : null,
      older: idx < posts.length - 1 ? toListItem(posts[idx + 1]) : null,
    };
  },
} satisfies PostsSource;
