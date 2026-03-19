---
title: "Do We Use Both Ceph and PowerStore?"
description: "#Infra #Concepts #On-premises 1. Let's start with what storage even is - Your computer has storage space (SSD, HDD), right? - Servers are the same — they need disks to store data. - But enterprise data centers have dozens to hundreds of servers, so managing disks separately on each one is a nightmare..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81b5bae8c38f05f38f79"
koreanSlug: "ceph-powerstore-둘다-쓰는가"
category: "On-premises"
tags:
  - "On-premises"
hierarchy:
  - "On-premises"
  - "Ceph, PowerStore 둘다 쓰는가?"
parent: "2d6ea3deaa2b80399d64ccb88444b6f5"
level: 1
---

#Infra #Concepts #On-premises


## 1. What Is Storage, Anyway?

- Your computer has **storage space (SSD, HDD)**, right?
- Servers are the same — they need disks to store data.
- But enterprise data centers have dozens to hundreds of servers, so **managing disks separately on each one is a nightmare.**

👉 That's why **shared storage** was invented → a structure where multiple servers use the same storage pool together.


---


## 2. Commercial Storage Like PowerStore

- A **dedicated storage appliance** made by Dell (expensive, but stable and easy to manage).
- Think of it as a "computer built exclusively for storage."
- Downsides: costly, vendor lock-in when scaling (you're tied to Dell hardware), limited expansion flexibility.

---


## 3. So What Is Ceph?

- Ceph is **software-defined storage**.
- No dedicated appliances like Dell PowerStore needed — just **a bunch of regular servers with hard drives**.
- Connect those servers over a network, install the Ceph software, and they behave like one giant unified storage system.

👉 Simply put:

- **PowerStore** = An expensive, purpose-built safe
- **Ceph** = A DIY safe built by linking several computers you already have at home

---


## 4. Key Features of Ceph

- **Scales** whether you have 10 servers or 100
- Data is automatically **replicated** across multiple servers, so even if one goes down, your data is safe
- Supports **all three** storage modes: block (disk), file (shared folders like NFS), and object (like AWS S3)

---


## 5. Diagram


```plain text
[서버1 + 디스크]   [서버2 + 디스크]   [서버3 + 디스크]
        |                  |                  |
        +------------------+------------------+
                       |
                 [ Ceph 소프트웨어 ]
                       |
          서버들이 가진 디스크를 합쳐서
         "하나의 큰 스토리지"로 제공
```


---


👉 Summary:

- **PowerStore 1200T** = A high-end storage appliance made by Dell
- **Ceph** = Open-source software that turns a cluster of regular servers into a unified storage system

---


## 1. How PowerStore 1200T and Ceph Differ in Nature

- **PowerStore 1200T**
    - Enterprise-grade commercial storage
    - Strengths: stability, performance, vendor support
    - Weaknesses: expensive, vendor lock-in (Dell only), limited scaling flexibility
    - Primary use: **Mission-critical workloads** like databases, ERP, and VMware
- **Ceph**
    - Open-source distributed storage
    - Strengths: scalability (just add servers to grow capacity and performance), cost efficiency, object storage (S3 API) support
    - Weaknesses: requires in-house operation and management, performance tuning has a learning curve
    - Primary use: Big data, AI/ML, backups, cloud-native apps, internal S3 services

---


## 2. Why Use Both?


In a project context, it comes down to **separation of purpose**.

- **PowerStore**

    → Used for core enterprise services (databases, VMs, transaction-critical services)

    → Stability and high performance are paramount, making a commercial appliance the right fit

- **Ceph**

    → Used when cloud environments (OpenStack, Kubernetes, etc.) need object storage or a large, horizontally scalable storage pool

    → Examples: research data, log storage, big data, internal S3 services


---


## 3. Real-World Examples

- Banks / large enterprises:
    - Core Banking DB = PowerStore
    - Mobile app logs, image/video storage = Ceph
- Cloud service providers:
    - Some VM disk storage = commercial storage appliance
    - The rest of large-scale data (backups, customer files) = Ceph

---


## 4. What This Means for Your Project


Having **PowerStore + Ceph** together in your project means:

- The customer intends to run **mission-critical workloads** (ERP, databases, etc.) on PowerStore,
- While operating **cloud-native workloads** (VMs, containers, object storage services like S3) on Ceph.