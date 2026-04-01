---
title: "Kubernetes 인프라 컨테이너 (pause container) 개념 정리"
description: "--- 개념맵 - 핵심 키워드 연결 --- 1. 인프라 컨테이너 (pause container)란? 정의 - 각 Pod마다 자동 생성되는 숨겨진 컨테이너 - 앱 로직 없이  시스템 콜로 무한 대기만 수행 - Pod 내 컨테이너들이 공유하는 Linux Namespace의..."
date: "2026-03-31T09:38:00.000Z"
notionId: "334ea3deaa2b808991f2fb302b269dfa"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "Kubernetes 인프라 컨테이너 (pause container) 개념 정리"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---


---


## 개념맵 - 핵심 키워드 연결


![image.png](/notion-blog/images/notion/334ea3deaa2b808991f2fb302b269dfa/image-1.png)


---


## 1. 인프라 컨테이너 (pause container)란?


### 정의

- 각 Pod마다 자동 생성되는 **숨겨진 컨테이너**
- 앱 로직 없이 `pause()` 시스템 콜로 **무한 대기**만 수행
- Pod 내 컨테이너들이 공유하는 **Linux Namespace의 소유자(앵커)** 역할

### 왜 필요한가? (인과관계)


```plain text
문제 상황: pause 없이 앱 컨테이너가 Namespace 소유 시
    │
    ├──▶ 역할 결합: 앱 로직 + 인프라 유지를 하나의 컨테이너가 담당
    │       └──▶ 앱의 불안정 = 인프라의 불안정
    │
    ├──▶ 재시작 불가: 소유자 크래시 → Namespace 소멸 → 다른 컨테이너 네트워크 끊김
    │       └──▶ restartPolicy로 컨테이너 단위 복구 불가능
    │
    └──▶ 비대칭 구조: 하나의 앱 컨테이너가 "특별한" 존재가 됨
            └──▶ Pod 내 컨테이너 대등성 원칙 위반

해결: pause 컨테이너 = 관심사의 분리 (Separation of Concerns)
    └──▶ 인프라 역할 전담, 크래시할 이유가 사실상 없음
```


---


## 2. pause 컨테이너의 정체


| 항목      | 내용                                                           |
| ------- | ------------------------------------------------------------ |
| 소스코드    | C로 작성, 핵심 로직 약 20줄                                           |
| 하는 일    | ① SIGCHLD 핸들러 등록 (좀비 프로세스 reaping) ② `pause()` 시스템 콜 (무한 대기) |
| 베이스 이미지 | `scratch` (완전히 빈 이미지, 셸/libc 없음)                             |
| 이미지 크기  | ~700KB                                                       |
| 컴파일 방식  | 정적 컴파일 (static linking) → OS 의존성 없음                          |
| OS 유무   | ❌ OS 없음. 커널 위에 바이너리 하나만 존재                                   |


### 이미지 크기 비교


```plain text
pause:3.9    ████ ~700KB        (scratch)
alpine       ████████████████████████████ ~7MB   (musl + busybox)
ubuntu       ████████████████████████████████████████████████████ ~78MB (full OS)
nginx        ██████████████████████████████████████████████████████████████████ ~140MB (debian)
```


---


## 3. Pod 내부 Namespace 공유 구조


### 공유되는 Namespace (pause가 소유)


| Namespace   | 효과                                    |
| ----------- | ------------------------------------- |
| **Network** | 모든 컨테이너가 같은 IP 공유, `localhost`로 상호 통신 |
| **IPC**     | 공유 메모리, 세마포어 등 IPC 통신 가능              |
| **UTS**     | 같은 hostname 공유                        |


### 분리되는 Namespace (각 컨테이너 고유)


| Namespace | 효과                             |
| --------- | ------------------------------ |
| **PID**   | 각 컨테이너는 자기 프로세스만 보임 (독립 PID 1) |
| **Mount** | 각 컨테이너는 독립적인 파일시스템 뷰           |


### 이 구조가 가능하게 하는 패턴

- **사이드카 패턴**: 앱 컨테이너가 `:80`에서 서비스 → 로그 에이전트가 `localhost:80`으로 접근
- **Ambassador 패턴**: 프록시 컨테이너가 외부 통신 담당
- **Adapter 패턴**: 모니터링 데이터 포맷 변환 컨테이너

---


## 4. 컨테이너 수 카운팅


### kubectl vs 실제 (예: 앱 컨테이너 2개인 Pod)


