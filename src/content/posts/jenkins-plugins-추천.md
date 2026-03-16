---
title: "Jenkins plugins 추천"
description: "1. Pipeline Utility Steps - 개념: Jenkins Pipeline에서 자주 쓰이는 유틸리티 함수 제공 - 대표 기능:     - ,  → JSON 파일 읽기/쓰기     - ,  → YAML 파일 읽기/쓰기     - , ,  등 압축 관련 기능..."
date: "2025-12-27T12:41:00.000Z"
notionId: "2d6ea3deaa2b80f5879afca80c82ff1a"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "Jenkins plugins 추천"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---


## 1. **Pipeline Utility Steps**

- **개념**: Jenkins Pipeline에서 자주 쓰이는 유틸리티 함수 제공
- **대표 기능**:
    - `readJSON`, `writeJSON` → JSON 파일 읽기/쓰기
    - `readYaml`, `writeYaml` → YAML 파일 읽기/쓰기
    - `zip`, `unzip`, `untar` 등 압축 관련 기능
- **예시**

```groovy
def data = readJSON file: 'config.json'
echo "버전: ${data.version}"
```


**사용 케이스**: 파이프라인에서 `config.json`/`values.yaml` 같은 파일을 읽어 환경에 따라 빌드 옵션 조정.


---


## 2. **Pipeline: Stage Step**

- **개념**: Declarative/Scripted Pipeline에서 `stage()`를 사용할 수 있게 하는 플러그인
- **역할**: 파이프라인 UI에서 단계(Stage)를 시각적으로 표시
- **예시**

```groovy
stage('Build') {
    sh 'mvn clean package'
}
```


**사용 케이스**: 빌드, 테스트, 배포 단계를 나누어 Jenkins UI/Blue Ocean에서 가시성 확보.


---


## 3. **Blue Ocean**

- **개념**: Jenkins Pipeline 전용 모던 UI 플러그인
- **특징**:
    - 직관적인 파이프라인 시각화
    - 멀티브랜치 파이프라인 브랜치별 보기
    - 빌드 로그를 단계별로 구분해서 표시
- **예시**:

    기존 Classic UI 대신 **파이프라인을 “타임라인 형태”**로 예쁘게 보여줌.


    **사용 케이스**: 복잡한 파이프라인 실행 상황을 한눈에 파악.


---


## 4. **Swarm Plugin**

- **개념**: Jenkins Agent를 **자동으로 Controller에 등록**해주는 플러그인
- **특징**:
    - Agent 서버에서 Swarm Client 실행 → Controller에 자동 연결
    - 동적으로 Agent 풀 확장 가능
- **예시**

```bash
java -jar swarm-client.jar -master http://jenkins:8080 -username user -password pass
```


**사용 케이스**: 많은 빌드 Agent를 쉽게 관리 (특히 VM 기반 환경).


---


## 5. **Node and Label Parameter Plugin**

- **개념**: 빌드 실행 시 **어떤 노드(Node)나 라벨(Label)**에서 실행할지 선택 가능
- **특징**:
    - 파라미터로 빌드할 노드 지정
    - 특정 라벨(예: `docker`, `windows`)에서만 실행
- **예시**

```groovy
parameters {
    label(name: 'NODE_LABEL', defaultValue: 'docker', description: '빌드 실행 노드')
}
node(params.NODE_LABEL) {
    stage('Build') {
        sh 'make build'
    }
}
```


**사용 케이스**: 윈도우 전용/리눅스 전용 빌드, 특정 GPU 노드에서 실행.


---


## 6. **Monitoring Plugin**

- **개념**: Jenkins Controller 및 Node의 **시스템 성능 모니터링** 제공
- **확인 가능 지표**: JVM 메모리, CPU, Thread 수, System Load, GC
- **예시**: Jenkins UI에서 `/monitoring` 페이지 접속 → 실시간 모니터링

    **사용 케이스**: Jenkins 서버 상태 확인, 성능 튜닝/장애 대응.


---


## 7. **Prometheus Metrics Plugin**

- **개념**: Jenkins 메트릭을 Prometheus에 노출하는 플러그인
- **특징**:
    - 빌드 성공/실패 카운트
    - 큐 길이, Executor 사용률
    - Node 상태, Job 실행 시간
- **예시**: `http://jenkins:8080/prometheus` → Prometheus 스크랩 대상 등록

    **사용 케이스**: Grafana 대시보드로 Jenkins 빌드 현황/노드 자원 시각화.


---


## 8. **Configuration as Code (JCasC)**

- **개념**: Jenkins 전체 설정(보안, 노드, 플러그인, 크레덴셜 등)을 **YAML 파일로 관리**
- **특징**:
    - Git에 저장해 재현성 확보
    - 새 서버 구축 시 코드 한 번 적용으로 동일 환경 복구
- **예시 (****`jenkins.yaml`****)**

```yaml
jenkins:
  systemMessage: "Managed by JCasC"
  numExecutors: 0
credentials:
  system:
    domainCredentials:
      - credentials:
          - string:
              id: "slack-token"
              secret: "${SLACK_TOKEN}"
```


**사용 케이스**: Jenkins 서버 재설치/이전/업그레이드 시 설정 자동 복원.


---


## 9. **Workspace Cleanup Plugin**

- **개념**: Job 실행 후 **워크스페이스를 자동 정리**해주는 플러그인
- **특징**:
    - 빌드할 때마다 클린 상태 보장
    - 노드 디스크 용량 절약
- **예시**

```groovy
post {
    always {
        cleanWs()
    }
}
```


**사용 케이스**: 빌드 아티팩트나 캐시 파일이 남아서 디스크를 가득 채우는 문제 방지.


---


## 10. **Throttle Concurrent Builds Plugin**

- **개념**: 특정 Job/Job 그룹의 **동시 실행 개수를 제한**
- **특징**:
    - 노드별/전체 Jenkins별 제한 가능
    - 카테고리로 Job 묶어서 제어 가능
- **예시**

```groovy
pipeline {
  agent any
  options {
    throttleConcurrentBuilds(
      maxConcurrentPerNode: 1,
      maxConcurrentTotal: 2,
      categories: ['heavy-tests']
    )
  }
}
```


**사용 케이스**: 무거운 통합 테스트, 외부 API 부하 테스트 → 동시에 여러 개 실행되지 않도록 제어.


---


# 요약


| 플러그인                       | 역할                              |
| -------------------------- | ------------------------------- |
| Pipeline Utility Steps     | JSON/YAML 등 파일 읽기·쓰기 유틸         |
| Pipeline: Stage Step       | Stage UI 제공 (파이프라인 단계 구분)       |
| Blue Ocean                 | 파이프라인 시각화 UI                    |
| Swarm Plugin               | 에이전트 자동 등록/풀 관리                 |
| Node and Label Parameter   | 특정 노드/라벨에서 실행 선택                |
| Monitoring Plugin          | Jenkins 서버/노드 성능 모니터링           |
| Prometheus Metrics         | Jenkins 지표를 Prometheus/Grafana로 |
| Configuration as Code      | Jenkins 설정을 YAML로 코드 관리         |
| Workspace Cleanup          | 워크스페이스 정리, 디스크 절약               |
| Throttle Concurrent Builds | Job 동시 실행 수 제한                  |

