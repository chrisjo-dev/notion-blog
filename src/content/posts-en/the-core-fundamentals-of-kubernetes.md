---
title: "The Core Fundamentals of Kubernetes"
description: "#IaC #kube #concepts 1. Basic Unit - Pod     - The smallest deployable unit in Kubernetes     - One or more containers + shared storage (Volumes) + network (IP) + execution info     - Containers within the same Pod share IP and port space..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81cbbc99dd1e7a19a9b6"
koreanSlug: "쿠버네티스의-기본-핵심"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "쿠버네티스의 기본 핵심"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

#IaC #kube #concepts


## 1. Basic Unit

- **Pod**
    - The smallest deployable unit in Kubernetes
    - One or more containers + shared storage (Volumes) + network (IP) + execution info
    - Containers within the same Pod share IP and port space, and are always scheduled together on the same Node
    - Short-lived (IP changes as well), making direct dependency difficult

---


## 2. Managing Pods

- **ReplicaSet**
    - Ensures a specified number of Pods are always running
    - Automatically creates new Pods when existing ones die
- **Deployment**
    - A higher-level resource that controls ReplicaSets
    - Provides version management features such as rolling updates and rollbacks

---


## 3. Pods and Nodes

- **Node**
    - The worker machine where Pods run (physical server or VM)
    - Each Node must run kubelet, kube-proxy, and a container runtime
    - Pods always run on a Node; if a Node dies, its Pods disappear and are rescheduled on another Node
- **Nature of a Node**
    - A tangible physical or virtual machine that Kubernetes abstracts as a Pod execution unit

---


## 4. VM and OS Environment

- **Linux**
    - Kubernetes runs directly on Linux (no VM required)
    - Foundation of container technology: Linux kernel features (cgroups, namespaces)
- **macOS / Windows**
    - No Linux kernel available, so a **VM is spun up to provide a Linux environment**
    - Tools like Docker Desktop and minikube internally launch a VM to serve as the Kubernetes Node
- **Windows Hyper-V**
    - The default virtualization engine for running VMs on Windows
    - Docker Desktop uses a Hyper-V VM (or WSL2) when running Kubernetes on Windows

---


## 5. Services

- **Why They're Needed**
    - Pod IPs change constantly, making stable connections impossible
    - Abstraction is needed so that applications are unaffected by Pod changes
- **Service Definition**
    - An abstraction resource that provides a stable endpoint for a logical set of Pods
    - Creates **loose coupling** between Pods and applications
- **Service Types**
    1. ClusterIP (default): Internal-only IP within the cluster
    2. NodePort: Exposed on a specified port of each Node's IP
    3. LoadBalancer: Integrates with a cloud load balancer to handle external traffic
    4. ExternalName: Maps to an external DNS name (CNAME)
- **Labels and Selectors**
    - The mechanism for associating Pods with a specific Service
    - Attach key-value labels like `app=frontend`, `env=prod` and match them using selectors

---


## 6. Summary of Key Takeaways

- Pod = container execution unit (short-lived, IP changes)
- ReplicaSet = guarantees the desired number of Pods
- Deployment = manages ReplicaSets + rolling updates
- Node = the actual machine (physical or virtual) Pods run on
- Linux = can run Kubernetes directly; macOS/Windows = requires a VM
- Service = abstracts a set of Pods to provide a stable endpoint, maintaining loose coupling between applications

---


## 7. Diagram


```python
[사용자 요청]
      │
      ▼
+-------------------+
| Deployment        |  ← 버전 관리, 롤링 업데이트
+-------------------+
          │
          ▼
+-------------------+
| ReplicaSet        |  ← Pod 개수 보장
+-------------------+
          │
          ▼
+-------------------+
| Pod (1개 이상 컨테이너) |
| - Containers      |
| - Volumes         |
| - IP (비영속)      |
+-------------------+
          │
          ▼
+-------------------+
| Node (물리/VM)     |
| - kubelet         |
| - kube-proxy      |
| - containerd      |
+-------------------+
          │
          ▼
+---------------------------------------------------+
| Service                                           |
| - Pod 집합을 추상화 (IP 변동과 무관한 고정 접근)   |
| - ClusterIP: 내부 전용                            |
| - NodePort: 외부에서 NodeIP:Port                  |
| - LoadBalancer: 클라우드 LB와 연동                 |
| - ExternalName: 외부 DNS 매핑                     |
+---------------------------------------------------+
          │
          ▼
   [클러스터 외부/내부 클라이언트]
```


---


## 8. Concept-Based Storytelling


In the early days, deploying an application meant physically provisioning servers, installing an operating system, and running the application directly on top. As services grew more complex and the need to manage multiple applications simultaneously increased, the desire to run multiple services in isolated environments became natural. This drove the advancement of virtualization technology, enabling users to create multiple VMs on top of a hypervisor, each with its own independent environment.


However, VMs were resource-heavy, duplicated the operating system, and introduced performance overhead due to full isolation. Container technology emerged to address these drawbacks. Containers leverage Linux kernel features (cgroups, namespaces) to provide isolated execution environments on a single operating system. This allowed developers to run and manage applications like App1 and App2 as lightweight container units, enabling far more efficient operations even in distributed environments.


Yet containers alone couldn't handle operations at the scale of hundreds or thousands of units. A platform capable of systematically managing container lifecycle, networking, storage, security, and high availability was needed — and that answer was Kubernetes. Evolved from Google's internal Borg system, Kubernetes is an orchestration tool used today by countless companies to operate large-scale services.


The smallest deployable unit in Kubernetes is a **Pod**. A Pod is a logical unit encapsulating one or more containers, shared storage, and a network IP — it can die and be recreated at any time. To always maintain a specified number of Pods, **ReplicaSets** exist. Above them, **Deployments** control ReplicaSets while also providing deployment strategies like rolling updates and rollbacks.


The biggest challenge in running Pods is the **non-persistence of IPs**. Because a Pod's IP changes every time it is recreated, other applications cannot reach it directly. To solve this, the **Service** resource was introduced. A Service provides a stable endpoint for a set of Pods and handles internal service discovery and load balancing. With types such as ClusterIP, NodePort, LoadBalancer, and ExternalName, Pods can be exposed in various ways — allowing users to access applications reliably regardless of Pod changes.


Pods need actual resources to run, and that environment is the **Node**. A Node can be a physical server or a virtual machine. Each Node runs **kubelet**, **kube-proxy**, and a **container runtime** (Docker, containerd, etc.), while the Kubernetes **Control Plane** manages the overall cluster state. The Control Plane consists of the API Server, etcd, Controller Manager, and Scheduler — acting as the brain of the cluster.


Kubernetes does far more than just manage Pods and networking. It handles persistent data via **storage (PersistentVolume, PersistentVolumeClaim)**, automatically scales Pod counts based on traffic with the **Horizontal Pod Autoscaler (HPA)**, and provides multi-tenancy and security through **namespaces and RBAC (Role-Based Access Control)**. Ultimately, Kubernetes has established itself not merely as a container management tool, but as a complete distributed platform encompassing **scalability, high availability, security, and automation**.