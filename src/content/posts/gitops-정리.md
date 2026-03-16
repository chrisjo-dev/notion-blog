---
title: "GitOps 정리"
description: "#GitOps #Infra #DevOps #개념 1. 정의 - GitOps는 운영(Operations)을 Git으로 관리하는 방법론 - 모든 인프라/애플리케이션의 원하는 상태(Desired State)를 Git에 선언적으로 정의 - Argo CD, Flux 같은 컨트롤..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b819cb7bbdf27bc4cef21"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "GitOps 정리"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---


#GitOps #Infra #DevOps #개념


## 1. 정의

- **GitOps**는 **운영(Operations)을 Git으로 관리하는 방법론**
- 모든 인프라/애플리케이션의 **원하는 상태(Desired State)**를 Git에 선언적으로 정의
- **Argo CD, Flux** 같은 컨트롤러가 Git과 실제 환경을 **지속적으로 동기화(reconciliation)**

---


## 2. 배경과 등장 이유

- 기존 **IaC(Terraform 등) + CI/CD** 방식의 한계:
    - **Drift 문제**: 실제 환경이 Git과 달라짐
    - **운영 변경 추적 불가**: 콘솔/CLI에서 직접 수정 → Git에 기록 안 남음
    - **환경 불일치**: 개발/스테이징/운영이 따로 놀 수 있음
- GitOps는 이를 해결하기 위해 **Git = 단일 진실(Single Source of Truth)** 원칙을 도입

---


## 3. 핵심 개념

1. **선언적 구성(Declarative Config)**
    - 원하는 상태를 YAML, Helm, Kustomize 등으로 정의
2. **Git 단일 진실 원천**
    - 변경은 반드시 PR/Commit으로만 반영
3. **자동 동기화**
    - 컨트롤러가 Git과 실제 환경을 계속 비교 → 다르면 자동으로 되돌림
4. **감사와 투명성**
    - 모든 변경은 Git 기록으로 추적 가능

---


## 4. CI/CD와 GitOps 차이


| 구분       | CI/CD               | GitOps                 |
| -------- | ------------------- | ---------------------- |
| 배포 주체    | 파이프라인이 환경에 **push** | 컨트롤러가 Git을 **pull**    |
| 실행 방식    | 이벤트 트리거 → 단발성 실행    | 지속적 감시 & 동기화           |
| Drift 대응 | 알 수 없음, 수동 복구 필요    | 자동 복구 (reconciliation) |
| 변경 경로    | CI/CD + 직접 수정 가능    | 오직 Git PR/Commit만 허용   |


---


## 5. 기술 스택

- **Git 저장소**: GitHub, GitLab, Bitbucket
- **CI**: GitHub Actions, Jenkins, GitLab CI (빌드/테스트/이미지 생성)
- **GitOps 컨트롤러(CD)**: Argo CD, Flux
- **선언적 배포**: Helm, Kustomize
- **보조 도구**: Sealed Secrets, Vault(비밀 관리), Kyverno/OPA(정책), Prometheus+Grafana(모니터링)

---


## 6. 정리된 한 줄

- **CI/CD**: 코드 변경을 환경으로 “밀어 넣는” 자동화
- **GitOps**: Git을 운영의 원본 진실로 삼고, 환경이 Git 상태를 **항상 따라가도록 유지**하는 운영 패턴

[bookmark](https://www.samsungsds.com/kr/insights/gitops.html)

