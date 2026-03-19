---
title: "GitOps Overview"
description: "#GitOps #Infra #DevOps #Concepts 1. Definition - GitOps is a methodology for managing Operations through Git - All desired states of infrastructure/applications are declaratively defined in Git - Controllers like Argo CD and Flux continuously synchronize Git with the actual environment..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b819cb7bbdf27bc4cef21"
koreanSlug: "gitops-정리"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "GitOps 정리"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---

#GitOps #Infra #DevOps #Concepts


## 1. Definition

- **GitOps** is a **methodology for managing Operations through Git**
- The **desired state** of all infrastructure/applications is declaratively defined in Git
- Controllers like **Argo CD and Flux** continuously **synchronize (reconcile)** Git with the actual environment

---


## 2. Background and Motivation

- Limitations of traditional **IaC (Terraform, etc.) + CI/CD** approaches:
    - **Drift problem**: The actual environment diverges from Git
    - **No audit trail for operational changes**: Direct modifications via console/CLI → not recorded in Git
    - **Environment inconsistency**: Dev/staging/production can fall out of sync
- GitOps addresses these issues by introducing the **Git = Single Source of Truth** principle

---


## 3. Core Concepts

1. **Declarative Configuration**
    - Desired state is defined using YAML, Helm, Kustomize, etc.
2. **Git as the Single Source of Truth**
    - Changes must only be applied through PRs/Commits
3. **Automatic Synchronization**
    - The controller continuously compares Git with the actual environment → automatically reverts any drift
4. **Auditability and Transparency**
    - All changes are traceable through Git history

---


## 4. CI/CD vs. GitOps


| Category | CI/CD | GitOps |
| -------- | ------------------- | ---------------------- |
| Deployment actor | Pipeline **pushes** to the environment | Controller **pulls** from Git |
| Execution model | Event-triggered → one-shot execution | Continuous monitoring & synchronization |
| Drift handling | Unknown; manual recovery required | Automatic recovery (reconciliation) |
| Change path | CI/CD + direct modifications allowed | Only Git PR/Commit permitted |


---


## 5. Tech Stack

- **Git repositories**: GitHub, GitLab, Bitbucket
- **CI**: GitHub Actions, Jenkins, GitLab CI (build/test/image creation)
- **GitOps controllers (CD)**: Argo CD, Flux
- **Declarative deployment**: Helm, Kustomize
- **Supporting tools**: Sealed Secrets, Vault (secrets management), Kyverno/OPA (policy), Prometheus + Grafana (monitoring)

---


## 6. One-Line Summary

- **CI/CD**: Automation that "pushes" code changes into the environment
- **GitOps**: An operational pattern that treats Git as the single source of truth for operations, **keeping the environment always in sync with the Git state**

[bookmark](https://www.samsungsds.com/kr/insights/gitops.html)