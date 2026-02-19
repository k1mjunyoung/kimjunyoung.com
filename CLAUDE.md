# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 명령어

```bash
# 로컬 개발 서버 실행
bundle exec jekyll serve

# 프로덕션 빌드
bundle exec rake build

# 테스트 실행 (HTMLProofer + 커스텀 JSON-LD 검증)
bundle exec rake test

# README에서 포스트 자동 생성/갱신 (en/ja 전용)
bundle exec rake upsert_data_by_readme
```

## 아키텍처

remotework.jp를 포크한 다국어 Jekyll 정적 블로그(`en` / `ja` / `kr`).

### 다국어 구조

각 언어는 독립된 디렉토리에 인덱스 페이지와 `_posts/` 하위 디렉토리를 가진다:

```
en/index.md  (lang: en)   en/_posts/
ja/index.md  (lang: ja)   ja/_posts/
kr/index.md  (lang: kr)   kr/_posts/
```

언어는 front matter의 `page.lang`으로 감지된다. 모든 템플릿은 `lang` 값으로 `_data/translations.yml`을 참조한다. 루트 `/`는 `redirect.html`이 처리하며 브라우저 언어를 감지해 리다이렉트한다 (`ko` → `/kr`, `ja` → `/ja`, 기본값 → `/en`).

### 자동 생성 포스트 (en/ja 전용)

`en/_posts/`와 `ja/_posts/`는 `upsert_data_by_readme.rb`가 README 테이블 데이터를 파싱해 **자동 생성**한다. 이 파일들을 직접 수정하면 다음 실행 시 덮어써진다. `kr/_posts/`의 한국어 포스트는 수동으로 작성한다.

포스트 front matter 주요 필드:
- `lang`: `en`, `ja`, `kr`
- `permalink`: `/[lang]/[domain-slug]` (예: `/en/corp-sansan_com`)
- `domain`: `post.html`에서 언어 간 교차 링크 생성에 사용되는 공개 도메인
- `categories`: `full_remote` 및/또는 `ja_required` (태그로 표시)
- `redirect_from`: `jekyll-redirect-from` 플러그인이 처리하는 구 URL 별칭

### 검색

각 언어별로 Liquid로 생성되는 JSON 인덱스 파일(`search-en.json`, `search-ja.json`, `search-kr.json`)이 있으며, 해당 `lang`의 포스트만 포함한다. `_layouts/default.html`이 `simple-jekyll-search.js`를 통해 `/search-{{ lang }}.json`을 동적으로 로드한다. 새 언어를 추가할 때는 대응하는 `search-[lang].json`을 생성해야 한다.

### 번역

모든 UI 문자열은 `_data/translations.yml`에 언어 코드를 키로 저장된다. 새 키를 추가할 때는 `en`, `ja`, `kr` 세 언어 항목을 모두 작성해야 한다. `menuSwitcher` / `menuSwitcherLabel` 키는 현재 미사용 — 언어 전환은 `_includes/menu.html`에서 직접 처리한다.

### 레이아웃 및 인클루드

- `_layouts/default.html`: 루트 HTML 셸. 언어별 설정으로 SimpleJekyllSearch 초기화
- `_layouts/post.html`: 포스트 페이지. `domain` 필드로 en/ja 관련 포스트를 감지해 교차 언어 링크 제공 (kr은 교차 링크 없음)
- `_layouts/redirect.html`: 포스트별 리다이렉트(`jekyll-redirect-from`)와 루트 언어 감지 처리
- `_includes/posts.html`: `site.posts`를 `page.lang`으로 자동 필터링 — 언어 포스트 추가 시 수정 불필요
- `_includes/head.html`: JSON-LD 스키마 (포스트: Organization, 인덱스: WebSite), Google Analytics

### 테스트

`bundle exec rake test`는 HTMLProofer와 커스텀 `_tests/json_ld_check.rb`(모든 `<script type="application/ld+json">` 블록 유효성 검사)를 실행한다. 테스트 전에 반드시 빌드(`jekyll build`)가 선행되어야 한다.

### 배포

모든 push/PR에서 CI가 빌드하고, `main` 브랜치 병합 시 GitHub Pages(`gh-pages` 브랜치)에 배포한다. 배포 잡은 빌드 전에 `upsert_data_by_readme`를 실행하고 생성된 포스트를 봇 커밋으로 자동 저장한다.
