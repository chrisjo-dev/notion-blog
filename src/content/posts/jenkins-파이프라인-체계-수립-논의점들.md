---
title: "Jenkins 파이프라인 체계 수립 논의점들"
description: "Jenkins 1. 현실적 운영 패턴     - 초기: UI로 잡 생성 → Jenkinsfile만 서비스 레포에 두고 운영     - 성장: 잡이 많아지면 seed job + Shared Library 도입     - 성숙: JCasC + DSL + GitOps 구조로..."
date: "2025-12-27T12:37:00.000Z"
notionId: "2d6ea3deaa2b80eaa0e8ff55f8d780e0"
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

1. 현실적 운영 패턴
    - **초기**: UI로 잡 생성 → Jenkinsfile만 서비스 레포에 두고 운영
    - **성장**: 잡이 많아지면 seed job + Shared Library 도입
    - **성숙**: JCasC + DSL + GitOps 구조로 전환 → Jenkins 자체도 완전히 코드화

    ⇒ 사실상 쿠버네티스 환경으로 jenkins를 관리하면 필수. 


    [https://popappend.tistory.com/94](https://popappend.tistory.com/94)

2. 레포 분리 (조직화) - 레포지토리 쳬계 설명
    - **서비스 레포**: 각 서비스 코드 + Jenkinsfile
    - **Shared Library 레포**: 공통 파이프라인 함수
    - **매니페스트 레포**: 배포 상태 (GitOps)
    - **플랫폼 레포**: Jenkins 자체 설정(JCasC/플러그인/Seed Job)

2. **코드로 관리?**

    - **Jenkinsfile**: 서비스 코드 레포 안에서 빌드/배포 파이프라인 정의
    - **Shared Library**: 공통 빌드/테스트/배포 로직을 함수로 제공
    - **JCasC(Jenkins Configuration as Code)**: Jenkins 자체 설정(YAML) 관리
    - **Job DSL/Seed Job**: Jenkins 잡 생성 자동화
1. **빌드/배포 흐름**
    1. 개발자가 Git에 push/PR → **Webhook** → Jenkins 빌드 시작
    2. Jenkinsfile 실행 → 빌드/테스트/보안스캔/도커빌드
    3. 이미지 푸시(Harbor/ECR/GCR 등)
    4. 이미지 취약점 점검 (Trivy)
    5. 매니페스트 레포에 **이미지 태그 업데이트 commit**
    6. ArgoCD/Flux가 변경 감지 → 자동 배포
1. Jenkins Plugin 추가건

    Pipeline Stage UI


        ![image.png](/notion-blog/images/notion/2d6ea3deaa2b80eaa0e8ff55f8d780e0/image-1.png)


# 보안 OSS (SonarQube, Trivy)

1. SonarQube Quality Gate 통과 요건 기준 수립

    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b80eaa0e8ff55f8d780e0/image-2.png)


    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b80eaa0e8ff55f8d780e0/image-3.png)


    평가 조건 설명


    | 지표 (Metric)       | 설명                                                  | 권장 기준 (값)                                       |
    | ----------------- | --------------------------------------------------- | ----------------------------------------------- |
    | Vulnerabilities   | 즉각적인 위협이 될 수 있는 심각한 보안 문제 (예: SQL Injection, XSS 등) | **0** (새 코드에서 1개 이상이면 실패)                       |
    | Security Hotspots | 보안 전문가의 검토가 필요한 잠재적 보안 구역. 직접적인 취약점은 아니나 위험 소지 있음   | **100% Reviewed** (새 코드의 모든 핫스팟이 '검토됨' 상태여야 통과) |
    | Security Rating   | 코드의 전반적 보안 등급 (취약점의 심각도에 따라 A ~ E 평가)               | **A** (새 코드에서 A보다 낮으면 실패)                       |


    | 측정 대상 (On)                       | 측정 지표 (Metric)             | 조건 (Operator)         | 값 (Value) | 설명                                |
    | -------------------------------- | -------------------------- | --------------------- | --------- | --------------------------------- |
    | New Code
    / Overall Code          | Security Rating            | is worse than (더 나쁨)  | A         | 새 코드의 보안 등급이 A가 아니면 실패            |
    | New Code
    / Overall Code          | Security Hotspots Reviewed | is less than (더 적음)   | 100%      | 새 코드에서 발견된 보안 핫스팟이 모두 검토되지 않으면 실패 |
    | New CodeaNew Code
    / Overall Code | Vulnerabilities            | is greater than (더 큼) | 0         | 새 코드에서 보안 취약점이 1개라도 발견되면 실패       |

