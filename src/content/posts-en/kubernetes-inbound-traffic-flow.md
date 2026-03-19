---
title: "Kubernetes Inbound Traffic Flow"
description: "--- 1) NodePort / LoadBalancer (Accessing via IP:Port without a hostname) Only the client-side DNS (public DNS) is used here — CoreDNS is not involved. - (1) **Public DNS** resolves to the LB IP (Route53/Cloud DNS, etc.)..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b810b98cdf1528ecd3e87"
koreanSlug: "kubernetes-인바운드-트래픽-플로우"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "Kubernetes 인바운드 트래픽 플로우"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---



# 1) NodePort / LoadBalancer (Accessing via IP:Port without a hostname)


In this case, only **client-side DNS (public DNS)** is used — **CoreDNS is not involved**.


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

- (1) **Public DNS** resolves `example.com` to the LB IP (Route53/Cloud DNS, etc.)
- (3) **kube-proxy** forwards traffic from Service → Pod endpoint via DNAT
- **No CoreDNS** (no cluster-internal DNS queries are made)

---


# 2) Ingress (Hostname-based routing; CoreDNS is involved)


**CoreDNS** is used when the Ingress controller references a **backend Service by DNS name**, or when a backend/sidecar communicates using a **Service FQDN**.


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


### Flow Breakdown

1. **The client uses public DNS** to resolve `myapp.example.com → LB IP`
2. The Ingress Controller routes based on the Host header
3. When **a backend Service is referenced by DNS name** (e.g., `myapp-svc.default.svc.cluster.local`)

    → **CoreDNS** resolves the **Service FQDN → ClusterIP**

    - (Note) Some controllers/proxies **directly subscribe to Endpoints via the K8s API** to retrieve IPs, which reduces CoreDNS queries
4. **kube-proxy** performs **DNAT** from ClusterIP → Pod endpoint
5. **CNI** delivers traffic to the node/pod network
> In other words, **CoreDNS is involved in the Ingress path for "cluster-internal name resolution"**.
>
> (Public domain resolution for the client is the responsibility of **public DNS**)
>
>

---


# 3) CoreDNS in an Internal Service Chain (For Reference)


After an inbound request arrives at a Pod, **CoreDNS also comes into play when that Pod makes additional calls to other Services/Pods**.


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


## Key Takeaways

- **Client-side domain resolution**: Public DNS (not CoreDNS)
- **Cluster-internal domain resolution**: **CoreDNS**
    - When Ingress/backends/sidecars use a **Service FQDN**
    - When a Pod calls another Service
- **Packet forwarding/translation**: **DNAT** by kube-proxy (iptables/ipvs), **Pod network routing** by CNI

If you need it, I can also put together a **comparison table** covering all three cases at a glance.
