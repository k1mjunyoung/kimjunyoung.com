// server(Spring) API 응답 형식. 날짜는 UTC ISO 문자열 ("2026-02-20T17:41:00Z")

/** GET /api/posts/{slug} (server PostResponse) */
export interface Post {
  slug: string;
  title: string;
  description: string | null;
  tags: string[];
  content: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  updatedAt: string | null;
}

/** GET /api/posts, GET /api/posts/{slug}/adjacent (server PostSummaryResponse). content는 없다 */
export interface PostListItem {
  slug: string;
  title: string;
  /** 직접 쓴 description, 없으면 본문 앞부분 (서버에서 계산) */
  summary: string;
  tags: string[];
  thumbnailUrl: string | null;
  publishedAt: string;
  readMinutes: number;
}

/** GET /api/posts/{slug}/adjacent (server AdjacentPostsResponse) */
export interface AdjacentPosts {
  newer: PostListItem | null;
  older: PostListItem | null;
}
