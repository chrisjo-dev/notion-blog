---
title: "Controller in Kubernetes"
description: "1. Why do we need controllers? Kubernetes is a declarative system. Users simply declare the desired state — \"spin up 3 nginx instances\" — without specifying how to do it. The API Server stores this Desired State in etcd..."
date: "2026-04-01T08:27:00.000Z"
notionId: "335ea3deaa2b80719889dd6192165d18"
koreanSlug: "controller-in-kubernetes"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "Controller in Kubernetes"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---

## 1. Why Do We Need Controllers?

Kubernetes is a **declarative** system. Users simply declare the **Desired State** — "spin up 3 nginx instances" — without specifying *how* to do it.

The API Server stores this Desired State in etcd, but **it does not actually reconcile the Current State to match the Desired State.**

> 💡 **Controller = the entity that bridges the gap between Desired State and Current State**

### Why this architecture? (Causal reasoning)

- **Cause**: In a distributed system, nodes can die, networks can disconnect, and Pods can vanish at any moment. The current state is inherently unstable.
- **Effect**: Rather than "issue a command → done," you need a structure that **continuously monitors and automatically restores state whenever a discrepancy arises**.
- **Analogy**: A thermostat. Set it to 25°C and it continuously measures the current temperature, turning heating or cooling on whenever it deviates from the target.

---

## 2. Reconciliation Loop (Control Loop)

The core operating principle of a controller:

```
1. Observe Current State  → "There are currently 2 nginx Pods running"
2. Check Desired State    → "etcd says there should be 3"
3. Calculate Diff         → "We're 1 short"
4. Execute Reconcile      → "Create 1 more Pod"
```

This loop is called the **Reconciliation Loop** or **Control Loop**.

---

## 3. Change Detection: Watch and Informer

![image.png](/notion-blog/images/notion/335ea3deaa2b80719889dd6192165d18/image-1.png)

### 3-1. Polling vs Event-driven

There are two ways a controller can detect that the current state has changed:

| Method | Description | Drawback |
| --- | --- | --- |
| **Polling** | Periodically asks the API Server: "what's the current state?" | Number of controllers × number of resources = API Server overload |
| **Watch (Event-driven)** | Maintains a long-lived connection to the API Server and receives events pushed on change | Events can be lost if the connection drops |

- **Kubernetes's choice**: Watch (Event-driven)
- **Reason**: No traffic when nothing changes. API Server load scales with **change frequency**, not resource count — making it stable even in large clusters.

### 3-2. Informer = List-Watch + Local Cache

Watch alone has two shortcomings:

| Problem | Solution |
| --- | --- |
| Watch connection drops → events are lost | **List-Watch pattern**: fetch a full snapshot via List on startup, then switch to Watch. On disconnect, re-sync from List again |
| Multiple controllers querying the API Server simultaneously → increased load | **Local cache**: the Informer stores data locally; controllers read from the cache instead of the API Server |

> 💡 **Informer = List-Watch + Local Cache, bundled together**

### 3-3. Work Queue (a separate structure outside the Informer)

A separate structure attached **outside** the Informer. It solves **consistency** problems in event processing.

**Why a Work Queue is needed (example)**:
Three events arrive within one second: "Pod-A deleted" → "Pod-B deleted" → "Pod-A created"

- If Reconcile is called immediately for each event → it reacts to the deletion events by creating extra Pods, only for them to come back via automatic restart → more Pods than intended, causing a consistency problem.

**How the Work Queue solves this**:

- Instead of the event itself, an **object key** (e.g., `default/Pod-A`) is enqueued
- If the same key already exists in the queue, it is **deduplicated**
- Reconcile dequeues a key and makes decisions based on the **latest local cache state at that point in time**

**Difference from SQS**:

- SQS messages are **persistent** — they remain in the queue even if the consumer dies.
- The K8s Work Queue is **in-memory** — if the controller dies, the queue is lost.
- On controller restart, stability is guaranteed by the Informer's **List** operation (full re-sync).

### 3-4. Component Role Summary

| Component | Problem it solves | Core mechanism |
| --- | --- | --- |
| **List-Watch** (inside Informer) | Event loss when Watch connection drops | Full re-sync via List on reconnect |
| **Local Cache** (inside Informer) | Query load on the API Server | Read from cache |
| **Work Queue** (outside Informer) | Event duplication, consistency | Key-based dedup + decisions based on latest cache |
| **Reconcile function** | Actually closing the gap | Compare desired vs current → execute action |

---

## 4. End-to-End Flow

```docker
kubectl apply (desired state)
        │
        ▼
   API Server ──── etcd (stores desired state)
        │
        │  List (initial full sync)
        │  Watch (subsequent change event stream)
        ▼
    Informer
        │
        ├──→ Local Cache (current state snapshot, read by controllers)
        │
        └──→ Event Handler ──→ Work Queue (key-based dedup)
                                     │
                                     │  dequeue key
                                     ▼
                              Reconcile function
                         (fetch current from cache →
                          compare with desired → execute action)
```

---

## 5. Where Does the Informer Live?

The Informer is **not a separate process or Pod**. It is a library embedded within each controller's code (part of `client-go`).

```docker
[Control Plane Node]
  └─ kube-controller-manager (single process)
       ├─ Deployment Controller
       │    └─ Informer (watches Deployment resources)
       ├─ ReplicaSet Controller
       │    └─ Informer (watches ReplicaSet resources)
       ├─ Node Controller
       │    └─ Informer (watches Node resources)
       └─ ...
```

Multiple controllers run as **goroutines** inside `kube-controller-manager`, and each controller has its own dedicated Informer.

---

## 6. Separation of Deployment Controller and ReplicaSet Controller

### 6-1. The Object Chain

`Deployment → ReplicaSet → Pod`

A Deployment does not create Pods directly — it goes through a ReplicaSet as an intermediary.

### 6-2. Why the separation? (Causal reasoning)

**If the Deployment Controller managed Pods directly:**
During a rolling update — "is this Pod v1 or v2?", "how far can I scale down v1?", "which Pods do I keep on rollback?" — all of this logic would be tangled in one place.

**With separation:**

| Controller | Role | Characteristics |
| --- | --- | --- |
| **Deployment Controller** (strategist) | Creates ReplicaSets and adjusts their `replicas` count | Never touches Pods directly. Understands rolling/rollback strategy |
| **ReplicaSet Controller** (executor) | Creates/deletes Pods to match the `replicas` count it was given | Knows nothing about rolling updates. Just "keep 3 running" → keeps 3 |

> 💡 This is Kubernetes's **Single Responsibility Principle** — the hierarchical controller pattern