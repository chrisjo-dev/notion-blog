---
title: "gitOps Repo 전략"
description: "다음은 앱 소스 레포(app repository)와 앱 매니페스트 레포(app manifest / GitOps 레포)를 분리해 운영할 때의 실전 전략입니다. (Argo CD + Jenkins/GitHub Actions + Harbor 기준, Gitea/내부 레지스트리/..."
date: "2025-12-27T12:43:00.000Z"
notionId: "2d6ea3deaa2b8030a47fe5f97ab4eac0"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "gitOps Repo 전략"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---


다음은 앱 소스 레포(app repository)와 앱 매니페스트 레포(app manifest / GitOps 레포)를 분리해 운영할 때의 실전 전략입니다. (Argo CD + Jenkins/GitHub Actions + Harbor 기준, Gitea/내부 레지스트리/운영망까지 고려)


# 1) 역할 분리 원칙 (CI vs CD)

- **App Repo (CI 담당)**

    소스 코드, 테스트, 빌드, 컨테이너 이미지 푸시, SBOM/취약점 스캔, 릴리스 태깅.

- **Manifest Repo (CD 담당)**

    쿠버네티스 배포 정의(Kustomize/Helm), 환경별 오버레이(dev/stage/prod), 승인/프로모션(승급) 히스토리.

> 장점: 배포 이력과 코드 이력을 명확히 분리, 운영망 접근권한 최소화, 롤백/감사 용이.

---


# 2) 저장소 구조 권장안


## App Repo (예: `org/app-foo`)


```plain text
app-foo/
 ├─ src/
 ├─ tests/
 ├─ Dockerfile
 ├─ .github/workflows/ci.yaml  # 또는 Jenkinsfile
 ├─ charts/app-foo/            # (옵션) Helm 차트 포함 시
 ├─ VERSION                    # 1.4.2 같은 세만틱 버전
 └─ release-please.json        # (옵션) 자동 버전/체인지로그
```


## Manifest Repo (예: `org/gitops-platform`)


```plain text
gitops-platform/
 ├─ apps/
 │   └─ app-foo/
 │       ├─ base/                  # 공통 (네임스페이스, 기본 리소스)
 │       │   ├─ kustomization.yaml
 │       │   └─ deployment.yaml    # 이미지 tag 또는 digest만 바뀜
 │       └─ overlays/
 │           ├─ dev/
 │           │   ├─ kustomization.yaml
 │           │   └─ values-dev.yaml     # Helm 쓰면 values
 │           ├─ stage/
 │           └─ prod/
 └─ argocd/
     └─ projects-and-apps/         # Argo CD App / Project 선언
```

> Helm을 쓰면 base에 Chart.yaml/values.yaml를 두고 각 overlay에서 values-*.yaml로 덮어씁니다.
>
> Kustomize면 `images:` 또는 `patches`로 이미지 버전만 바꿔 배포.
>
>

---


# 3) 브랜치/환경 전략

- **Manifest Repo**
    - `main`: 운영 소스(최종 진실).
    - `env/dev`, `env/stage`, `env/prod` 브랜치를 별도 운영하거나, 단일 브랜치 + `overlays/dev|stage|prod` 디렉터리로 운영.
    - **권장**: 단일 브랜치 + overlay 폴더. 환경 간 **프로모션은 PR 머지**로만 진행.
- **App Repo**
    - `main`: 안정화된 개발 라인(또는 trunk based).
    - 태그(`v1.4.2`) 기준으로 이미지 빌드/푸시 → Manifest Repo에 **자동 PR** 생성.

---


# 4) 이미지 버전 고정 방식 (태그 vs 다이제스트)

- **권장: 이미지 다이제스트(pin by digest)**

    예) `image: harbor.local/library/app-foo@sha256:abcd...`

    - 재현성↑, 서프라이즈 업데이트↓.
- 태그 병행 시: `1.4.2`로 사람이 읽기 쉬움 + PR 제목/본문에 digest 기록.

### Kustomize 예시


```yaml
# overlays/dev/kustomization.yaml
images:
  - name: harbor.local/library/app-foo
    newName: harbor.local/library/app-foo
    newTag: v1.4.2   # 또는 digest로 고정
```


### Helm values 예시


```yaml
# overlays/dev/values-dev.yaml
image:
  repository: harbor.local/library/app-foo
  tag: v1.4.2
  # digest 사용 시: tag 대신 digest: "sha256:abcd..."
```


---


# 5) 배포 파이프라인 (권장 “골든 패스”)

1. **App Repo CI**
    - PR → 테스트/빌드 → 이미지 푸시(Harbor) → SBOM 생성 → 취약점 스캔 통과 시
    - `vX.Y.Z` 태깅 & GitHub Release(또는 Gitea Release)
    - **Manifest Repo에 자동 PR 생성**
        - 변경점: `overlays/dev`의 이미지 tag/digest 업데이트
        - PR 제목: `chore(app-foo): bump to v1.4.2 (sha256:abcd)`
        - PR 본문: 체인지로그/릴리스 노트, SBOM 링크, 스캔 결과 요약
2. **Manifest Repo**
    - 리뷰/승인(CODEOWNERS: 운영자 필수 리뷰)
    - 머지되면 Argo CD가 `dev`에 **자동 동기화**
    - **스모크 테스트** 후, `stage`로 **프로모션 PR 생성** (봇 또는 사람)
    - `stage` 검증(Peformance/E2E/합의) 후, `prod`로 **최종 프로모션 PR** → 머지 → 자동 배포
