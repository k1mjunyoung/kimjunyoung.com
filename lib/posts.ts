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

export async function getPrevNext(
  slug: string,
): Promise<{ prev: Post | null; next: Post | null }> {
  const posts = await fetchAllPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx === -1) return { prev: null, next: null };

  const prevIdx = idx === 0 ? posts.length - 1 : idx - 1;
  const nextIdx = idx === posts.length - 1 ? 0 : idx + 1;

  return { prev: posts[prevIdx], next: posts[nextIdx] };
}
