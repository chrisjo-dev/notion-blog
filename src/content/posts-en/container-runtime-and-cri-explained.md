---
title: "Container Runtime and CRI Explained"
description: "#CRI #Infra #IaaS #Concepts  1. What is a Container Runtime? - A program that runs, stops, and deletes containers - Examples: Docker Engine, containerd, CRI-O, rkt (legacy) - Kubernetes does not run containers directly; instead, the kubelet sends requests to the runtime,..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81e29fc2e3d680c54997"
koreanSlug: "컨테이너-런타임-cri란"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "컨테이너 런타임, CRI란?"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

#CRI #Infra #IaaS #Concepts 


# 1. What is a Container Runtime?

- A program that **runs, stops, and deletes** containers
- Examples: Docker Engine, containerd, CRI-O, rkt (legacy)
- Kubernetes does not run containers directly — the **kubelet sends requests to the runtime**.

---


# 2. Background: Why CRI Was Introduced

- Early Kubernetes **only supported Docker Engine** → tight dependency on the Docker API
- No standardized interface for using other runtimes (containerd, CRI-O, etc.) → each required custom development per kubelet
- The solution: **CRI = a standard gRPC API between kubelet and container runtimes**

    → The kubelet only needs to know CRI; any runtime just needs to implement CRI.


---


# 3. Basic Architecture of CRI


_(Conceptual diagram)_

- **kubelet**

    → Issues Pod start/stop requests

- **CRI shim** (e.g., containerd-shim, cri-o)

    → Translates kubelet's gRPC calls into the runtime's internal logic

- **Container runtime** (containerd, CRI-O, etc.)

    → Actually creates and runs containers


---


# 4. CRI Components (2 gRPC Services)

1. **RuntimeService**
    - Manages PodSandbox (the smallest unit of a Kubernetes Pod)
    - Creates, starts, stops, and deletes containers
    - Supports exec / attach / logs, etc.
2. **ImageService**
    - Pulls, removes, and lists container images
    - Queries image status

---


# 5. Major CRI Implementations

- **containerd**
    - A CNCF project, evolved from Docker Engine as a standalone runtime
    - Used as the default in most Kubernetes clusters
- **CRI-O**
    - Led by Red Hat — "Lightweight CRI implementation for OCI containers"
    - Default runtime for OpenShift
- (Legacy) **dockershim**
    - A shim layer inside kubelet that translated Docker API calls into CRI
    - Fully removed in Kubernetes 1.24 (→ Docker is no longer directly supported)

---


# 6. CRI and OCI: How They Relate

- **OCI (Open Container Initiative)**: A container standardization body
    - **OCI Runtime Spec**: Standard for running containers (e.g., runc)
    - **OCI Image Spec**: Standard for image format (.tar structure)
- **CRI**: An interface that defines "how to use an OCI runtime" within Kubernetes
- Summary:
    - OCI → Container **standard**
    - CRI → **API interface** for Kubernetes

---


# 7. How CRI Works: An Example Flow

1. User runs `kubectl apply -f pod.yaml`
2. kube-apiserver notifies kubelet: "Run this Pod"
3. kubelet calls CRI RuntimeService:
    - `RunPodSandbox` (prepares the Pod environment)
    - `CreateContainer` (creates the container)
    - `StartContainer` (starts it)
4. The runtime (containerd/CRI-O) pulls the image → runs runc → starts the container process

---


# 8. How to Check / Test CRI


To check which runtime a Kubernetes node is using:


```bash
kubectl get node -o wide
kubectl describe node <nodename> | grep "Container Runtime"
```


Example output:


```plain text
Container Runtime Version:  containerd://1.7.12
```


To directly test CRI calls:


```bash
crictl ps       # 컨테이너 목록
crictl images   # 이미지 목록
crictl runp ... # PodSandbox 실행
```


※ `crictl` = a CLI tool that calls the same CRI gRPC interface as kubelet


---


# 9. Summary

- **CRI = the standard container runtime API interface for Kubernetes**
- The kubelet only calls CRI → runtimes can be swapped out easily
- Key services: **RuntimeService**, **ImageService**
- Implementations: containerd, CRI-O (formerly dockershim)
- Image building is NOT a CRI function → separate tools like BuildKit/Kaniko are required