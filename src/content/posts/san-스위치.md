---
title: "SAN 스위치"
description: "#Infra #On-premises #개념 1. SAN이란? - SAN (Storage Area Network) = 스토리지 전용 네트워크 - 서버(CPU가 있는 장비)와 스토리지(디스크 장비)를 네트워크로 따로 연결해서, 서버가 스토리지를 자기 로컬 디스크처럼 쓰게..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81f2a7fbf52a3a486fb0"
category: "On-premises"
tags:
  - "On-premises"
hierarchy:
  - "On-premises"
  - "SAN 스위치"
parent: "2d6ea3deaa2b80399d64ccb88444b6f5"
level: 1
---


#Infra #On-premises #개념


## 1. SAN이란?

- **SAN (Storage Area Network)** = 스토리지 전용 네트워크
- 서버(CPU가 있는 장비)와 스토리지(디스크 장비)를 **네트워크로 따로 연결**해서, 서버가 스토리지를 자기 로컬 디스크처럼 쓰게 해주는 것.
    - 일반 LAN이 “사람 ↔ 서버 ↔ 인터넷 통신”이라면,

        **SAN은 “서버 ↔ 스토리지 통신” 전용 네트워크**라고 생각하면 돼.


---


## 2. SAN 스위치란?

- SAN을 구축하려면 서버 ↔ 스토리지 사이에 **네트워크 장비**가 필요함.
- 그게 바로 **SAN 스위치**.
- 일반 LAN 스위치와 다르게 **Fibre Channel (광채널, FC)** 같은 스토리지 전용 프로토콜을 사용.

👉 특징

- 서버와 스토리지를 **고속, 안정적으로 연결**
- 보통 **8Gb, 16Gb, 32Gb FC 포트** 같은 초고속 포트 지원
- 다수의 서버와 다수의 스토리지를 **패브릭(Fabric)** 형태로 연결 가능

---


## 3. 비교: LAN 스위치 vs SAN 스위치


| 구분   | LAN 스위치 (Cisco, Juniper 등) | SAN 스위치 (Brocade, Cisco MDS 등) |
| ---- | -------------------------- | ------------------------------ |
| 목적   | 서버/PC ↔ 네트워크 ↔ 인터넷         | 서버 ↔ 스토리지 전용 네트워크              |
| 프로토콜 | Ethernet (TCP/IP)          | Fibre Channel (FC)             |
| 속도   | 1G, 10G, 25G, 100G         | 8G, 16G, 32G FC                |
| 예시   | Cisco Catalyst, Nexus      | Brocade DS-7720B               |


---


## 4. 네트워크 구조 그림


```plain text
[ 서버 (R760, R730XD 등) ]
         |
         |  (Fibre Channel)
   [ SAN Switch (DS-7720B) ]
         |
         |  (Fibre Channel)
[ PowerStore 1200T 스토리지 ]
```


![image.png](/notion-blog/images/notion/2d6ea3deaa2b81f2a7fbf52a3a486fb0/image-1.png)

