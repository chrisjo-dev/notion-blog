---
title: "What is a Hypervisor?"
description: "#Infra #IaaS #Concepts #LayeredArchitecture 1. What is a Hypervisor? - Definition: Virtualization software that allows multiple Virtual Machines (VMs) to run on a single physical server (Host). - In other words, it acts as an intermediary manager that slices up physical resources such as CPU, memory, network, and storage so that multiple VMs can share them..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81bb84dccbbbe29e186f"
koreanSlug: "hypervisor하이퍼바이저란"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "Hypervisor(하이퍼바이저)란?"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

#Infra #IaaS #Concepts #LayeredArchitecture


## 1. What is a Hypervisor?

- **Definition**: **Virtualization software** that allows multiple Virtual Machines (VMs) to run on a single physical server (Host).
- In other words, it acts as an **intermediary manager** that slices up physical resources — such as CPU, memory, network, and storage — so that multiple VMs can share them.
- A VM behaves like an independent server, but in reality it is a process running on top of the hypervisor.

---


## 2. Types of Hypervisors

1. **Type 1 (Bare-metal)**
    - Installed directly on the physical hardware.
    - Examples: VMware ESXi, Microsoft Hyper-V, Xen
    - Better performance (no OS layer in between).
2. **Type 2 (Hosted)**
    - Runs as an application on top of an existing OS (e.g., Ubuntu, Windows).
    - Examples: VirtualBox, VMware Workstation
    - Slightly lower performance, but widely used for testing and development environments.

---


## 3. KVM (Kernel-based Virtual Machine)

- **Definition**: An open-source hypervisor feature built directly into the Linux kernel.
- Closer to **Type 1** (the Linux kernel controls hardware directly, resulting in good performance).
- Provided by default on Linux distributions such as Red Hat, Ubuntu, and CentOS.

### How It Works

- KVM transforms the Linux kernel itself into a hypervisor.
- Each VM operates like a Linux **process**, and is allocated its own isolated CPU, memory, and disk resources.
- Networking can be configured via **bridge**, **NAT**, **SDN (Open vSwitch)**, and more.

---


## 4. KVM Components

- **QEMU**: Handles hardware emulation (CPU, disk, network card, etc.).
- **libvirt**: VM creation and management toolset (CLI command `virsh`, GUI tool `virt-manager`).
- **KVM kernel modules**: `kvm.ko`, `kvm-intel.ko` or `kvm-amd.ko`.

---


## 5. Advantages of KVM

- Tightly integrated with the Linux kernel → excellent performance.
- Open-source → no licensing cost.
- Widely used in cloud and virtualization platforms such as OpenStack, oVirt, and Proxmox.
- Supports live migration, snapshots, and high availability.

---


## 6. Real-World Examples

- AWS EC2 → Previously Xen-based; now mostly transitioned to **KVM-based**.
- OpenStack → KVM is the default hypervisor.
- Personal server → You can practice creating multiple VMs using Ubuntu + KVM + virt-manager.

---


To summarize:


**A Hypervisor is virtualization management software that runs multiple VMs**,


and **KVM is a powerful open-source Hypervisor built directly into the Linux kernel**.