# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## 저장소 구조 (모노레포)

```
client/    # Next.js 15 프론트엔드 (모든 npm 명령은 여기서 실행)
server/    # Spring Boot 백엔드 (Gradle, 이전 작업 진행 중)
supabase/  # DB 마이그레이션 SQL
ko/        # 예전 마크다운 포스트 원본 (현재 코드에서는 사용하지 않음)
```

현재 포스트 데이터는 프론트(`client`)가 Supabase를 직접 조회한다. 포스트 조회를 `server`(Spring Boot) API 경유로 바꾸는 작업이 `migrate-to-spring` 브랜치에서 진행 중이다.

## 기술 스택

### client

- **프레임워크**: Next.js 15 (App Router) + React 19 + TypeScript
- **스타일**: TailwindCSS v4 (`@theme` CSS vars), shadcn/ui, SCSS(Tiptap 컴포넌트). 폰트는 Pretendard(본문) + JetBrains Mono(`font-mono`, 메타/코드)
- **마크다운**: `gray-matter` + `unified` 파이프라인 (`rehype-starry-night` 코드 하이라이트)
- **에디터**: Tiptap (`/simple` 페이지)
- **데이터**: Supabase (`@supabase/supabase-js`)
- **검색**: 헤더의 `⌘K` / `/` 검색 팔레트(`SearchPalette.tsx`)가 `public/search-ko.json`(prebuild 생성, gitignore)을 처음 열 때 불러와 제목/요약/태그로 거른다
- **배포**: Vercel (Root Directory를 `client`로 지정해야 함)

### server

- Spring Boot 4.0.9 + Java 17, Gradle
- Spring Web MVC, Data JPA, Validation, PostgreSQL, Lombok

## 명령어

```bash
# client (cd client)
npm run dev                      # 개발 서버
npm run build                    # 프로덕션 빌드 (prebuild: search-ko.json 자동 생성)
node scripts/build-search.mjs    # 검색 인덱스만 재생성

# server (cd server)
./gradlew bootRun                # 실행
./gradlew build                  # 빌드와 테스트
```

## 환경변수

- `client/.env.local` (커밋 금지). 항목은 `client/.env.example` 참고
- 전부 `NEXT_PUBLIC_*`: 사이트 메타, GA, AdSense, Giscus, Supabase URL과 anon key
- `scripts/build-search.mjs`는 `.env.local`이 없으면 `process.env`에서 읽는다 (Vercel 빌드)

## 아키텍처 (client)

ko 단일 언어 블로그. 포스트는 Supabase `post` 테이블에서 읽는다.

### 포스트 처리 (`client/lib/posts.ts`)

- `getAllPosts`, `getPostBySlug`, `getAdjacentPosts`(newer/older)가 Supabase `post` 테이블을 조회
- `is_public = true` 인 포스트만 노출
- 컬럼: `slug`, `title`, `description`, `date`, `categories`, `content`, `thumbnail_url`, `is_public` (스키마: `supabase/migrations`)
- 조회 오류는 로그만 남기고 빈 값을 반환
- `generateStaticParams`로 포스트 페이지를 정적 생성

### 라우팅

| URL | 파일 |
|-----|------|
| `/` | `client/app/page.tsx` |
| `/post/[slug]` | `client/app/post/[slug]/page.tsx` |
| `/simple` | `client/app/simple/page.tsx` (Tiptap 에디터) |
| `/sitemap.xml`, `/robots.txt` | `client/app/sitemap.ts`, `client/app/robots.ts` |

### 렌더링 (`client/lib/markdown.ts`, `client/lib/post-meta.ts`)

- `renderArticle(md)`가 HTML과 목차용 `headings`(h2/h3)를 반환. `rehypeArticle` 플러그인이 코드 블록을 `.code-block`(언어 라벨 + 복사 버튼)으로 감싼다
- `toSummary(post)`: 목록용 요약(직접 쓴 `description`, 없으면 본문 앞부분), 읽는 시간, 태그(`full_remote`, `ja_required`는 제외)
- 클라이언트 컴포넌트는 `lib/site.ts`(경로, 헤더 id)만 import한다. `lib/markdown.ts`를 끌어오면 starry-night 문법 전체가 클라이언트 번들에 들어간다

### 디자인 (이슈 #32, E안)

- 레이아웃: `SiteHeader`(sticky, 로고 `~/kimjunyoung▌`, 검색, GitHub, 테마 전환) + `SiteFooter`. 페이지마다 `max-w-[880px] px-5` 컨테이너와 왼쪽 96px gutter 그리드(`sm:grid-cols-[96px_1fr]`)를 쓴다
- 메인: 최신 글 하나 크게 + 연도별 목록(연도는 gutter에 sticky)
- 상세: 본문 680px, 목차(1360px 이상 오른쪽 sticky, 좁으면 접이식), 헤더 읽기 진행 바와 제목(`components/post/ReadingChrome.tsx`, 헤더에 portal)

### 스타일

- `client/styles/globals.css`: Tailwind v4 `@theme` 토큰 + base 스타일 + 폰트. 따뜻한 무채색 팔레트를 shadcn 토큰(`background`, `foreground`, `muted`, `muted-foreground`, `border`)에 연결하고, 강조색은 `brand`(라이트 `#d9480f`, 다크 `#ff8a5b`) 하나
- `client/styles/article.css`: 포스트 본문(`.article`) 전용 스타일과 starry-night 문법 색 (포스트 페이지에서만 import)
- 다크모드: `next-themes`(`Providers.tsx`)가 `html`에 `dark` 클래스를 붙이는 방식, 기본값은 시스템 설정. 헤더에 토글 있음

### 외부 통합

- **GA4**: `NEXT_PUBLIC_GA_ID` (`Analytics.tsx`, afterInteractive)
- **AdSense**: `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT` (포스트 본문 끝, 채워지지 않은 자리는 CSS로 숨김)
- **Giscus**: `NEXT_PUBLIC_GISCUS_*` (포스트 페이지, `noborder_light`/`noborder_dark`, 테마 전환 시 iframe에 postMessage)
- **Bootstrap Icons**: CDN (`layout.tsx <head>`)
