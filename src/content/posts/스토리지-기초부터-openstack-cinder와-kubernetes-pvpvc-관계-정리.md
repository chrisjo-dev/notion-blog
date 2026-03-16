---
title: "스토리지 기초부터 OpenStack Cinder와 Kubernetes PV/PVC 관계 정리"
description: "#IaaS #Onboarding #개념 #Cinder 1. 스토리지 기본 유형 스토리지는 크게 세 가지 방식으로 구분돼: 1. 블록 스토리지 (Block Storage)     - 데이터를 “블록 단위”로 저장.     - OS 입장에서는 로컬 디스크처럼 보임...."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b813084a8d836a37a5abd"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "스토리지 기초부터 OpenStack Cinder와 Kubernetes PV/PVC 관계 정리"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---


#IaaS #Onboarding #개념 #Cinder


## 1. 스토리지 기본 유형


스토리지는 크게 세 가지 방식으로 구분돼:

1. **블록 스토리지 (Block Storage)**
    - 데이터를 “블록 단위”로 저장.
    - OS 입장에서는 로컬 디스크처럼 보임.
    - VM 디스크, 데이터베이스처럼 빠른 읽기/쓰기 필요한 곳에 적합.
    - 예: AWS EBS, OpenStack Cinder.
2. **파일 스토리지 (File Storage)**
    - 파일/폴더 구조로 저장. 여러 서버가 공유해서 씀.
    - 예: NFS, Amazon EFS.
3. **오브젝트 스토리지 (Object Storage)**
    - 데이터를 “객체(파일+메타데이터+ID)”로 저장.
    - 확장성이 크고, 정적 데이터(이미지, 백업)에 적합.
    - 예: AWS S3, OpenStack Swift.

---


## 2. OpenStack Cinder

- **OpenStack의 블록 스토리지 서비스**.
- VM 인스턴스에 붙였다 뗄 수 있는 **영속적 디스크 볼륨**을 제공.
- AWS의 **EBS**와 같은 역할.
- 주요 기능:
    - 볼륨 생성/삭제
    - attach/detach
    - 스냅샷, 복제
    - 다양한 백엔드(Ceph RBD, LVM, NetApp 등) 지원

👉 즉, OpenStack 환경에서 VM에 “디스크(EBS 같은 것)”을 붙이고 싶으면 **Cinder**를 통해 API/CLI로 처리.


---


## 3. Kubernetes의 영속 스토리지 (PV/PVC)

- 쿠버네티스는 기본적으로 Pod가 죽으면 **스토리지도 날아감** → 영속성 필요.
- 이를 해결하는 구조가 **PV/PVC**.
1. **PersistentVolume (PV)**
    - 클러스터에 등록된 스토리지 자원.
    - 실제 스토리지(Cinder, NFS, EBS 등)와 연결된 “대표 객체”.
2. **PersistentVolumeClaim (PVC)**
    - 개발자가 요청하는 스토리지 요구사항 (예: 10Gi, ReadWriteOnce).
    - PVC가 생성되면 적절한 PV와 매칭됨.
3. **StorageClass + 동적 프로비저닝**
    - 관리자가 PV를 미리 만들어두는 대신, PVC가 생기면 자동으로 스토리지를 생성.
    - `StorageClass`에 어떤 프로비저너(Cinder, EBS 등)를 쓸지 정의.
    - PVC 생성 → StorageClass 확인 → Kubernetes가 Cinder API 호출 → 새 볼륨 생성 → PV 자동 매칭.

---


## 4. Cinder와 Kubernetes의 연결

- Kubernetes가 OpenStack 위에서 동작할 때, **Cinder가 PV의 실제 백엔드 스토리지**가 됨.
- 동작 흐름:
    1. 사용자가 PVC를 생성 → 10Gi 볼륨 필요.
    2. PVC에 연결된 StorageClass가 `kubernetes.io/cinder` 프로비저너를 사용.
    3. Kubernetes가 OpenStack Cinder API 호출 → 새 블록 볼륨 생성.
    4. 자동으로 PV 객체가 생성되고 PVC와 바인딩.
    5. Pod에서 PVC를 마운트 → Cinder 볼륨을 디스크처럼 사용.

👉 결국 **Cinder = 실제 스토리지 제공자**, **PV = Kubernetes에서 추상화된 스토리지 자원**, **PVC = 사용자의 스토리지 요청서**.


---


## 5. OpenStack Cinder vs AWS EBS (Kubernetes에서의 스토리지 연동 비교)


## 5-1. 기본 정의

- **Cinder**: OpenStack의 블록 스토리지 서비스.
- **EBS**: AWS의 블록 스토리지 서비스.

