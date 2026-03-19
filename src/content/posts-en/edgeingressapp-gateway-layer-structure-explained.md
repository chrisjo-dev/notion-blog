---
title: "Edge–Ingress–App Gateway Layer Structure Explained"
description: "#Infra #IaaS #Concepts #LayerStructure 1. The \"Layer Map\" to Build in Your Head - Edge (Global Edge): CloudFront, WAF, DNS (Route53/GA). CDN · DDoS · global routing. - L4 Ingress (Transport Layer): NLB, (on-premises L4 switch)..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b812282ede55cb879884c"
koreanSlug: "edgeingressapp-gateway-계층-구조-정리"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "Edge–Ingress–App Gateway 계층 구조 정리"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

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

# 1. The "Layer Map" to Build in Your Head

- **Edge (Global Edge)**: CloudFront, WAF, DNS (Route53/GA). CDN · DDoS · global routing.
- **L4 Ingress (Transport Layer)**: NLB, (on-premises L4 switch). TCP/UDP, static IP, source IP preservation, mTLS passthrough.
- **L7 Ingress (Application Layer)**: ALB. Host/path routing, HTTP/2 · gRPC · WebSocket, health checks, SSL termination.
- **App Gateway (per-service proxy)**: Nginx/HAProxy. Fine-grained header/rewrite control, caching, compression, rate-limiting, advanced routing.
- **Service (Application)**: ECS/EKS/EC2, Lambda, etc.

With this layer map as your reference, deciding "which layer is responsible for the feature I need?" first will naturally lock in the right combination.


# 2. Layer Structure


### (1) **Edge (Global Edge)**

- **Components**: Route 53 (DNS), CloudFront (CDN), AWS WAF, Global Accelerator (GA)
- **Key Roles**:
    - DNS-based traffic distribution
    - Worldwide CDN caching and acceleration
    - Security filtering via WAF (including DDoS protection)
    - Static IP provisioning via GA's Anycast-based routing and edge-level traffic optimization

---


### (2) **L4 Ingress (Transport Layer)**

- **Components**: AWS NLB (Network Load Balancer), on-premises L4 switch
- **Key Roles**:
    - TCP/UDP traffic distribution (no application-level inspection)
    - **Static IP provisioning** → essential for firewall whitelisting and financial/security compliance
    - Source IP preservation (beneficial for security logging)
    - TLS Passthrough and mTLS support

---


### (3) **L7 Ingress (Application Layer)**

- **Components**: AWS ALB (Application Load Balancer)
- **Key Roles**:
    - HTTP/HTTPS/gRPC/WebSocket support
    - **Host-based routing**: `api.example.com`, `shop.example.com`
    - **Path-based routing**: `/api/*`, `/static/*`
    - SSL termination (integrated with ACM certificates)
    - Health checks and traffic distribution
    - Direct Lambda target invocation → serverless environment support

---


### (4) **App Gateway (Per-Service Proxy)**

- **Components**: Nginx, HAProxy
- **Key Roles**:
    - Fine-grained header/cookie/body manipulation
    - Caching (static/dynamic)
    - Compression, detailed TLS configuration
    - Sophisticated routing (per-tenant, per-version routing)
    - Rate limiting and enhanced security rules

---


### (5) **Service (Application)**

- **Components**: ECS, EKS, EC2, Lambda
- **Key Roles**: Handles actual business logic (web apps, APIs, microservices, etc.)

---


## 3. Common Patterns

1. **ALB Standalone**

```plain text
Client → Route53/WAF → ALB → ECS/EKS/EC2/Lambda
```

- Simple and fully managed.
- Suitable for most standard web services.

1. **ALB → Nginx/HAProxy**

```plain text
Client → ALB → Nginx/HAProxy → App
```

- Use when complex URL rewrites, fine-grained header/body manipulation, or advanced caching/compression are required.

1. **NLB → ALB**

```plain text
Client → NLB(고정 IP) → ALB(L7 라우팅) → App
```

- ALB alone cannot provide a static IP → supplement with NLB.
- Suitable for financial and security-regulated environments.

1. **CloudFront (+WAF) → ALB**

```plain text
Client → CloudFront(+WAF) → ALB → App
```

- Use when targeting global users and CDN acceleration + enhanced security are required.

---


## 4. Technology Comparison (Nginx / HAProxy / NLB / ALB)


| Category | **Nginx** | **HAProxy** | **NLB** | **ALB** |
| --- | --- | --- | --- | --- |
| **Original Purpose** | Web server + reverse proxy | Dedicated load balancer | Managed L4 LB | Managed L7 LB |
| **Supported Layer** | L7 (HTTP-centric) | L4+L7 | L4 (TCP/UDP) | L7 (HTTP/HTTPS/gRPC/WebSocket) |
| **Static File Serving** | Yes | No | No | No |
| **Load Balancing Algorithms** | Basic (Round Robin, etc.) | Very diverse (response-time based, etc.) | Limited | Limited |
| **Health Checks** | Basic level | Advanced support | Built-in (AWS managed) | Built-in (AWS managed) |
| **SSL Termination** | Supported | Supported | Passthrough/Termination | Supported (ACM integration, auto-managed) |
| **Operation Model** | Self-managed | Self-managed | AWS managed | AWS managed |
| **Strengths** | Versatile, Ingress Controller | Ultra-high performance LB | Static IP, ultra-low latency | HTTP L7 specialization, serverless integration |
| **Weaknesses** | Requires self-management | Self-managed, learning curve | No L7 support | No static IP |


---


## 5. Conclusion

- **Edge** is responsible for global traffic distribution and security.
- **NLB** handles the network layer (L4): static IPs, ultra-low latency, and non-HTTP traffic.
- **ALB** handles application-layer (L7) HTTP-based routing.
- **Nginx/HAProxy** sits in front of applications to provide fine-grained control and advanced features.