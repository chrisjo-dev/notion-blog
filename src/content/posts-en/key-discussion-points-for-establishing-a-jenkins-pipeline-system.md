---
title: "Key Discussion Points for Establishing a Jenkins Pipeline System"
description: "Jenkins 1. Realistic Operational Patterns     - Early Stage: Create jobs via UI → Keep only Jenkinsfile in service repo and operate     - Growth Stage: When jobs increase, introduce seed job + Shared Library     - Mature Stage: Transition to JCasC + DSL + GitOps structure..."
date: "2025-12-27T12:37:00.000Z"
notionId: "2d6ea3deaa2b80eaa0e8ff55f8d780e0"
koreanSlug: "jenkins-파이프라인-체계-수립-논의점들"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "Jenkins 파이프라인 체계 수립 논의점들"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---

## Jenkins

1. Realistic Operational Patterns
    - **Early Stage**: Create jobs via UI → Keep only Jenkinsfile in service repo and operate
    - **Growth Stage**: When jobs increase, introduce seed job + Shared Library
    - **Mature Stage**: Transition to JCasC + DSL + GitOps structure → Jenkins itself fully codified

    ⇒ Essentially mandatory when managing Jenkins in a Kubernetes environment.


    [https://popappend.tistory.com/94](https://popappend.tistory.com/94)

2. Repository Separation (Organization) - Repository Structure Overview
    - **Service Repo**: Each service code + Jenkinsfile
    - **Shared Library Repo**: Common pipeline functions
    - **Manifest Repo**: Deployment state (GitOps)
    - **Platform Repo**: Jenkins core configuration (JCasC / Plugins / Seed Job)

2. **Manage as Code?**

    - **Jenkinsfile**: Defines build/deploy pipelines within the service code repo
    - **Shared Library**: Provides common build/test/deploy logic as reusable functions
    - **JCasC (Jenkins Configuration as Code)**: Manages Jenkins core configuration (YAML)
    - **Job DSL / Seed Job**: Automates Jenkins job creation

1. **Build/Deploy Flow**
    1. Developer pushes/PRs to Git → **Webhook** → Jenkins build starts
    2. Execute Jenkinsfile → Build / Test / Security Scan / Docker Build
    3. Push image (Harbor / ECR / GCR, etc.)
    4. Image vulnerability scan (Trivy)
    5. **Image tag update commit** to manifest repo
    6. ArgoCD/Flux detects changes → Automatic deployment

1. Additional Jenkins Plugin

    Pipeline Stage UI


        ![image.png](/notion-blog/images/notion/2d6ea3deaa2b80eaa0e8ff55f8d780e0/image-1.png)


# Security OSS (SonarQube, Trivy)

1. Establishing SonarQube Quality Gate Pass Criteria

    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b80eaa0e8ff55f8d780e0/image-2.png)


    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b80eaa0e8ff55f8d780e0/image-3.png)


    Evaluation Criteria Description


    | Metric | Description | Recommended Criteria (Value) |
    | --- | --- | --- |
    | Vulnerabilities | Serious security issues that can pose an immediate threat (e.g., SQL Injection, XSS, etc.) | **0** (Fails if 1 or more found in new code) |
    | Security Hotspots | Potential security areas requiring review by a security expert. Not a direct vulnerability, but poses risk | **100% Reviewed** (All hotspots in new code must be in 'Reviewed' status to pass) |
    | Security Rating | Overall security rating of the code (rated A–E based on vulnerability severity) | **A** (Fails if lower than A in new code) |


    | Target (On) | Metric | Operator | Value | Description |
    | --- | --- | --- | --- | --- |
    | New Code / Overall Code | Security Rating | is worse than | A | Fails if security rating of new code is not A |
    | New Code / Overall Code | Security Hotspots Reviewed | is less than | 100% | Fails if not all security hotspots found in new code are reviewed |
    | New Code / Overall Code | Vulnerabilities | is greater than | 0 | Fails if even 1 security vulnerability is found in new code |

