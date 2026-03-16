---
title: "컨테이너 런타임, CRI란?"
description: "#CRI #Infra #IaaS #개념  1. 컨테이너 런타임이란? - 컨테이너를 실행·중지·삭제하는 프로그램 - 예: Docker Engine, containerd, CRI-O, rkt(옛날 것) - 쿠버네티스(Kubernetes)는 직접 컨테이너를 실행하지 않고,..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81e29fc2e3d680c54997"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "컨테이너 런타임, CRI란?"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---


#CRI #Infra #IaaS #개념 


# 1. 컨테이너 런타임이란?

- 컨테이너를 **실행·중지·삭제**하는 프로그램
- 예: Docker Engine, containerd, CRI-O, rkt(옛날 것)
- 쿠버네티스(Kubernetes)는 직접 컨테이너를 실행하지 않고, **kubelet이 런타임에 요청**을 보냅니다.

---


# 2. CRI(Container Runtime Interface)의 등장 배경

- 초창기 Kubernetes는 **Docker 엔진만 지원** → Docker API 의존
- 다양한 런타임(containerd, CRI-O 등)을 쓰고 싶어도 표준화된 인터페이스가 없음 → kubelet마다 따로 개발해야 했음
- 해결책: **CRI = kubelet ↔ 컨테이너 런타임 표준 gRPC API**

    → kubelet은 CRI만 알면 되고, 런타임은 CRI만 구현하면 됨.


---


# 3. CRI 기본 구조


_(원리 도식)_

- **kubelet**

    → Pod 실행/중지 요청

- **CRI shim** (예: containerd-shim, cri-o)

    → kubelet의 gRPC 호출을 런타임 내부 로직으로 변환

- **컨테이너 런타임** (containerd, CRI-O 등)

    → 실제로 컨테이너 생성/실행


---


# 4. CRI 구성 요소 (gRPC 서비스 2개)

1. **RuntimeService**
    - PodSandbox(쿠버네티스 Pod의 최소 단위) 관리
    - 컨테이너 생성, 시작, 중지, 삭제
    - exec/attach/logs 등 지원
2. **ImageService**
    - 컨테이너 이미지 풀(Pull) / 제거(Remove) / 목록(List)
    - 이미지 상태 조회

---


# 5. 대표적인 CRI 구현체

- **containerd**
    - CNCF 프로젝트, Docker 엔진에서 분리되어 독립 런타임으로 발전
    - 대부분의 Kubernetes 클러스터에서 디폴트로 사용
- **CRI-O**
    - Red Hat 주도, “Lightweight CRI implementation for OCI containers”
    - OpenShift 기본 런타임
- (과거) **dockershim**
    - kubelet 안에서 Docker API를 CRI로 변환해 주던 중간 계층
    - Kubernetes 1.24에서 완전히 제거됨 (→ 이제 Docker 직접 지원 없음)

---


# 6. CRI와 OCI 관계

- **OCI(Open Container Initiative)**: 컨테이너 표준화 단체
    - **OCI Runtime Spec**: 컨테이너 실행 표준 (runc 등)
    - **OCI Image Spec**: 이미지 포맷 표준 (.tar 구조)
- **CRI**: 쿠버네티스에서 “OCI 런타임을 어떻게 쓸지” 정의한 인터페이스
- 정리:
    - OCI → 컨테이너 “표준”
    - CRI → 쿠버네티스용 “API 인터페이스”

---


# 7. CRI의 동작 흐름 예시

1. 사용자가 `kubectl apply -f pod.yaml` 실행
2. kube-apiserver → kubelet에게 “Pod 실행” 전달
3. kubelet → CRI RuntimeService 호출
    - `RunPodSandbox` (Pod 환경 준비)
    - `CreateContainer` (컨테이너 생성)
    - `StartContainer` (실행)
4. 런타임(containerd/CRI-O)이 이미지 풀 → runc 실행 → 컨테이너 프로세스 시작

---


# 8. CRI 확인/테스트 방법


쿠버네티스 노드에서 어떤 런타임을 쓰는지 확인:


```bash
kubectl get node -o wide
kubectl describe node <nodename> | grep "Container Runtime"
```


예:


```plain text
Container Runtime Version:  containerd://1.7.12
```


CRI 호출을 직접 테스트:


```bash
crictl ps       # 컨테이너 목록
crictl images   # 이미지 목록
crictl runp ... # PodSandbox 실행
```


※ `crictl` = kubelet과 같은 CRI gRPC를 호출하는 CLI 도구


---


# 9. 정리

- **CRI = Kubernetes 전용 컨테이너 런타임 API 표준**
- kubelet은 CRI만 호출 → 다양한 런타임을 쉽게 교체 가능
- 주요 서비스: **RuntimeService**, **ImageService**
- 구현체: containerd, CRI-O (예전엔 dockershim)
- 이미지 빌드는 CRI 기능이 아님 → BuildKit/Kaniko 같은 별도 도구 필요
