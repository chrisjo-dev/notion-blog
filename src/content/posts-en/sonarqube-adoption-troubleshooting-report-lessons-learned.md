---
title: "SonarQube Adoption: Troubleshooting Report & Lessons Learned"
description: "--- 1. Project Overview Environment - Kubernetes: minikube - SonarQube: Community Edition (Helm Chart) - Jenkins: Existing Jenkins server - Language: Python (Flask application) - CI/..."
date: "2025-12-27T12:40:00.000Z"
notionId: "2d6ea3deaa2b80739237c1e45ac7ba9c"
koreanSlug: "sonarqube-도입-시행착오-및-문제점-보고서"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "SonarQube 도입 시행착오 및 문제점 보고서"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---



## 1. Project Overview


### Environment

- **Kubernetes**: minikube
- **SonarQube**: Community Edition (Helm Chart)
- **Jenkins**: Existing Jenkins server
- **Language**: Python (Flask application)
- **CI/CD**: Jenkins Pipeline

### Goals

- Install and configure SonarQube server
- Integrate with Jenkins pipeline automatically
- Implement code quality gates via Quality Gate
- Integrate code quality checks into the development workflow

---


## 2. Key Issues Encountered


| Category | Issue | Severity | Resolution Time | Status |
| -------- | ----- | -------- | --------------- | ------ |
| Installation | Insufficient understanding of Helm values file structure | Medium | 2 hours | ✅ Resolved |
| Integration | Jenkins-SonarQube authentication failure | High | 4 hours | ✅ Resolved |
| Network | Webhook connection failure | High | 3 hours | ✅ Resolved |
| Performance | Analysis failure due to insufficient memory | Medium | 1 hour | ✅ Resolved |
| Configuration | Confusion between Quality Profile and Quality Gate | Low | 1 hour | ✅ Resolved |
| Documentation | Installation method change (Docker Compose → Helm) | Medium | 2 hours | ✅ Resolved |


---


## 3. Installation Issues


### ⚠️ Issue 1: Insufficient Understanding of Helm Values File Structure

- **Problem:** Using default values caused Ingress configuration errors
- **Cause:** No Ingress Controller specified + minikube-specific settings not applied
- **Resolution:** Created a custom values.yaml and specified ingressClassName

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


**💡 Lesson:** Always review the values.yaml structure before installation


---


### ⚠️ Issue 2: Persistent Storage Configuration Confusion

- **Problem:** Disabling persistence caused data loss on restart
- **Resolution:** Enable persistence in production environments + specify StorageClass

```yaml
persistence:
  enabled: true
  storageClass: "standard"
  size: 10Gi
```


---


## 4. Jenkins Integration Issues


### ⚠️ Issue 3: SonarQube Token Authentication Failure

- **Problem:** HTTP 401 Unauthorized error from Jenkins
- **Cause:** Wrong token type, expired token, or whitespace included in token
- **Resolution:** Generate a User Token in SonarQube → Register as Jenkins Credentials (secret text)

---


### ⚠️ Issue 4: SonarQube Scanner Tool Configuration Problem

- **Problem:** Jenkins could not find the scanner executable
- **Resolution:** Register `sonar-scanner` in Jenkins Global Tool Configuration → Match reference in Jenkinsfile

```groovy
def scannerHome = tool 'sonar-scanner'
```


---


## 5. Webhook Configuration Issues


### ⚠️ Issue 5: Quality Gate Webhook Connection Failure

- **Problem:** Jenkins timed out waiting for a Quality Gate response
- **Cause:** minikube network limitations prevented Pod-to-Host access
- **Resolution:** Use `host.minikube.internal`

```plain text
Webhook URL: http://host.minikube.internal:8080/sonarqube-webhook/
```


---


### ⚠️ Issue 6: Webhook Endpoint Path Confusion

- **Problem:** Confusion between `/sonar-webhook/` and `/sonarqube-webhook/`
- **Resolution:** Use the plugin's standard path `/sonarqube-webhook/`

---


## 6. Performance & Resource Issues


### ⚠️ Issue 7: Insufficient Memory

- **Problem:** `OutOfMemoryError` error occurred during analysis
- **Resolution:** Increase JVM heap size and Pod resource limits

```yaml
resources:
  limits:
    memory: 2048M
jvmOpts: "-Xmx1536m -Xms512m"
```


---


### ⚠️ Issue 8: Insufficient CPU

- **Problem:** Analysis took significantly longer (10 min → 25 min)
- **Resolution:** Increase CPU limit + adjust Jenkins timeout settings

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


## 7. Quality Gate Configuration Issues


### ⚠️ Issue 9: Confusion Between Quality Profile and Quality Gate Concepts

- **Misconception:** Profile = quality standards, Gate = rules
- **Correct understanding:** Profile = analysis rules, Gate = quality standards

---


### ⚠️ Issue 10: Overly Strict Quality Gate Conditions

- **Problem:** Default gate was too strict, causing all builds to fail
- **Resolution:** Phased adoption strategy + exclude legacy code

```plain text
sonar.exclusions=**/legacy/**,**/old_modules/**
```


---


## 8. Root Cause Analysis

1. Insufficient documentation (Compose → Helm migration not reflected)
2. Environmental differences not considered (local vs. minikube)
3. Lack of tool understanding (Webhook and Scanner behavior)
4. Insufficient testing (network and resource validation skipped)

---


## 9. Lessons Learned & Improvements


### Key Takeaways

- **Environment analysis and dependency verification** are mandatory before installation
- **Step-by-step network and resource validation** is necessary
- **Gradual adoption of Quality Gates** is critical
- **Documentation and team training** should come first

---


## 10. Recommendations


### Pre-Installation Checklist

- [ ] Review Helm values.yaml
- [ ] Confirm Ingress Controller and StorageClass
- [ ] Test Jenkins-SonarQube authentication

### 🔧 Recommended Production Settings


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


## Conclusion

- Successfully built a stable environment by resolving **network, authentication, and resource issues** encountered during SonarQube adoption
- Achieved full integration with Jenkins to establish an **automated code quality inspection workflow**
- Can serve as a **systematic installation and operations guide** for similar projects in the future

**Key Takeaways**:

1. Thorough preparation in advance
2. Step-by-step validation and gradual adoption
3. Continuous documentation and knowledge sharing
