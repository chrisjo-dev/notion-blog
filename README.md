# Notion Blog

Notion을 CMS로 사용하는 개인 블로그 시스템입니다. Astro 정적 사이트 빌더와 GitHub Pages를 통해 무료로 호스팅됩니다.

## 주요 기능

- ✨ **Notion을 CMS로 사용**: Notion 페이지를 블로그 콘텐츠로 자동 변환
- 🔄 **자동 동기화**: 10분마다 Notion 콘텐츠 자동 업데이트 (GitHub Actions)
- ⚡ **빠른 정적 사이트**: Astro 기반으로 최적화된 성능
- 🎨 **모던 UI/UX**: Astrofy 기반의 깔끔한 디자인
  - 다크모드 지원 (자동 전환)
  - 반응형 그리드 레이아웃
  - 블루 계열 액센트 컬러
- 💬 **GitHub 댓글 시스템**: Giscus를 통한 댓글 기능
- 🔍 **SEO 최적화**: sitemap, meta tags, Open Graph, JSON-LD
- 📸 **이미지 자동 관리**: Notion 이미지 자동 다운로드 및 로컬 저장
- 🚀 **무료 호스팅**: GitHub Pages 자동 배포

## 시작하기

### 1. Notion Integration 생성

1. [Notion Integrations](https://www.notion.so/my-integrations) 페이지로 이동
2. "New integration" 클릭
3. 이름 입력 후 "Submit" 클릭
4. "Internal Integration Token" 복사 (이것이 `NOTION_TOKEN`입니다)

### 2. Notion 페이지 설정

1. Notion에서 블로그의 **루트 페이지** 생성
   - 일반 페이지를 생성합니다
   - 이 페이지의 하위 페이지들이 블로그 글이 됩니다
   - 예: "Blog" 또는 "Posts" 같은 이름의 페이지

2. 루트 페이지에 하위 페이지 추가
   - 루트 페이지 안에서 새 페이지를 만들면 블로그 글이 됩니다
   - 각 하위 페이지가 하나의 블로그 게시글이 됩니다

3. 루트 페이지에 Integration 연결
   - 루트 페이지 우측 상단 "..." 클릭
   - "Add connections" 선택
   - 생성한 Integration 선택

4. 루트 페이지 ID 복사
   - 페이지 URL에서 ID 추출
   - URL 형식: `https://www.notion.so/Page-Name-{PAGE_ID}?v=...`
   - `PAGE_ID` 부분을 복사 (32자의 16진수 문자열, 하이픈 포함/제외 모두 가능)

### 3. GitHub Repository 설정

1. 이 저장소를 GitHub에 푸시

2. Repository Settings → Secrets and variables → Actions로 이동

3. 다음 Secrets 추가:
   - `NOTION_TOKEN`: Notion Integration Token
   - `NOTION_ROOT_PAGE_ID`: Notion 루트 페이지 ID
   - `SITE_URL` (선택): 사이트 URL (예: `https://yourusername.github.io/blog`)

4. Repository Settings → Pages로 이동
   - Source: "GitHub Actions" 선택

5. Repository Settings → General로 이동
   - Workflow permissions에서 "Read and write permissions" 선택
   - "Allow GitHub Actions to create and approve pull requests" 체크

### 4. 설정 파일 수정

다음 파일들을 본인의 정보로 수정:

#### `astro.config.mjs`
```javascript
export default defineConfig({
  site: 'https://yourusername.github.io',  // 본인의 GitHub Pages URL
  base: '/blog',  // Repository 이름 (루트 도메인이면 '/' 사용)
  // ...
});
```

#### `public/robots.txt`
```
Sitemap: https://yourusername.github.io/blog/sitemap-index.xml
```

#### `src/pages/posts/[...slug].astro`
```astro
article={{
  publishedTime: post.data.date,
  modifiedTime: post.data.date,
  author: 'Your Name',  // 본인의 이름으로 변경
}}
```

### 5. 배포

1. 변경사항 커밋 및 푸시:
```bash
git add .
git commit -m "Initial setup"
git push origin main
```

2. GitHub Actions에서 자동으로 동기화 및 배포가 시작됩니다
3. Actions 탭에서 진행 상황 확인
4. 완료 후 `https://yourusername.github.io/blog` 에서 블로그 확인

## 로컬 개발

### 환경 설정

1. `.env` 파일 생성:
```bash
cp .env.example .env
```

2. `.env` 파일 편집:
```env
NOTION_TOKEN=your_notion_integration_token
NOTION_ROOT_PAGE_ID=your_root_page_id
SITE_URL=http://localhost:4321
```

### 개발 서버 실행

```bash
# 의존성 설치
npm install

# Notion 동기화
npm run sync

# 개발 서버 시작
npm run dev
```

브라우저에서 `http://localhost:4321` 접속

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 댓글 시스템 설정 (Giscus)

이 블로그는 [Giscus](https://giscus.app)를 사용하여 GitHub Discussions 기반의 댓글 시스템을 제공합니다.

### Giscus 설정 방법

1. **GitHub Repository에 Discussions 활성화**
   - Repository Settings → General → Features
   - "Discussions" 체크박스 활성화

2. **Giscus 앱 설치**
   - [giscus.app](https://giscus.app)에 접속
   - 페이지 하단의 "Configuration" 섹션으로 스크롤
   - Repository 입력: `your-username/your-repo`
   - Page ↔️ Discussions Mapping: "pathname" 선택
   - Discussion Category: "Announcements" 또는 원하는 카테고리 선택

3. **설정값 복사**
   - giscus.app에서 자동 생성된 스크립트에서 다음 값들을 확인:
     - `data-repo`: Repository 이름
     - `data-repo-id`: Repository ID
     - `data-category`: Category 이름
     - `data-category-id`: Category ID

4. **Comments.astro 파일 수정**
   ```typescript
   // src/components/Comments.astro 파일에서 다음 부분을 수정:
   const GISCUS_CONFIG = {
     repo: 'your-username/your-repo', // ⚠️ 여기에 실제 repo 이름 입력
     repoId: 'YOUR_REPO_ID', // ⚠️ giscus.app에서 복사한 값
     category: 'Announcements', // 원하는 카테고리
     categoryId: 'YOUR_CATEGORY_ID', // ⚠️ giscus.app에서 복사한 값
     // ... 나머지 설정은 기본값 사용
   };
   ```

5. **테스트**
   - 로컬 개발 서버 실행: `npm run dev`
   - 게시글 페이지로 이동
   - 하단에 Giscus 댓글 섹션이 표시되는지 확인
   - GitHub 로그인 후 댓글 작성 테스트

### 주의사항

- 댓글은 GitHub Discussions에 저장되므로, 사용자는 GitHub 계정으로 로그인해야 합니다
- 댓글은 공개되며 Repository의 Discussions에서 관리할 수 있습니다
- 다크모드 전환 시 Giscus 테마도 자동으로 변경됩니다

## 작동 방식

### 동기화 프로세스

1. **10분마다 자동 실행** (또는 수동 트리거)
2. Notion API를 통해 루트 페이지의 하위 페이지들을 조회
3. 각 하위 페이지를 Markdown으로 변환
4. 이미지 다운로드 및 로컬 저장
5. 프론트매터와 함께 `src/content/posts/`에 저장
6. 변경사항이 있으면 자동 커밋 및 푸시
7. 변경사항 감지 시 빌드 및 배포

### URL 구조

- 홈: `/`
- 게시글: `/posts/{slug}/`
- Slug는 제목에서 자동 생성
- 중복 제목은 `-2`, `-3` 등의 suffix 추가

### 날짜 정책

- Notion의 `last_edited_time` 사용
- 게시글 수정 시 날짜 자동 업데이트
- 내림차순 정렬 (최신글이 위로)

## 디렉토리 구조

```
notion-blog/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 워크플로
├── public/
│   ├── images/
│   │   └── notion/            # Notion 이미지 저장소
│   └── robots.txt             # 검색엔진 크롤러 설정
├── scripts/
│   └── notion-sync.js         # Notion 동기화 스크립트
├── src/
│   ├── content/
│   │   ├── config.ts          # Content collection 스키마
│   │   └── posts/             # 블로그 글 (Markdown)
│   ├── layouts/
│   │   └── Layout.astro       # 기본 레이아웃 (SEO 포함)
│   └── pages/
│       ├── index.astro        # 홈페이지 (글 목록)
│       └── posts/
│           └── [...slug].astro # 글 상세 페이지
├── astro.config.mjs           # Astro 설정
├── package.json
├── tsconfig.json
└── .env.example               # 환경 변수 예시
```

## Notion 페이지 구조

루트 페이지 구조:
```
📄 Blog (루트 페이지)
  ├── 📄 첫 번째 글
  ├── 📄 두 번째 글
  └── 📄 세 번째 글
```

각 페이지에서 자동 추출:
- **제목**: 페이지 제목
- **날짜**: `last_edited_time` 사용
- **설명**: 본문 첫 150자 자동 추출
- **Slug**: 제목에서 자동 생성

## SEO 최적화

자동 생성되는 SEO 요소:
- Meta tags (title, description)
- Open Graph tags (Facebook, LinkedIn 등)
- Twitter Card tags
- JSON-LD structured data (Article schema)
- Canonical URLs
- Sitemap.xml
- Robots.txt

## Google Search Console 등록

1. [Google Search Console](https://search.google.com/search-console) 접속
2. 속성 추가: 사이트 URL 입력
3. 소유권 확인 (HTML 파일 업로드 또는 메타 태그 방식)
4. Sitemap 제출: `https://yourusername.github.io/blog/sitemap-index.xml`

## 문제 해결

### 빌드 실패

1. GitHub Actions → Actions 탭에서 에러 로그 확인
2. Secrets가 올바르게 설정되었는지 확인
3. Notion Integration이 데이터베이스에 연결되었는지 확인

### 동기화가 안 됨

1. `NOTION_TOKEN`과 `NOTION_ROOT_PAGE_ID`가 올바른지 확인
2. Notion Integration이 루트 페이지에 연결되었는지 확인
3. 루트 페이지 ID가 올바른지 확인 (페이지 URL에서 확인)
4. 루트 페이지에 하위 페이지가 있는지 확인

### 이미지가 안 보임

1. Notion 이미지 URL이 만료되었을 수 있음 (재동기화 필요)
2. 이미지 다운로드 권한 확인
3. GitHub Pages에 이미지가 올바르게 배포되었는지 확인

## 고급 설정

### 수동 동기화

GitHub Actions 탭에서 "Deploy to GitHub Pages" 워크플로를 선택하고 "Run workflow" 클릭

### 동기화 주기 변경

`.github/workflows/deploy.yml`의 cron 설정 수정:
```yaml
schedule:
  - cron: '*/10 * * * *'  # 10분마다 (기본값)
  # - cron: '0 * * * *'    # 매시간
  # - cron: '0 0 * * *'    # 매일 자정
```

### 커스텀 도메인 사용

1. Repository Settings → Pages → Custom domain에 도메인 입력
2. DNS 설정에서 CNAME 레코드 추가
3. `astro.config.mjs`의 `site`와 `base` 수정
4. `public/CNAME` 파일 생성 (도메인 이름 입력)

## 라이선스

MIT License

## 기여

이슈와 PR을 환영합니다!
