---
title: "로드밸런싱 기초부터 Octavia vs HAProxy 까지 한 번에 정리"
description: "#IaaS #Onboarding #개념 #Octavia --- 1) 로드밸런싱 기본 개념 - 목표: 다수의 백엔드(서버/파드)에 트래픽을 고르게 분산해 가용성과 성능을 확보. - L4 vs L7     - L4: TCP/UDP 레벨 분산. 빠르고 단순. 원본 IP 보존..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81c7b0dce617bd9df455"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "로드밸런싱 기초부터 Octavia vs HAProxy 까지 한 번에 정리"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---


#IaaS #Onboarding #개념 #Octavia


---


## 1) 로드밸런싱 기본 개념

- **목표**: 다수의 백엔드(서버/파드)에 트래픽을 고르게 분산해 **가용성**과 **성능**을 확보.
- **L4 vs L7**
    - **L4**: TCP/UDP 레벨 분산. 빠르고 단순. 원본 IP 보존, 고정 IP, 패스스루 용도에 강함.
    - **L7**: HTTP/HTTPS 레벨 분산. 경로/호스트 기반 라우팅, 헤더 검사, 쿠키 스티키 등 **애플리케이션 인지** 기능 제공.
- **핵심 기능**
    - **헬스체크**(죽은 노드 제외)
    - **SSL/TLS 종료(termination)**, **SNI**
    - **세션 지속성**(쿠키/소스IP)
    - **롤링 업데이트 중 무중단 트래픽 전환**
    - **관측성**(로그/메트릭)

---


## 2) HAProxy란?

- **정체성**: 오픈소스 **고성능 L4/L7 로드밸런서/리버스 프록시** 소프트웨어.
- **사용 방식**: 리눅스 서버/VM/컨테이너에 **직접 설치**해서 설정 파일(`haproxy.cfg`)로 운용.
- **강점**
    - 매우 높은 성능/안정성, 세밀한 라우팅/리트라이/스티키/큐잉/리스케줄링
    - 다양한 배포 형태(베어메탈, VM, 컨테이너, 쿠버네티스 인그레스 컨트롤러 등)
- **한 줄 요약**: **“엔진 그 자체”**. 로드밸런싱 기능을 가장 가까이에서 직접 다룸.

---


## 3) Octavia란?

- **정체성**: **OpenStack의 LBaaS(Load Balancer as a Service)**.

    API로 “로드밸런서 리소스”를 만들고 관리하는 **클라우드 서비스 레이어**.

- **구성 개념**
    - **Octavia 컨트롤 플레인**: API/오케스트레이션.
    - **Amphora**: 실제 트래픽을 처리하는 **데이터 플레인** 유닛(보통 VM/컨테이너).

        기본 드라이버인 **Amphora 드라이버는 내부에서 HAProxy를 실행**해 분산 처리.

    - **Neutron 연동**: 가상 네트워크/서브넷에 LB를 붙이고, 플로팅 IP/보안그룹 등과 통합.
- **포인트**
    - 멀티테넌시, RBAC, 과금/쿼터, API/자동화를 **클라우드 표준 방식**으로 제공.
    - **프로바이더 드라이버** 개념이 있어, 기본은 HAProxy 기반(Amphora)이지만 환경에 따라 **OVN 프로바이더** 등도 선택 가능.

---


## 4) 관계와 차이 (한눈에)

- **관계**: Octavia는 “서비스”, HAProxy는 “엔진”.
    - OpenStack에서 **Octavia를 생성**하면, **뒤에서는 HAProxy(Amphora)** 가 실제로 트래픽을 처리.
- **차이**
    - **운영 레벨**:
        - Octavia: “로드밸런서라는 리소스”를 API로 만들고 수명주기를 관리(클라우드 네이티브).
        - HAProxy: 소프트웨어 설치/설정 파일로 직접 운영(호스트/컨테이너 레벨).
    - **멀티테넌시/거버넌스**:
        - Octavia: 프로젝트/쿼터/RBAC/과금 같은 **IaaS 거버넌스 내재**.
        - HAProxy: 직접 통합/구현 필요.
    - **네트워킹 통합**:
        - Octavia: Neutron과 네이티브 통합(IP, SG, 라우팅).
        - HAProxy: OS/클라우드 네트워킹과 **직접** 맞물려야 함.

---


## 5) 언제 무엇을 쓰나 (선택 가이드)

