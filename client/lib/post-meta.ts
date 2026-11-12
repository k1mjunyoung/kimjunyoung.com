import type { PostListItem } from "@/types/post";

/** 목록, 검색, 상세에서 쓰는 가벼운 포스트 정보 */
export interface PostSummary {
  slug: string;
  title: string;
  /** 직접 쓴 description, 없으면 본문 앞부분 */
  summary: string;
  date: string; // YYYY-MM-DD (KST)
  tags: string[];
  readMin: number;
}

const KST_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * UTC ISO 문자열을 KST 날짜(YYYY-MM-DD)로.
 * 빌드 서버(Vercel)는 UTC라 앞 10자만 자르면 자정 근처 글의 날짜가 하루 밀린다
 */
export function kstDate(iso: string | null | undefined): string {
  return iso ? KST_DATE.format(new Date(iso)) : "";
}

/** 한글 기준 분당 약 500자 (server PostSummaryUtils.readMinutes와 같은 규칙) */
export function readMinutes(content: string): number {
  return Math.max(1, Math.round(content.replace(/\s+/g, "").length / 500));
}

export function toSummary(p: PostListItem): PostSummary {
  return {
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    date: kstDate(p.publishedAt),
    tags: p.tags,
    readMin: p.readMinutes,
  };
}

export { postHref } from "@/lib/site";