둘 다 공통적으로 **VM/Pod에 attach할 수 있는 영속 디스크**를 제공한다는 점에서 역할이 같아.


---


## 5-2. Kubernetes 연동 구조


| 구분               | OpenStack 환경                             | AWS 환경                                |
| ---------------- | ---------------------------------------- | ------------------------------------- |
| **스토리지 서비스**     | Cinder (블록 스토리지)                         | EBS (Elastic Block Store)             |
| **K8s PV 생성 방식** | `cinder` 프로비저너 사용                        | `ebs.csi.aws.com` CSI 드라이버 사용         |
| **동적 프로비저닝**     | StorageClass → `kubernetes.io/cinder`    | StorageClass → `ebs.csi.aws.com`      |
| **실제 볼륨**        | Cinder API 호출로 블록 볼륨 생성                  | EBS API 호출로 EBS 볼륨 생성                 |
| **Pod에 연결**      | Cinder 볼륨 attach → PV/PVC 매칭 → Pod mount | EBS 볼륨 attach → PV/PVC 매칭 → Pod mount |


---


## 5-3. 흐름 비교 (동적 프로비저닝)


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


## 5-4. 한 줄 정리

- **Cinder = OpenStack의 EBS**라고 보면 이해가 빠름.
- 둘 다 쿠버네티스에서는 **PV/PVC를 통해 추상화**되고,
- **StorageClass**를 통해 **동적 프로비저닝**이 가능.

👉 즉, Kubernetes 입장에서는 **PVC → StorageClass → 백엔드 볼륨 생성** 흐름이 같고,


백엔드가 **OpenStack이면 Cinder**, **AWS면 EBS**일 뿐이야.


## 5-5. 블록 스토리지 비교: Cinder vs EBS vs 로컬 디스크(NFS 등)


| 구분                 | **OpenStack Cinder**                | **AWS EBS**                          | **로컬/NFS 등 (온프레미스 공유 스토리지)**               |
| ------------------ | ----------------------------------- | ------------------------------------ | ------------------------------------------ |
| **플랫폼**            | OpenStack (프라이빗 클라우드)               | AWS (퍼블릭 클라우드)                       | 온프레미스 서버/VM 환경                             |
| **스토리지 타입**        | 블록 스토리지                             | 블록 스토리지                              | 파일 스토리지(NFS), 블록 로컬디스크                     |
| **사용 예시**          | VM 디스크, DB 스토리지                     | EC2 디스크, DB 스토리지                     | NAS/NFS 공유 파일, 단일 서버용 로컬 SSD/HDD           |
| **프로비저닝 방식 (K8s)** | StorageClass `kubernetes.io/cinder` | CSI Driver `ebs.csi.aws.com`         | NFS: `nfs-subdir-external-provisioner` 등   |
| **동적 프로비저닝 지원**    | O (Cinder API 호출)                   | O (EBS API 호출)                       | O (NFS provisioner, Ceph RBD, GlusterFS 등) |
| **백엔드**            | LVM, Ceph RBD, NetApp, Dell EMC 등   | AWS 전용(SSD, gp2/gp3/io2)             | 직접 구축: NFS 서버, SAN, Ceph, GlusterFS        |
| **고가용성**           | 멀티 AZ(가상화 기반) 지원                    | 멀티 AZ 지원 (단, EBS는 AZ 단위라 AZ 간 공유 불가) | NFS 서버 HA 구성 필요 (수동)                       |
| **성능**             | 백엔드에 따라 다름 (Ceph=확장성, 고성능)          | 고성능 SSD, IOPS/Throughput 옵션 제공       | 로컬 SSD는 빠름, NFS는 네트워크 속도 의존                |
| **확장성**            | 클라우드 API로 무한 확장                     | AWS API로 무한 확장                       | 서버/스토리지 용량에 제한 있음                          |
| **관리 편의성**         | OpenStack 관리자가 운영                   | AWS 관리형 (완전 관리형)                     | 직접 운영 필요 (백업/HA 구성 수동)                     |
| **대표 활용**          | 프라이빗 클라우드 기업 환경                     | AWS 기반 애플리케이션                        | 온프레미스 앱, 쿠버네티스 실습/소규모 환경                   |


---


## 한 줄 요약

- **Cinder**: OpenStack의 **블록 스토리지**, 프라이빗 클라우드에 최적.
- **EBS**: AWS의 **블록 스토리지**, 퍼블릭 클라우드에서 관리형으로 사용.
- **NFS/로컬디스크**: 온프레미스/작은 규모에 적합, 직접 관리 필요.
