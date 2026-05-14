# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## 기술 스택

- **프레임워크**: Next.js 15 (App Router) + TypeScript
- **스타일**: TailwindCSS v4 (`@theme` CSS vars)
- **마크다운**: `gray-matter` + `unified` 파이프라인 (`rehype-prism-plus` 코드 하이라이트)
- **검색**: Fuse.js + `public/search-ko.json` (prebuild 생성)
- **배포**: Vercel

## 명령어

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드 (prebuild: search-ko.json 자동 생성)
npm run build

# 검색 인덱스만 재생성
node scripts/build-search.mjs
```

## 아키텍처

ko 단일 언어 정적 블로그. 포스트는 `ko/_posts/*.md`에서 읽으며, 추후 Supabase로 전환 예정.

### 포스트 처리 (`src/lib/posts.ts`)

- `ko/_posts/*.md` 를 빌드 타임에 읽음
- front matter 필드: `lang`, `permalink`, `title`, `description`, `date`, `categories`, `domain`, `redirect_from`, `published`
- slug는 `permalink`의 마지막 세그먼트에서 추출
- `published: false` 포스트는 필터링

### 라우팅

| URL | 파일 |
|-----|------|
| `/` | `src/app/page.tsx` |
| `/post/[slug]` | `src/app/post/[slug]/page.tsx` |

### 스타일

- `src/styles/globals.css`: Tailwind v4 `@theme` 토큰 + base 스타일 + 폰트
- `src/styles/article.css`: 마크다운 article 전용 스타일 (포스트 페이지에서만 import)
- 다크모드: `prefers-color-scheme: dark` 미디어쿼리 자동 전환 (토글 없음)

### 외부 통합

- **GA4**: `G-1YJ6S21G70` (`Analytics.tsx`, afterInteractive)
- **AdSense**: `ca-pub-9115544315516369` (포스트 페이지)
- **Giscus**: `k1mjunyoung/kimjunyoung.com` (포스트 페이지, 다크모드 자동 테마)
- **Bootstrap Icons**: CDN (`layout.tsx <head>`)
- **Prism CSS**: CDN 라이트/다크 미디어 분기 (`layout.tsx <head>`)
