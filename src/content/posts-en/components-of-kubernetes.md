---
title: "Components of Kubernetes"
description: "Control Plane & Worker Runtime - etcd: cluster state store (Raft consensus) - kube-apiserver: front door for all requests (authentication/authorization/validation) - kube-controller-manager: maintains desired state of objects (ReplicaSet, Node/Job, and other controllers..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b819bb1d2fc143aa3808e"
koreanSlug: "kubernetes의-구성-요소"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "kubernetes의 구성 요소"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

## Control Plane & Worker Runtime

- **etcd**: Cluster state store (Raft consensus)
- **kube-apiserver**: Front door for all requests (authentication, authorization, validation)
- **kube-controller-manager**: Maintains desired state of objects (a collection of controllers including ReplicaSet, Node, Job, etc.)
- **kube-scheduler**: Decides which node to place a pod on
- **cloud-controller-manager** (optional): Integrates with cloud provider resources
- **kubelet (node)**: Manages pod lifecycle
- **kube-proxy (node)**: Proxies service virtual IPs to actual endpoints
- **Container runtime**: `containerd` (standard), cri-o, etc.

## Workload Resources (Deployment & Execution Types)

- **ReplicaSet**: Maintains a specified number of identical pods (an internal component of Deployment)
- **Deployment**: Zero-downtime rolling updates (Stateless)
- **StatefulSet**: Stateful workloads (fixed names/storage)
- **DaemonSet**: Deploys one pod per all (or specific) nodes (for agent-type workloads)
- **Job / CronJob**: One-off / recurring tasks

## Networking

- **CNI Plugin**: Calico, Flannel, Cilium, etc.
- **Service**: ClusterIP / NodePort / LoadBalancer / Headless
- **Ingress**: L7 routing (domain/path-based), requires an Ingress Controller (Nginx, HAProxy, Traefik, etc.)
- **NetworkPolicy**: Allow/deny traffic policies between pods

## Configuration / Secrets / Storage

- **ConfigMap / Secret**: Inject application configuration and sensitive information
- **PersistentVolume (PV) / PersistentVolumeClaim (PVC)**: Persistent storage binding
- **StorageClass / CSI Driver**: Dynamic provisioning (cloud/on-premises storage integration)

## Scheduling & Stability & Automation

- **HPA / VPA**: Autoscaling (horizontal / vertical)
- **PodDisruptionBudget (PDB)**: Guarantees a minimum number of available pods during planned disruptions
- **PriorityClass & Preemption**: Priority and resource contention policies
- **Affinity/Anti-Affinity, Taints/Tolerations**: Placement constraints for pod-to-node and pod-to-pod relationships

## Multi-Tenancy, Security & Organization

- **Namespace**: Logical isolation (team/environment separation)
- **RBAC**: Role-based access control (Role / RoleBinding / ClusterRole / ClusterRoleBinding)
- **ServiceAccount**: The identity used by pods to access the API
- **Admission Controllers**: Request mutation and validation (Mutating / Validating)
- **ResourceQuota / LimitRange**: Per-namespace resource limits and default values

## Extensibility

- **CRD / Operator**: Custom resource definitions and the automated operator pattern