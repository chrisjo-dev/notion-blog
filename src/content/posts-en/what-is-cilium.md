---
title: "What is Cilium?"
description: "#IaaS #Onboarding #Concepts #Cilium 1. Networking Basics - When you have multiple servers/applications, they need IP addresses and ports to communicate with each other. - Data flows through transport layers like TCP/UDP, and the actual requests/responses we use happen at the application layer like HTTP..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b8177a826cb7570e163d4"
koreanSlug: "cilium이란"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "Cilium이란?"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

#IaaS #Onboarding #Concepts #Cilium


## 1. Networking Basics

- When you have multiple servers/applications, they need an IP address and port to **communicate** with each other.
- Data flows through **transport layers** like TCP/UDP, and the actual requests/responses we use happen at the **application layer** like HTTP.
- However, containers (Pods) have a **very short lifespan** and their IPs keep changing → **managing network connections becomes complex**.

---


## 2. Kubernetes Networking (CNI)

- Since Kubernetes Pods need to communicate with each other, it uses a standard plugin called **CNI (Container Network Interface)**.
- **CNI responsibilities**:
    1. Assign an IP when a Pod is created
    2. Configure routing/network rules
    3. Guarantee Pod ↔ Pod / Pod ↔ external connectivity
- Notable CNIs:
    - **Flannel**: Simple overlay network (provides only basic connectivity).
    - **Calico**: Supports L3/L4 security policies, iptables-based.
    - **Cilium**: eBPF-based, enhanced security, performance, and observability.

---


## 3. eBPF (extended Berkeley Packet Filter)

- Originally a technology built for packet filtering inside the Linux kernel.
- Now expanded into **"small programs that run inside the Linux kernel"**.
- Characteristics:
    - Can **dynamically extend functionality** without directly modifying kernel code.
    - **High performance**: iptables slows down as rules increase, but eBPF operates efficiently inside the kernel.
    - Can intercept network packets, system calls, and process events to execute custom logic.

👉 Simply put: **"A tiny app that runs at blazing speed inside Linux"**.


---


## 4. What is Cilium?

- Cilium is a **Kubernetes CNI built on eBPF**.
- It goes beyond simple network connectivity, supporting **security, load balancing, monitoring, and service mesh** as well.

### Key Features

1. **Networking**
    - Provides connectivity for Pod ↔ Pod and Pod ↔ external.
    - Supports both overlay and native routing.
2. **Security Policies**
    - Not just L3/L4 (IP/port), but also
    - **L7 (HTTP, gRPC, Kafka)** level policies.
    - Example: "The frontend Pod can only call `/api/v1/*` on the backend".
3. **Load Balancing**
    - Distributed processing for Kubernetes Services.
    - Uses eBPF instead of iptables/XDP → fast and efficient.
4. **Observability (Hubble)**
    - Visualizes which Pod communicated with whom.
    - Tracks block/allow reasons, latency, and request paths.
5. **Service Mesh (optional)**
    - Provides mesh features via eBPF without sidecars like Istio (L7 routing, authentication, traffic management).

---


## 5. Comparison with Other CNIs


| CNI     | Technology Base | Characteristics                                              |
| ------- | --------------- | ------------------------------------------------------------ |
| Flannel | VXLAN/Overlay   | Basic connectivity only, no policies                         |
| Calico  | iptables        | Provides security policies, performance degrades at scale    |
| Cilium  | eBPF            | High performance, L7 policies, observability, service mesh   |


---


## 6. One-Line Summary


👉 **Cilium = "Next-generation Kubernetes network platform based on eBPF"**

- An all-in-one solution that goes beyond simple networking to include **security, load balancing, observability, and service mesh**.