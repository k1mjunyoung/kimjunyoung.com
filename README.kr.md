# kimjunyoung.com

> [English Documentation](README.md)

Next.js 15 App Router 기반 한국어 개인 블로그입니다.

## 기술 스택

- **프레임워크**: Next.js 15 (App Router) + TypeScript
- **스타일**: TailwindCSS v4 (`@theme` CSS 변수)
- **마크다운**: `gray-matter` + `unified` 파이프라인 (`rehype-starry-night` 코드 하이라이트)
- **검색**: Fuse.js + `public/search-ko.json` (prebuild 시 자동 생성)
- **배포**: Vercel

## 설치 및 실행

1. 저장소를 클론합니다
2. 의존성을 설치하고 실행합니다:
   ```bash
   npm install
   npm run dev
   ```

3. 프로덕션 빌드:
   ```bash
   npm run build
   ```
   prebuild 단계에서 `public/search-ko.json`이 자동으로 생성됩니다.

4. 검색 인덱스만 재생성:
   ```bash
   node scripts/build-search.mjs
   ```

## Vercel 배포

GitHub 저장소를 Vercel에 연결하면 됩니다. Next.js를 자동으로 감지하므로 별도의 빌드 설정이 필요하지 않습니다.

## 포스트

포스트는 런타임에 Supabase API를 통해 불러옵니다.

## 라이선스

이 테마는 [MIT 라이선스](https://opensource.org/licenses/MIT) 조건에 따라 오픈 소스로 제공됩니다.