- **OpenStack 프라이빗 클라우드**:
    - 표준/거버넌스/멀티테넌시/자동화가 필요 → **Octavia** (→ 내부적으로 HAProxy 사용)
- **일반 VM/베어메탈/쿠버네티스 단독 환경**:
    - 빠른 직접 제어/커스텀 라우팅/가벼운 구성 → **HAProxy 직접**
- **퍼블릭 클라우드(AWS 등)**:
    - 관리형 LB가 이미 있음 → **AWS NLB/ALB**를 1차로, 필요시 그 뒤/앞에 **HAProxy**를 보조 계층으로.
- **쿠버네티스**:
    - **Ingress 컨트롤러**(NGINX/HAProxy/Envoy 등) 사용.
    - OpenStack 위의 K8s라면 `Service: LoadBalancer`가 **Octavia**와 연동되어 외부 IP를 받을 수 있음.

---


## 6) 빠른 구성/명령 예시


### 6-1) HAProxy 최소 예시


`/etc/haproxy/haproxy.cfg` 예:


```plain text
global
    log /dev/log local0

defaults
    mode http
    timeout connect 5s
    timeout client  30s
    timeout server  30s

frontend fe_http
    bind *:80
    default_backend be_app

backend be_app
    balance roundrobin
    server app1 10.0.1.11:8000 check
    server app2 10.0.1.12:8000 check
```

- 적용/재시작: `systemctl reload haproxy` 또는 컨테이너면 `docker restart`.

### 6-2) Octavia(OpenStack CLI) 예시 흐름


```bash
# 1) 로드밸런서 생성 (서브넷에 바인딩)
openstack loadbalancer create --name lb1 --vip-subnet-id <SUBNET_ID>

# 2) 리스너(80/tcp)
openstack loadbalancer listener create --name http80 --protocol HTTP --protocol-port 80 lb1

# 3) 풀(라운드로빈)
openstack loadbalancer pool create --name webpool \
  --lb-algorithm ROUND_ROBIN --listener http80 --protocol HTTP

# 4) 멤버(백엔드)
openstack loadbalancer member create --subnet-id <SUBNET_ID> --address 10.0.1.11 --protocol-port 8000 webpool
openstack loadbalancer member create --subnet-id <SUBNET_ID> --address 10.0.1.12 --protocol-port 8000 webpool

# 5) 헬스모니터
openstack loadbalancer healthmonitor create --delay 5 --timeout 3 --max-retries 2 \
  --type HTTP --url-path /healthz webpool
```

- 이렇게 만들면 Octavia가 Amphora(HAProxy)를 준비·설정하고, 트래픽 분산이 시작됨.

---


## 7) 운영 팁 / 모범사례


### 공통

- **관측성**: 액세스 로그(요청 라벨/추적ID), 에러 로그, 메트릭(요청수, 대기열, 응답코드 분포, 백엔드 상태).
- **배포 전략**: 블루-그린/카나리. L7 규칙으로 점진 전환.
- **헬스체크**: 앱의 실건강을 반영하는 경량 엔드포인트(`/healthz` 등) 별도 구현.
- **TLS**:
    - L7 종료면 **X-Forwarded-For/Proto/Host** 헤더를 앱에 전달하도록 설정.
    - 원본 IP가 중요한 경우 **PROXY protocol**(L4) 고려.
- **스케일**: 커넥션 수/큐잉/타임아웃 튜닝. Keep-Alive, HTTP/2, 압축 등 성능 옵션 점검.
- **보안**: 최소 권한 보안그룹, DDoS 완화(상위 계층/WAF), TLS 정책(최소 버전, 강한 cipher).

### HAProxy 전용

- **구성 관리**: Ansible/Consul-Template로 cfg 생성·배포 자동화.
- **무중단 재적용**: `runtime API`(socket), `graceful reload` 활용.
- **고가용성**: Keepalived(가상 IP) 또는 상위 L4/NLB 앞단 배치.

### Octavia 전용

- **토폴로지**: `ACTIVE_STANDBY`(이중화) vs `SINGLE`(단일). 서비스 중요도에 따라 선택.
- **프로바이더**: 기본 Amphora(HAProxy) 외에 OVN 등 환경별 선택지 존재.
- **네트워킹**: Neutron 서브넷/보안그룹/플로팅IP 설계와 함께 계획.
- **K8s 연동**: Service(type=LoadBalancer) → Octavia VIP 할당으로 외부 유입점 제공.

