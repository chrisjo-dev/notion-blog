---
title: "Kubernetes Outbound Traffic Flow"
description: "Pod Outbound Traffic Flow 1. DNS Query (CoreDNS → External DNS) - Application inside the pod makes a request → DNS query to CoreDNS - CoreDNS forwards to an upstream DNS specified in (e.g., Google 8.8.8.8, cloud-provided DNS) → Obtains IP and responds to the pod..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81ae9b24c13db9c68516"
koreanSlug: "kubernetes-아웃바운드-트래픽-플로우"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "Kubernetes 아웃바운드 트래픽 플로우"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

# Pod Outbound Traffic Flow


## 1. DNS Query (CoreDNS → External DNS)

- Application inside the pod makes a `api.github.com` request → DNS query to **CoreDNS**
- CoreDNS forwards to an upstream DNS specified in `/etc/resolv.conf` (e.g., Google 8.8.8.8, cloud-provided DNS) → Obtains IP and responds to the pod

    → This is how the pod learns the **IP address of the target server**.


---


## 2. Role of the CNI Plugin (Network Level L3 + NAT)

- **Pod IP Characteristics**: Pods use a **private IP** exclusively for the cluster interior (e.g., 10.x, 192.168.x).

    The external internet neither knows nor can reach these IPs.

- **CNI plugins (Calico, Flannel, Cilium, etc.)** manage the pod network.
    - **Routing (L3)**: Forwards traffic from the pod → to the node interface
    - **NAT (Masquerade)**: Uses iptables (or nftables) to **translate the source IP from Pod IP → Node IP**
        - This process is called SNAT (Source NAT).
        - From the outside, it appears as though "the request came from the node."

---


## 3. External Communication (Sent via Node IP)

- The translated packet now exits to the internet with the **node's public IP** as the source.
- From the perspective of the external server (`api.github.com`) → it looks as if the request came from a single node IP.
- When the response comes back, the node's NAT table looks it up and → forwards it to the original pod.

---


## 4. Relationship with kube-proxy

- **kube-proxy** is responsible for **distributing inbound/internal requests** to **cluster-internal services (ClusterIP, NodePort, LoadBalancer, etc.)**.
- That is, it does not directly intervene in **outbound requests** in the `파드 → 외부` direction.
- For outbound, **CNI plugin + iptables NAT** is the core mechanism.

---


# 🔹 Traffic Flow Summary


```plain text
[Pod] --DNS Query--> [CoreDNS] --forward--> [외부 DNS]
[Pod] --패킷--> [CNI 네트워크] --L3 라우팅--> [Node]
[Node] --SNAT(Masquerade)--> [Node Public IP]
[Internet] <---> [외부 서버(api.github.com)]
[Node] --DNAT(reverse)--> [Pod]
```


```javascript
+-----------------+        +-------------+        +------------------+        +-------------------+
|      Pod        |        |   CoreDNS   |        |    Node (NAT)    |        |   External Server |
| (10.244.x.x IP) |        | (ClusterIP) |        | (Public IP 보유) |        | api.github.com    |
+-----------------+        +-------------+        +------------------+        +-------------------+
        |                        |                         |                           |
        | 1. DNS Query           |                         |                           |
        |----------------------->|                         |                           |
        |                        | 2. Forward to 외부 DNS   |                           |
        |                        |------------------------>| (ex. 8.8.8.8)             |
        |                        |<------------------------|                           |
        |<-----------------------|                         |                           |
        |   (IP 주소 응답)         |                         |                           |
        |                        |                         |                           |
        | 3. 패킷 송신             |                         |                           |
        |----------------------->|   (CNI L3 라우팅)        |                            |
        |                        |------------------------>|                           |
        |                        |                         |                           |
        |                        |   4. SNAT (Pod→Node IP) |                           |
        |                        |------------------------>|-------------------------->|
        |                        |                         |     5. 요청 전달            |
        |                        |                         |                           |
        |                        |                         |<--------------------------|
        |                        |   6. DNAT (역변환)        |                           |
        |<-------------------------------------------------|                           |
        |          7. 응답 전달    |                         |                           |
        |                        |                         |                           |
```


```javascript
┌─────────────┐
   │     Pod     │  (예: 10.244.0.5)
   │  App 프로세스 │
   └──────┬──────┘
          │
          │ 패킷 생성 (src=10.244.0.5, dst=api.github.com)
          ▼
   ┌─────────────┐
   │   CNI 계층   │  (가상 네트워크, veth pair, bridge 등)
   │   L3 라우팅   │
   └──────┬──────┘
          │
          │ 패킷 전달
          ▼
   ┌─────────────┐
   │    Node     │  (예: 192.168.0.10)
   │ iptables NAT│
   └──────┬──────┘
          │
          │ SNAT 수행
          │ src=192.168.0.10 (공인/사설 IP) 로 변경
          ▼
   ┌─────────────┐
   │   Internet  │
   │   외부 서버   │  (예: api.github.com / 140.82.x.x)
   └─────────────┘
```


---


# 🔹 Additional Points to Understand

- **Pod-to-Pod communication (within the same cluster)** → No NAT needed (CNI routes directly)
- **Pod → External Internet communication** → NAT required (uses node's public IP)
- **External → Direct Pod access** → Not possible (ClusterIP is internal only).

    In this case, a **Service (NodePort / LoadBalancer / Ingress)** is required.


---


👉 Your summary is spot-on as-is, but to nail down the key differences:

- **CoreDNS**: "Domain → IP" translation
- **CNI + NAT**: "Pod private IP → Node public IP" translation
- **kube-proxy**: "Requests coming from outside → distributed to internal pods"

---


If you'd like, I can draw this entire flow as a **packet movement diagram** in text art (`Pod → Node → NAT → 외부`)!