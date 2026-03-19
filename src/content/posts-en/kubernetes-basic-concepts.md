---
title: "Kubernetes Basic Concepts"
description: "#IaaS #Onboarding #Concepts 1. Basic Concepts - Kubernetes (K8s): A container orchestration tool. Automates container deployment, scaling, networking, and resource management. - Cluster: The overall system in which Kubernetes operates...."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81f9afecdee4642fccf4"
koreanSlug: "kubernetes-기본-개념"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "kubernetes 기본 개념"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

#IaaS #Onboarding #Concepts


## 1. Basic Concepts

- **Kubernetes (K8s)**

    A container orchestration tool. Automates container deployment, scaling, networking, and resource management.

- **Cluster**

    The overall system in which Kubernetes operates.

    - **Master Node (Control Plane)**: Responsible for cluster management (API server, scheduler, controller manager, etcd).
    - **Worker Node (Node)**: Runs the actual containers (Pods).

---


## 2. Resource Units

- **Pod**

    The smallest unit of container execution. Groups one or more containers together with storage and networking.

- **ReplicaSet**

    A resource that maintains a specified number of Pods. (Guarantees n replicas)

- **Deployment**

    Manages Pods + ReplicaSets in a declarative manner. Supports rolling updates and rollbacks.

- **StatefulSet**

    For workloads that require state persistence (e.g., databases). Guarantees unique IDs and persistent storage.

- **DaemonSet**

    A resource that runs one Pod per node (e.g., log collectors, monitoring agents).

- **Job / CronJob**
    - Job: Executes a one-time task.
    - CronJob: Executes recurring tasks on a schedule.

---


## 3. Networking

- **Service**

    An abstraction layer that provides a stable IP/domain to Pods.

    - ClusterIP (internal communication only),
    - NodePort (exposes a port on the node),
    - LoadBalancer (integrates with an external load balancer),
    - Headless Service (provides fixed DNS records).

- **Ingress**

    Routes external HTTP/HTTPS requests to services inside the cluster. (Requires an Ingress Controller)

- **CNI (Container Network Interface)**

    Pod networking plugins (Calico, Flannel, Cilium, etc.).


---


## 4. Storage

- **Volume**

    Storage that can be shared between containers within a Pod.

- **PersistentVolume (PV)**

    Storage managed at the cluster level.

- **PersistentVolumeClaim (PVC)**

    A storage request made by a Pod.

- **StorageClass**

    A storage policy for dynamic provisioning (e.g., AWS EBS, Ceph RBD).


---


## 5. Configuration & Security

- **ConfigMap**

    Stores and injects non-sensitive configuration data.

- **Secret**

    Stores sensitive data such as passwords and certificates. Uses base64 encoding.

- **Namespace**

    Logically isolates resources.

- **RBAC (Role-Based Access Control)**

    Controls permissions for users and service accounts.


---


## 6. Scheduling & Management

- **Scheduler**

    Places Pods on appropriate nodes. Considers resource usage, taints/tolerations, and affinity.

- **Affinity / Anti-Affinity**

    Pod placement policies (run alongside or away from specific nodes/Pods).

- **Taints & Tolerations**

    Restricts scheduling so that only specific Pods can be placed on certain nodes.

- **Resource Requests & Limits**

    Reserves and caps CPU/memory resources.

- **Horizontal Pod Autoscaler (HPA)**

    Automatically adjusts the number of Pods based on CPU and memory usage.

- **Vertical Pod Autoscaler (VPA)**

    Automatically adjusts Pod resource sizes (CPU/memory).

- **Cluster Autoscaler**

    Automatically scales the number of cluster nodes up or down.


---


## 7. Logging & Monitoring

- **kubectl logs** / **kubectl exec**

    Pod log viewing and debugging.

- **Prometheus / Grafana**

    Metrics collection and monitoring.

- **ELK / EFK Stack**

    Elasticsearch + (Fluentd/Fluent Bit) + Kibana logging.


---


## 8. Advanced Concepts

- **Operator**

    A controller built to automate the operation of a specific application in the Kubernetes way.

- **CSI (Container Storage Interface)**

    A standard storage interface. (AWS EBS CSI, Ceph CSI, PowerStore CSI, etc.)

- **CRD (Custom Resource Definition)**

    Allows users to extend Kubernetes resource types.

- **Service Mesh (Istio, Linkerd)**

    Provides inter-microservice communication, traffic management, security, and monitoring.