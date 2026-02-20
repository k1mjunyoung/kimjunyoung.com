# kimjunyoung.com

> [English Documentation](README.md)

remotework.jp를 포크한 다국어 Jekyll 정적 블로그입니다. 한국어, 영어, 일본어를 지원합니다.

## 설치 및 실행

1. 저장소를 클론합니다
2. 의존성을 설치하고 실행합니다:
   ```bash
   bundle install
   bundle exec jekyll serve
   ```

## Cloudflare Pages 배포

### 사전 요구사항

- Cloudflare 계정
- Cloudflare Pages에 연결된 GitHub 저장소

### 빌드 설정

Cloudflare Pages 프로젝트 설정에서 다음과 같이 설정합니다:

| 설정 항목 | 값 |
|---------|-----|
| 빌드 명령어 | `jekyll build` |
| 빌드 출력 디렉토리 | `_site` |
| 프로덕션 브랜치 | `main` |

### 환경 변수

Cloudflare Pages 대시보드에서 다음 환경 변수를 추가합니다:

| 변수명 | 값 | 비고 |
|-------|-----|------|
| `RUBY_VERSION` | `3.4.4` | `.ruby-version` 파일과 일치해야 함 |

**중요:** 이 프로젝트의 `.ruby-version` 파일은 Ruby 3.4.4를 지정합니다. `RUBY_VERSION` 환경 변수가 이 버전과 일치하는지 확인하세요.

### 빌드 프로세스

Cloudflare Pages는 다음 단계로 빌드를 수행합니다:
1. 의존성 설치: `bundle install`
2. Jekyll 사이트 빌드: `jekyll build`
3. `_site/` 디렉토리 배포

모든 포스트는 `en/_posts/`, `ja/_posts/`, `ko/_posts/` 디렉토리에서 수동으로 관리됩니다.

## 지원 언어

- 한국어 (Korean)
- 영어 (English)
- 일본어 (Japanese)

## 카테고리

1. 완전 원격 근무: `full_remote`
2. 일본어 필수 원격 근무: `ja_required`

## 번역 기여

누락된 번역을 추가해주시면 감사하겠습니다.

- `/_data/translations.yml` 파일에서
- 번역 키에 누락된 언어(`ko`, `en`, `ja`)의 번역을 추가하세요

## 라이선스

이 테마는 [MIT 라이선스](https://opensource.org/licenses/MIT) 조건에 따라 오픈 소스로 제공됩니다.