2. Establishing Trivy Pass Criteria

    Callback Payload


    ```json
    "scan_overview": {
        "application/vnd.security.vulnerability.report; version=1.1": {
          "complete_percent": 100,
          "duration": 4,
          "end_time": "2025-09-25T08:27:39.000Z",
          "report_id": "0bd2b3cc-774e-4b9e-a6ae-4e15c8d5d6a6",
          "scan_status": "Success",
          "scanner": {
            "name": "Trivy",
            "vendor": "Aqua Security",
            "version": "v0.64.1"
          },
          "severity": "High",
          "start_time": "2025-09-25T08:27:35.000Z",
          "summary": {
            "fixable": 2,
            "summary": {
              "High": 2,
              "Low": 51,
              "Medium": 1
            },
            "total": 54
          }
        }
      },
    ```


    Security Items Summary Table


    | Field Path | Description | Example Value |
    | --- | --- | --- |
    | `scan_status` | Scan result status (`Success`, `Failed`, `Running`, etc.) | `Success` |
    | `scanner.name` | Scanner name used | `Trivy` |
    | `scanner.version` | Scanner version | `v0.64.1` |
    | `severity` | Highlighted (or highest) severity level in the report | `High` |
    | `summary.total` | Total number of vulnerabilities | `54` |
    | `summary.fixable` | Number of fixable vulnerabilities | `2` |
    | `summary.summary.High` | Number of High severity vulnerabilities | `2` |
    | `summary.summary.Medium` | Number of Medium severity vulnerabilities | `1` |
    | `summary.summary.Low` | Number of Low severity vulnerabilities | `51` |
    | `start_time` / `end_time` | Scan start/end time (timestamp for judgment) | `2025-09-25T08:27:35Z` / `2025-09-25T08:27:39Z` |
    | `report_id` | Unique report ID (for tracking) | `0bd2b3cc-...` |


    Auto-Judgment Rules Table


    | Rule Name | Condition (Operator) | Threshold (Value) | Result | Reason / Recommended Action |
    | --- | --- | --- | --- | --- |
    | Critical: New vulnerabilities present | `summary.total` is greater than `0` | `0` | **FAIL** | Block if even one vulnerability exists in new code (or scan target). Immediate analysis and patching required. |
    | High severity present | `summary.summary.High` is greater than `0` | `0` | **FAIL** | High severity vulnerabilities require immediate response. Priority patching or mitigation needed. |
    | Fixable vulnerabilities exist | `summary.fixable` is greater than `0` | `0` | **FAIL** | Treated as failure if there are vulnerabilities that can be immediately fixed automatically/manually (fix required within deadline). |
    | Medium severity threshold | `summary.summary.Medium` is greater than `>= 5` | `5` | **WARN** | Risk accumulates when many Medium vulnerabilities occur. Scheduled patching required. |
    | Low severity threshold | `summary.summary.Low` is greater than `>= 20` | `20` | **WARN** | When many Low vulnerabilities exist, management and monitoring recommended (potential technical debt). |
    | Scan status check | `scan_status` is not `Success` | `Success` | **WARN / FAIL** | `Failed` → **FAIL** (issue with the scan itself), `Running`/`Partial` → **WARN** (retry/validation needed). |
    | Scanner version staleness | `scanner.version` older than policy | policy-defined | **WARN** | Outdated scanners may cause false positives/negatives ⇒ Upgrade recommended. |
    | Time-to-fix SLA | `fixable > 0` and `reported_time` older than SLA | e.g., 7 days | **FAIL / WARN** | **FAIL** or Escalation when fix deadline is exceeded. |


    Given Payload Summary:

    - `summary.total` = 54
    - `summary.summary.High` = 2
    - `summary.fixable` = 2
    - `scan_status` = `Success`

    Rule Evaluation (with priority applied):

    1. `summary.total > 0` → **FAIL** (vulnerabilities exist)
    2. `summary.summary.High > 0` → **FAIL** (High vulnerabilities exist)
    3. `summary.fixable > 0` → **FAIL** (fixable items exist)

    Final Judgment: **FAIL**