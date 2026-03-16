---
title: "Jenkins 에이전트 실행 시 서버 다운 사후 분석 보고서"
description: "1. 사건 개요 (Incident Summary) - 발생 일시: 2025년 10월 2일 - 발생 환경: Minikube 단일 노드 Kubernetes 클러스터 (Docker 드라이버 기반) - 관련 구성요소: Jenkins, Jenkins Agent, SonarQub..."
date: "2025-12-27T12:36:00.000Z"
notionId: "2d6ea3deaa2b80f692c2d7f7f963e92a"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "Jenkins 에이전트 실행 시 서버 다운 사후 분석 보고서"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---


## 1. 사건 개요 (Incident Summary)

- **발생 일시**: 2025년 10월 2일
- **발생 환경**: Minikube 단일 노드 Kubernetes 클러스터 (Docker 드라이버 기반)
- **관련 구성요소**: Jenkins, Jenkins Agent, SonarQube Scanner, Docker Daemon
- **주요 증상**: Jenkins 파이프라인 실행 중 SonarQube Scanner와 Jenkins Agent가 동시에 동작하면서 Minikube 전체가 멈춤(Freeze).

---


## 2. 문제 시나리오 (Scenario)


문제 발생 당시의 흐름을 텍스트 다이어그램으로 정리:


```plain text
[SonarQube Scanner] ----> CPU/메모리 부하 ↑
        │
        ▼
[Jenkins Master] ---파이프라인 실행---> [Jenkins Agent Pod 생성]
        │
        ▼
[Jenkins Agent Pod] ---Docker socket mount---> [/var/run/docker.sock]
        │
        ▼
[Host Docker Daemon] <--- 과부하 발생 ---> [Minikube Internal Docker]
        │
        ▼
[전체 Minikube 노드] ----> Freeze (응답 불가)
```


---


## 3. 상세 원인 분석 (Root Cause Analysis)

1. **Docker Socket 마운트 구조**
    - Jenkins Agent 파드가 `/var/run/docker.sock` 을 호스트에서 마운트.
    - 이로 인해 에이전트가 실행하는 `docker build`, `docker run` 명령은 **호스트 Docker Daemon(dockerd)** 에 직접 전달됨.
    - 결과적으로 Kubernetes 리소스 제한(requests/limits)이 무효화되고, 모든 빌드 작업이 호스트 레벨에서 실행됨.
2. **SonarQube Scanner 리소스 사용**
    - 코드 분석 및 Elasticsearch 인덱싱 과정에서 CPU/메모리 사용량 급증.
    - 순간적으로 CPU 1Core 이상, 메모리 1.5~2Gi 이상 사용.
3. **자원 경합(Resource Contention) 심화**
    - Minikube는 단일 Docker Daemon 위에서 Kubernetes 노드를 시뮬레이션하는 구조.
    - Jenkins Agent의 빌드 작업 + SonarQube Scanner의 분석 작업이 동시에 dockerd에 부하를 줌.
    - CPU/메모리 여유가 남아 있더라도, **dockerd 내부의 직렬화 구간(메타데이터 락, 이미지 인덱싱), overlayfs I/O 병목, 네트워크 conntrack, QoS 스로틀링** 등으로 인해 전체 시스템 응답이 멈춤.
4. **핵심 포인트: 여유 자원이 있어도 멈출 수 있는 이유**
    - **Docker 데몬 병목**: 단일 데몬이 모든 요청을 직렬로 처리 → CPU가 남아도 락 경합으로 전체 대기.
    - **OverlayFS I/O**: `docker build`는 수만 개 파일을 복사/해시 → 메타데이터 I/O 병목 발생.
    - **메모리 스파이크**: SonarQube + 빌드 압축으로 순간 피크 발생 → 커널이 kubelet, etcd 같은 핵심 프로세스 OOMKill.
    - **QoS 역전**: Jenkins Agent가 `BestEffort` QoS라면 kubelet 헬스체크가 밀려 노드 전체가 NotReady.
    - 결론: **리소스 여유는 빈도를 낮출 뿐, 구조적 위험(같은 dockerd 공유)을 제거하지 못함.**

---


## 4. 트러블슈팅 과정 (Troubleshooting Steps)

1. `kubectl top pods` 와 `docker stats` 로 리소스 사용량 모니터링 → SonarQube Scanner CPU/메모리 급상승 확인.
2. Jenkins Agent Pod 내부에서 `/var/run/docker.sock` 존재 및 `docker build` 실행 확인.
3. 동일 조건에서 Jenkins Agent 없이 Scanner만 실행 → 정상 동작.
4. Docker socket 마운트 제거 후 Jenkins Agent 실행 → Minikube 정상 동작.
5. **Root Cause → Docker socket mount + 단일 dockerd 경합**으로 최종 확인.

---


## 5. 영향도 (Impact & Risks)

- **보안 위험**: 컨테이너가 호스트 Docker Daemon 완전 제어 가능 → 권한 상승.
- **리소스 위험**: Kubernetes 리소스 제한 무효화 → 전체 노드 불안정.
- **안정성 위험**: 단일 노드(Minikube) 환경에서 dockerd 다운 → 클러스터 전체 다운.

---


## 6. 개선 방안 (Resolution & Action Items)

1. **Docker Socket 마운트 제거**
    - Jenkins Agent에서 `/var/run/docker.sock` 제거.
    - 호스트 도커에 직접 접근하지 않도록 차단.
2. **네이티브 빌드 도구 전환**
    - Kaniko / BuildKit(rootless) / Buildah 사용.
    - Pod 내부에서 자체적으로 OCI 이미지 빌드 수행.
3. **리소스 제한 및 QoS 보장**
    - SonarQube Scanner, Jenkins Agent 모두 `requests/limits` 지정.
    - kube-system 컴포넌트는 Guaranteed QoS 보장.
4. **빌드 워크로드 격리**
    - Minikube와 Jenkins를 같은 노드에서 실행하지 않도록 분리.
    - 혹은 Jenkins 전용 노드/프로필 운영.
5. **관측성과 경고**
    - Prometheus + Grafana로 dockerd, kubelet, overlayFS I/O 지표 모니터링.
    - 리소스 스파이크 발생 시 빌드 중단(Alert + Fail-fast).

---


## 7. 결론 (Conclusion)


본 사건은 Jenkins Agent가 Docker socket을 마운트하여 호스트 Docker Daemon에 직접 접근하면서 발생한 구조적 문제다. 단순히 리소스 여유가 부족한 문제가 아니라, **단일 Docker Daemon에 대한 과부하와 내부 병목 현상, 자원경합(QoS 역전, I/O 락, 메모리 스파이크)** 으로 인해 Minikube 전체가 멈추었다.


**리소스 여유는 문제를 지연시킬 뿐 해결책이 아니며**, 근본적으로는 Docker socket mount를 제거하고 Kubernetes 네이티브 빌드 방식으로 전환해야 한다.

