# Changelog

## 2026-03-17 — SEO 종합 최적화

### 추가
- 게시글별 OG 이미지: 본문 첫 이미지를 `og:image`로 사용, 없으면 기본 이미지 fallback
- RSS 피드 생성 (`/rss.xml`) — `@astrojs/rss` 사용
- `<link rel="alternate" type="application/rss+xml">` 태그 추가
- BreadcrumbList JSON-LD 구조화 데이터 (게시글, 카테고리 페이지)
- Article JSON-LD에 `publisher`, `mainEntityOfPage`, `keywords` 필드 추가
- Naver 검색 등록용 `naver-site-verification` 메타 태그 (플레이스홀더)
- 기본 OG 이미지 (`public/og-image.png`, 1200x630)

### 변경
- `getCategorySlug()` 유틸리티 추출 — 4곳에 중복되던 슬러그 로직을 `src/utils/post.ts`로 통합
- `isBlogPost()` 유틸리티 추출 — 7곳에 중복되던 포스트 필터 로직을 `src/utils/post.ts`로 통합
- `getThumbnail()` null-safe 처리 (body가 undefined인 카테고리 페이지 대응)
- 게시글 author를 `'Your Name'`에서 `'Chris'`로 수정

### 파일 변경 요약
| 파일 | 변경 |
|------|------|
| `package.json` | `@astrojs/rss` 의존성 추가 |
| `public/og-image.png` | 기본 OG 이미지 생성 |
| `src/utils/post.ts` | `getCategorySlug()`, `isBlogPost()` 추가, `getThumbnail()` null-safe |
| `src/layouts/Layout.astro` | Props 확장, 동적 og:image, Naver 메타, RSS 링크, JSON-LD 개선 |
| `src/pages/posts/[...slug].astro` | ogImage/keywords/breadcrumbs 전달, author 수정, 공유 유틸 사용 |
| `src/pages/category/[category].astro` | breadcrumbs 전달, 공유 유틸 사용 |
| `src/pages/index.astro` | `isBlogPost` 유틸 사용 |
| `src/pages/page/[page].astro` | `isBlogPost` 유틸 사용 |
| `src/pages/archive.astro` | `isBlogPost` 유틸 사용 |
| `src/components/CategorySidebar.astro` | 공유 유틸 사용 |
| `src/pages/rss.xml.ts` | RSS 피드 엔드포인트 신규 생성 |
