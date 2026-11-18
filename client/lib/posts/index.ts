import { cache } from 'react';
import type { AdjacentPosts, Post, PostListItem } from '@/types/post';
import { serverSource } from './server';
import { supabaseSource } from './supabase';
import type { PostsSource } from './types';

export type { AdjacentPosts, Post, PostListItem };

/**
 * 포스트 데이터 소스 선택
 * - USE_SUPABASE=true  → Supabase 직접 조회 (레거시, lib/posts/supabase.ts)
 * - USE_SUPABASE=false → server(Spring) API (lib/posts/server.ts)
 * - 없으면 false
 *
 * 빌드 때 정해지므로 값을 바꾸면 다시 배포해야 한다.
 * scripts/build-search.mjs도 같은 값을 본다.
 */
function useSupabase(): boolean {
  const raw = process.env.USE_SUPABASE?.trim().toLowerCase();
  if (raw === undefined || raw === '' || raw === 'false') return false;
  if (raw === 'true') return true;
  // 오타(TURE 등)로 조용히 다른 쪽을 타지 않게 막는다
  throw new Error(`[posts] USE_SUPABASE는 true 또는 false여야 합니다 (현재: "${process.env.USE_SUPABASE}")`);
}

const source: PostsSource = useSupabase() ? supabaseSource : serverSource;

export const getAllPosts = cache((): Promise<PostListItem[]> => source.getAllPosts());

export const getPostBySlug = cache((slug: string): Promise<Post | undefined> =>
  source.getPostBySlug(slug),
);

export function getAdjacentPosts(slug: string): Promise<AdjacentPosts> {
  return source.getAdjacentPosts(slug);
}
