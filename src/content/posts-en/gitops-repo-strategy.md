---
title: "GitOps Repo Strategy"
description: "The following is a practical strategy for running a separate app source repository and app manifest repository (GitOps repo). (Based on Argo CD + Jenkins/GitHub Actions + Harbor, with consideration for Gitea, internal registries, and air-gapped production networks)"
date: "2025-12-27T12:43:00.000Z"
notionId: "2d6ea3deaa2b8030a47fe5f97ab4eac0"
koreanSlug: "gitops-repo-전략"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "gitOps Repo 전략"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---

The following is a practical strategy for running a separate app source repository and app manifest repository (GitOps repo). (Based on Argo CD + Jenkins/GitHub Actions + Harbor, with consideration for Gitea, internal registries, and air-gapped production networks)


# 1) Role Separation Principle (CI vs CD)

- **App Repo (CI responsibility)**

    Source code, tests, build, container image push, SBOM/vulnerability scanning, release tagging.

- **Manifest Repo (CD responsibility)**

    Kubernetes deployment definitions (Kustomize/Helm), per-environment overlays (dev/stage/prod), approval/promotion history.

> Benefits: Clear separation of deployment history from code history, minimized access to production networks, easy rollback and auditing.

---


# 2) Recommended Repository Structure


## App Repo (e.g., `org/app-foo`)


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


## Manifest Repo (e.g., `org/gitops-platform`)


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

> With Helm, place Chart.yaml/values.yaml in the base and override with values-*.yaml in each overlay.
>
> With Kustomize, use `images:` or `patches` to update only the image version for deployment.
>
>

---


# 3) Branch/Environment Strategy

- **Manifest Repo**
    - `main`: Production source (single source of truth).
    - Operate `env/dev`, `env/stage`, `env/prod` as separate branches, or use a single branch + `overlays/dev|stage|prod` directories.
    - **Recommended**: Single branch + overlay folders. **Promotion between environments is done exclusively via PR merge**.
- **App Repo**
    - `main`: Stabilized development line (or trunk-based).
    - Image build/push triggered by tags (`v1.4.2`) → **Auto-PR created** in Manifest Repo.

---


# 4) Image Version Pinning (Tag vs Digest)

- **Recommended: Pin by image digest**

    e.g.) `image: harbor.local/library/app-foo@sha256:abcd...`

    - Higher reproducibility, fewer surprise updates.
- When using tags alongside: `1.4.2` for human readability + record digest in PR title/body.

### Kustomize Example


```yaml
# overlays/dev/kustomization.yaml
images:
  - name: harbor.local/library/app-foo
    newName: harbor.local/library/app-foo
    newTag: v1.4.2   # 또는 digest로 고정
```


### Helm values Example


```yaml
# overlays/dev/values-dev.yaml
image:
  repository: harbor.local/library/app-foo
  tag: v1.4.2
  # digest 사용 시: tag 대신 digest: "sha256:abcd..."
```


---


# 5) Deployment Pipeline (Recommended "Golden Path")

1. **App Repo CI**
    - PR → test/build → image push (Harbor) → SBOM generation → on vulnerability scan pass:
    - `vX.Y.Z` tagging & GitHub Release (or Gitea Release)
    - **Auto-PR created in Manifest Repo**
        - Change: update image tag/digest in `overlays/dev`
        - PR title: `chore(app-foo): bump to v1.4.2 (sha256:abcd)`
        - PR body: changelog/release notes, SBOM link, scan result summary
2. **Manifest Repo**
    - Review/approval (CODEOWNERS: required review by ops team)
    - On merge, Argo CD **auto-syncs** to `dev`
    - After **smoke test**, **promotion PR created** to `stage` (by bot or human)
    - After `stage` validation (Performance/E2E/consensus), **final promotion PR** to `prod` → merge → auto-deploy
> Key point: Environment promotion happens only through Git PR/merge. Argo CD Auto-Sync is enabled, but promotion itself is controlled by manual approval (merge).

---


# 6) Argo CD Configuration Points


### App of Apps (Optional)