| 확인 방법                         | 보이는 수   | 실제 구성             |
| ----------------------------- | ------- | ----------------- |
| `kubectl get pods` (READY 컬럼) | **2/2** | 앱 A + 앱 B만 표시     |
| `crictl ps` (노드에서 직접)         | **3개**  | pause + 앱 A + 앱 B |

> pause 컨테이너는 kubelet이 내부적으로 생성하는 인프라 컨테이너이므로 Kubernetes API 레벨에서는 보이지 않음

### 확인 명령어


```bash
# containerd 기반 (RKE2, EKS 등)
crictl ps | grep <pod-name>

# 결과: pause, app-container-a, app-container-b 3개 모두 출력
```


---


## 5. initContainer 포함 시 컨테이너 수 변화

> initContainer는 **실행 완료 후 종료**되는 컨테이너 → 시점에 따라 수가 달라짐

### 예시: init 1개 + 앱 컨테이너 2개


```plain text
시점별 실행 중인 컨테이너:

[초기화 중]  pause + initContainer = 2개
                │
                ▼ init 성공 (exit 0) → init 종료/제거
                │
[앱 시작]    pause + app-A + app-B = 3개
                │
[Running]    pause + app-A + app-B = 3개
```


### kubectl 표시


```bash
# 초기화 중
NAME        READY   STATUS
my-pod      0/2     Init:0/1     ← init 진행 상황 표시

# Running 상태
NAME        READY   STATUS
my-pod      2/2     Running      ← init은 카운트에 안 잡힘
```


### 핵심 규칙

- initContainer는 **순차 실행** (여러 개면 하나씩 차례로)
- **하나라도 실패하면** 앱 컨테이너 절대 시작 안 됨 → `Init:CrashLoopBackOff`
- 모든 init 성공 후 앱 컨테이너들은 **동시 시작**

---


## 6. pause가 없으면 안 되는 근본적 이유


### "etcd/ConfigMap에 네트워크 정보 저장하면 되지 않나?" 에 대한 답변


**Namespace는 데이터가 아니라 커널 자원이다.**


| 구분    | etcd/ConfigMap | Network Namespace |
| ----- | -------------- | ----------------- |
| 성격    | 데이터 (설정값)      | 커널 런타임 자원         |
| 저장 위치 | 디스크/메모리 DB     | 커널 메모리            |
| 유지 조건 | etcd가 살아있으면 유지 | **프로세스가 점유해야 유지** |
| 비유    | 전화번호부에 번호 기록   | 실제 전화기가 연결됨       |


### Linux Namespace의 생존 조건


```plain text
참조 카운트 (reference count) 기반:

참조하는 프로세스 ≥ 1개  →  Namespace 존재 유지
참조하는 프로세스 = 0개  →  커널이 즉시 해제 (GC)
```


### Network Namespace 안에 존재하는 커널 오브젝트들

- `eth0` 가상 인터페이스 + `veth` 페어
- IP 주소 바인딩
- 라우팅 테이블
- iptables/nftables 규칙
- 열려있는 소켓 (TCP 연결 상태)
> 이것들은 전부 커널 오브젝트로, 키-밸류로 저장할 수 있는 성격이 아님.  
> etcd에 "IP는 10.244.1.5"라고 기록해도 커널에 Namespace가 없으면 패킷 수신 불가.

### pause 컨테이너의 본질

- "상호작용"이 아니라 **존재 자체**가 목적
- `pause()` 시스템 콜로 무한 대기 → CPU/메모리 거의 안 씀
- 커널에게 "나 아직 이 Namespace 쓰고 있어" 참조를 유지해주는 역할

---


## 7. pause 컨테이너가 죽으면?


```plain text
pause 죽음
    │
    ▼
pause가 소유하던 Network/IPC Namespace 소멸
    │
    ▼
Pod 내 모든 앱 컨테이너 네트워크 연결 상실
    │
    ▼
kubelet 감지
    │
    ▼
Pod 전체 종료 → 새 Pod 재생성 (새 pause + 새 앱 컨테이너)
    │
    ▼
⚠️ 새 Pod은 새로운 IP를 받음 → Service가 필요한 이유
```

> 앱 컨테이너 크래시 → `restartPolicy`로 해당 컨테이너만 재시작 가능  
> pause 컨테이너 크래시 → Namespace 자체 소멸, 부분 복구 불가 → Pod 전체 재생성

---


## 실무 트러블슈팅 팁


### 1. Pod이 계속 재시작될 때 pause 컨테이너 확인


```bash
# 노드 접속 후
crictl ps -a | grep <pod-name>
# pause 컨테이너 상태 확인 — Exited 상태라면 인프라 레벨 문제

crictl logs <pause-container-id>
# 보통 로그가 없음 (정상), 에러가 있으면 노드 레벨 이슈
```


