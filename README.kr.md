# kimjunyoung.com

> [English Documentation](README.md)

한국어 개인 블로그입니다. Next.js 프론트엔드와 Spring Boot 백엔드로 구성된 모노레포이며, 백엔드 이전을 진행 중입니다.

## 저장소 구조

```
client/    # Next.js 15 프론트엔드
server/    # Spring Boot 백엔드 (Gradle)
supabase/  # DB 마이그레이션
```

## 기술 스택

### client

- **프레임워크**: Next.js 15 (App Router) + React 19 + TypeScript
- **스타일**: TailwindCSS v4 (`@theme` CSS 변수)
- **마크다운**: `gray-matter` + `unified` 파이프라인 (`rehype-starry-night` 코드 하이라이트)
- **데이터**: Supabase
- **검색**: `⌘K` / `/` 검색 팔레트 + `public/search-ko.json` (prebuild 시 자동 생성)
- **배포**: Vercel

### server

- Spring Boot 4.0.9, Java 17, Gradle
- Spring Web MVC, Data JPA, Validation, PostgreSQL

## 설치 및 실행

### client

1. 저장소를 클론합니다
2. `client/.env.example`을 참고해 `client/.env.local`을 만듭니다
3. 의존성을 설치하고 실행합니다:
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. 프로덕션 빌드:
   ```bash
   npm run build
   ```
   prebuild 단계에서 `public/search-ko.json`이 자동으로 생성됩니다.

5. 검색 인덱스만 재생성:
   ```bash
   node scripts/build-search.mjs
   ```

### server

```bash
cd server
./gradlew build
./gradlew bootRun
```

아직 DB 연결 설정이 없어서, datasource 설정을 추가하기 전에는 `bootRun`이 시작되지 않습니다.

## Vercel 배포

GitHub 저장소를 Vercel에 연결하고 **Root Directory**를 `client`로 지정해야 합니다. 지정하지 않으면 Vercel이 저장소 루트에서 Next.js 프로젝트를 찾지 못합니다.

## 포스트

포스트는 런타임에 Supabase를 통해 불러옵니다. 포스트 조회를 Spring Boot API 경유로 바꾸는 작업이 진행 중입니다.

## 라이선스

이 테마는 [MIT 라이선스](https://opensource.org/licenses/MIT) 조건에 따라 오픈 소스로 제공됩니다.
