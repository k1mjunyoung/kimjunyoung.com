# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 환경 설정

- **Ruby 버전**: 3.4.4 (`.ruby-version` 파일 참조)
- **초기 설정**: `bundle install`

## 명령어

```bash
# 로컬 개발 서버 실행
bundle exec jekyll serve

# 프로덕션 빌드
bundle exec jekyll build

# 빌드 캐시 정리
bundle exec rake clean

# 테스트 실행 (HTMLProofer + 커스텀 JSON-LD 검증)
# 참고: test는 자동으로 clean + build를 먼저 실행함
bundle exec rake test

# PostgreSQL에서 ko/_posts/로 포스트 마이그레이션 (선택적)
bundle exec rake migrate          # 기존 파일 건너뜀
bundle exec rake migrate FORCE=1  # 기존 파일 덮어쓰기
```

## 아키텍처

remotework.jp를 포크한 다국어 Jekyll 정적 블로그(`en` / `ja` / `ko`).

### 다국어 구조

각 언어는 독립된 디렉토리에 인덱스 페이지와 `_posts/` 하위 디렉토리를 가진다:

```
en/index.md  (lang: en)   en/_posts/
ja/index.md  (lang: ja)   ja/_posts/
ko/index.md  (lang: ko)   ko/_posts/
```

언어는 front matter의 `page.lang`으로 감지된다. 모든 템플릿은 `lang` 값으로 `_data/translations.yml`을 참조한다. 루트 `/`는 `redirect.html`이 처리하며 브라우저 언어를 감지해 리다이렉트한다 (`ko` → `/ko`, `ja` → `/ja`, 기본값 → `/en`).

### 포스트 관리

**모든 포스트는 수동으로 작성 및 관리한다** (`en/_posts/`, `ja/_posts/`, `ko/_posts/`). 포스트는 다음 front matter 필드를 포함한다:

- `lang`: `en`, `ja`, `ko`
- `permalink`: `/[lang]/[slug]` (예: `/ko/my-post`)
- `title`: 포스트 제목
- `description`: 포스트 설명 (SEO용)
- `date`: 발행일 (YAML 날짜 형식)
- `categories`: 카테고리 (선택적)
- `redirect_from`: 구 URL 리다이렉트 별칭 (선택적, `jekyll-redirect-from` 플러그인 사용)

### SEO 및 메타데이터

`_config.yml`에 SEO 관련 설정이 구조화되어 있다:

- **author**: 작성자 정보 (`name`, `jobTitle`, `logo`)
- **images**: 소셜 미디어 이미지 (`ogImage`, `twitterCard`, `favicon`)
- **seo**: 사이트 설명(`description`) 및 키워드(`defaultKeywords`)
  - 각 언어(`en`, `ja`, `ko`)별 `description` 제공
  - JSON-LD 스키마에서 사용됨

### 검색

각 언어별로 Liquid로 생성되는 JSON 인덱스 파일(`search-en.json`, `search-ja.json`, `search-ko.json`)이 있으며, 해당 `lang`의 포스트만 포함한다. `_layouts/default.html`이 `simple-jekyll-search.js`를 통해 `/search-{{ lang }}.json`을 동적으로 로드한다. 새 언어를 추가할 때는 대응하는 `search-[lang].json`을 생성해야 한다.

### 번역

모든 UI 문자열은 `_data/translations.yml`에 언어 코드를 키로 저장된다. 새 키를 추가할 때는 `en`, `ja`, `ko` 세 언어 항목을 모두 작성해야 한다. `menuSwitcher` / `menuSwitcherLabel` 키는 현재 미사용 — 언어 전환은 `_includes/menu.html`에서 직접 처리한다.

### 레이아웃 및 인클루드

- `_layouts/default.html`: 루트 HTML 셸. 언어별 설정으로 SimpleJekyllSearch 초기화
- `_layouts/post.html`: 포스트 페이지. SEO 메타태그 및 JSON-LD 스키마 포함
- `_layouts/redirect.html`: 포스트별 리다이렉트(`jekyll-redirect-from`)와 루트 언어 감지 처리
- `_includes/posts.html`: `site.posts`를 `page.lang`으로 자동 필터링 — 언어 포스트 추가 시 수정 불필요
- `_includes/head.html`: JSON-LD 스키마 (포스트: Organization, 인덱스: WebSite), Google Analytics

### 테스트

`bundle exec rake test`는 다음을 실행한다:
1. `rake clean`: Jekyll 캐시 정리
2. `jekyll build`: 사이트 빌드
3. **HTMLProofer**: 링크, 이미지, Open Graph, Favicon 검증
4. **커스텀 JSON-LD 검증** (`_tests/json_ld_check.rb`): 모든 `<script type="application/ld+json">` 블록 유효성 검사

테스트는 의존성 체인으로 자동 실행되므로 별도로 빌드할 필요 없다.

### PostgreSQL 마이그레이션 (선택적)

`migrate_from_pg.rb` 스크립트는 PostgreSQL DB에서 `ko/_posts/`로 포스트를 마이그레이션한다.

**환경 변수**:
- `PG_HOST` (기본값: localhost)
- `PG_PORT` (기본값: 5432)
- `PG_DBNAME` (기본값: railway)
- `PG_USER` (기본값: postgres)
- `PG_PASSWORD` (기본값: postgres)

스크립트는 자동으로 컬럼을 감지하고 HTML을 Markdown으로 변환한다.

### 배포

**Cloudflare Pages**에 배포된다. Cloudflare Pages 설정:

| 설정                     | 값                    |
|------------------------|----------------------|
| Build command          | `jekyll build`       |
| Build output directory | `_site`              |
| Production branch      | `cf-pages`           |
| 환경 변수                  | `RUBY_VERSION=3.4.4` |

배포 프로세스:
1. `bundle install` (의존성 설치)
2. `jekyll build` (사이트 빌드)
3. `_site/` 디렉토리 배포
