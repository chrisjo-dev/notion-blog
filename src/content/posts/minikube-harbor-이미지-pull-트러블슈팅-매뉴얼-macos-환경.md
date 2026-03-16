---
title: "Minikube Harbor 이미지 Pull 트러블슈팅 매뉴얼 (macOS 환경)"
description: "> 목적: Minikube 환경에서 kubelet이 Harbor에서 이미지를 Pull하지 못하는 문제를 해결하기 위한 핵심 가이드. 복잡한 네트워크 아키텍처 설명 대신, 문제 상황과 해법만을 다룸. --- 1. 문제 증상 - Pod는 정상적으로 CoreDNS를 통해..."
date: "2025-12-27T12:44:00.000Z"
notionId: "2d6ea3deaa2b80f2b548c2b53e7f60fa"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "Minikube Harbor 이미지 Pull 트러블슈팅 매뉴얼 (macOS 환경)"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---

> 목적: Minikube 환경에서 kubelet이 Harbor에서 이미지를 Pull하지 못하는 문제를 해결하기 위한 핵심 가이드. 복잡한 네트워크 아키텍처 설명 대신, 문제 상황과 해법만을 다룸.

---


## 1. 문제 증상

- Pod는 정상적으로 CoreDNS를 통해 `harbor-core.harbor.svc.cluster.local` 등의 서비스 이름을 해석하고 통신 가능.
- 그러나 **kubelet(containerd/docker)** 이 Harbor 레지스트리에서 이미지를 Pull하려 할 때 실패:
    - `x509: certificate signed by unknown authority`
    - `no such host`
    - `connection refused`
    - `Temporary failure in name resolution`

### 원인 핵심

- **이미지 Pull 주체는 kubelet/런타임(=Minikube VM)** → CoreDNS 범위가 아님.
- 따라서 **Minikube VM 관점에서 Harbor FQDN을 해석 가능**하고 **TLS 신뢰**해야 Pull 성공.

---


## 2. 주요 실패 유형과 해결책


### (1) `no such host` / `Temporary failure in name resolution`


**원인**: kubelet 런타임이 FQDN을 해석 못함.


**해결**:


```bash
# Minikube VM /etc/hosts 에 LB IP 또는 NodePort IP 매핑
minikube ssh -- "echo '<LB_IP> harbor.local.test' | sudo tee -a /etc/hosts"
```

- LB IP는 `minikube tunnel`로 할당되거나 `minikube ip` + NodePort 조합.
- nip.io 사용 시 `harbor.127.0.0.1.nip.io`는 피해야 함 (항상 127.0.0.1로 단락).

---


### (2) `x509: certificate signed by unknown authority`


**원인**: Harbor TLS 인증서를 kubelet 런타임(containerd/docker)이 신뢰하지 않음.


**해결**:


```bash
# VM에 사설 CA 설치
minikube scp ./rootCA.crt minikube:/home/docker/rootCA.crt
minikube ssh -- "sudo mkdir -p /usr/local/share/ca-certificates && sudo mv /home/docker/rootCA.crt /usr/local/share/ca-certificates/harbor-rootCA.crt && (sudo update-ca-certificates || sudo update-ca-trust) && (sudo systemctl restart containerd || sudo systemctl restart docker)"
```

- 인증서 SAN에 접근하려는 FQDN이 반드시 포함되어 있어야 함.

---


### (3) `denied: requested access to the resource is denied`


**원인**: Harbor 프로젝트 접근 권한 또는 ImagePullSecret 누락.


**해결**:


```bash
kubectl -n <NAMESPACE> create secret docker-registry harbor-creds \
  --docker-server=harbor.local.test \
  --docker-username=<USER> \
  --docker-password=<PASS> \
  --docker-email=<EMAIL>

kubectl -n <NAMESPACE> patch serviceaccount default \
  -p '{"imagePullSecrets": [{"name": "harbor-creds"}]}'
```


---


### (4) `connection refused` / `timeout`


**원인**: 잘못된 포트(NodePort/LB IP 미사용), `minikube tunnel` 미실행, 방화벽 차단.


**해결**:


```bash
kubectl -n harbor get svc,ingress -o wide
minikube tunnel   # Ingress LB 사용 시 필수
```


---


## 3. Jenkins 빌드 컨테이너 이슈 (`-add-host`)

- Jenkins 빌드 컨테이너 내부는 자체 `/etc/hosts`만 사용.
- nip.io를 쓰면 `127.0.0.1`로 잘못 해석되는 경우가 발생.

**해결 (파이프라인 예시)**:


