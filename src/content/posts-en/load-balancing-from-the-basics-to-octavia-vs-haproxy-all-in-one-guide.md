---
title: "Load Balancing from the Basics to Octavia vs HAProxy — All in One Guide"
description: "#IaaS #Onboarding #Concepts #Octavia --- 1) Core Load Balancing Concepts - Goal: Distribute traffic evenly across multiple backends (servers/pods) to ensure availability and performance. - L4 vs L7     - L4: TCP/UDP-level distribution. Fast and simple. Strong for source IP preservation, static IPs, and pass-through use cases.     - L7: HTTP/HTTPS-level distribution. Provides application-aware features like path/host-based routing, header inspection, and cookie stickiness."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81c7b0dce617bd9df455"
koreanSlug: "로드밸런싱-기초부터-octavia-vs-haproxy-까지-한-번에-정리"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "로드밸런싱 기초부터 Octavia vs HAProxy 까지 한 번에 정리"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

#IaaS #Onboarding #Concepts #Octavia


---


## 1) Core Load Balancing Concepts

- **Goal**: Distribute traffic evenly across multiple backends (servers/pods) to ensure **availability** and **performance**.
- **L4 vs L7**
    - **L4**: TCP/UDP-level distribution. Fast and simple. Strong for source IP preservation, static IPs, and pass-through use cases.
    - **L7**: HTTP/HTTPS-level distribution. Provides **application-aware** features like path/host-based routing, header inspection, and cookie stickiness.
- **Key Features**
    - **Health checks** (removing dead nodes)
    - **SSL/TLS termination**, **SNI**
    - **Session persistence** (cookie/source IP)
    - **Zero-downtime traffic switchover during rolling updates**
    - **Observability** (logs/metrics)

---


## 2) What Is HAProxy?

- **Identity**: An open-source **high-performance L4/L7 load balancer / reverse proxy** software.
- **How it's used**: **Installed directly** on a Linux server/VM/container and operated via a config file (`haproxy.cfg`).
- **Strengths**
    - Extremely high performance and stability; fine-grained routing, retry, stickiness, queuing, and rescheduling
    - Versatile deployment options (bare metal, VM, container, Kubernetes ingress controller, etc.)
- **One-liner**: **"The engine itself."** The closest, most direct way to work with load balancing functionality.

---


## 3) What Is Octavia?

- **Identity**: **OpenStack's LBaaS (Load Balancer as a Service)**.

    A **cloud service layer** that creates and manages "load balancer resources" via API.

- **Component Concepts**
    - **Octavia Control Plane**: API and orchestration.
    - **Amphora**: The **data plane** unit that handles actual traffic (typically a VM or container).

        The default driver, the **Amphora driver, runs HAProxy internally** to handle distribution.

    - **Neutron Integration**: Attaches the LB to virtual networks/subnets and integrates with floating IPs, security groups, etc.
- **Key Points**
    - Provides multi-tenancy, RBAC, billing/quotas, and API/automation in a **cloud-native standard way**.
    - Features a **provider driver** concept — the default is HAProxy-based (Amphora), but depending on the environment, alternatives like the **OVN provider** are also available.

---


## 4) The Relationship and Differences (At a Glance)

- **Relationship**: Octavia is the "service"; HAProxy is the "engine."
    - When you **create an Octavia load balancer** in OpenStack, **HAProxy (Amphora)** is what actually processes traffic behind the scenes.
- **Differences**
    - **Operational Level**:
        - Octavia: Creates and manages the lifecycle of a "load balancer as a resource" via API (cloud-native).
        - HAProxy: Operated directly through software installation and config files (host/container level).
    - **Multi-tenancy / Governance**:
        - Octavia: **IaaS governance built in** — projects, quotas, RBAC, billing.
        - HAProxy: Requires direct integration and custom implementation.
    - **Networking Integration**:
        - Octavia: Native integration with Neutron (IPs, security groups, routing).
        - HAProxy: Must be **manually** wired into OS/cloud networking.

---


## 5) When to Use What (Decision Guide)

- **OpenStack Private Cloud**:
    - Need standard governance / multi-tenancy / automation → **Octavia** (→ uses HAProxy internally)
- **Standalone VM / Bare Metal / Kubernetes Environment**:
    - Need fast direct control / custom routing / lightweight setup → **HAProxy directly**
- **Public Cloud (AWS, etc.)**:
    - Managed LB already available → Use **AWS NLB/ALB** first; add **HAProxy** as a supplementary layer in front/behind if needed.
- **Kubernetes**:
    - Use an **Ingress controller** (NGINX / HAProxy / Envoy, etc.).
    - For K8s on top of OpenStack, `Service: LoadBalancer` can integrate with **Octavia** to obtain an external IP.

---


## 6) Quick Config / Command Examples


### 6-1) Minimal HAProxy Example


`/etc/haproxy/haproxy.cfg` example:


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

- Apply/restart: `systemctl reload haproxy`, or for containers, `docker restart`.

### 6-2) Octavia (OpenStack CLI) Example Flow


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

