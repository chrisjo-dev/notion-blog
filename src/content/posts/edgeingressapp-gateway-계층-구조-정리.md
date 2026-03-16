---
title: "Edge–Ingress–App Gateway 계층 구조 정리"
description: "#Infra #IaaS #개념 #계층구조 1. 먼저 머릿속에 넣을 “레이어 맵” - Edge(전세계 엣지): CloudFront, WAF, DNS(Route53/GA). CDN·DDoS·전역 라우팅. - L4 인그레스(전송 계층): NLB, (온프레미스면 L4 스위치)..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b812282ede55cb879884c"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "Edge–Ingress–App Gateway 계층 구조 정리"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---


#Infra #IaaS #개념 #계층구조


```python
[사용자]
   │
   ├─ DNS (Route 53)  ──────────────────────────────────────────► (도메인 해석)
   │
   ├─ Edge Network / Accelerator: AWS Global Accelerator ───────► (Anycast 고정 IP, 엣지 가속)
   │
   ├─ L4 Ingress (전송 계층): NLB ───────────────────────────────► (TCP/UDP, 고정 IP, 소스 IP 보존, mTLS 패스스루)
   │
   ├─ L7 Ingress (애플리케이션 계층): ALB ───────────────────────► (Host/Path 라우팅, HTTP/2/gRPC/WebSocket, TLS 종료)
   │
   ├─ App Gateway (서비스 앞 프록시): Nginx / HAProxy ──────────► (헤더/바디 가공, 캐시, 압축, rate-limit, 고급 라우팅)
   │
   └─ Services: ECS / EKS / EC2 / Lambda  ──────────────────────► (애플리케이션/마이크로서비스)
```


# 1. 먼저 머릿속에 넣을 “레이어 맵”

- **Edge(전세계 엣지)**: CloudFront, WAF, DNS(Route53/GA). CDN·DDoS·전역 라우팅.
- **L4 인그레스(전송 계층)**: NLB, (온프레미스면 L4 스위치). TCP/UDP, 고정 IP, 소스 IP 보존, mTLS 패스스루.
- **L7 인그레스(애플리케이션 계층)**: ALB. 호스트/경로 라우팅, HTTP/2·gRPC·WebSocket, 헬스체크, SSL 종료.
- **앱 게이트웨이(서비스 앞 프록시)**: Nginx/HAProxy. 세밀한 헤더/리라이트, 캐시, 압축, rate-limit, 고급 라우팅.
- **서비스(애플리케이션)**: ECS/EKS/EC2, Lambda 등.

이 레이어를 기준으로 “내가 필요한 기능이 어느 층의 책임인가?”를 먼저 결정하면 조합이 자연스럽게 고정돼.


# 2. 계층 구조


### (1) **Edge (전세계 엣지)**

- **구성 요소**: Route 53(DNS), CloudFront(CDN), AWS WAF, Global Accelerator(GA)
- **주요 역할**:
    - DNS 기반 트래픽 분산
    - 전세계 CDN 캐싱 및 가속
    - WAF를 통한 보안 필터링 (DDoS 방어 포함)
    - GA를 통한 Anycast 기반 고정 IP 제공, 엣지 레벨 트래픽 최적화

---


### (2) **L4 인그레스 (전송 계층)**

- **구성 요소**: AWS NLB(Network Load Balancer), 온프레미스 L4 스위치
- **주요 역할**:
    - TCP/UDP 트래픽 분산 (애플리케이션 레벨까지 해석하지 않음)
    - **고정 IP 제공** → 방화벽 화이트리스트, 금융권/보안 규제에 필수
    - 소스 IP 보존 (보안 로깅에 유리)
    - TLS Passthrough 및 mTLS 지원

---


### (3) **L7 인그레스 (애플리케이션 계층)**

