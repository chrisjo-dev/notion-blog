---
title: "Hypervisor(하이퍼바이저)란?"
description: "#Infra #IaaS #개념 #계층구조 1. Hypervisor(하이퍼바이저)란? - 정의: 하나의 물리 서버(Host) 위에서 여러 개의 가상 머신(VM, Virtual Machine)을 실행할 수 있도록 해주는 가상화 소프트웨어. - 즉, CPU, 메모리, 네트워..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81bb84dccbbbe29e186f"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "Hypervisor(하이퍼바이저)란?"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---


#Infra #IaaS #개념 #계층구조


## 1. Hypervisor(하이퍼바이저)란?

- **정의**: 하나의 물리 서버(Host) 위에서 여러 개의 가상 머신(VM, Virtual Machine)을 실행할 수 있도록 해주는 **가상화 소프트웨어**.
- 즉, CPU, 메모리, 네트워크, 스토리지 같은 물리 자원을 잘게 쪼개서 여러 VM들이 나눠 쓸 수 있도록 관리하는 **중간 관리자** 역할을 함.
- VM은 마치 독립된 서버처럼 동작하지만, 실제로는 하이퍼바이저 위에서 돌아가는 프로세스임.

---


## 2. Hypervisor의 종류

1. **Type 1 (Bare-metal)**
    - 물리 하드웨어 위에 직접 설치됨.
    - 예: VMware ESXi, Microsoft Hyper-V, Xen
    - 성능이 더 좋음(운영체제 거치지 않음).
2. **Type 2 (Hosted)**
    - 기존 OS(예: Ubuntu, Windows) 위에서 애플리케이션처럼 실행됨.
    - 예: VirtualBox, VMware Workstation
    - 성능은 조금 떨어지지만 테스트/개발 환경에 많이 사용됨.

---


## 3. KVM(Kernel-based Virtual Machine)

- **정의**: 리눅스 커널에 내장된 오픈소스 하이퍼바이저 기능.
- **Type 1**에 가까움 (리눅스 커널이 직접 하드웨어를 제어하므로 성능이 좋음).
- Red Hat, Ubuntu, CentOS 같은 리눅스에서 기본 제공됨.

### 동작 원리

- KVM은 리눅스 커널을 하이퍼바이저로 변신시킴.
- 각 VM은 리눅스의 **프로세스(Process)**처럼 동작하고, CPU/메모리/디스크를 분리해서 배정받음.
- 네트워크는 **브리지(bridge)**, **NAT**, **SDN(Open vSwitch)** 등으로 연결 가능.

---


## 4. KVM 구성 요소

- **QEMU**: 하드웨어 에뮬레이션 담당 (CPU, 디스크, 네트워크 카드 등).
- **libvirt**: VM 생성·관리 툴 (명령어 `virsh`, GUI 툴 `virt-manager`).
- **KVM 커널 모듈**: `kvm.ko`, `kvm-intel.ko` 또는 `kvm-amd.ko`.

---


## 5. KVM 장점

- 리눅스 커널과 밀접하게 통합 → 성능 우수.
- 오픈소스 → 비용 없음.
- OpenStack, oVirt, Proxmox 같은 클라우드/가상화 플랫폼에서 많이 사용됨.
- 라이브 마이그레이션, 스냅샷, 고가용성 지원.

---


## 6. 실제 예시

- AWS EC2 → 예전엔 Xen 기반, 지금은 대부분 **KVM 기반**으로 전환됨.
- OpenStack → KVM이 기본 하이퍼바이저.
- 개인 서버 → Ubuntu + KVM + virt-manager로 여러 VM을 만들어 연습 가능.

---


정리하자면,


**Hypervisor는 여러 VM을 실행시키는 가상화 관리 소프트웨어**이고,


**KVM은 리눅스 커널에 내장된 강력한 오픈소스 Hypervisor**라고 보면 됩니다.

