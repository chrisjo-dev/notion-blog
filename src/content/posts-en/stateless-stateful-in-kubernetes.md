---
title: "Stateless & Stateful in Kubernetes"
description: "Stateless and Stateful in Kubernetes - how the reconciliation loop, Deployments, and StatefulSets work at their core."
date: "2026-03-30T14:36:00.000Z"
notionId: "333ea3deaa2b80bf9cc6f305ffa376b4"
koreanSlug: "stateless-stateful-in-kubernetes"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "Stateless & Stateful in Kubernetes"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---



## 1. Starting Point: How Kubernetes Works at Its Core


Kubernetes is an orchestration engine. Its core mechanism is the **declarative model** — users declare "this is the desired state" in a manifest (YAML), and the system figures out how to get there on its own.


This declaration is stored via `kubectl apply` → API Server → etcd. This is the **desired state**. The Controller continuously compares this value against the actual **current state** and automatically reconciles any differences. This loop is called the **reconciliation loop**.

> For this loop to run fast and light, Pods must be freely killable, scalable, and replaceable. This is where the need for Stateless design comes in.

**Kubernetes philosophy:** Pods can die at any time (Cattle, not Pets)


---


## 2. Why Stateless Is Necessary


If business data — like session or order data — lives inside a Pod, you can't freely kill that Pod. Kill it, and the data is gone. And if you scale out, the new Pod has no access to the existing data, forcing you to rely on sticky sessions.


The solution is to **move business data outside the Pod**. By delegating to external storage like Redis, a DB, or S3, the Pod only processes requests and "remembers" nothing. This kind of Pod is **Stateless**.


This isn't about eliminating state — it's about Separation of Concerns, handing off the responsibility of managing state to a specialist.


---


## 3. Stateless vs. Stateful: A Comparison


![image.png](/notion-blog/images/notion/333ea3deaa2b80bf9cc6f305ffa376b4/image-1.png)


|                            | Stateless                              | Stateful                                          |
| -------------------------- | -------------------------------------- | ------------------------------------------------- |
| Definition                 | Handles state but doesn't store it     | Stores state and maintains it persistently         |
| K8s Resource               | Deployment                             | StatefulSet                                       |
| Pod Replacement            | Flexible — just spin up a new one      | Must preserve same name and volume                |
| Scaling                    | Freely auto-scalable with HPA          | Requires data sync and membership adjustments     |
| Rolling Update             | Zero-downtime deployment possible      | Data compatibility must be verified               |
| Proportion                 | 80–90% of total workloads              | Data layer: DBs, caches, message queues, etc.     |
| Examples                   | API servers, web frontends, workers    | PostgreSQL, Kafka, Redis, Harbor                  |


---


## 4. How StatefulSet Differs from Deployment


Why can't Stateful workloads use a Deployment? Because data consistency and cluster membership must be guaranteed. StatefulSet provides four additional guarantees to address this:


| Item                  | Deployment                          | StatefulSet                                        |
| --------------------- | ----------------------------------- | -------------------------------------------------- |
| Pod Name              | Random suffix (`app-7f8b9c-xk2z`)  | Fixed ordinal (`db-0`, `db-1`)                    |
| Volume Binding        | Loosely coupled with Pod            | Per-Pod dedicated PVC via `volumeClaimTemplates`  |
| Creation/Deletion Order | No ordering guarantee             | Created 0→1→2; deleted in reverse order            |
| Network ID            | None                                | Unique DNS via Headless Service                   |


---


## 5. Design Patterns by Environment


How you handle Stateful workloads depends on your environment.


**Public Cloud (e.g., EKS)** — Stateful workloads are separated out of the cluster using managed services (RDS, ElastiCache, MSK). The cluster is nearly 100% Stateless → easiest to operate.


**Air-gapped / On-premises (e.g., RKE2)** — Managed services aren't available. DBs, Kafka, and Harbor must be run directly inside the cluster as StatefulSets → increased operational burden: PVC management, Velero backups, etc.


---


## 6. Watch Out for Confusion: Two Meanings of "State"


The word "state" is used at two different layers — and they're completely separate concepts.


|               | Infrastructure State                          | Application State                        |
| ------------- | --------------------------------------------- | ---------------------------------------- |
| What          | Infrastructure blueprint (replicas, image, port) | Business data (sessions, DB, cache)   |
| Where Stored  | etcd                                          | Inside the Pod or external storage       |
| Who Manages   | Kubernetes control plane                      | Developer's architectural decisions      |
| Related Concept | Reconciliation loop                         | Stateless / Stateful design              |


**Where the two layers meet**: Application state must be moved outside the Pod (Stateless) → Pods become disposable → the reconciliation loop for infrastructure state runs efficiently.


---


## 7. etcd: The Storage Backend for Infrastructure State


The desired state mentioned above is actually stored in etcd.

- Kubernetes' **sole data store** (Single Source of Truth)
- All resources are stored as key-value pairs in the format `/registry/{type}/{namespace}/{name}`
- **Only the API Server** communicates directly with etcd. Controllers, the Scheduler, and kubelets receive changes via watch events from the API Server
- Distributed store based on Raft consensus → HA configuration with 3+ nodes recommended in production
- If etcd goes down, the entire cluster goes dark → **etcd backup is essential**

### Data Flow


`kubectl apply` → API Server (authn/authz/Admission) → stored in etcd → watch event → Controller detects desired ≠ current → creates/deletes Pod → Scheduler assigns node → kubelet runs container


---


![image.png](/notion-blog/images/notion/333ea3deaa2b80bf9cc6f305ffa376b4/image-2.png)


![image.png](/notion-blog/images/notion/333ea3deaa2b80bf9cc6f305ffa376b4/image-3.png)