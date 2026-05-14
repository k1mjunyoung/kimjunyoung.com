# Jekyll → Next.js 15 마이그레이션 계획

## 상태: 구현 완료 (2026-05-14)

---

## 확정된 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) + TypeScript |
| 스타일 | TailwindCSS v4 (CSS-only `@theme`) |
| 마크다운 | `gray-matter` + `unified` (remark/rehype 파이프라인) |
| 코드 하이라이트 | `rehype-prism-plus` + Prism CSS CDN (라이트/다크 미디어 분기) |
| 폰트 | CDN `@font-face` (Pretendard Variable, Cafe24ProUp) |
| 다국어 | ko 단일 언어 (en/ja 제거) |
| 다크모드 | `prefers-color-scheme` 자동 전환 (토글 없음) |
| 검색 | Fuse.js + `public/search-ko.json` (prebuild 생성) |
| 댓글 | Giscus (클라이언트, 다크모드 자동 테마) |
| 코드 하이라이트 | `rehype-prism-plus` |
| 배포 | Vercel |

## 구현된 구조

```
kimjunyoung.com/
├── next.config.mjs
├── postcss.config.mjs
├── package.json
├── tsconfig.json
├── ko/_posts/*.md              # 포스트 소스 (Supabase 전환 전까지 유지)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # html, body, Menu, Footer, Analytics
│   │   ├── page.tsx            # 인덱스: Header(Search) + PostList
│   │   ├── post/[slug]/
│   │   │   └── page.tsx        # 포스트 페이지 (generateStaticParams)
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── Menu.tsx, Footer.tsx
│   │   ├── Header.tsx          # 인덱스 커버 + Search
│   │   ├── Search.tsx          # client, Fuse.js
│   │   ├── PostCard.tsx, PostList.tsx
│   │   ├── PostNav.tsx         # prev/next
│   │   ├── JsonLd.tsx
│   │   ├── Giscus.tsx          # client
│   │   ├── AdSense.tsx         # client
│   │   ├── Analytics.tsx       # GA4
│   │   └── FadeIn.tsx          # IntersectionObserver
│   ├── lib/
│   │   ├── posts.ts            # 포스트 로딩 (ko/_posts 직접 읽기)
│   │   ├── markdown.ts         # unified 파이프라인
│   │   └── seo.ts              # buildMetadata, JSON-LD 헬퍼
│   ├── i18n/translations.ts    # 상수, 번역 문자열 (ko only)
│   └── styles/
│       ├── globals.css         # @import "tailwindcss"; @theme { ... }
│       └── article.css         # 마크다운 article 스타일
├── public/
│   ├── assets/                 # 이미지, PDF 등 정적 파일
│   └── search-ko.json          # prebuild 생성 (gitignore)
└── scripts/
    └── build-search.mjs        # prebuild: search-ko.json 생성
```

## 라우팅

| URL | 설명 |
|-----|------|
| `/` | 인덱스 (포스트 카드 목록) |
| `/post/[slug]` | 개별 포스트 |
| `/sitemap.xml` | 자동 생성 |
| `/robots.txt` | 자동 생성 |

## 의도적으로 제외한 항목

- **redirect_from**: Supabase 전환 예정으로 불필요 판단
- **다국어 (en/ja)**: ko 단일 언어로 단순화
- **`app/[lang]/` 세그먼트**: 불필요, `app/` 직하에 배치
- **AOS 애니메이션**: FadeIn 컴포넌트(IntersectionObserver)로 대체

## 남은 작업

- [ ] Vercel 프로젝트 연결 → 프리뷰 배포 검증
- [ ] Lighthouse SEO/Performance 점수 확인
- [ ] (추후) Supabase로 포스트 소스 전환, `ko/_posts` 제거