> 핵심: 환경 승급은 오직 Git PR/머지로만. Argo CD는 Auto-Sync는 켜되, 승급 자체는 수동 승인(머지)로 통제.

---


# 6) Argo CD 설정 포인트


### App of Apps (옵션)

- `argocd/projects-and-apps/`에서 여러 앱을 한 방에 선언(폴더 스캔/디렉토리 Helm/Kustomize).

### Argo CD Image Updater (대안)

- 태그 규칙으로 이미지 새 버전 감지 → values/kustomize 자동 갱신 → **Manifest Repo에 PR 생성**

    (직접 바로 적용도 가능하지만, **PR 생성 모드**가 감사/통제에 안전)


### 예시: Image Updater 주석(Helm)


```yaml
metadata:
  annotations:
    argocd-image-updater.argoproj.io/image-list: app-foo=harbor.local/library/app-foo
    argocd-image-updater.argoproj.io/app-foo.update-strategy: latest
    argocd-image-updater.argoproj.io/write-back-method: git
    argocd-image-updater.argoproj.io/git-branch: main
```


---


# 7) 권한/보안/감사

- **Manifest Repo**
    - `CODEOWNERS`: `overlays/prod`는 SRE/운영팀만 승인 가능.
    - 브랜치 보호: `main` 보호, 필수 리뷰 2인, 서명 커밋(옵션).
    - 시크릿은 External Secrets / SealedSecrets / SOPS로 관리.
- **App Repo**
    - 런타임 보안: SBOM(Syft), 취약점(Trivy/Grype), 서명(Cosign), 프로비넌스(SLSA 레벨 목표).
- **Argo CD**
    - 프로젝트로 네임스페이스/리소스 스코프 제한, 네트워크 세분화.

---


# 8) 다중 레지스트리/망(Dev Gitea ↔ eCAMS ↔ Prod Gitea) 동기화

- **단방향 미러링 규칙**을 명확히:
    - 소스 진실(SSOT)은 어디인가? 일반적으로 **Manifest Repo는 운영망의 Gitea**를 SSOT로.
    - 개발망에서 생성된 PR/커밋은 **미러봇**이 eCAMS → 운영 Gitea로 **PR로 전달**(직접 푸시는 금지).
    - 릴리스 아티팩트(이미지)는 Harbor(dev) → Harbor(prod)로 **프로모션 시점에 리태그/카피**.
    - 네트워크 정책상 eCAMS만 양쪽과 연결된다면:

        Dev Gitea ↔ **eCAMS (중계)** ↔ Prod Gitea, Dev Harbor ↔ **eCAMS 캐시/프록시** ↔ Prod Harbor.

> 핵심: 운영망은 Pull 기반, 외부에서 직접 Push 금지. 변경은 항상 PR/승인/머지 경로만 통과.

---


# 9) 프로모션 정책(승급 기준)

- Dev → Stage: 단위/통합/E2E 통과 + 베이직 퍼포먼스 OK + 보안 스캔 통과.
- Stage → Prod: 변경 영향도/릴리스 노트 승인 + 운영 점검표 체크 + 창구 승인(변경관리 CAB).
- 모든 승급은 Manifest Repo PR로 기록(체인지로그, 이미지 digest, SBOM 링크, 릴리스 노트 첨부).

---


# 10) 멀티테넌트(30테넌트) 대응

- **폴더형 오버레이**:

```plain text
apps/app-foo/overlays/
 ├─ dev-tenant-01/
 ├─ dev-tenant-02/
 ...
 └─ prod-tenant-30/
```

- 공통 베이스 + 테넌트별 `values-tenant.yaml` 또는 Kustomize patch로
    - 도메인, 리소스쿼터, 환경변수, 비밀키, 버전 고정 등 분리.
- 테넌트 일괄 승급: 멀티-PR 생성 스크립트(레포 액션)로 배치 변경.

---


# 11) 자동화 훅(샘플)


### CI가 Manifest PR을 여는 스크립트 개요

1. App Repo에서 빌드/푸시 후 `IMAGE_TAG`/`DIGEST` 산출
2. Manifest Repo 클론 → 대상 overlay(`overlays/dev/...`) 파일 수정
3. 브랜치 생성 → 커밋 메시지: `chore(app-foo): bump to v1.4.2 (sha256:...)`
4. PR 생성(검증 결과/릴리스노트/SBOM 링크 첨부)
> GitHub Actions에선 peter-evans/create-pull-request 같은 액션, Jenkins에선 gh/glab/Gitea API 사용.

---


# 12) 운영 기준표 (요약)


| 항목  | 권장                                            |
| --- | --------------------------------------------- |
| 버전  | 세만틱 버전 + digest 고정                            |
| 롤백  | Manifest Repo에서 이전 커밋/태그로 되돌림(PR)             |
| 승인  | dev 자동, stage/prod 2인 승인                      |
| 동기화 | Argo CD Auto-sync ON, Sync Policy는 “PR 머지 후”만 |
| 보안  | SBOM 필수, 스캔 통과 시만 프로모션, Cosign 서명             |
| 감사  | 모든 환경 변경은 Manifest Repo PR로 기록                |