- Declare multiple apps at once from `argocd/projects-and-apps/` (folder scan / directory Helm/Kustomize).

### Argo CD Image Updater (Alternative)

- Detect new image versions via tag rules → auto-update values/kustomize → **create PR in Manifest Repo**

    (Direct apply is also possible, but **PR creation mode** is safer for auditing/control)


### Example: Image Updater Annotation (Helm)


```yaml
metadata:
  annotations:
    argocd-image-updater.argoproj.io/image-list: app-foo=harbor.local/library/app-foo
    argocd-image-updater.argoproj.io/app-foo.update-strategy: latest
    argocd-image-updater.argoproj.io/write-back-method: git
    argocd-image-updater.argoproj.io/git-branch: main
```


---


# 7) Access Control / Security / Auditing

- **Manifest Repo**
    - `CODEOWNERS`: Only SRE/ops team can approve `overlays/prod`.
    - Branch protection: protect `main`, require 2-person review, signed commits (optional).
    - Secrets managed via External Secrets / SealedSecrets / SOPS.
- **App Repo**
    - Runtime security: SBOM (Syft), vulnerability scanning (Trivy/Grype), signing (Cosign), provenance (SLSA level target).
- **Argo CD**
    - Limit namespace/resource scope by project, network segmentation.

---


# 8) Multi-Registry/Network (Dev Gitea ↔ eCAMS ↔ Prod Gitea) Synchronization

- **Define clear one-way mirroring rules**:
    - Where is the Single Source of Truth (SSOT)? Typically, **the Manifest Repo uses the production Gitea** as SSOT.
    - PRs/commits created in the dev network are forwarded by a **mirror bot** from eCAMS → prod Gitea **as PRs** (direct push is prohibited).
    - Release artifacts (images) are **retagged/copied from Harbor (dev) → Harbor (prod)** at promotion time.
    - If eCAMS is the only node connected to both networks:

        Dev Gitea ↔ **eCAMS (relay)** ↔ Prod Gitea, Dev Harbor ↔ **eCAMS cache/proxy** ↔ Prod Harbor.

> Key point: Production network is pull-based; direct push from outside is prohibited. All changes must pass through the PR/approval/merge path.

---


# 9) Promotion Policy (Promotion Criteria)

- Dev → Stage: Unit/integration/E2E tests pass + basic performance OK + security scan pass.
- Stage → Prod: Change impact/release notes approved + ops checklist completed + change window approval (change management CAB).
- All promotions are recorded as Manifest Repo PRs (attach changelog, image digest, SBOM link, release notes).

---


# 10) Multi-Tenant (30 Tenants) Support

- **Folder-based overlays**:

```plain text
apps/app-foo/overlays/
 ├─ dev-tenant-01/
 ├─ dev-tenant-02/
 ...
 └─ prod-tenant-30/
```

- Common base + per-tenant `values-tenant.yaml` or Kustomize patches to separate:
    - Domain, resource quotas, environment variables, secrets, pinned versions, etc.
- Batch tenant promotion: batch changes via multi-PR generation scripts (repo actions).

---


# 11) Automation Hooks (Sample)


### Script Overview for CI to Open a Manifest PR

1. After build/push in App Repo, produce `IMAGE_TAG`/`DIGEST` artifacts
2. Clone Manifest Repo → modify target overlay (`overlays/dev/...`) file
3. Create branch → commit message: `chore(app-foo): bump to v1.4.2 (sha256:...)`
4. Create PR (attach verification results/release notes/SBOM link)
> In GitHub Actions, use an action like peter-evans/create-pull-request; in Jenkins, use the gh/glab/Gitea API.

---


# 12) Operations Reference Table (Summary)


| Item | Recommendation |
| --- | --- |
| Versioning | Semantic versioning + digest pinning |
| Rollback | Revert to previous commit/tag in Manifest Repo (via PR) |
| Approval | Dev: automatic, Stage/Prod: 2-person approval |
| Sync | Argo CD Auto-sync ON, Sync Policy only "after PR merge" |
| Security | SBOM required, promotion only on scan pass, Cosign signing |
| Auditing | All environment changes recorded as Manifest Repo PRs |
