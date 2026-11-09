import type { Post } from "@/types/post";
import { extractPreview } from "@/lib/markdown";

// 예전 구인 공고용 카테고리는 태그로 보여주지 않는다
const LEGACY_TAGS = new Set(["full_remote", "ja_required"]);

/** 목록, 검색, 상세에서 쓰는 가벼운 포스트 정보 */
export interface PostSummary {
  slug: string;
  title: string;
  /** 직접 쓴 description, 없으면 본문 앞부분 */
  summary: string;
  date: string; // YYYY-MM-DD
  tags: string[];
  readMin: number;
}

export function visibleTags(categories: string[] | null | undefined): string[] {
  return (categories ?? []).filter((c) => !LEGACY_TAGS.has(c));
}

/** 한글 기준 분당 약 500자 */
export function readMinutes(content: string): number {
  return Math.max(1, Math.round(content.replace(/\s+/g, "").length / 500));
}

export function toSummary(p: Post): PostSummary {
  return {
    slug: p.slug,
    title: p.title,
    summary: p.description?.trim() || extractPreview(p.content, 120),
    date: p.date ? p.date.slice(0, 10) : "",
    tags: visibleTags(p.categories),
    readMin: readMinutes(p.content),
  };
}

export { postHref } from "@/lib/site";
