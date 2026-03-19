---
title: "Post-Incident Analysis Report: Server Down During Jenkins Agent Execution"
description: "1. Incident Summary - Date: October 2, 2025 - Environment: Minikube single-node Kubernetes cluster (Docker driver-based) - Components Involved: Jenkins, Jenkins Agent, SonarQub..."
date: "2025-12-27T12:36:00.000Z"
notionId: "2d6ea3deaa2b80f692c2d7f7f963e92a"
koreanSlug: "jenkins-에이전트-실행-시-서버-다운-사후-분석-보고서"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "Jenkins 에이전트 실행 시 서버 다운 사후 분석 보고서"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---

## 1. Incident Summary

- **Date**: October 2, 2025
- **Environment**: Minikube single-node Kubernetes cluster (Docker driver-based)
- **Components Involved**: Jenkins, Jenkins Agent, SonarQube Scanner, Docker Daemon
- **Primary Symptom**: During Jenkins pipeline execution, SonarQube Scanner and Jenkins Agent operating simultaneously caused the entire Minikube to freeze.

---


## 2. Problem Scenario


The flow at the time of the incident, summarized as a text diagram:


```plain text
[SonarQube Scanner] ----> CPU/메모리 부하 ↑
        │
        ▼
[Jenkins Master] ---파이프라인 실행---> [Jenkins Agent Pod 생성]
        │
        ▼
[Jenkins Agent Pod] ---Docker socket mount---> [/var/run/docker.sock]
        │
        ▼
[Host Docker Daemon] <--- 과부하 발생 ---> [Minikube Internal Docker]
        │
        ▼
[전체 Minikube 노드] ----> Freeze (응답 불가)
```


---


## 3. Root Cause Analysis

1. **Docker Socket Mount Structure**
    - The Jenkins Agent pod mounts `/var/run/docker.sock` from the host.
    - As a result, `docker build` and `docker run` commands executed by the agent are sent directly to the **host Docker Daemon (dockerd)**.
    - Consequently, Kubernetes resource limits (requests/limits) are bypassed, and all build tasks run at the host level.
2. **SonarQube Scanner Resource Usage**
    - CPU/memory usage spikes sharply during code analysis and Elasticsearch indexing.
    - Peak usage exceeds 1 CPU core and 1.5–2 GiB of memory momentarily.
3. **Resource Contention Escalation**
    - Minikube simulates a Kubernetes node on top of a single Docker Daemon.
    - The Jenkins Agent build tasks and SonarQube Scanner analysis tasks simultaneously put load on dockerd.
    - Even with available CPU/memory headroom, **internal dockerd serialization points (metadata locks, image indexing), overlayFS I/O bottlenecks, network conntrack, and QoS throttling** can cause the entire system to become unresponsive.
4. **Key Point: Why the System Can Freeze Even with Available Resources**
    - **Docker Daemon Bottleneck**: A single daemon processes all requests serially → even with available CPU, lock contention causes system-wide waiting.
    - **OverlayFS I/O**: `docker build` copies/hashes tens of thousands of files → metadata I/O bottleneck occurs.
    - **Memory Spike**: SonarQube and build compression cause momentary peaks → the kernel OOMKills critical processes like kubelet and etcd.
    - **QoS Inversion**: If Jenkins Agent has `BestEffort` QoS, kubelet health checks are delayed, causing the entire node to become NotReady.
    - Conclusion: **Available resources only reduce the frequency of the issue; they do not eliminate the structural risk (sharing the same dockerd).**

---


## 4. Troubleshooting Steps

1. Monitored resource usage with `kubectl top pods` and `docker stats` → confirmed CPU/memory spike in SonarQube Scanner.
2. Confirmed the presence of `/var/run/docker.sock` inside the Jenkins Agent Pod and verified that `docker build` was running.
3. Ran Scanner only (without Jenkins Agent) under the same conditions → operated normally.
4. Removed Docker socket mount and ran Jenkins Agent → Minikube operated normally.
5. **Root Cause → Docker socket mount + single dockerd contention** confirmed as final root cause.

---


## 5. Impact & Risks

- **Security Risk**: Container gains full control of the host Docker Daemon → privilege escalation.
- **Resource Risk**: Kubernetes resource limits bypassed → entire node becomes unstable.
- **Stability Risk**: dockerd going down in a single-node (Minikube) environment → entire cluster goes down.

---


## 6. Resolution & Action Items

1. **Remove Docker Socket Mount**
    - Remove `/var/run/docker.sock` from the Jenkins Agent.
    - Block direct access to the host Docker.
2. **Switch to Native Build Tools**
    - Use Kaniko / BuildKit (rootless) / Buildah.
    - Perform OCI image builds independently within the Pod.
3. **Resource Limits and QoS Guarantees**
    - Specify `requests/limits` for both SonarQube Scanner and Jenkins Agent.
    - Ensure Guaranteed QoS for kube-system components.
4. **Build Workload Isolation**
    - Separate Minikube and Jenkins so they do not run on the same node.
    - Alternatively, operate a dedicated node/profile for Jenkins.
5. **Observability and Alerting**
    - Monitor dockerd, kubelet, and overlayFS I/O metrics with Prometheus + Grafana.
    - Halt builds when resource spikes occur (Alert + Fail-fast).

---


## 7. Conclusion


This incident was a structural problem caused by the Jenkins Agent mounting the Docker socket to directly access the host Docker Daemon. It was not simply a lack of resource headroom; the entire Minikube froze due to **overload on a single Docker Daemon, internal bottlenecks, and resource contention (QoS inversion, I/O locks, memory spikes)**.


**Available resources only delay the problem, not solve it**, and the fundamental fix requires removing the Docker socket mount and transitioning to Kubernetes-native build methods.