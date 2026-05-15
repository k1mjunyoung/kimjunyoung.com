# Jekyll → Next.js 마이그레이션

## 현황 (2026-05-14 완료)

Jekyll 기반 블로그를 Next.js 15 + Tailwind v4로 마이그레이션 완료.

## 완료된 작업

- [x] Next.js 15 App Router + TypeScript + Tailwind v4 초기화 ([#10](https://github.com/k1mjunyoung/kimjunyoung.com/issues/10))
- [x] 디자인 토큰 이식 (`@theme` CSS vars, 다크모드 자동 전환) ([#11](https://github.com/k1mjunyoung/kimjunyoung.com/issues/11))
- [x] 마크다운 파이프라인 (`gray-matter` + `unified` + `rehype-prism-plus`) ([#12](https://github.com/k1mjunyoung/kimjunyoung.com/issues/12))
- [x] 컴포넌트 전체 구현 (Menu, Header, Search, PostList, PostCard, PostNav, Footer, Giscus, AdSense, Analytics) ([#13](https://github.com/k1mjunyoung/kimjunyoung.com/issues/13))
- [x] SEO (generateMetadata, JSON-LD, sitemap, robots) ([#14](https://github.com/k1mjunyoung/kimjunyoung.com/issues/14))
- [x] 검색 (`Fuse.js` + 빌드 타임 `public/search-ko.json` 생성) ([#15](https://github.com/k1mjunyoung/kimjunyoung.com/issues/15))
- [x] 포스트 정적 생성 (`generateStaticParams` — 19개 포스트) ([#16](https://github.com/k1mjunyoung/kimjunyoung.com/issues/16))
- [x] Jekyll 파일 전체 삭제 (layouts, includes, sass, data, Gemfile 등) ([#17](https://github.com/k1mjunyoung/kimjunyoung.com/issues/17))
- [x] 에셋 이전 (`assets/` → `public/assets/`) ([#18](https://github.com/k1mjunyoung/kimjunyoung.com/issues/18))
- [x] 배포 환경: **Vercel** (예정) ([#19](https://github.com/k1mjunyoung/kimjunyoung.com/issues/19))

## 현재 구조

```
ko/_posts/*.md          # 포스트 소스 (Supabase 전환 전까지 임시 유지)
src/app/                # Next.js App Router
public/assets/          # 이미지, PDF 등 정적 파일
scripts/build-search.mjs  # prebuild: public/search-ko.json 생성
```

## 다음 작업

- [ ] Vercel 배포 연결 및 프로덕션 검증 ([#8](https://github.com/k1mjunyoung/kimjunyoung.com/issues/8))
- [ ] 추후: Supabase로 포스트 소스 전환 (ko/_posts 제거) ([#9](https://github.com/k1mjunyoung/kimjunyoung.com/issues/9))
