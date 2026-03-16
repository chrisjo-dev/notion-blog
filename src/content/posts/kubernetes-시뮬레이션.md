---
title: "kubernetes 시뮬레이션"
description: "#IaaS #Onboarding #개념 1. HPA (Horizontal Pod Autoscaler) 문제 동료: “왜 우리 서비스는 CPU가 꽉 차는데도 Pod이 자동으로 늘어나지 않지?” Chris: “HPA는 Metrics Server에 의존해서 CPU/메모리 사..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b8138b713d54585f055b3"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "kubernetes 시뮬레이션"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---


#IaaS #Onboarding #개념


## 1. HPA (Horizontal Pod Autoscaler) 문제


**동료:**


“왜 우리 서비스는 CPU가 꽉 차는데도 Pod이 자동으로 늘어나지 않지?”


**Chris:**


“HPA는 Metrics Server에 의존해서 CPU/메모리 사용량을 가져와. Metrics Server가 설치 안 됐거나 RBAC 권한이 부족하면 값이 0으로 나오고, HPA가 동작하지 않아. 또, Deployment에 Resource Requests가 없으면 HPA가 기준치를 계산하지 못해. 따라서 Metrics Server 정상 동작 확인 + Requests 설정 확인이 필요해.”


---


## 2. Ingress 설정 충돌


**면접관:**


“하나의 Ingress Controller에서 여러 Ingress 리소스를 쓸 때 충돌이 발생한다면 어떻게 해결할까요?”


**Chris:**

- 우선 `kubectl describe ingress`로 어떤 규칙이 우선 적용되는지 확인합니다.
- Ingress Controller(NGINX 등)는 경로 기반/호스트 기반 라우팅 규칙을 따르는데, 우선순위 충돌이 생길 수 있어요.
- 해결책은 **명확한 Host 기반 규칙 분리**, **Annotation으로 우선순위 설정**, 필요하다면 IngressClass로 별도 컨트롤러를 분리하는 겁니다.

---


## 3. RBAC 이슈


**동료:**


“CI/CD 파이프라인에서 배포가 실패하는데 에러 로그에 `Forbidden: user does not have access` 라고 나와.”


**Chris:**


“이건 ServiceAccount 권한 문제야. 파이프라인이 실행하는 SA가 Deployment 수정 권한이 없을 때 발생해. `kubectl get clusterrolebinding`으로 권한 확인하고, 필요한 경우 Role/ClusterRole을 생성해서 `kubectl create rolebinding`으로 SA에 연결해야 해.”


---


## 4. PersistentVolume 충돌


**면접관:**


“PVC가 Pending 상태에서 바인딩이 안 됩니다. 원인을 어떻게 확인하실 건가요?”


**Chris:**

- 먼저 PVC가 요청하는 StorageClass와 PV의 StorageClass가 일치하는지 확인합니다.
- 요청한 용량이 PV의 Available 용량보다 크면 매칭이 안 돼요.
- AccessMode(RWO/ROX/RWX)가 안 맞아도 문제 발생합니다.
- 실제 클라우드 환경이라면 CSI 드라이버 로그를 확인해서 프로비저닝이 제대로 이뤄졌는지 점검합니다.

---


## 5. Node 자원 부족 문제


**동료:**


“Pod이 Pending 상태로 스케줄링이 안 되는데, 이벤트를 보니까 `Insufficient CPU`라고 떠.”


**Chris:**


“이건 클러스터 Autoscaler나 노드 증설이 필요해. 일단 `kubectl describe pod`로 스케줄링 실패 사유를 확인하고, `kubectl top nodes`로 노드 자원 현황을 확인해야 해. 요청한 리소스가 큰 경우 Pod 스펙을 조정하거나, Taints/Tolerations 때문에 특정 노드에만 배치되도록 돼 있는지도 확인해봐야 해.”


---


## 6. 서비스 디스커버리 장애


**면접관:**


“Pod에서 DNS 이름으로 다른 Service를 호출했는데 연결이 안 됩니다. 어떻게 트러블슈팅하시겠습니까?”


**Chris:**

1. CoreDNS Pod이 정상 동작 중인지 확인 (`kubectl get pods -n kube-system`).
2. `/etc/resolv.conf` 안에서 nameserver가 CoreDNS ClusterIP를 가리키는지 확인.
3. NetworkPolicy가 통신을 막고 있지 않은지 확인.
4. 마지막으로, 해당 Service가 Headless인지 일반 ClusterIP인지에 따라 DNS 레코드가 달라지니 적절히 맞춰야 함.
