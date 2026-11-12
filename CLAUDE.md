# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## 저장소 구조 (모노레포)

```
client/    # Next.js 15 프론트엔드 (모든 npm 명령은 여기서 실행)
server/    # Spring Boot 백엔드 (Gradle, 이전 작업 진행 중)
supabase/  # DB 마이그레이션 SQL
ko/        # 예전 마크다운 포스트 원본 (현재 코드에서는 사용하지 않음)
```

포스트 데이터는 `client`가 `server`(Spring Boot) API(`/api/posts`)로 조회한다. DB는 독립 Postgres(`server/.env`의 `DB_URL`)이고 Supabase는 더 이상 조회하지 않는다 (`feature/server` 브랜치에서 전환, 아직 main 미반영).

## 작업 방식

- **`server/`(Spring Boot) 코드는 사용자가 직접 작성한다.** Claude는 `server/` 파일을 만들거나 고치지 말고, 해야 할 일과 방법(순서, 설정, 예시 코드)만 설명한다. 사용자가 명시적으로 부탁할 때만 예외
- 백엔드 작업 기준은 Obsidian 이슈 #33(백엔드 API 개발), #36(Spring Boot 이전)

## 기술 스택

### client

- **프레임워크**: Next.js 15 (App Router) + React 19 + TypeScript
- **스타일**: TailwindCSS v4 (`@theme` CSS vars), shadcn/ui, SCSS(Tiptap 컴포넌트). 폰트는 Pretendard(본문) + JetBrains Mono(`font-mono`, 메타/코드)
- **마크다운**: `gray-matter` + `unified` 파이프라인 (`rehype-starry-night` 코드 하이라이트)
- **에디터**: Tiptap (`/simple` 페이지)
- **데이터**: server API를 `fetch`로 호출 (`lib/posts.ts`). `@supabase/supabase-js`는 예전 이전 스크립트(`scripts/migrate-posts.mjs`)만 쓴다
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
- `USE_SUPABASE`: 포스트 데이터 소스 (`false`면 server API, `true`면 Supabase 레거시). 빌드 때 정해지므로 바꾸면 다시 배포
- `API_URL`: server API 주소 (로컬 `http://localhost:8080`). 빌드와 서버 렌더링에서만 쓰므로 `NEXT_PUBLIC_`가 아니다
- `WRITE_PASSWORD`: `/write` 접근 암호 (없으면 글 작성 꺼짐). `ADMIN_API_TOKEN`: server 쓰기 API 호출 토큰 (server `.env`와 같은 값). 둘 다 서버 전용
- 나머지는 `NEXT_PUBLIC_*`: 사이트 메타, GA, AdSense, Giscus, (이전 스크립트용) Supabase URL과 anon key
- `scripts/build-search.mjs`는 `.env.local`이 없으면 `process.env`에서 읽는다 (Vercel 빌드)
- 빌드할 때 server가 떠 있어야 한다. API 호출이 실패하면 빈 목록으로 넘기지 않고 빌드가 실패한다

## 아키텍처 (client)

ko 단일 언어 블로그. 포스트는 server API에서 읽는다.

### 포스트 처리 (`client/lib/posts/`, 타입은 `client/types/post.ts`)

- `USE_SUPABASE`로 데이터 소스를 고른다. `false`(기본): `lib/posts/server.ts`(Spring API), `true`: `lib/posts/supabase.ts`(레거시, Supabase 직접 조회 결과를 새 타입으로 변환). `true`/`false`가 아닌 값은 에러
- 두 구현 모두 `PostsSource`(`lib/posts/types.ts`)를 `satisfies`로 맞춘다. 페이지는 `@/lib/posts`(`index.ts`)만 import하고 새 타입만 안다
- `scripts/build-search.mjs`도 같은 `USE_SUPABASE`로 분기한다
- 레거시(`supabase.ts`, 분기, `@supabase/supabase-js`, `NEXT_PUBLIC_SUPABASE_*`)는 Spring 운영이 안정되면 함께 지운다

server 구현 기준:
- `getAllPosts` → `GET /api/posts` (`PostListItem[]`: 요약형, `content` 없음. `summary`와 `readMinutes`는 서버가 계산)
- `getPostBySlug` → `GET /api/posts/{slug}` (`Post`: 본문 포함, 404면 `undefined`)
- `getAdjacentPosts` → `GET /api/posts/{slug}/adjacent` (`{ newer, older }`)
- 공개 조건(`is_published`, `deleted_at is null`)은 서버가 건다
- 404 말고 다른 응답 오류는 에러를 던진다 (빌드 실패)
- 날짜는 UTC ISO 문자열로 온다. 화면용 날짜는 `kstDate()`(`lib/post-meta.ts`)로 KST `YYYY-MM-DD`로 바꾼다
- `generateStaticParams`로 포스트 페이지를 정적 생성

### 라우팅

| URL | 파일 |
|-----|------|
| `/` | `client/app/page.tsx` |
| `/post/[slug]` | `client/app/post/[slug]/page.tsx` |
| `/simple` | `client/app/simple/page.tsx` (Tiptap 에디터) |
| `/write`, `/write/login` | `client/app/write/` (마크다운 글 작성, 이슈 #38) |
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

### 글 작성 (`/write`, 이슈 #38)

- `middleware.ts`가 세션 쿠키(`lib/write-auth.ts`, HMAC 서명)로 `/write`를 막고, 서버 액션(`app/write/actions.ts`)도 액션마다 세션을 다시 확인한다
- 에디터는 CodeMirror 6(`components/write/MarkdownEditor.tsx`, `next/dynamic` ssr false). 미리보기(`LivePreview.tsx`)는 `createArticleProcessor()`(`lib/markdown.ts`)를 브라우저에서 돌려 입력할 때마다 바로 그린다. 글 페이지와 같은 파이프라인이다. starry-night WASM은 `app/write/onig.wasm/route.ts`가 내려준다 (기본값은 esm.sh)
- `lib/markdown.ts`를 클라이언트에서 import하는 곳은 `/write`의 `LivePreview`뿐이다 (dynamic import라 공개 페이지 번들에는 안 들어간다)
- 저장: 서버 액션 → `POST /api/posts` (`Authorization: Bearer ADMIN_API_TOKEN`), 성공하면 `revalidatePath`

### 외부 통합

- **GA4**: `NEXT_PUBLIC_GA_ID` (`Analytics.tsx`, afterInteractive)
- **AdSense**: `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT` (포스트 본문 끝, 채워지지 않은 자리는 CSS로 숨김)
- **Giscus**: `NEXT_PUBLIC_GISCUS_*` (포스트 페이지, `noborder_light`/`noborder_dark`, 테마 전환 시 iframe에 postMessage)
- **Bootstrap Icons**: CDN (`layout.tsx <head>`)