- Once created this way, Octavia provisions and configures the Amphora (HAProxy), and traffic distribution begins.

---


## 7) Operational Tips / Best Practices


### Common

- **Observability**: Access logs (request labels/trace IDs), error logs, metrics (request count, queue depth, response code distribution, backend health).
- **Deployment Strategy**: Blue-green / canary. Use L7 rules for gradual traffic shifting.
- **Health Checks**: Implement a lightweight endpoint (`/healthz`, etc.) that reflects actual application health.
- **TLS**:
    - For L7 termination, configure forwarding of **X-Forwarded-For / Proto / Host** headers to the application.
    - If the original IP matters, consider **PROXY protocol** (L4).
- **Scale**: Tune connection count, queuing, and timeouts. Review performance options like Keep-Alive, HTTP/2, and compression.
- **Security**: Least-privilege security groups, DDoS mitigation (upstream layer/WAF), TLS policy (minimum version, strong ciphers).

### HAProxy-Specific

- **Configuration Management**: Automate config generation and deployment with Ansible/Consul-Template.
- **Zero-downtime Reload**: Leverage `runtime API` (socket) and `graceful reload`.
- **High Availability**: Use Keepalived (virtual IP) or place an upstream L4/NLB in front.

### Octavia-Specific

- **Topology**: `ACTIVE_STANDBY` (active-standby HA) vs `SINGLE` (single instance). Choose based on service criticality.
- **Provider**: Beyond the default Amphora (HAProxy), alternatives like OVN exist depending on the environment.
- **Networking**: Plan in conjunction with Neutron subnet / security group / floating IP design.
- **K8s Integration**: Service (type=LoadBalancer) → Octavia VIP assignment provides the external entry point.

---


## 8) Frequently Asked Questions (FAQ)


**Q1. Is it typical to use only one of them?**

- On OpenStack, using **Octavia** is the standard (HAProxy operates under the hood).
- Outside of OpenStack, using **HAProxy directly** is the common approach.

**Q2. Can they be used together?**

- Yes. The representative architecture is **Octavia (service layer)** with **HAProxy (data layer)** running inside it.
- In public cloud environments, **HAProxy is sometimes added as an extra layer in front of or behind ALB/NLB** (for fine-grained L7 policies, caching, circuit-breaker-like patterns).

**Q3. How do they compare to NGINX / Envoy?**

- All are general-purpose L7 proxies/load balancers.
    - **HAProxy**: A traditional powerhouse — high performance, strong fine-grained L7 and queuing control.
    - **NGINX**: Web server + reverse proxy role; rich ecosystem and documentation.
    - **Envoy**: A modern L7 proxy — gRPC/HTTP/2, filter chains, a natural fit for service meshes.

**Q4. What's the AWS equivalent?**

- **Octavia ≈ The ELB service family** (managed LB).
- **HAProxy ≈ Self-hosted software LB**.
- Typically, you start with **ALB/NLB** and supplement with **HAProxy on EC2/containers** when specialized policies are needed.

**Q5. How does it relate to Kubernetes?**

- In Kubernetes, you typically use an **Ingress controller** (NGINX / HAProxy / Envoy).
- For K8s running on top of OpenStack, `Service: LoadBalancer` **integrates with Octavia** to receive an external VIP.

---


## 9) Decision: Octavia or HAProxy?


### **When to Choose Octavia**

- You are operating an OpenStack cloud environment.
- You need to provide LB as a service to multiple projects/users.
- You want to use LB easily as a **user (API consumer)**, not as an administrator.
- You need **cloud management features** like RBAC, quotas, and billing.

👉 In short, if you're a **cloud service provider (OpenStack environment)**, **Octavia** is the right answer.


---


### **When to Choose HAProxy**

- You simply need load balancing for **a single service of your own**.
- You're in an environment without a cloud platform like OpenStack (on-premises, AWS EC2, Kubernetes, etc.).
- You want to do fine-grained tuning (queuing, session persistence, routing policies) yourself.
- You want to run a high-performance L4/L7 load balancer with a lightweight setup.

👉 In short, for **a single environment or a container platform like Kubernetes**, using **HAProxy directly** is the right call.


---


### **When to Use Both Together**

- OpenStack → Octavia API call → HAProxy runs inside the Amphora VM → Traffic is distributed.
- In other words, in an OpenStack environment, **using both together is essentially the standard architecture**.

---


## 10) Final Summary (Cheat Sheet)


| Category | HAProxy | Octavia |
| ----- | ------------------- | ------------------------ |
| Identity | Load balancer software (engine) | OpenStack LBaaS service (API) |
| Use Environment | Bare metal, VM, container, K8s | OpenStack cloud |
| Installation Method | Direct install/configuration | API call → automated deployment |
| Features | L4/L7 LB, fine-grained control | L4/L7 LB, cloud integration features |
| Strengths | Performance, flexibility, usable anywhere | Managed, multi-tenancy, API/automation |
| Weaknesses | Direct operational overhead | Limited to OpenStack, limited fine-tuning |
| Selection Criteria | Single service / need direct control | OpenStack cloud provisioning/consumption |}