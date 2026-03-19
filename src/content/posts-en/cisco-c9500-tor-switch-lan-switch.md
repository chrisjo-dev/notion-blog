---
title: "Cisco C9500, ToR Switch = LAN Switch"
description: "#Infra #On-premises #Concepts 1. Cisco C9500 Overview - Official name: Cisco Catalyst 9500 Series Switch - Type: Enterprise/data center core and aggregation switch - Placement: Can be used as ToR (Top of Rack) or deployed at the Core layer..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81ae8661c4c4a44ee4a5"
koreanSlug: "cisco-c9500-tor-스위치-lan-스위치"
category: "On-premises"
tags:
  - "On-premises"
hierarchy:
  - "On-premises"
  - "Cisco C9500, ToR 스위치 =LAN 스위치"
parent: "2d6ea3deaa2b80399d64ccb88444b6f5"
level: 1
---

#Infra #On-premises #Concepts


## 1. Cisco C9500 Overview

- **Official name**: Cisco Catalyst 9500 Series Switch
- **Type**: Enterprise/data center **core and aggregation switch**
- **Placement**: Can be used as a ToR (Top of Rack) switch or deployed at the Core layer

---


## 2. Role

- Connects servers, storage, and other network devices at the **L2/L3 level**
- Routes and switches traffic between the internal data center network and external networks
- Can also aggregate multiple ToR switches (Leaves) and connect them to the Spine network

---


## 3. Features

- **High-speed port support**: 10G / 25G / 40G / 100G uplinks
- **Enterprise-grade capabilities**:
    - Routing (OSPF, BGP, etc.)
    - Multicast, QoS
    - Security (MACsec, TrustSec)
    - Automation (SDN, Cisco DNA Center integration)
- **Availability**: High availability (HA) support, hot-swappable modules

---


## 4. Simple Analogy

- The router at home handles "a few computers → internet" at most
- The Cisco C9500 is like an **ultra-fast, ultra-reliable router** that connects "a data center with thousands of servers → the external network/internet"

---


## 5. Visual Overview


```plain text
[ 외부 인터넷 / 상위 네트워크 ]
                           |
                     [ Cisco C9500 ]
                 ┌─────────┼─────────┐
              [서버]     [스토리지]    [다른 랙 스위치]
```


---


👉 Summary:


**Cisco C9500 = A high-performance switch that connects servers/storage ↔ the external network inside a data center.**


In your project, it acts as a **ToR switch** — think of it as the hub that ties together the servers (R760, R730XD) and storage inside the rack and connects them to the outside world.


```plain text
[ 사용자 / 외부 네트워크 ]
                   |
             (LAN 스위치)
             Cisco C9500
                   |
                   -------------------------------------------------
                   |                                               |
               [R760 컴퓨트 서버]                           [R730XD Ceph 서버]
   
   
   (SAN 스위치)
    DS-7720B
   /        \\
[서버 HBA]   [PowerStore 1200T]
```