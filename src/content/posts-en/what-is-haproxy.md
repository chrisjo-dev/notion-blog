---
title: "What is HAProxy?"
description: "#Infra #Proxy #Concepts HAProxy (High Availability Proxy) is, as the name suggests, an open-source reverse proxy + load balancer software that emphasizes High Availability. In other words, it's one of the representative solutions designed to overcome the limitations of proxies (e.g., single point of failure, performance degradation) discussed earlier."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b8122b68bf701c16feff3"
koreanSlug: "ha-proxy란"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "HA-Proxy란?"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

#Infra #Proxy #Concepts


**HAProxy (High Availability Proxy)** is, as the name suggests, an open-source **reverse proxy + load balancer** software that emphasizes **High Availability**.


In other words, it's one of the representative solutions designed to overcome the limitations of proxies discussed earlier (e.g., single point of failure, performance degradation).


---


## 1. Role

- **Reverse Proxy Functionality**

    Receives requests from external users and forwards them to multiple internal servers (supports security, SSL termination, and caching).

- **Load Balancer Functionality**

    Distributes traffic across multiple servers using various algorithms (Round Robin, Least Connections, Source IP Hash, etc.).

- **High Availability**

    Automatically redirects requests to another healthy server in the event of a server failure.


---


## 2. Why Use It?


It is often adopted to address the **reverse proxy failure scenarios** mentioned earlier.

- **Single Point of Failure (SPOF) → Resolved**

    → HAProxy supports clustering and redundancy configurations.

- **Performance Degradation → Resolved**

    → High-performance engine implemented at the C level, capable of handling hundreds of thousands of concurrent connections.

- **Load Balancing Errors → Prevented**

    → Built-in **health checks** for backend servers.

- **Certificate Management**

    → Supports SSL/TLS termination, reducing the burden on web servers.


---


## 3. Representative Use Cases

- **Large-Scale Web Service Frontend**: Distributes web traffic across multiple web servers.
- **Pre-API Server Gateway**: Traffic routing and security hardening.
- **Microservices Environments**: Sometimes used as a replacement for Kubernetes Ingress Controllers.
- **Security Gateway**: IP blocking, limited DDoS defense.

---


## 4. Comparison with Other Technologies

- **Forward Proxy**: Primarily for internal network control (e.g., Squid)
- **Reverse Proxy**: Server protection / load distribution (e.g., Nginx, Apache mod_proxy)
- **HAProxy**: A specialized solution that addresses the limitations of reverse proxies with high performance and high availability

---


# 1) Architecture Comparison Diagram


## A. Without HA (Single Point of Failure Exists)


```plain text
[사용자]
   │
   ▼
[리버스 프록시/로드밸런서]  ← 단일 인스턴스(SPOF)
   │
   ├── [웹/앱1]
   └── [웹/앱2]
```

- If the proxy/load balancer goes down, the entire service goes down.
- Even with multiple backends, a single node at the front becomes a bottleneck/failure point.

## B. With HA (Redundancy + Health Checks + Automatic Failover)


```plain text
(DNS/Anycast/가상 IP/게이트웨이)
[사용자] ─────────────────────────────────────►
        ┌───────────────┬───────────────┐
        ▼               ▼               ▼
 [LB/프록시-A]   <HB>  [LB/프록시-B]   (선택적으로 GSLB)
        │  \            /  │
        │   └─ 동기/상태공유 ┘
        │
        ├──(헬스체크)──► [웹/앱1]
        ├──(헬스체크)──► [웹/앱2]
        └──(헬스체크)──► [웹/앱3]
```

- **Two or more** LB/proxy instances (**Active-Active or Active-Standby**).
- **Health checks** automatically exclude dead backends.
- The frontend entry point minimizes downtime using **Route53 (multi-value, health checks), Anycast, virtual IP (Failover)**, etc.

# 2) Traffic Flow (Failure Scenarios)


### Without HA (Single LB Failure)

1. User → Single LB node goes down
2. Connection fails (even if backends are healthy, it's meaningless)

### With HA (Frontend LB Redundancy)

1. User → LB-A goes down
2. Heartbeat (HB) / health check detects it → **LB-B automatically takes over**
3. User requests continue to be handled through LB-B
4. On backend failure, only that node is excluded and service continues

# 3) Practical Checklist (Summary)


## Frontend (Reverse Proxy / Load Balancer)

- [ ] **2 or more instances** deployed (Active-Active recommended; consider session sync if sticky sessions are needed)
- [ ] **State sharing / Heartbeat** (e.g., keepalived, VRRP, or cloud-native LB)
- [ ] **Entry point redundancy**:
    - On-premises: VRRP (virtual IP), BGP/Anycast, dual core switches
    - AWS: **ALB/NLB multi-AZ**, Route53 health checks/Failover
- [ ] **TLS termination**: Automated certificate renewal (e.g., ACME/certbot, ACM) + HSTS/security profiles
- [ ] **Observability**: Metrics/logs (request count, error rate, latency p90/p99), dashboards/alerts

## Backend (Web/App/Service)

- [ ] **Horizontal scaling to N instances** + **health check endpoints** provided (/health, /ready, etc.)
- [ ] **Zero-downtime deployment** (blue/green, rolling) and rollback strategy
- [ ] **Session management**:
    - **Stateless** is recommended if sticky sessions are not needed
    - If needed, apply Redis session store or LB-level stickiness

## Data Layer

- [ ] **Multi-AZ** (RDS), replica/failover strategy
- [ ] **Backup/recovery** and recovery drills (Runbook)

# 4) AWS Example (Simple Pattern)


### Web Application (Recommended)


```plain text
Route53(헬스체크/Failover)
          │
       ALB(다중 AZ)
          │
     ECS/EKS Auto Scaling (헬스체크, 롤링 업그레이드)
          │
        RDS Multi-AZ / ElastiCache
```

- Since ALB itself acts as proxy + LB, **proxy redundancy concerns are minimized**.
- Built-in container auto-scaling, health checks, and retries.
- Certificates automatically managed via **ACM**.

### On-Premises / Hybrid (Self-Managed Proxy)

- 2 proxy instances (Nginx/HAProxy) + **keepalived (VRRP)** for virtual IP operation
- Or an **L4 switch** at the front for distribution → Nginx/HAProxy farm behind it
- Certificate automation + Prometheus/Grafana/alerting stack is essential

# 5) Operational Tips (Minimizing Downtime)

- **Canary Testing**: Validate new configurations with a subset of traffic
- **Circuit Breaker / Timeout**: Prevent downstream failure propagation
- **Retry / Backoff**: Prevent excessive retry storms
- **Runbook / Drills**: Document recovery procedures for each scenario — LB failure, certificate expiration, backend outage, etc.