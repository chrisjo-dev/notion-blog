---
title: "Forward Proxy vs. Reverse Proxy: A Complete Overview"
description: "#Infra #IaaS #Concepts #Proxy 1. What is a Proxy Server? - An intermediary server that acts as a middleman between a client and a server. - Instead of passing requests and responses directly, the proxy server handles them on behalf of either party. - Used for security, performance optimization, access control, load balancing, and more."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81c9acb3c282d151d8fb"
koreanSlug: "forward-proxy-reverse-proxy-서버-정리"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "Forward Proxy, Reverse Proxy 서버 정리"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

#Infra #IaaS #Concepts #Proxy


## 1. **What is a Proxy Server?**

- An intermediary server that acts as a **middleman** between a client and a server.
- Instead of passing requests and responses directly, the **proxy server handles them on behalf of either party**.
- Used for security, performance optimization, access control, load balancing, and more.

---


## 2. **Types and Representative Technologies**


### (1) **Forward Proxy**

- **Positioned in front of the client** → handles outbound requests on the client's behalf.

### Why use it?

- Security / Anonymity (hides the real client IP)
- Access control (blocking specific sites within an organization)
- Caching (faster delivery of frequently requested content)
- Bandwidth reduction

### Representative Technologies / Products

- **Squid Proxy** → the most well-known open-source forward proxy
- **Apache HTTP Server (mod_proxy)** → supports proxy functionality
- **Blue Coat ProxySG** (enterprise commercial solution)
- **Zscaler Internet Access (ZIA)** (cloud-based security proxy)

---


### (2) **Reverse Proxy**

- **Positioned in front of the server** → handles inbound requests on the server's behalf.

### Why use it?

- Load balancing (distributing traffic across multiple servers)
- Enhanced security (hiding the actual server structure and addresses)
- SSL termination (handling TLS encryption)
- Caching (faster delivery of static files)
- High availability (Failover support)

### Representative Technologies / Products

- **Nginx** → the most widely used open-source reverse proxy
- **Apache HTTP Server (mod_proxy, mod_ssl)**
- **F5 BIG-IP LTM** (large-scale enterprise load balancer)
- **AWS ALB (Application Load Balancer)**
- **Cloudflare** (CDN + reverse proxy)

---


## 3. **Comparison Summary**


| Category | Forward Proxy | Reverse Proxy |
| -------- | ------------- | ------------- |
| Position | In front of the client | In front of the server |
| Acts on behalf of? | Client | Server |
| Traffic direction | Outbound (internal → external) | Inbound (external → internal) |
| Primary purpose | Anonymity, access control, caching, bandwidth reduction | Load balancing, security, SSL termination, high availability |
| Representative technologies/products | Squid, Apache mod_proxy, Zscaler, Blue Coat | Nginx, Apache mod_proxy, F5 BIG-IP, AWS ALB, Cloudflare |


```python
[클라이언트] → (포워드 프록시) → 인터넷 → [서버]
   (내부망에서 나갈 때)

[클라이언트] → 인터넷 → (리버스 프록시) → [서버]
   (외부 요청이 들어올 때)
```


---


Key Takeaways:

- **Forward Proxy** is for **controlling and securing internal users**
- **Reverse Proxy** is for **distributing and securing external traffic**
- **Their physical position is fundamentally the same** → between the client and the server.
- **However, their roles and perspectives differ** → the name changes based on who they act on behalf of.
    - Acting on behalf of the client → Forward Proxy (outbound)
    - Acting on behalf of the server → Reverse Proxy (inbound)