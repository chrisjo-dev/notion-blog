---
title: "Kubernetes 인바운드 트래픽 플로우"
description: "--- 1) NodePort / LoadBalancer (호스트네임 없이 IP:Port로 접근) 여기서는 클라이언트 쪽 DNS(공용 DNS)만 쓰이고, CoreDNS는 관여하지 않습니다. - (1) 공용 DNS가 을 LB IP로 해석 (Route53/Cloud DNS..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b810b98cdf1528ecd3e87"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "Kubernetes 인바운드 트래픽 플로우"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---


---


# 1) NodePort / LoadBalancer (호스트네임 없이 IP:Port로 접근)


여기서는 **클라이언트 쪽 DNS(공용 DNS)**만 쓰이고, **CoreDNS는 관여하지 않습니다.**


```plain text
[Client] --(1. DNS: example.com → LB IP; 공용 DNS)--> [Client]
    │
    │ 2. TCP SYN to <LB IP:Port>  또는  <Node Public IP:NodePort>
    ▼
+-----------------+         +-------------------+         +----------------------+
|  External LB    |  --->   |       Node        |  --->   |       CNI Network    |
| (옵션, LB 타입)   |         | kube-proxy/iptables|        |  (Pod CIDR 라우팅)     |
+-----------------+         +-------------------+         +----------------------+
                                     │ 3. DNAT: LB/NodePort → PodIP:Port
                                     ▼
                               +----------------+
                               |      Pod       |
                               |  App Container |
                               +----------------+
```

- (1) **공용 DNS**가 `example.com`을 LB IP로 해석 (Route53/Cloud DNS 등)
- (3) **kube-proxy**가 DNAT로 Service → Pod 엔드포인트로 전달
- **CoreDNS는 없음**(클러스터 내부 DNS 질의가 발생하지 않음)

---


# 2) Ingress (호스트네임 기반 라우팅; CoreDNS 관여)


Ingress 컨트롤러가 **백엔드 Service를 “DNS 이름”으로 참조**하거나, 백엔드/사이드카가 **Service FQDN**으로 통신할 때 **CoreDNS**가 사용됩니다.


```plain text
[Client]
  │
  │ (1) 공용 DNS 질의: myapp.example.com → LB IP (공용 DNS)
  ▼
+-----------------+
|  External LB    |  <-- L4/L7
+-----------------+
        │
        │ (2) 트래픽 전달 (Host 헤더 유지)
        ▼
+-------------------------+
|   Ingress Controller    |  (Pod, 예: nginx/HAProxy/Traefik)
|   - 라우팅 규칙 로드        |
|   - 백엔드 Service 참조    |
+-----------+-------------+
            │
            │ (3) 백엔드 Service FQDN 해석 필요 시 → CoreDNS 질의
            ▼
     +---------------+           +----------------------+
     |   CoreDNS     |  (3-1)    |   Kubernetes API     |
     |  (ClusterIP)  |  <------> |  Endpoints/Service   |
     +-------+-------+           +----------------------+
             │ (A) ServiceName.svc.cluster.local → ClusterIP 로 해석
             ▼
+-------------------------+      +----------------------+
|   kube-proxy/iptables   | ---> |      CNI Network     |
| (4) DNAT: SVC → PodEP   |      |   (Pod CIDR 라우팅)    |
+-------------------------+      +----------------------+
                                         │
                                         ▼
                                   +-----------+
                                   |   Pod     |
                                   |  App      |
                                   +-----------+
```


### 흐름 포인트

1. **클라이언트는 공용 DNS**로 `myapp.example.com → LB IP` 해석
2. Ingress Controller가 Host 헤더 기반 라우팅
3. **백엔드 Service를 DNS 이름**(예: `myapp-svc.default.svc.cluster.local`)으로 참조하면

    → **CoreDNS**가 **Service FQDN → ClusterIP** 로 해석

    - (참고) 일부 컨트롤러/프록시는 **K8s API로 Endpoints를 직접 구독**해 IP를 가져가기도 함(이 경우 CoreDNS 질의가 줄어듦)
4. **kube-proxy**가 ClusterIP → Pod 엔드포인트로 **DNAT**
5. **CNI**가 노드/파드 네트워크로 전달
> 즉, **Ingress 경로에서 CoreDNS는 “클러스터 내부 이름 해석”**에 관여합니다.
>
> (클라이언트의 퍼블릭 도메인 해석은 **공용 DNS** 책임)
>
>

---


# 3) 내부 서비스 체인에서의 CoreDNS (참고)


인바운드 요청이 Pod에 도착한 뒤, **해당 Pod가 다른 Service/POD로 추가 호출**을 할 때도 CoreDNS가 등장합니다.


```plain text
(외부 → Ingress/Service → Pod)  ← 앞의 두 다이어그램과 동일
                            │
                            │  추가 내부 호출 (예: http://users-svc.default:8000)
                            ▼
                       [CoreDNS]
                            │ (Service FQDN → ClusterIP)
                            ▼
                     [kube-proxy DNAT]
                            ▼
                        [Target Pod]
```


---


## 핵심 정리

- **클라이언트 측 도메인 해석**: 공용 DNS (CoreDNS 아님)
- **클러스터 내부 도메인 해석**: **CoreDNS**
    - Ingress/백엔드/사이드카가 **Service FQDN**을 사용할 때
    - Pod가 다른 Service로 호출할 때
- **패킷 전달/변환**: kube-proxy(iptables/ipvs)의 **DNAT**, CNI의 **Pod 네트워크 라우팅**

필요하시면, 위 3개 케이스 각각을 **한눈에 비교하는 표**도 바로 만들어 드릴게요.

