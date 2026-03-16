---
title: "kubernetes 기본 개념"
description: "#IaaS #Onboarding #개념 1. 기본 개념 - 쿠버네티스(Kubernetes, K8s)     컨테이너 오케스트레이션 도구. 컨테이너 배포, 스케일링, 네트워킹, 자원 관리 자동화. - 클러스터(Cluster)     쿠버네티스가 동작하는 전체 시스템...."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81f9afecdee4642fccf4"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "kubernetes 기본 개념"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---


#IaaS #Onboarding #개념


## 1. 기본 개념

- **쿠버네티스(Kubernetes, K8s)**

    컨테이너 오케스트레이션 도구. 컨테이너 배포, 스케일링, 네트워킹, 자원 관리 자동화.

- **클러스터(Cluster)**

    쿠버네티스가 동작하는 전체 시스템.

    - **마스터 노드(Control Plane)**: 클러스터 관리 담당 (API 서버, 스케줄러, 컨트롤러 매니저, etcd).
    - **워커 노드(Node)**: 실제 컨테이너(Pod) 실행.

---


## 2. 리소스 단위

- **Pod**

    컨테이너 실행의 최소 단위. 하나 이상의 컨테이너와 스토리지, 네트워크를 묶음.

- **ReplicaSet**

    Pod 개수를 유지하는 리소스. (n개 복제본 보장)

- **Deployment**

    Pod + ReplicaSet을 선언적 방식으로 관리. 롤링 업데이트/롤백 지원.

- **StatefulSet**

    상태 유지가 필요한 워크로드 (DB 등). 고유 ID와 영속 스토리지 보장.

- **DaemonSet**

    모든 노드에 하나씩 Pod을 실행하는 리소스 (예: 로그 수집기, 모니터링 에이전트).

- **Job / CronJob**
    - Job: 일회성 작업 수행.
    - CronJob: 스케줄 기반 반복 작업 수행.

---


## 3. 네트워킹

- **Service**

    Pod에 고정된 IP/도메인을 제공하는 추상화 계층.

    - ClusterIP (내부 통신 전용),
    - NodePort (노드의 포트 개방),
    - LoadBalancer (외부 로드밸런서 연동),
    - Headless Service (고정 DNS 레코드 제공).
- **Ingress**

    외부에서 HTTP/HTTPS 요청을 클러스터 내부 서비스로 라우팅. (Ingress Controller 필요)

- **CNI (Container Network Interface)**

    Pod 네트워킹 플러그인 (Calico, Flannel, Cilium 등).


---


## 4. 스토리지

- **Volume**

    Pod 안에서 컨테이너 간 공유 가능 스토리지.

- **PersistentVolume(PV)**

    클러스터 레벨에서 관리되는 스토리지.

- **PersistentVolumeClaim(PVC)**

    Pod에서 요청하는 스토리지.

- **StorageClass**

    동적 프로비저닝을 위한 스토리지 정책 (예: AWS EBS, Ceph RBD).


---


## 5. 설정 및 보안

- **ConfigMap**

    환경 설정(비민감 데이터) 저장 및 주입.

- **Secret**

    비밀번호, 인증서 등 민감 데이터 저장. base64 인코딩 방식.

- **Namespace**

    리소스를 논리적으로 격리.

- **RBAC(Role-Based Access Control)**

    사용자/서비스 계정 권한 제어.


---


## 6. 스케줄링 & 관리

- **Scheduler**

    Pod을 적절한 노드에 배치. 자원 사용량, taint/toleration, affinity 고려.

- **Affinity / Anti-Affinity**

    Pod 배치 정책 (특정 노드/Pod와 함께 or 떨어져서 실행).

- **Taints & Tolerations**

    특정 노드에만 Pod이 스케줄링되도록 제한.

- **Resource Requests & Limits**

    CPU/메모리 자원 예약 및 상한 지정.

- **Horizontal Pod Autoscaler (HPA)**

    CPU, 메모리 사용량에 따라 Pod 개수 자동 조절.

- **Vertical Pod Autoscaler (VPA)**

    Pod 자원 크기(CPU/메모리) 자동 조절.

- **Cluster Autoscaler**

    클러스터 노드 수를 자동 확장/축소.


---


## 7. 로깅 & 모니터링

- **kubectl logs** / **kubectl exec**

    Pod 로그 및 디버깅.

- **Prometheus / Grafana**

    메트릭 수집 및 모니터링.

- **ELK / EFK Stack**

    Elasticsearch + (Fluentd/Fluentbit) + Kibana 로깅.


---


## 8. 고급 개념

- **Operator**

    특정 애플리케이션을 쿠버네티스 방식으로 자동 운영할 수 있도록 만든 컨트롤러.

- **CSI(Container Storage Interface)**

    스토리지 표준 인터페이스. (AWS EBS CSI, Ceph CSI, PowerStore CSI 등)

- **CRD(Custom Resource Definition)**

    사용자가 쿠버네티스 리소스 타입을 확장 가능.

- **Service Mesh (Istio, Linkerd)**

    마이크로서비스 간 통신, 트래픽 관리, 보안, 모니터링 제공.

