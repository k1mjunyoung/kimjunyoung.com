import type { AdjacentPosts, Post, PostListItem } from '@/types/post';
import type { PostsSource } from './types';

/**
 * server(Spring) API 구현 (USE_SUPABASE=false)
 *
 * 주소는 API_URL. 빌드와 서버 렌더링에서만 쓰므로 NEXT_PUBLIC_가 아니다.
 * 404 말고 다른 오류는 에러를 던진다. 빌드 중에 서버가 죽어 있으면
 * 글이 0개인 사이트가 배포되는 대신 빌드가 실패한다.
 */
function apiUrl(path: string): string {
  const base = process.env.API_URL;
  if (!base) throw new Error('[posts/server] API_URL 환경변수가 없습니다');
  return `${base.replace(/\/+$/, '')}${path}`;
}

async function request<T>(path: string): Promise<T | undefined> {
  const res = await fetch(apiUrl(path), { headers: { Accept: 'application/json' } });
  if (res.status === 404) return undefined;
  if (!res.ok) {
    throw new Error(`[posts/server] ${res.status} ${res.statusText} - GET ${path}`);
  }
  return (await res.json()) as T;
}

export const serverSource = {
  async getAllPosts(): Promise<PostListItem[]> {
    return (await request<PostListItem[]>('/api/posts')) ?? [];
  },

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    return request<Post>(`/api/posts/${encodeURIComponent(slug)}`);
  },

  async getAdjacentPosts(slug: string): Promise<AdjacentPosts> {
    return (
      (await request<AdjacentPosts>(`/api/posts/${encodeURIComponent(slug)}/adjacent`)) ?? {
        newer: null,
        older: null,
      }
    );
  },
} satisfies PostsSource;