### 2. 폐쇄망 환경에서 pause 이미지 누락


```bash
# RKE2 기본 pause 이미지 경로
# registry.k8s.io/pause:3.9 → Harbor에 미러링 필요

# RKE2의 경우 /etc/rancher/rke2/registries.yaml에서 미러 설정
mirrors:
  "registry.k8s.io":
    endpoint:
      - "https://harbor.internal.company.com"

# 또는 containerd 설정에서 sandbox_image 변경
# /etc/containerd/config.toml
[plugins."io.containerd.grpc.v1.cri"]
  sandbox_image = "harbor.internal.company.com/pause:3.9"
```


### 3. initContainer 실패로 Pod 시작 안 될 때


```bash
# init 상태 확인
kubectl describe pod <pod-name> | grep -A 20 "Init Containers"

# init 컨테이너 로그 확인
kubectl logs <pod-name> -c <init-container-name>

# 흔한 원인
# - 폐쇄망: init 이미지도 Harbor에 올려야 함
# - DB 마이그레이션 실패: DB 연결 문제
# - ConfigMap/Secret 마운트 누락
```


### 4. Pod 네트워크 이상 시 Namespace 직접 확인


```bash
# Pod의 네트워크 namespace 확인
POD_ID=$(crictl pods --name <pod-name> -q)
PID=$(crictl inspectp $POD_ID | jq '.info.pid')

# 해당 namespace의 네트워크 인터페이스 확인
nsenter -t $PID -n ip addr
nsenter -t $PID -n ip route
nsenter -t $PID -n ss -tlnp
```


---


## 면접 예상 질문


### Q1. Kubernetes에서 pause 컨테이너의 역할은 무엇인가요?


**모범 답변 포인트:**

- Pod 내 컨테이너들이 공유하는 Linux Namespace(Network, IPC, UTS)의 소유자
- 관심사의 분리: 인프라 역할을 앱 컨테이너와 분리
- scratch 이미지 기반, ~700KB, pause() 시스템 콜로 무한 대기
- kubectl에는 안 보이지만 crictl로 확인 가능

### Q2. Pod 내 컨테이너들은 어떻게 통신하나요?


**모범 답변 포인트:**

- 같은 Network Namespace를 공유 → 같은 IP, localhost로 통신
- pause 컨테이너가 Namespace를 소유하고 앱 컨테이너들이 join
- PID, Mount Namespace는 분리 → 프로세스와 파일시스템은 격리
- 이 구조가 사이드카 패턴의 기반

### Q3. pause 컨테이너가 죽으면 어떻게 되나요?


**모범 답변 포인트:**

- Namespace 소멸 → 모든 앱 컨테이너 네트워크 끊김
- kubelet이 Pod 전체를 재생성 (부분 복구 불가)
- 새 Pod은 새 IP를 받음 → Service 추상화의 필요성과 연결

### Q4. 왜 네트워크 정보를 etcd에 저장하는 것만으로는 부족한가요?


**모범 답변 포인트:**

- Namespace는 데이터가 아니라 커널 런타임 자원
- 참조 카운트 기반: 프로세스가 점유해야만 존재
- etcd = desired state(컨트롤 플레인), Namespace = actual state(데이터 플레인)
- pause 컨테이너가 actual state의 앵커

### Q5. initContainer와 일반 컨테이너의 차이는 무엇인가요?


**모범 답변 포인트:**

- init은 순차 실행 후 종료, 앱 컨테이너는 동시 시작 후 상주
- init 실패 시 앱 컨테이너 시작 안 됨
- kubectl READY 카운트에 init은 포함 안 됨
- 활용: DB 마이그레이션, 설정 파일 다운로드, 의존 서비스 대기

---


## 한 줄 요약

> **pause 컨테이너는 아무것도 하지 않으면서 Pod의 네트워크를 존재하게 만드는, 가장 중요한 "아무것도 안 하는" 프로세스다.**

---


## 연결 학습 키워드

- `CNI (Container Network Interface)` → pause가 만든 Namespace에 veth 페어를 꽂는 과정
- `Service / kube-proxy` → Pod IP가 바뀌어도 안정적 접근을 보장하는 추상화
- `CRI (Container Runtime Interface)` → kubelet이 pause를 생성하는 인터페이스
- `Linux cgroup` → Namespace와 함께 컨테이너 격리의 양대 축
- `Sidecar Container (K8s 1.28+)` → restartPolicy: Always인 init container
