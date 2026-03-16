---
title: "kubernetes의 구성 요소"
description: "컨트롤플레인 & 워커 런타임 - etcd: 클러스터 상태 저장소(Raft 합의) - kube-apiserver: 모든 요청의 프론트도어(인증/인가/검증) - kube-controller-manager: 오브젝트 목표 상태 유지(ReplicaSet, Node/Job 등..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b819bb1d2fc143aa3808e"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "kubernetes의 구성 요소"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---


## 컨트롤플레인 & 워커 런타임

- **etcd**: 클러스터 상태 저장소(Raft 합의)
- **kube-apiserver**: 모든 요청의 프론트도어(인증/인가/검증)
- **kube-controller-manager**: 오브젝트 목표 상태 유지(ReplicaSet, Node/Job 등 컨트롤러 집합)
- **kube-scheduler**: 파드를 어느 노드에 배치할지 결정
- **cloud-controller-manager**(선택): 클라우드 리소스 연동
- **kubelet(노드)**: 파드 생명주기 관리
- **kube-proxy(노드)**: 서비스 가상 IP를 실제 엔드포인트로 프록시
- **컨테이너 런타임**: `containerd`(표준), cri-o 등

## 워크로드 리소스(배포/실행 형태)

- **ReplicaSet**: 동일 파드 개수 유지(Deployment의 내부 구성요소)
- **Deployment**: 무중단 롤링 업데이트(Stateless)
- **StatefulSet**: 상태 유지 워크로드(고정 네임/스토리지)
- **DaemonSet**: 모든(또는 특정) 노드에 1개씩 파드 배포(에이전트류)
- **Job / CronJob**: 일회성/주기성 작업

## 네트워킹

- **CNI 플러그인**: Calico, Flannel, Cilium 등
- **Service**: ClusterIP / NodePort / LoadBalancer / Headless
- **Ingress**: L7 라우팅(도메인/경로 기반), Ingress Controller 필요(Nginx, HAProxy, Traefik 등)
- **NetworkPolicy**: 파드 간 트래픽 허용/차단 정책

## 설정/비밀/스토리지

- **ConfigMap / Secret**: 앱 설정/민감정보 주입
- **PersistentVolume(PV) / PersistentVolumeClaim(PVC)**: 영속 스토리지 바인딩
- **StorageClass / CSI 드라이버**: 동적 프로비저닝(클라우드/온프렘 스토리지 연동)

## 스케줄링 & 안정성 & 자동화

- **HPA / VPA**: 오토스케일(수평/수직)
- **PodDisruptionBudget(PDB)**: 계획된 중단시 최소 가용 파드 수 보장
- **PriorityClass & Preemption**: 우선순위/자원 쟁탈 정책
- **Affinity/Anti-Affinity, Taints/Tolerations**: 파드-노드/파드-파드 배치 제약

## 멀티테넌시·보안·조직화

- **Namespace**: 논리 격리(팀/환경 구분)
- **RBAC**: 역할 기반 접근제어(Role/RoleBinding/ClusterRole/ClusterRoleBinding)
- **ServiceAccount**: 파드가 API에 접근할 신원
- **Admission Controllers**: 요청 변형/검증(Mutating/Validating)
- **ResourceQuota / LimitRange**: 네임스페이스별 자원 한도/기본값

## 확장성

- **CRD / Operator**: 사용자 정의 리소스와 자동운영 오퍼레이터 패턴
