---
title: "SonarQube Installation and Jenkins Integration Manual"
description: "Table of Contents 1. Prerequisites 2. SonarQube Server Setup 3. Jenkins Plugin Installation and Configuration 4. SonarQube Project Setup 5. Jenkins Pipeline Integration 6. Quality Gates Configuration 7. Integration Testing 8. Troubleshooting 9. Best Practices 1..."
date: "2025-12-27T12:39:00.000Z"
notionId: "2d6ea3deaa2b806aad74ebdcd6b1737d"
koreanSlug: "sonarqube-설치-및-jenkins-연동-매뉴얼"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "SonarQube 설치 및 Jenkins 연동 매뉴얼"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---

## Table of Contents

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


## 1. Prerequisites

- Kubernetes cluster (minikube, k8s, etc.)
- Helm 3.x installed
- kubectl installed with cluster access permissions
- Jenkins server running
- Jenkins administrator console access
- Network connectivity between Jenkins ↔ SonarQube

---


## 2. SonarQube Server Setup


### 2.1 Helm Chart Installation


```bash
helm repo add sonarqube https://SonarSource.github.io/helm-chart-sonarqube
helm repo update

helm install sonarqube sonarqube/sonarqube \
  --namespace sonarqube \
  --create-namespace \
  --values sonarqube.yaml
```


### 2.2 Access Verification


```bash
# Ingress 확인
curl -I http://sonarqube.127.0.0.1.nip.io

# 또는 포트 포워딩
kubectl port-forward svc/sonarqube-sonarqube 9000:9000 -n sonarqube
```


### 2.3 Initial Credentials

- ID: `admin`
- PW: `admin` (must be changed on first login)

### 2.4 Token Generation

1. **Profile → My Account → Security → Generate Tokens**

    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-1.png)


    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-2.png)

2. Token name: `jenkins-integration` , Type: Global Analysis Token

    ```json
    Generate Tokens
    Name : jenkins-integration
    Type : Project Analysis Token
    Project : apps-demo
    Expires in : No expiration
    ```

3. After generation, register in Jenkins
    - id: sonarqube-token
    secret: token

---


## 3. Jenkins Plugin Installation and Configuration


### 3.1 Required Plugins

- SonarQube Scanner for Jenkins
- Quality Gates Plugin

### 3.2 Scanner Tool Configuration

- Manage Jenkins → **Global Tool Configuration**

    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-3.png)

- Add SonarQube Scanner (auto-install).
The name used here is the command identifier that will be called from the Jenkinsfile.

    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-4.png)


    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-5.png)


### 3.3 SonarQube Server Registration

- Manage Jenkins → **System Configuration**
- Name: `SonarQube`
- URL: `http://sonarqube.127.0.0.1.nip.io`
- Credentials: `sonarqube-token`
The SonarQube secret key generated earlier
Kind: Secret text

    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-6.png)


    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-7.png)


---


## 4. SonarQube Project Setup


### 4.2 Quality Profile

- Default `Sonar way` or custom-defined

    ![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-8.png)


### 4.3 sonar-project.properties Example

- Register this configuration file in the same location where the Jenkinsfile is stored.

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


## 5. Jenkins Pipeline Integration


### 5.0 Jenkinsfile Parameter Example


```bash
string(name: 'SONAR_HOST_URL', defaultValue: 'http://sonarqube.127.0.0.1.nip.io', description: 'SonarQube server URL')
string(name: 'SONAR_CREDENTIALS_ID', defaultValue: 'sonarqube-token', description: 'Jenkins credentialsId for SonarQube token')
string(name: 'SONAR_PROJECT_KEY', defaultValue: 'app-demo', description: 'SonarQube project key')
string(name: 'SONAR_PROJECT_NAME', defaultValue: 'App Demo', description: 'SonarQube project name')
booleanParam(name: 'ENABLE_SONAR', defaultValue: true, description: 'Enable SonarQube code analysis')
booleanParam(name: 'SONAR_QUALITY_GATE', defaultValue: true, description: 'Wait for SonarQube Quality Gate')
```


### 5.1 Jenkinsfile Example


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


### 5.2 Webhook Configuration


![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-9.png)

- SonarQube: Project Settings **→ Webhooks → Create**
- Name: `Jenkins-sonarqube-quality`
- URL example: `http://jenkins:8080/sonarqube-webhook/`

---


## 6. Quality Gates Configuration

- Coverage < 80%
- Duplicated lines > 3%
- Maintainability/Reliability/Security Rating ≤ A

→ **Project Settings → Quality Gate → Select Custom Gate**


---


## 7. Integration Testing

1. Run Jenkins build (`ENABLE_SONAR=true`)
2. Check analysis results in Jenkins console log
3. Verify project status in SonarQube dashboard

---


## 8. Troubleshooting


### 8.1 Common Issues

- **Scanner not found**: Check Jenkins Global Tool configuration
- **Authentication failure**: Check if token has expired
- **Webhook timeout**: Verify SonarQube → Jenkins connectivity

### 8.2 Debugging


```bash
# Jenkins → SonarQube 연결 확인
curl -I http://sonarqube.127.0.0.1.nip.io

# SonarQube → Jenkins Webhook 테스트
curl -X POST http://jenkins:8080/sonarqube-webhook/ -d '{"test":"ok"}'
```


---


## 9. Best Practices

- Use strong passwords for administrator accounts
- Rotate tokens periodically
- Apply HTTPS
- Gradually strengthen Quality Gate conditions

---


## 10. Maintenance

- Regularly update SonarQube and plugins
- Monitor disk space and back up the database
- Periodically review Quality Profiles
- Configure monitoring and alerts

---


👉 The manual now has **section numbers that match the table of contents**, with **subheadings, code blocks, and lists** neatly organized.


If you'd like, I can also prepare this document in **PDF distribution format** or as a **company wiki Markdown** version. Which format do you need?


![image.png](/notion-blog/images/notion/2d6ea3deaa2b806aad74ebdcd6b1737d/image-10.png)