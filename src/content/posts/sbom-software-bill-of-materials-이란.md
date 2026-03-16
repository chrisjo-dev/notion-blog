---
title: "SBOM (Software Bill of Materials) 이란?"
description: "#SBOM #CI/CD #개념 #DevOps Software Bill of Materials SBOM은 소프트웨어 구성 명세서라고 번역할 수 있어. 말 그대로 “이 소프트웨어 안에 어떤 부품(패키지/라이브러리)이 들어있는지 일종의 재료 명세서”야. - 자동차 부품 리스..."
date: "2025-12-27T12:34:00.000Z"
notionId: "2d6ea3deaa2b8059b287c3abe224f67f"
category: "끄적끄적"
tags:
  - "끄적끄적"
hierarchy:
  - "끄적끄적"
  - "SBOM (Software Bill of Materials) 이란?"
parent: "2d6ea3deaa2b80ec8f44c1b718f382c4"
level: 1
---


#SBOM #CI/CD #개념 #DevOps


Software Bill of Materials


SBOM은 **소프트웨어 구성 명세서**라고 번역할 수 있어.


말 그대로 **“이 소프트웨어 안에 어떤 부품(패키지/라이브러리)이 들어있는지 일종의 재료 명세서”**야.

- 자동차 부품 리스트처럼, 소프트웨어도 수많은 **오픈소스 라이브러리, 프레임워크, 패키지**로 만들어짐.
- SBOM은 그 **구성요소 목록, 버전, 출처**를 구조화된 형식(JSON, SPDX, CycloneDX 등)으로 기록한 파일이야.

---


## 왜 필요한가?

1. **취약점 관리**
    - 어떤 버전의 라이브러리가 포함되어 있는지 알면, 그 버전에 CVE(보안 취약점)가 발표되었을 때 바로 영향 범위를 파악 가능.
    - 예: Log4j 취약점(Log4Shell)이 터졌을 때, SBOM 있으면 “내 서비스 중 어떤 이미지에 log4j-core 2.14.1이 들어있나?”를 자동 확인 가능.
2. **라이선스 컴플라이언스**
    - 오픈소스 라이선스(GPL, Apache2, MIT 등) 의무 확인.
    - SBOM은 어떤 라이브러리가 어떤 라이선스로 들어갔는지 기록해 법적 리스크 줄여줌.
3. **공급망(Supply Chain) 보안**
    - 최근 공격은 직접 코드보다 **서드파티 라이브러리, 패키지 레지스트리, 빌드 체인**을 노리는 경우가 많아.
    - SBOM은 공급망 추적(“어떤 경로로 이 코드가 들어왔는지”)을 돕는다.
4. **규제/표준 대응**
    - 미국(2021년 Biden 행정명령 14028)에서 연방 정부 공급업체는 SBOM 제공을 요구.
    - EU, 일본 등도 SBOM 제출 의무화 논의 중.

---


## 어떻게 만들고 쓰나?

- **생성 도구**
    - `Syft`, `Trivy`, `CycloneDX`, `bom` 같은 툴이 컨테이너 이미지나 코드베이스에서 SBOM을 자동 생성.
    - 예:

        ```bash
        syft myapp:1.0 -o cyclonedx-json > sbom.json
        ```

- **형식**
    - SPDX, CycloneDX, SWID 세 가지가 대표 표준.
- **활용**
    - CI 단계에서 SBOM 생성 → Nexus 같은 아티팩트 저장소에 함께 업로드
    - Trivy, Grype 같은 도구가 SBOM을 읽고 취약점 스캔

---


## 정리

- **SBOM = 소프트웨어 “부품 리스트”**
- **효과 = 취약점 추적, 라이선스 관리, 공급망 보안 강화**
- CI/CD 파이프라인에서 Trivy/Syft로 자동 생성 → 레지스트리에 업로드 → 운영/보안팀이 활용.
