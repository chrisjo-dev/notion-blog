---
title: "Node Architecture Terminology – 3 Perspectives + Workload Examples"
description: "#Infra #IaaS #Concepts | Term | General Infrastructure Perspective | On-Premises (OpenStack/KVM) | Cloud (AWS/EKS/ECS)..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b814fb668c5b7b993f333"
koreanSlug: "노드-아키텍처-용어-3가지-관점-워크로드-예시"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "노드 아키텍처 용어 – 3가지 관점 + 워크로드 예시"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

#Infra #IaaS #Concepts


| Term | General Infrastructure Perspective | On-Premises (OpenStack/KVM) | Cloud (AWS/EKS/ECS) | Workload Examples |
| ----------------------------- | ---------------------------- | ------------------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| **Server** | Physical hardware with CPU, RAM, Disk, and NIC | Bare-metal servers (Dell/HPE, etc.) | AWS EC2 instance (virtual server) | The hardware itself — no apps running yet |
| **Node** | A server unit assigned a specific role | Controller Node, Compute Node | EKS Worker Node, ECS Task, Control Plane node | Designating a role like "this server is Compute-only" |
| **Controller** | The "brain" of the cluster — manages and orchestrates | Keystone, Glance, Neutron-Server, Scheduler | AWS EKS/ECS Control Plane (managed by AWS) | Doesn't run apps directly. Instead, issues directives like "run this workload on Compute node 3" |
| **Compute** | The actual workload executor | OpenStack Nova-Compute (runs VMs) | EC2 instances, ECS Tasks, EKS Worker Nodes | Django web servers, MySQL DBs, AI inference, log analysis, etc. |
| **Storage Node** | Stores, replicates, and serves data | Ceph OSD, Swift/Object Storage | EBS, EFS, FSx, S3 | DB data files, user-uploaded images, logs |
| **Network Node (Gateway)** | Forwards and routes traffic | Neutron L3/NAT, DHCP Agent | VPC, Subnet, NAT GW, ALB/NLB | Routing external user requests to web servers |
| **Availability Zone (AZ)** | Physical isolation to prevent fault propagation | Separate racks, power, and switches | AWS AZ (`ap-northeast-2a`, `2b`, `2c`) | If one AZ goes down, workloads continue running in other AZs |
