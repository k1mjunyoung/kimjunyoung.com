// 클라이언트 컴포넌트에서도 쓰는 상수/경로. 무거운 모듈(markdown 등)을 import하지 않는다.

export const postHref = (slug: string) => `/post/${encodeURIComponent(slug)}`;

/** 페이지가 헤더에 내용을 끼워 넣을 때 쓰는 자리 (components/post/ReadingChrome) */
export const HEADER_ID = "site-header";
export const HEADER_SLOT_ID = "site-header-slot";
