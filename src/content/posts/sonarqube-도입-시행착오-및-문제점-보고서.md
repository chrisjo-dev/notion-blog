---
title: "SonarQube 도입 시행착오 및 문제점 보고서"
description: "--- 1. 프로젝트 개요 환경 정보 - Kubernetes: minikube - SonarQube: Community Edition (Helm Chart) - Jenkins: 기존 설치된 Jenkins 서버 - 언어: Python (Flask 애플리케이션) - CI/..."
date: "2025-12-27T12:40:00.000Z"
notionId: "2d6ea3deaa2b80739237c1e45ac7ba9c"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "SonarQube 도입 시행착오 및 문제점 보고서"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---


---


## 1. 프로젝트 개요


### 환경 정보

- **Kubernetes**: minikube
- **SonarQube**: Community Edition (Helm Chart)
- **Jenkins**: 기존 설치된 Jenkins 서버
- **언어**: Python (Flask 애플리케이션)
- **CI/CD**: Jenkins Pipeline

### 목표

- SonarQube 서버 설치 및 설정
- Jenkins 파이프라인과 자동 연동
- Quality Gate를 통한 코드 품질 게이트 구현
- 개발 워크플로우에 코드 품질 검사 통합

---


## 2. 주요 발생 문제점


| 구분   | 문제                                 | 심각도 | 해결 시간 | 상태   |
| ---- | ---------------------------------- | --- | ----- | ---- |
| 설치   | Helm values 파일 구조 이해 부족            | 중   | 2시간   | ✅ 해결 |
| 연동   | Jenkins-SonarQube 인증 실패            | 높음  | 4시간   | ✅ 해결 |
| 네트워크 | Webhook 연결 실패                      | 높음  | 3시간   | ✅ 해결 |
| 성능   | 메모리 부족으로 분석 실패                     | 중   | 1시간   | ✅ 해결 |
| 설정   | Quality Profile vs Quality Gate 혼동 | 낮음  | 1시간   | ✅ 해결 |
| 문서화  | 설치 방법 변경(Docker Compose → Helm)    | 중   | 2시간   | ✅ 해결 |


---


## 3. 설치 관련 이슈


### ⚠️ 이슈 1: Helm Values 파일 구조 이해 부족

- **문제:** 기본 values 사용 시 Ingress 설정 오류 발생
- **원인:** Ingress Controller 미지정 + minikube 특수 설정 미반영
- **해결:** custom values.yaml 작성 및 ingressClassName 지정

```yaml
ingress:
  enabled: true
  ingressClassName: haproxy
  hosts:
    - name: sonarqube.127.0.0.1.nip.io
resources:
  limits:
    cpu: 800m
    memory: 2048M
```


**💡 교훈:** 설치 전 values.yaml 구조 반드시 검토


---


### ⚠️ 이슈 2: 영구 스토리지 설정 혼동

- **문제:** persistence 비활성화 → 재시작 시 데이터 유실
- **해결:** 운영 환경에서는 persistence 활성화 + StorageClass 지정

```yaml
persistence:
  enabled: true
  storageClass: "standard"
  size: 10Gi
```


---


## 4. Jenkins 연동 이슈


### ⚠️ 이슈 3: SonarQube 토큰 인증 실패

- **문제:** Jenkins에서 HTTP 401 Unauthorized 발생
- **원인:** 잘못된 토큰 타입, 만료된 토큰, 공백 포함
- **해결:** SonarQube → User Token 생성 → Jenkins Credentials(secret text) 등록

---


### ⚠️ 이슈 4: SonarQube Scanner 도구 설정 문제

- **문제:** Jenkins가 scanner 실행 파일을 찾지 못함
- **해결:** Jenkins Global Tool Configuration에 `sonar-scanner` 등록 → Jenkinsfile 참조 일치

```groovy
def scannerHome = tool 'sonar-scanner'
```


---


## 5. Webhook 설정 이슈


### ⚠️ 이슈 5: Quality Gate Webhook 연결 실패

- **문제:** Jenkins에서 Quality Gate 응답을 받지 못하고 TIMEOUT 발생
- **원인:** minikube 네트워크 특성으로 Pod→Host 접근 불가
- **해결:** `host.minikube.internal` 사용

```plain text
Webhook URL: http://host.minikube.internal:8080/sonarqube-webhook/
```


---


### ⚠️ 이슈 6: Webhook 엔드포인트 경로 혼동

- **문제:** `/sonar-webhook/`와 `/sonarqube-webhook/` 혼동
- **해결:** 플러그인 표준 경로 `/sonarqube-webhook/` 사용

---


## 6. 성능 및 리소스 이슈


### ⚠️ 이슈 7: 메모리 부족

- **문제:** 분석 중 `OutOfMemoryError` 발생
- **해결:** JVM heap 및 Pod 리소스 상향

```yaml
resources:
  limits:
    memory: 2048M
jvmOpts: "-Xmx1536m -Xms512m"
```


---


### ⚠️ 이슈 8: CPU 부족

- **문제:** 분석 지연 (10분 → 25분)
- **해결:** CPU limit 상향 + Jenkins 타임아웃 조정

```yaml
limits:
  cpu: 800m
```


```groovy
timeout(time: 15, unit: 'MINUTES') {
  def qg = waitForQualityGate()
}
```


---


## 7. Quality Gate 설정 이슈


### ⚠️ 이슈 9: Quality Profile vs Quality Gate 개념 혼동

- **잘못된 이해:** Profile = 품질 기준, Gate = 규칙
- **올바른 이해:** Profile = 분석 규칙, Gate = 품질 기준

---


### ⚠️ 이슈 10: 과도한 Quality Gate 조건

- **문제:** 기본 Gate가 너무 엄격하여 빌드 전부 실패
- **해결:** 점진적 도입 전략 + 레거시 코드 제외

```plain text
sonar.exclusions=**/legacy/**,**/old_modules/**
```


---


## 8. 근본 원인 분석

1. 문서화 부족 (Compose→Helm 전환 반영 미흡)
2. 환경 차이 미고려 (로컬 vs minikube)
3. 도구 이해 부족 (Webhook, Scanner 동작 방식)
4. 테스트 부족 (네트워크, 리소스 검증 미흡)

---


## 9. 교훈 및 개선사항


### 학습된 교훈

- 설치 전 **환경 분석·의존성 확인** 필수
- **단계별 네트워크/리소스 검증** 필요
- **Quality Gate 점진적 도입** 중요
- **문서화 및 팀 교육** 선행 필요

---


## 10. 권장사항


### 사전 준비 체크리스트

- [ ] Helm values.yaml 검토
- [ ] Ingress Controller 및 StorageClass 확인
- [ ] Jenkins-SonarQube 인증 테스트

### 🔧 운영환경 권장 설정


```yaml
resources:
  limits:
    cpu: 2000m
    memory: 4096M
persistence:
  enabled: true
  size: 20Gi
```


---


## 결론

- SonarQube 도입 과정에서 **네트워크, 인증, 리소스 문제**를 해결하며 안정적인 환경을 구축
- Jenkins와 완전 연동하여 **자동화된 코드 품질 검사 체계** 마련
- 향후 유사 프로젝트에 **체계적 설치/운영 가이드**로 활용 가능

**핵심 교훈**:

1. 사전 준비 철저
2. 단계별 검증 및 점진적 도입
3. 지속적 문서화 및 공유
