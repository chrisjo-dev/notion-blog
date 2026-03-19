---
title: "Storage Basics: OpenStack Cinder and Kubernetes PV/PVC Relationship Explained"
description: "#IaaS #Onboarding #Concepts #Cinder 1. Basic Storage Types Storage can be broadly categorized into three types: 1. Block Storage     - Data is stored in \"block units.\"     - From the OS perspective, it looks like a local disk...."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b813084a8d836a37a5abd"
koreanSlug: "스토리지-기초부터-openstack-cinder와-kubernetes-pvpvc-관계-정리"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "스토리지 기초부터 OpenStack Cinder와 Kubernetes PV/PVC 관계 정리"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

#IaaS #Onboarding #Concepts #Cinder


## 1. Basic Storage Types


Storage can be broadly categorized into three types:

1. **Block Storage**
    - Data is stored in "block units."
    - From the OS perspective, it looks like a local disk.
    - Suitable for workloads requiring fast read/write, such as VM disks and databases.
    - Examples: AWS EBS, OpenStack Cinder.
2. **File Storage**
    - Data is stored in a file/folder structure and shared across multiple servers.
    - Examples: NFS, Amazon EFS.
3. **Object Storage**
    - Data is stored as "objects (file + metadata + ID)."
    - Highly scalable and suitable for static data such as images and backups.
    - Examples: AWS S3, OpenStack Swift.

---


## 2. OpenStack Cinder

- **OpenStack's block storage service**.
- Provides **persistent disk volumes** that can be attached to and detached from VM instances.
- Serves the same role as AWS **EBS**.
- Key features:
    - Volume creation/deletion
    - Attach/detach
    - Snapshots and replication
    - Support for various backends (Ceph RBD, LVM, NetApp, etc.)

👉 In short, if you want to attach a "disk (like EBS)" to a VM in an OpenStack environment, you handle it through **Cinder** via API/CLI.


---


## 3. Kubernetes Persistent Storage (PV/PVC)

- In Kubernetes, when a Pod dies, **its storage is lost by default** → persistence is required.
- The structure that solves this is **PV/PVC**.
1. **PersistentVolume (PV)**
    - A storage resource registered in the cluster.
    - A "representative object" connected to actual storage (Cinder, NFS, EBS, etc.).
2. **PersistentVolumeClaim (PVC)**
    - Storage requirements requested by a developer (e.g., 10Gi, ReadWriteOnce).
    - When a PVC is created, it is matched with an appropriate PV.
3. **StorageClass + Dynamic Provisioning**
    - Instead of having an admin pre-create PVs, storage is automatically created when a PVC is submitted.
    - Defines which provisioner (Cinder, EBS, etc.) to use in `StorageClass`.
    - PVC created → StorageClass checked → Kubernetes calls Cinder API → new volume created → PV automatically matched.

---


## 4. Connecting Cinder and Kubernetes

- When Kubernetes runs on top of OpenStack, **Cinder becomes the actual backend storage for PVs**.
- Flow:
    1. User creates a PVC → needs a 10Gi volume.
    2. The StorageClass linked to the PVC uses the `kubernetes.io/cinder` provisioner.
    3. Kubernetes calls the OpenStack Cinder API → creates a new block volume.
    4. A PV object is automatically created and bound to the PVC.
    5. Pod mounts the PVC → uses the Cinder volume like a disk.

👉 In summary: **Cinder = the actual storage provider**, **PV = the abstracted storage resource in Kubernetes**, **PVC = the user's storage request**.


---


## 5. OpenStack Cinder vs AWS EBS (Comparing Storage Integration in Kubernetes)


## 5-1. Basic Definitions

- **Cinder**: OpenStack's block storage service.
- **EBS**: AWS's block storage service.

Both serve the same role in that they provide **persistent disks that can be attached to VMs/Pods**.


---


## 5-2. Kubernetes Integration Structure


