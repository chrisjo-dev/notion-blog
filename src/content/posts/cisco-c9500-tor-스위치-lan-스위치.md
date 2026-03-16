---
title: "Cisco C9500, ToR 스위치 =LAN 스위치"
description: "#Infra #On-premises #개념 1. Cisco C9500 개요 - 정식 이름: Cisco Catalyst 9500 Series Switch - 종류: 엔터프라이즈/데이터센터용 코어·어그리게이션 스위치 - 위치: ToR(Top of Rack)에도 쓰이고, 코..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81ae8661c4c4a44ee4a5"
category: "On-premises"
tags:
  - "On-premises"
hierarchy:
  - "On-premises"
  - "Cisco C9500, ToR 스위치 =LAN 스위치"
parent: "2d6ea3deaa2b80399d64ccb88444b6f5"
level: 1
---


#Infra #On-premises #개념


## 1. Cisco C9500 개요

- **정식 이름**: Cisco Catalyst 9500 Series Switch
- **종류**: 엔터프라이즈/데이터센터용 **코어·어그리게이션 스위치**
- **위치**: ToR(Top of Rack)에도 쓰이고, 코어(Core) 레이어에도 배치 가능

---


## 2. 역할

- 서버, 스토리지, 다른 네트워크 장비들을 **L2/L3 레벨에서 연결**
- 데이터센터 내부 트래픽과 외부 네트워크 트래픽을 라우팅/스위칭
- 여러 대의 ToR 스위치(Leaf)를 묶어서 Spine 네트워크로 연결하는 역할도 가능

---


## 3. 특징

- **고속 포트 지원**: 10G / 25G / 40G / 100G 업링크
- **엔터프라이즈 기능**:
    - 라우팅 (OSPF, BGP 등)
    - 멀티캐스트, QoS
    - 보안 (MACsec, TrustSec)
    - 자동화 (SDN, Cisco DNA Center 연동)
- **가용성**: 이중화(HA) 지원, 모듈 교체 가능

---


## 4. 쉬운 비유

- 네 집에 있는 공유기는 “컴퓨터 몇 대 → 인터넷” 정도만 연결
- Cisco C9500은 “수천 대 서버가 있는 데이터센터 → 외부 네트워크/인터넷”을 연결하는 **초고속, 초안정 공유기** 같은 거야

---


## 5. 그림으로 보면


```plain text
[ 외부 인터넷 / 상위 네트워크 ]
                           |
                     [ Cisco C9500 ]
                 ┌─────────┼─────────┐
              [서버]     [스토리지]    [다른 랙 스위치]
```


---


👉 정리:


**Cisco C9500 = 데이터센터에서 서버/스토리지 ↔ 외부 네트워크를 연결하는 고성능 스위치.**


네 프로젝트에서는 **ToR 스위치 역할**로, 랙 안에 있는 서버들(R760, R730XD)과 스토리지를 네트워크로 묶어주고 외부로 연결해 주는 허브 역할을 한다고 보면 돼.


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

