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
- **스타일**: TailwindCSS v4 (`@theme` CSS vars), shadcn/ui, SCSS(Tiptap 컴포넌트)
- **마크다운**: `gray-matter` + `unified` 파이프라인 (`rehype-starry-night` 코드 하이라이트)
- **에디터**: Tiptap (`/simple` 페이지)
- **데이터**: Supabase (`@supabase/supabase-js`)
- **검색**: Fuse.js + `public/search-ko.json` (prebuild 생성)
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

- `getAllPosts`, `getPostBySlug`, `getPrevNext`가 Supabase `post` 테이블을 조회
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

### 스타일

- `client/styles/globals.css`: Tailwind v4 `@theme` 토큰 + base 스타일 + 폰트. `.dark`에 One Dark Pro 기반 팔레트 정의
- `client/styles/article.css`: 마크다운 article 전용 스타일 (포스트 페이지에서만 import)
- 다크모드: `next-themes`(`Providers.tsx`)가 `html`에 `dark` 클래스를 붙이는 방식, 기본값은 시스템 설정 (사이트 UI에 토글은 없음)

### 외부 통합

- **GA4**: `NEXT_PUBLIC_GA_ID` (`Analytics.tsx`, afterInteractive)
- **AdSense**: `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT` (포스트 페이지)
- **Giscus**: `NEXT_PUBLIC_GISCUS_*` (포스트 페이지, 다크모드에 따라 테마 전환)
- **Bootstrap Icons**: CDN (`layout.tsx <head>`)
