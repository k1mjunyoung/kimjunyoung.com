import { cache } from 'react';
import { supabase } from './supabase';
import type { Post } from '@/types/post';

export type { Post };

const fetchAllPosts = cache(async (): Promise<Post[]> => {
  const { data, error } = await supabase
    .from('post')
    .select('*')
    .eq('is_public', true)
    .order('date', { ascending: false });

  if (error) {
    console.error('[getAllPosts]', error.message);
    return [];
  }
  return data ?? [];
});

export async function getAllPosts(): Promise<Post[]> {
  return fetchAllPosts();
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const { data, error } = await supabase
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

/** 목록은 최신순이라 idx-1이 더 최신 글, idx+1이 더 오래된 글 */
export async function getAdjacentPosts(
  slug: string,
): Promise<{ newer: Post | null; older: Post | null }> {
  const posts = await fetchAllPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx === -1) return { newer: null, older: null };

  return {
    newer: idx > 0 ? posts[idx - 1] : null,
    older: idx < posts.length - 1 ? posts[idx + 1] : null,
  };
}
