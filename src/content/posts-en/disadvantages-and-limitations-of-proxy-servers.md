---
title: "Disadvantages and Limitations of Proxy Servers"
description: "#Infra #IaaS #Concepts #Proxy 1. Common Disadvantages - Additional Latency     - Since an intermediate server is inserted between the client and the server, network latency can occur during the request/response process.     - Performance degradation is especially noticeable when encryption (SSL/TLS) processing or complex rules are involved..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b8137ae42d2ed6904404a"
koreanSlug: "프록시-서버의-단점-및-한계"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "프록시 서버의 단점 및 한계"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

#Infra #IaaS #Concepts #Proxy


## 1. **Common Disadvantages**

- **Additional Latency**
    - Since an intermediate server is inserted between the client and the server, network latency can occur during the request/response process.
    - Performance degradation is especially noticeable when SSL/TLS encryption processing or a large number of complex rules are involved.
- **Single Point of Failure (SPOF)**
    - If the proxy server itself goes down, the entire service can be interrupted.
    - To prevent this, a High Availability (HA) configuration is essential.
- **Operational/Management Complexity**
    - Rules, certificates, and access control lists must be managed, and configuration becomes increasingly complex in large-scale environments.
    - Incorrectly applied policies can lead to service outages.
- **Security Risks**
    - A misconfigured proxy can become an **Open Proxy**, posing a security threat that allows anyone to route traffic through it.
    - There is also the possibility that attackers intercept or abuse traffic.

---


## 2. **Disadvantages of Forward Proxy**

- **Lack of Transparency**
    - Clients often need to configure the proxy manually (via browser or OS network settings).
    - Incorrect configuration can result in no internet access at all or restricted connectivity.
- **Limitations of Anonymity**
    - Some websites and services detect and block forward proxies (e.g., attempts to bypass geo-restrictions in certain countries).
    - Advanced tracking techniques (IP fingerprinting, TLS fingerprinting) can still identify the real client.
- **Caching Issues**
    - Cached content may become stale and fail to reflect the latest data.
    - It is not suitable for services where real-time data is critical (e.g., stock trading, real-time notifications).

---


## 3. **Disadvantages of Reverse Proxy**

- **Initial Configuration Complexity**
    - Load balancing, SSL certificate management, redirects, and caching policies must all be configured in detail.
    - Lack of operational experience can actually cause outages.
- **Additional Infrastructure Costs**
    - Hardware or cloud costs for the reverse proxy server are added.
    - Environments that handle a large volume of SSL termination tend to have high CPU usage, sometimes requiring dedicated hardware (e.g., F5, dedicated SSL offloading appliances).
- **Bottleneck**
    - Since all external requests pass through the reverse proxy, a bottleneck occurs when it reaches its performance limit.
    - To resolve this, a scale-out architecture is essential.
- **Security Management Overhead**
    - All SSL/TLS certificates must be managed at the reverse proxy level.
    - Managing certificates becomes cumbersome when multiple domains and microservices are mixed together.

---


# Representative Scenarios Based on Proxy Server Disadvantages


## 1. Common Scenarios


### (1) Single Point of Failure (SPOF)

- **Situation**: A company deployed a reverse proxy (Nginx) as a single server in front of its web service.
- **Problem**: When the Nginx process went down, external users could not connect even though all web servers were functioning normally.
- **Cause**: The architecture required all requests to pass through the reverse proxy, making it both a bottleneck and a SPOF.
- **Lesson**: Reverse proxies and load balancers must always be configured with redundancy (HA setup).

---


### (2) Performance Degradation and Increased Latency

- **Situation**: A company handled SSL termination, logging, and authentication simultaneously on a single proxy server.
- **Problem**: During peak hours, CPU usage reached 100%, causing request response times to balloon to several seconds.
- **Cause**: A bottleneck occurred as encryption/decryption operations concentrated on a single point.
- **Lesson**: SSL offloading hardware, dedicated appliances, or a scale-out architecture is necessary.

---


## 2. Forward Proxy Scenarios


### (1) Inconsistent Caching

- **Situation**: A company used a Squid proxy on its internal network to save bandwidth.
- **Problem**: Some employees could see the latest announcements, while others kept seeing an older version of the page.
- **Cause**: Squid continued to serve stale cached content.
- **Lesson**: For services where real-time accuracy matters, caching policies should be adjusted or specific URLs should be excluded from caching.

### (2) Service Blocking and Inaccessibility

- **Situation**: Students at school tried to access YouTube but received an "Access Denied" message.
- **Problem**: The forward proxy policy had streaming service domains blocked.
- **Cause**: The policy was applied, but students were not informed in advance, causing confusion.
- **Lesson**: Access control policies must be operated transparently, accompanied by proper user education.

---


## 3. Reverse Proxy Scenarios


### (1) Certificate Expiration Incident

- **Situation**: A startup installed an SSL certificate on their reverse proxy (Nginx) to operate HTTPS.
- **Problem**: The team forgot to renew the certificate, causing the entire website to display a "Security Warning (Expired Certificate)" and become inaccessible.
- **Cause**: Lack of certificate management automation.
- **Lesson**: Automated certificate renewal (e.g., Let's Encrypt + certbot) must be implemented.

### (2) Load Balancing Misconfiguration

- **Situation**: A reverse proxy was configured to distribute traffic across 3 web servers using round-robin.
- **Problem**: One server went down, but because health checks were disabled, traffic continued to be forwarded to the dead server.
- **Result**: One-third of users experienced connection failures.
- **Lesson**: Health check configuration is absolutely required on a reverse proxy.

### (3) Missing Security Configuration

- **Situation**: An internal API server behind the reverse proxy was supposed to be inaccessible directly from the outside.
- **Problem**: Due to insufficient firewall rules, external users were able to bypass the proxy and directly access the internal API server.
- **Lesson**: While a reverse proxy serves as a security gateway, it must be managed comprehensively in conjunction with network ACLs and firewalls.