---


## 8) 자주 묻는 질문(FAQ)


**Q1. 둘 중 하나만 쓰는 게 보통인가?**

- OpenStack이면 **Octavia**를 쓰는 게 표준(내부적으로 HAProxy가 동작).
- OpenStack이 아니면 **HAProxy 직접** 쓰는 경우가 일반적.

**Q2. 둘을 같이도 쓰나?**

- 네. **Octavia(서비스층)** 위에서 **HAProxy(데이터층)** 가 동작하는 구조가 대표적.
- 퍼블릭 클라우드에선 **ALB/NLB 앞단/뒤단에 HAProxy** 를 추가 계층으로 두기도 함(세밀한 L7 정책, 캐싱, 서킷브레이커 비슷한 패턴).

**Q3. NGINX/Envoy와 비교는?**

- 모두 범용 L7 프록시/로드밸런서.
    - **HAProxy**: 전통 강자, 고성능, 세밀한 L7·큐잉 제어에 강함.
    - **NGINX**: 웹서버+리버스 프록시 역할, 에코시스템/문서 풍부.
    - **Envoy**: 현대적 L7 프록시, gRPC/HTTP/2, 필터 체인, 서비스메시와 궁합.

**Q4. AWS로 치면?**

- **Octavia ≈ ELB 서비스 계열**(관리형 LB).
- **HAProxy ≈ 직접 띄우는 소프트웨어 LB**.
- 보통은 **ALB/NLB** 먼저 쓰고, 특수 정책이 필요할 때 **EC2/컨테이너의 HAProxy** 로 보완.

**Q5. K8s와의 관계?**

- 쿠버네티스에선 보통 **Ingress 컨트롤러**(NGINX/HAProxy/Envoy)를 사용.
- OpenStack 위의 K8s는 `Service: LoadBalancer`가 **Octavia와 연동**되어 외부 VIP를 받음.

---


## 9) 의사결정: Octavia vs HAProxy 중 무엇을 쓸까?


### **Octavia를 선택할 상황**

- OpenStack 클라우드 환경을 운영하고 있음.
- 여러 프로젝트/사용자에게 LB를 서비스 형태로 제공해야 함.
- 관리자가 아니라 **사용자(API 소비자)** 입장에서 쉽게 LB를 쓰고 싶음.
- RBAC, 쿼터, 과금 체계 같은 **클라우드 관리 기능**이 필요함.

👉 즉, **클라우드 서비스 제공자(OpenStack 환경)**라면 **Octavia**가 정답.


---


### **HAProxy를 선택할 상황**

- 단순히 **내 서비스 하나**를 위해 로드밸런싱이 필요함.
- OpenStack 같은 클라우드 플랫폼이 없는 환경(온프레미스, AWS EC2, 쿠버네티스 등).
- 세밀한 튜닝(큐잉, 세션 지속성, 라우팅 정책)을 직접 하고 싶음.
- 고성능 L4/L7 로드밸런서를 가볍게 운영하고 싶음.

👉 즉, **단일 환경이나 쿠버네티스 같은 컨테이너 플랫폼**이라면 **HAProxy** 직접 쓰는 게 맞음.


---


### **둘을 같이 쓰는 경우**

- OpenStack → Octavia API 호출 → Amphora VM 안에서 HAProxy 실행 → 트래픽 분산.
- 즉, OpenStack 환경에서는 사실상 **둘 다 함께 쓰는 구조**가 표준.

---


## 10) 최종 정리 (치트시트)


| 구분    | HAProxy             | Octavia                  |
| ----- | ------------------- | ------------------------ |
| 정체성   | 로드밸런서 소프트웨어(엔진)     | OpenStack LBaaS 서비스(API) |
| 사용 환경 | 베어메탈, VM, 컨테이너, K8s | OpenStack 클라우드           |
| 설치 방식 | 직접 설치/설정            | API 호출 → 자동 배포           |
| 기능    | L4/L7 LB, 세밀 제어     | L4/L7 LB, 클라우드 통합 기능     |
| 장점    | 성능, 유연성, 어디서든 사용 가능 | 관리형, 멀티테넌시, API/자동화      |
| 단점    | 직접 운영 부담            | OpenStack 한정, 세부 튜닝 한계   |
| 선택 기준 | 단일 서비스/직접 제어 필요     | OpenStack 클라우드 제공/사용     |