2. Trivy 통과 요건 기준 수립

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


    보안 항목 요약표


    | 필드 경로                     | 설명                                          | 예시 값                                            |
    | ------------------------- | ------------------------------------------- | ----------------------------------------------- |
    | `scan_status`             | 스캔 결과 상태 (`Success`, `Failed`, `Running` 등) | `Success`                                       |
    | `scanner.name`            | 사용된 스캐너 이름                                  | `Trivy`                                         |
    | `scanner.version`         | 스캐너 버전                                      | `v0.64.1`                                       |
    | `severity`                | 리포트에서 강조된(또는 최고) 심각도 수준                     | `High`                                          |
    | `summary.total`           | 전체 취약점 수                                    | `54`                                            |
    | `summary.fixable`         | 수정 가능한 취약점 수                                | `2`                                             |
    | `summary.summary.High`    | High 심각도 취약점 수                              | `2`                                             |
    | `summary.summary.Medium`  | Medium 심각도 취약점 수                            | `1`                                             |
    | `summary.summary.Low`     | Low 심각도 취약점 수                               | `51`                                            |
    | `start_time` / `end_time` | 스캔 시작/종료 시각 (판단용 타임스탬프)                     | `2025-09-25T08:27:35Z` / `2025-09-25T08:27:39Z` |
    | `report_id`               | 리포트 고유 ID (추적용)                             | `0bd2b3cc-...`                                  |


    자동판정 규칙표


    | 규칙 이름                                 | 조건 (Operator)                                    | 임계값 (Value)    | 결과              | 이유 / 권장 조치                                                                |
    | ------------------------------------- | ------------------------------------------------ | -------------- | --------------- | ------------------------------------------------------------------------- |
    | Critical: New vulnerabilities present | `summary.total` is greater than `0`              | `0`            | **FAIL**        | 새 코드(또는 스캔 대상)에 취약점이 하나라도 있으면 차단. 즉시 분석 및 패치 필요.                          |
    | High severity present                 | `summary.summary.High` is greater than `0`       | `0`            | **FAIL**        | High 심각도 취약점 존재는 즉시 대응 대상. 우선순위로 패치 또는 Mitigation 필요.                     |
    | Fixable vulnerabilities exist         | `summary.fixable` is greater than `0`            | `0`            | **FAIL**        | 자동/수동으로 바로 고칠 수 있는 취약점이 있으면 실패로 처리(기한내 수정 요구).                            |
    | Medium severity threshold             | `summary.summary.Medium` is greater than `>= 5`  | `5`            | **WARN**        | Medium 다수 발생 시 리스크 누적. 스케줄된 패치 필요.                                        |
    | Low severity threshold                | `summary.summary.Low` is greater than `>= 20`    | `20`           | **WARN**        | Low가 많으면 관리·모니터링 권장(잠재적 기술부채).                                            |
    | Scan status check                     | `scan_status` is not `Success`                   | `Success`      | **WARN / FAIL** | `Failed` → **FAIL**(스캔 자체 문제), `Running`/`Partial` → **WARN**(재시도/검증 필요). |
    | Scanner version staleness             | `scanner.version` older than policy              | policy-defined | **WARN**        | 오래된 스캐너는 오탐/미탐 가능성 ⇒ 업그레이드 권장.                                            |
    | Time-to-fix SLA                       | `fixable > 0` and `reported_time` older than SLA | e.g., 7 days   | **FAIL / WARN** | 수정 기한 초과 시 **FAIL** 또는 Escalation.                                        |


    주어진 페이로드 요약:

    - `summary.total` = 54
    - `summary.summary.High` = 2
    - `summary.fixable` = 2
    - `scan_status` = `Success`

    규칙 평가(우선순위 적용):

    1. `summary.total > 0` → **FAIL** (취약점 존재)
    2. `summary.summary.High > 0` → **FAIL** (High 존재)
    3. `summary.fixable > 0` → **FAIL** (수정 가능한 항목 존재)

    최종 판정: **FAIL**

