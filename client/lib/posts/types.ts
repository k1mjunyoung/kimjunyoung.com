import type { AdjacentPosts, Post, PostListItem } from '@/types/post';

/**
 * 포스트 데이터 소스가 지켜야 할 모양.
 * server(Spring)와 supabase(레거시) 구현 모두 `satisfies PostsSource`로 맞춘다
 */
export interface PostsSource {
  /** 공개 글 목록, 최신순 */
  getAllPosts(): Promise<PostListItem[]>;
  /** 공개 글 하나, 없으면 undefined */
  getPostBySlug(slug: string): Promise<Post | undefined>;
  /** newer: 바로 최신 글, older: 바로 오래된 글 */
  getAdjacentPosts(slug: string): Promise<AdjacentPosts>;
}
