# Spring Boot 백엔드 이전

## 상태: 진행 중 (`migrate-to-spring` 브랜치)

## 목표

- 저장소를 모노레포로 바꾸고 프론트엔드(`client`)와 백엔드(`server`)를 분리한다.
- 지금은 프론트가 Supabase를 직접 조회한다. 이를 Spring Boot API 경유로 바꾼다.

## 목표 구조

```
client/    # Next.js 15 (기존 코드 이동 완료)
server/    # Spring Boot 4.0.9, Java 17, Gradle (Initializr 기본 틀 추가 완료)
supabase/  # DB 스키마 마이그레이션 (스키마 관리는 이곳 한 곳에서)
docs/      # 문서
ko/        # 예전 마크다운 원본 (일회성 이전 스크립트 입력, 코드에서는 미사용)
```

## 완료

- [x] Next.js 코드를 `client/`로 이동 (`git mv`로 히스토리 유지)
- [x] 문서를 `docs/`로 이동 (`CLAUDE.md`, `README*`는 루트 유지)
- [x] `server/`에 Spring Boot 프로젝트 추가 (Web MVC, Data JPA, Validation, PostgreSQL, Lombok)
- [x] `CLAUDE.md`, README 갱신

## 남은 작업

- [ ] `server/src/main/resources/application.yaml`에 datasource 설정 추가 (Supabase Postgres JDBC 연결, 비밀번호는 환경변수)
- [ ] JPA는 `ddl-auto: none` 또는 `validate`로 두기 (스키마는 `supabase/migrations`가 관리)
- [ ] 패키지와 group 이름 정리 (`server`, `com.example` → 예: `com.kimjunyoung.server`)
- [ ] `post` 조회 API 구현 (목록, slug 조회, 이전/다음)
- [ ] `client/lib/posts.ts`를 Supabase 직접 호출에서 서버 API 호출로 교체
- [ ] `client/scripts/build-search.mjs`도 서버 API를 쓰도록 변경 여부 결정
- [ ] Vercel 프로젝트의 Root Directory를 `client`로 변경 (머지 전에 확인)
- [ ] 서버 배포 위치 결정 (미정)
- [ ] Supabase에 anon key로 직접 접근하는 경로를 막을지 결정 (RLS 정책 포함)
- [ ] Spring Boot 4.1.x로 올릴지 결정 (현재 4.0.9)

## 참고

- 빌드 확인: `client`의 `npm run build`는 prebuild에서 Supabase를 호출한다. 2026-11-04 시점에 Supabase 쪽 SSL 오류(Cloudflare 526)로 실패해 `next build` 단계는 확인하지 못했다. 복구 후 다시 확인이 필요하다.