| Category | OpenStack Environment | AWS Environment |
| ---------------- | ---------------------------------------- | ------------------------------------- |
| **Storage Service** | Cinder (Block Storage) | EBS (Elastic Block Store) |
| **K8s PV Creation Method** | Uses `cinder` provisioner | Uses `ebs.csi.aws.com` CSI driver |
| **Dynamic Provisioning** | StorageClass → `kubernetes.io/cinder` | StorageClass → `ebs.csi.aws.com` |
| **Actual Volume** | Block volume created via Cinder API call | EBS volume created via EBS API call |
| **Pod Connection** | Cinder volume attach → PV/PVC match → Pod mount | EBS volume attach → PV/PVC match → Pod mount |


---


## 5-3. Flow Comparison (Dynamic Provisioning)


```plain text
[사용자 PVC 생성]
        |
        v
[Kubernetes Controller]
        |
        |--- OpenStack 환경 ---> [Cinder API] → 블록 볼륨 생성
        |
        |--- AWS 환경 ---------> [EBS API] → 블록 볼륨 생성
        |
        v
[PV 자동 생성 및 PVC 바인딩]
        |
        v
[Pod에 attach & mount]
```


## 5-4. One-Line Summary

- Think of **Cinder as OpenStack's EBS** and it becomes easy to understand.
- Both are **abstracted through PV/PVC** in Kubernetes,
- And **dynamic provisioning** is available via **StorageClass**.

👉 From Kubernetes' perspective, the flow of **PVC → StorageClass → backend volume creation** is the same;

the backend is simply **Cinder for OpenStack** and **EBS for AWS**.


## 5-5. Block Storage Comparison: Cinder vs EBS vs Local Disk (NFS, etc.)


| Category | **OpenStack Cinder** | **AWS EBS** | **Local/NFS (On-Premises Shared Storage)** |
| ------------------ | ----------------------------------- | ------------------------------------ | ------------------------------------------ |
| **Platform** | OpenStack (Private Cloud) | AWS (Public Cloud) | On-premises server/VM environment |
| **Storage Type** | Block storage | Block storage | File storage (NFS), local block disk |
| **Use Cases** | VM disks, DB storage | EC2 disks, DB storage | NAS/NFS shared files, single-server local SSD/HDD |
| **Provisioning Method (K8s)** | StorageClass `kubernetes.io/cinder` | CSI Driver `ebs.csi.aws.com` | NFS: `nfs-subdir-external-provisioner`, etc. |
| **Dynamic Provisioning Support** | Yes (via Cinder API call) | Yes (via EBS API call) | Yes (NFS provisioner, Ceph RBD, GlusterFS, etc.) |
| **Backend** | LVM, Ceph RBD, NetApp, Dell EMC, etc. | AWS-native (SSD, gp2/gp3/io2) | Self-built: NFS server, SAN, Ceph, GlusterFS |
| **High Availability** | Multi-AZ support (virtualization-based) | Multi-AZ support (note: EBS is AZ-scoped, cannot be shared across AZs) | NFS server HA configuration required (manual) |
| **Performance** | Varies by backend (Ceph = scalable, high-performance) | High-performance SSD, IOPS/Throughput options available | Local SSD is fast; NFS depends on network speed |
| **Scalability** | Unlimited scaling via cloud API | Unlimited scaling via AWS API | Limited by server/storage capacity |
| **Management Convenience** | Managed by OpenStack administrators | AWS-managed (fully managed) | Self-managed required (manual backup/HA setup) |
| **Primary Use Case** | Private cloud enterprise environments | AWS-based applications | On-premises apps, Kubernetes practice/small-scale environments |


---


## One-Line Summary

- **Cinder**: OpenStack's **block storage**, optimized for private cloud.
- **EBS**: AWS's **block storage**, used as a managed service in public cloud.
- **NFS/Local Disk**: Suitable for on-premises/small-scale environments; requires self-management.