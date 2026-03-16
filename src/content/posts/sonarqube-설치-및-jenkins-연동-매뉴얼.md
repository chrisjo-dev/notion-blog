---
title: "SonarQube 설치 및 Jenkins 연동 매뉴얼"
description: "목차 1. 사전 요구사항 2. SonarQube 서버 설정 3. Jenkins 플러그인 설치 및 설정 4. SonarQube 프로젝트 설정 5. Jenkins 파이프라인 연동 6. Quality Gates 설정 7. 연동 테스트 8. 문제 해결 9. 베스트 프랙티스 1..."
date: "2025-12-27T12:39:00.000Z"
notionId: "2d6ea3deaa2b806aad74ebdcd6b1737d"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "SonarQube 설치 및 Jenkins 연동 매뉴얼"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---


## 목차

1. [사전 요구사항](https://chatgpt.com/g/g-p-68c365f9afa08191964e07ff1280fc43-nh-archive/c/68d503c6-8c40-8322-83d8-49fd617da795#1-%EC%82%AC%EC%A0%84-%EC%9A%94%EA%B5%AC%EC%82%AC%ED%95%AD)
2. [SonarQube 서버 설정](https://chatgpt.com/g/g-p-68c365f9afa08191964e07ff1280fc43-nh-archive/c/68d503c6-8c40-8322-83d8-49fd617da795#2-sonarqube-%EC%84%9C%EB%B2%84-%EC%84%A4%EC%A0%95)
3. [Jenkins 플러그인 설치 및 설정](https://chatgpt.com/g/g-p-68c365f9afa08191964e07ff1280fc43-nh-archive/c/68d503c6-8c40-8322-83d8-49fd617da795#3-jenkins-%ED%94%8C%EB%9F%AC%EA%B7%B8%EC%9D%B8-%EC%84%A4%EC%B9%98-%EB%B0%8F-%EC%84%A4%EC%A0%95)
4. [SonarQube 프로젝트 설정](https://chatgpt.com/g/g-p-68c365f9afa08191964e07ff1280fc43-nh-archive/c/68d503c6-8c40-8322-83d8-49fd617da795#4-sonarqube-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EC%84%A4%EC%A0%95)
5. [Jenkins 파이프라인 연동](https://chatgpt.com/g/g-p-68c365f9afa08191964e07ff1280fc43-nh-archive/c/68d503c6-8c40-8322-83d8-49fd617da795#5-jenkins-%ED%8C%8C%EC%9D%B4%ED%94%84%EB%9D%BC%EC%9D%B8-%EC%97%B0%EB%8F%99)
6. [Quality Gates 설정](https://chatgpt.com/g/g-p-68c365f9afa08191964e07ff1280fc43-nh-archive/c/68d503c6-8c40-8322-83d8-49fd617da795#6-quality-gates-%EC%84%A4%EC%A0%95)
7. [연동 테스트](https://chatgpt.com/g/g-p-68c365f9afa08191964e07ff1280fc43-nh-archive/c/68d503c6-8c40-8322-83d8-49fd617da795#7-%EC%97%B0%EB%8F%99-%ED%85%8C%EC%8A%A4%ED%8A%B8)
8. [문제 해결](https://chatgpt.com/g/g-p-68c365f9afa08191964e07ff1280fc43-nh-archive/c/68d503c6-8c40-8322-83d8-49fd617da795#8-%EB%AC%B8%EC%A0%9C-%ED%95%B4%EA%B2%B0)
9. [베스트 프랙티스](https://chatgpt.com/g/g-p-68c365f9afa08191964e07ff1280fc43-nh-archive/c/68d503c6-8c40-8322-83d8-49fd617da795#9-%EB%B2%A0%EC%8A%A4%ED%8A%B8-%ED%94%84%EB%9E%99%ED%8B%B0%EC%8A%A4)
10. [유지보수](https://chatgpt.com/g/g-p-68c365f9afa08191964e07ff1280fc43-nh-archive/c/68d503c6-8c40-8322-83d8-49fd617da795#10-%EC%9C%A0%EC%A7%80%EB%B3%B4%EC%88%98)

---


## 1. 사전 요구사항

- Kubernetes 클러스터 (minikube, k8s 등)
- Helm 3.x 설치
- kubectl 설치 및 클러스터 접근 권한
- Jenkins 서버 실행 중
- Jenkins 관리자 콘솔 접근 권한
- Jenkins ↔ SonarQube 간 네트워크 연결 가능

---


## 2. SonarQube 서버 설정


### 2.1 Helm Chart 설치


```bash
helm repo add sonarqube https://SonarSource.github.io/helm-chart-sonarqube
helm repo update

helm install sonarqube sonarqube/sonarqube \
  --namespace sonarqube \
  --create-namespace \
  --values sonarqube.yaml
```


### 2.2 접근 확인


```bash
# Ingress 확인
curl -I http://sonarqube.127.0.0.1.nip.io

# 또는 포트 포워딩
kubectl port-forward svc/sonarqube-sonarqube 9000:9000 -n sonarqube
```


### 2.3 초기 계정

- ID: `admin`
- PW: `admin` (최초 로그인 시 변경 필요)

### 2.4 토큰 생성

1. **프로필 → My Account → Security → Generate Tokens**

    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-1.png)


    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-2.png)

2. 토큰 이름: `jenkins-integration` , 타입: Global Analysis Token

    ```json
    Generate Tokens
    Name : jenkins-integration
    Type : Project Analysis Token
    Project : apps-demo
    Expires in : No expiration
    ```

3. 생성 후 Jenkins에 등록
    - id: sonarqube-token
    secret: token

---


## 3. Jenkins 플러그인 설치 및 설정


### 3.1 필수 플러그인

- SonarQube Scanner for Jenkins
- Quality Gates Plugin

### 3.2 Scanner 도구 설정

- Jenkins 관리 → **Global Tool Configuration**

    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-3.png)

- SonarQube Scanner 추가 (자동 설치),
여기서 사용할 이름은 젠킨스 파일에서 호출할 커멘드 지정 이름.

    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-4.png)


    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-5.png)


### 3.3 SonarQube 서버 등록

- Jenkins 관리 → **시스템 설정**
- Name: `SonarQube`
- URL: `http://sonarqube.127.0.0.1.nip.io`
- Credentials: `sonarqube-token` 
아까 발급받은 sonarqube 시크릿키
Kind: Secret text

    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-6.png)


    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-7.png)


---


## 4. SonarQube 프로젝트 설정


### 4.2 Quality Profile

- 기본 `Sonar way` 또는 사용자 정의

    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-8.png)


### 4.3 sonar-project.properties 예시

- 젠킨스 파일이 저장되는 곳에다가 이 설정파일을 등록한다.

```plain text
# SonarQube project configuration
sonar.projectKey=app-demo
sonar.projectName=App Demo
sonar.projectVersion=1.0

# Source code location
sonar.sources=.
sonar.sourceEncoding=UTF-8

# Exclusions
sonar.exclusions=**/dist/**,**/venv/**,**/__pycache__/**,**/node_modules/**,**/.git/**,**/target/**,**/*.pyc,**/.pytest_cache/**,**/htmlcov/**

# Python specific settings (no test coverage files exist)
# sonar.python.coverage.reportPaths=coverage.xml
# sonar.python.xunit.reportPath=test-results.xml

# Language detection
sonar.language=py

# Test settings (no tests directory exists)
# sonar.tests=tests/
# sonar.test.inclusions=**/test_*.py,**/*_test.py

# Coverage exclusions
sonar.coverage.exclusions=**/test_*.py,**/*_test.py,**/conftest.py

# Duplication exclusions
sonar.cpd.exclusions=**/migrations/**
```


---


## 5. Jenkins 파이프라인 연동


### 5.0 Jenkinsfile 파라미터 예시


```bash
string(name: 'SONAR_HOST_URL', defaultValue: 'http://sonarqube.127.0.0.1.nip.io', description: 'SonarQube server URL')
string(name: 'SONAR_CREDENTIALS_ID', defaultValue: 'sonarqube-token', description: 'Jenkins credentialsId for SonarQube token')
string(name: 'SONAR_PROJECT_KEY', defaultValue: 'app-demo', description: 'SonarQube project key')
string(name: 'SONAR_PROJECT_NAME', defaultValue: 'App Demo', description: 'SonarQube project name')
booleanParam(name: 'ENABLE_SONAR', defaultValue: true, description: 'Enable SonarQube code analysis')
booleanParam(name: 'SONAR_QUALITY_GATE', defaultValue: true, description: 'Wait for SonarQube Quality Gate')
```


### 5.1 Jenkinsfile 예시


```groovy
stage('SonarQube Analysis') {
  when {
    expression { return params.ENABLE_SONAR }
  }
  steps {
    script {
      echo "Starting SonarQube code analysis for project: ${params.SONAR_PROJECT_KEY}"
      
      // Jenkins SonarQube 플러그인의 표준 방식
      withSonarQubeEnv('SonarQube') {
        // Jenkins에서 관리하는 SonarScanner 도구 사용
        def scannerHome = tool 'sonar-scanner'
        sh """
          ${scannerHome}/bin/sonar-scanner \
            -Dsonar.projectKey=${params.SONAR_PROJECT_KEY} \
            -Dsonar.projectName="${params.SONAR_PROJECT_NAME}" \
            -Dsonar.projectVersion=${env.VERSION}
        """
      }
    }
  }
}

stage('SonarQube Quality Gate') {
  when {
    allOf {
      expression { 
        echo "ENABLE_SONAR: ${params.ENABLE_SONAR} (type: ${params.ENABLE_SONAR?.getClass()})"
        return params.ENABLE_SONAR == true || params.ENABLE_SONAR == 'true'
      }
      expression { 
        echo "SONAR_QUALITY_GATE: ${params.SONAR_QUALITY_GATE} (type: ${params.SONAR_QUALITY_GATE?.getClass()})"
        return params.SONAR_QUALITY_GATE == true || params.SONAR_QUALITY_GATE == 'true'
      }
    }
  }
  steps {
    script {
      echo "Waiting for SonarQube Quality Gate result..."
      echo "Webhook URL: http://host.minikube.internal:8080/sonarqube-webhook/"
      
      timeout(time: 10, unit: 'MINUTES') {
        def qg = waitForQualityGate()
        echo "Quality Gate result received: ${qg.status}"
        echo "Quality Gate details: ${qg}"
        
        if (qg.status != 'OK') {
          error "Pipeline aborted due to quality gate failure: ${qg.status}"
        }
        echo "Quality Gate passed successfully"
      }
    }
  }
}
```


### 5.2 Webhook 설정


![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-9.png)

- SonarQube: 프로젝트 셋팅 **→ Webhooks → Create**
- Name: `Jenkins-sonarqube-quality`
- URL 예시: `http://jenkins:8080/sonarqube-webhook/`

---


## 6. Quality Gates 설정

- Coverage < 80%
- Duplicated lines > 3%
- Maintainability/Rel/Sec Rating ≤ A
- ㅓ

→ **Project Settings → Quality Gate → Custom Gate 선택**


---


## 7. 연동 테스트

1. Jenkins 빌드 실행 (`ENABLE_SONAR=true`)
2. Jenkins 콘솔 로그에서 분석 결과 확인
3. SonarQube 대시보드에서 프로젝트 상태 확인

---


## 8. 문제 해결


### 8.1 공통 이슈

- **Scanner 없음**: Jenkins Global Tool 확인
- **인증 실패**: Token 만료 여부 확인
- **Webhook 타임아웃**: SonarQube → Jenkins 접근 가능성 확인

### 8.2 디버깅


```bash
# Jenkins → SonarQube 연결 확인
curl -I http://sonarqube.127.0.0.1.nip.io

# SonarQube → Jenkins Webhook 테스트
curl -X POST http://jenkins:8080/sonarqube-webhook/ -d '{"test":"ok"}'
```


---


## 9. 베스트 프랙티스

- 관리자 계정 강력 비밀번호
- 토큰 주기적 로테이션
- HTTPS 적용
- Quality Gate 조건 점진적 강화

---


## 10. 유지보수

- SonarQube/플러그인 정기 업데이트
- 디스크 공간 및 DB 백업
- Quality Profile 주기적 검토
- 모니터링/알림 설정

---


👉 이제 매뉴얼은 **섹션 번호와 목차가 일치**하고, **소제목·코드 블록·리스트**가 깔끔하게 정리되어 있습니다.


원하시면 제가 이 문서를 **PDF 배포용** 또는 **사내 위키용 Markdown** 버전으로도 만들어드릴 수 있어요. 어떤 형식이 필요하세요?


![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-10.png)

