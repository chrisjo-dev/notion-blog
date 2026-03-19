---
title: "Rolling Update / Rollout / Rollback"
description: "#Infra #IaaS #kube #concept #rolling 1. Rolling Update A zero-downtime deployment strategy that replaces Pods sequentially with a new version. Example: replacing image version v1 → v2 --- 2. Rollout Commands for tracking and managing the deployment process and its history..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81cabea8fc8655a38f09"
koreanSlug: "롤링-업데이트-롤-아웃-롤-백"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "롤링 업데이트/ 롤 아웃 / 롤 백"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

#Infra #IaaS #kube #concept #rolling


## 1. Rolling Update


A zero-downtime deployment strategy that replaces Pods sequentially with a new version


**Example: replacing image version v1 → v2**


```bash
# Deployment의 컨테이너 이미지 변경 (v1 → v2)
kubectl set image deployment/my-app my-app-container=my-app:v2

# 교체가 진행되는 동안 상태 확인
kubectl rollout status deployment/my-app
```


---


## 2. Rollout


Commands for tracking and managing the deployment process and its history


**Key Commands**


```bash
# 현재 배포 상태 확인
kubectl rollout status deployment/my-app

# 이전 배포 이력 확인
kubectl rollout history deployment/my-app

# 특정 revision의 상세 정보 확인
kubectl rollout history deployment/my-app --revision=2
```


---


## 3. Rollback


How to revert to a previous version when something goes wrong


**Example: incident occurs after v2 deployment → restore to v1**


```bash
# 직전 revision으로 롤백
kubectl rollout undo deployment/my-app

# 특정 revision(예: 2번)으로 롤백
kubectl rollout undo deployment/my-app --to-revision=2
```


---


## 4. Flow at a Glance (Example Scenario)

1. **Trigger a deployment update (Rolling Update begins)**

```bash
kubectl set image deployment/my-app my-app-container=my-app:v2
```

1. **Check deployment status (Rollout check)**

```bash
kubectl rollout status deployment/my-app
```

1. **If an issue occurs → Execute Rollback**

```bash
kubectl rollout undo deployment/my-app
```


---


👉 In summary:

- `kubectl set image` = **Start Rolling Update**
- `kubectl rollout status/history` = **Track Rollout status**
- `kubectl rollout undo` = **Execute Rollback**