```groovy
sh """
  docker build \
    --add-host harbor.local.test:<LB_IP> \
    --add-host nexus.local.test:<LB_IP> \
    -t myimage:latest .
"""
```

- `<LB_IP>`는 `minikube tunnel`이 할당한 IP.

---


## 4. 진단 커맨드


```bash
# Minikube VM에서 이름 해석
minikube ssh -- "getent hosts harbor.local.test"

# Minikube 런타임에서 직접 Pull
minikube ssh -- "ctr -n k8s.io images pull harbor.local.test/library/alpine:3"

# TLS 확인
minikube ssh -- "echo | openssl s_client -connect harbor.local.test:443 -servername harbor.local.test"
```


---


## 5. 임시 해결 방법 (Jenkins 파이프라인 `-add-host`)


네트워크/CA 설정을 근본적으로 해결하기 전, Jenkins 빌드 파이프라인에서 `--add-host` 옵션을 사용해 **빌드 컨테이너 내부 /etc/hosts를 보정**하는 방식으로 임시 대응할 수 있다.


### 5.1 동작 원리

- `docker build` 시점에 `-add-host FQDN:IP`를 주어, 빌드 컨테이너 내부에서 Harbor/Nexus FQDN을 올바른 IP(LB IP 또는 Minikube IP)로 해석하게 만든다.
- nip.io를 사용할 경우 `harbor.127.0.0.1.nip.io`는 항상 루프백으로 단락되므로, `-add-host harbor.local.test:<LB_IP>` 식으로 강제 매핑해야 Ingress로 도달할 수 있다.

### 5.2 Jenkins 스크립트 예시


```groovy
// Host IP 탐색 로직 (minikube ip, default gw 등)
def hostIP = sh(
  script: '''
    minikube ip 2>/dev/null || ip route | awk '/default/ {print $3; exit}' || echo 172.17.0.1
  ''',
  returnStdout: true
).trim()

echo "Host IP: ${hostIP}"

sh """
  docker build \
    --build-arg NEXUS_URL=${env.NEXUS_URL} \
    --build-arg NEXUS_PYPI_URL=${env.NEXUS_PYPI_URL} \
    --add-host harbor.local.test:${hostIP} \
    --add-host nexus.local.test:${hostIP} \
    -t ${env.LOCAL_IMAGE} .
"""
```


### 5.3 한계

- Jenkins 빌드 컨테이너에서만 효과 있음 → kubelet 런타임의 Pull 문제는 여전히 Minikube VM 측에서 해결해야 함.
- IP 변경 시 파이프라인도 다시 수정 필요.

---


## 6. 요약 체크리스트


## 6. 올바른 해결 방법 (Best Practice)

> 단순 트러블슈팅을 넘어 장기적으로 안정적인 환경을 구축하는 방법.

### 6.1 Ingress + 고정 FQDN + 단일 TLS 시크릿

- Harbor를 **Ingress**로 노출하고, 고정 도메인(`harbor.lab.local`)을 사용.
- nip.io는 피하고, 반드시 SAN에 해당 FQDN 포함된 인증서 사용.
- Ingress Controller에 **단일 TLS 시크릿**(와일드카드 또는 SAN 묶음)을 지정.

### 6.2 DNS/이름해결 표준화

- macOS, Minikube VM, Jenkins 빌드 컨테이너 모두 같은 FQDN을 바라보도록 구성.
- 개인 환경: `/etc/hosts`에 `<LB_IP> harbor.lab.local` 고정.
- 팀 환경: 사설 DNS(dnsmasq, 내부 DNS)에 등록.

### 6.3 사설 CA 신뢰 배포

- Root CA를 Minikube VM에 설치해 containerd/docker가 Harbor 인증서를 신뢰.
- Jenkins 빌드 컨테이너에도 필요시 CA를 포함(base image 또는 파이프라인 주입).

### 6.4 ImagePullSecret 통합

- Harbor 사용자/Robot Token을 `docker-registry` Secret으로 생성.
- 네임스페이스 기본 ServiceAccount에 붙여 모든 Pod에 자동 적용.

### 6.5 테스트 및 검증


```bash
# Minikube VM 런타임 관점에서 Pull
minikube ssh -- "ctr -n k8s.io images pull harbor.lab.local/library/alpine:3"

# Pod 관점에서 Pull
kubectl run test --image=harbor.lab.local/library/alpine:3 --rm -it --restart=Never
```


---


### 결론


트러블슈팅은 임시 처방(호스트 수정, add-host 등)이지만,


**올바른 해결**은 "Ingress + 고정 FQDN + 단일 TLS + 중앙 DNS/CA 관리"로 모든 주체가 일관된 경로로 Harbor를 바라보게 만드는 것이다.