- **구성 요소**: AWS ALB(Application Load Balancer)
- **주요 역할**:
    - HTTP/HTTPS/gRPC/WebSocket 지원
    - **호스트 기반 라우팅**: `api.example.com`, `shop.example.com`
    - **경로 기반 라우팅**: `/api/*`, `/static/*`
    - SSL 종료 (ACM 인증서 연동)
    - 헬스 체크 및 트래픽 분산
    - Lambda 타깃 직접 호출 가능 → 서버리스 환경 지원

---


### (4) **App Gateway (서비스 앞 프록시)**

- **구성 요소**: Nginx, HAProxy
- **주요 역할**:
    - 세밀한 헤더/쿠키/바디 가공
    - 캐싱 (정적/동적)
    - 압축, TLS 세부 설정
    - 정교한 라우팅 (테넌트별, 버전별 라우팅)
    - Rate limiting, 보안 규칙 강화

---


### (5) **Service (애플리케이션)**

- **구성 요소**: ECS, EKS, EC2, Lambda
- **주요 역할**: 실제 비즈니스 로직 처리 (웹 앱, API, 마이크로서비스 등)

---


## 3. 대표적인 패턴

1. **ALB 단독**

```plain text
Client → Route53/WAF → ALB → ECS/EKS/EC2/Lambda
```

- 단순하고 관리형.
- 표준 웹서비스 대부분에 적합.
1. **ALB → Nginx/HAProxy**

```plain text
Client → ALB → Nginx/HAProxy → App
```

- 복잡한 URL 리라이트, 세밀한 헤더/바디 변조, 고급 캐싱/압축이 필요한 경우.
1. **NLB → ALB**

```plain text
Client → NLB(고정 IP) → ALB(L7 라우팅) → App
```

- ALB 단독으로는 고정 IP 제공 불가 → NLB로 보완.
- 금융, 보안 규제 환경에 적합.
1. **CloudFront(+WAF) → ALB**

```plain text
Client → CloudFront(+WAF) → ALB → App
```

- 글로벌 사용자 대상, CDN 가속 + 보안 강화 필요할 때.

---


## 4. 기술 비교 (Nginx / HAProxy / NLB / ALB)


| 구분             | **Nginx**                | **HAProxy**       | **NLB**                 | **ALB**                        |
| -------------- | ------------------------ | ----------------- | ----------------------- | ------------------------------ |
| **출발 목적**      | 웹 서버 + 리버스 프록시           | 로드밸런서 전용          | L4 관리형 LB               | L7 관리형 LB                      |
| **지원 계층**      | L7 (HTTP 중심)             | L4+L7             | L4 (TCP/UDP)            | L7 (HTTP/HTTPS/gRPC/WebSocket) |
| **정적 파일 서빙**   | 가능                       | 불가능               | 불가능                     | 불가능                            |
| **로드밸런싱 알고리즘** | 기본적 (Round Robin 등)      | 매우 다양 (응답시간 기반 등) | 제한적                     | 제한적                            |
| **헬스 체크**      | 기본 수준                    | 고급 지원             | 내장 (AWS 관리)             | 내장 (AWS 관리)                    |
| **SSL 종료**     | 지원                       | 지원                | Passthrough/Termination | 지원 (ACM 연동, 자동 관리)             |
| **운영 방식**      | 직접 운영                    | 직접 운영             | AWS 관리형                 | AWS 관리형                        |
| **장점**         | 다재다능, Ingress Controller | 초고성능 LB           | 고정 IP, 초저지연             | HTTP L7 특화, 서버리스 연동            |
| **단점**         | 직접 운영 필요                 | 직접 운영, 학습곡선       | L7 불가                   | 고정 IP 불가                       |


---


## 5. 결론

- **Edge**는 글로벌 트래픽 분산/보안을 책임진다.
- **NLB**는 네트워크 계층(L4)에서 고정 IP, 초저지연, 비-HTTP 트래픽을 다룬다.
- **ALB**는 애플리케이션 계층(L7)에서 HTTP 기반 라우팅을 처리한다.
- **Nginx/HAProxy**는 애플리케이션 앞단에서 세밀한 제어/고급 기능을 제공한다.
