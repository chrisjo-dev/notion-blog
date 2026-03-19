---
title: "Minikube Harbor Image Pull Troubleshooting Manual (macOS Environment)"
description: "> Purpose: A focused guide for resolving issues where kubelet fails to pull images from Harbor in a Minikube environment. Rather than explaining complex network architecture, this guide covers only the problem scenarios and their solutions. --- 1. Symptoms - Pods can successfully resolve service names like __INLINE_CODE_8__ via CoreDNS and communicate normally. - However, **kubelet (containerd/docker)** fails when attempting to pull images from the Harbor registry: - __INLINE_CODE_9__ - __INLINE_CODE_10__ - __INLINE_CODE_11__ - __INLINE_CODE_12__"
date: "2025-12-27T12:44:00.000Z"
notionId: "2d6ea3deaa2b80f2b548c2b53e7f60fa"
koreanSlug: "minikube-harbor-이미지-pull-트러블슈팅-매뉴얼-macos-환경"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "Minikube Harbor 이미지 Pull 트러블슈팅 매뉴얼 (macOS 환경)"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---

> Purpose: A focused guide for resolving issues where kubelet fails to pull images from Harbor in a Minikube environment. Rather than explaining complex network architecture, this guide covers only the problem scenarios and their solutions.

---


## 1. Symptoms

- Pods can successfully resolve service names like `harbor-core.harbor.svc.cluster.local` via CoreDNS and communicate normally.
- However, **kubelet (containerd/docker)** fails when attempting to pull images from the Harbor registry:
    - `x509: certificate signed by unknown authority`
    - `no such host`
    - `connection refused`
    - `Temporary failure in name resolution`

### Root Cause

- **The entity performing the image pull is kubelet/the runtime (= the Minikube VM)** → outside the scope of CoreDNS.
- Therefore, the pull will only succeed if **the Harbor FQDN is resolvable from the Minikube VM's perspective** and **TLS is trusted**.

---


## 2. Common Failure Types and Solutions


### (1) `no such host` / `Temporary failure in name resolution`


**Cause**: The kubelet runtime cannot resolve the FQDN.


**Solution**:


```bash
# Minikube VM /etc/hosts 에 LB IP 또는 NodePort IP 매핑
minikube ssh -- "echo '<LB_IP> harbor.local.test' | sudo tee -a /etc/hosts"
```

- The LB IP is assigned via `minikube tunnel`, or alternatively as a `minikube ip` + NodePort combination.
- When using nip.io, avoid `harbor.127.0.0.1.nip.io` (it always short-circuits to 127.0.0.1).

---


### (2) `x509: certificate signed by unknown authority`


**Cause**: The kubelet runtime (containerd/docker) does not trust the Harbor TLS certificate.


**Solution**:


```bash
# VM에 사설 CA 설치
minikube scp ./rootCA.crt minikube:/home/docker/rootCA.crt
minikube ssh -- "sudo mkdir -p /usr/local/share/ca-certificates && sudo mv /home/docker/rootCA.crt /usr/local/share/ca-certificates/harbor-rootCA.crt && (sudo update-ca-certificates || sudo update-ca-trust) && (sudo systemctl restart containerd || sudo systemctl restart docker)"
```

- The FQDN you are accessing must be included in the certificate's SAN (Subject Alternative Name).

---


### (3) `denied: requested access to the resource is denied`


**Cause**: Insufficient Harbor project access permissions or missing ImagePullSecret.


**Solution**:


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


**Cause**: Wrong port (NodePort/LB IP not used), `minikube tunnel` not executed, or firewall blocking.


**Solution**:


```bash
kubectl -n harbor get svc,ingress -o wide
minikube tunnel   # Ingress LB 사용 시 필수
```


---


## 3. Jenkins Build Container Issue (`-add-host`)

- The Jenkins build container internally uses only its own `/etc/hosts`.
- When using nip.io, it may incorrectly resolve to `127.0.0.1`.

**Solution (Pipeline Example)**:


```groovy
sh """
  docker build \
    --add-host harbor.local.test:<LB_IP> \
    --add-host nexus.local.test:<LB_IP> \
    -t myimage:latest .
"""
```

- `<LB_IP>` is the IP assigned by `minikube tunnel`.

---


## 4. Diagnostic Commands


```bash
# Minikube VM에서 이름 해석
minikube ssh -- "getent hosts harbor.local.test"

# Minikube 런타임에서 직접 Pull
minikube ssh -- "ctr -n k8s.io images pull harbor.local.test/library/alpine:3"

# TLS 확인
minikube ssh -- "echo | openssl s_client -connect harbor.local.test:443 -servername harbor.local.test"
```


---


## 5. Temporary Workaround (Jenkins Pipeline `-add-host`)


Before fundamentally resolving the network/CA configuration, you can apply a temporary fix in the Jenkins build pipeline by using the `--add-host` option to **correct `/etc/hosts` inside the build container**.


### 5.1 How It Works

- At `docker build` time, pass `-add-host FQDN:IP` so that the build container resolves Harbor/Nexus FQDNs to the correct IP (LB IP or Minikube IP).
- When using nip.io, `harbor.127.0.0.1.nip.io` always short-circuits to loopback, so you must force a mapping like `-add-host harbor.local.test:<LB_IP>` to route traffic through the Ingress.

### 5.2 Jenkins Script Example


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


### 5.3 Limitations

- Only effective inside the Jenkins build container → pull issues at the kubelet runtime level must still be resolved on the Minikube VM side.
- If the IP changes, the pipeline must be updated accordingly.

---


## 6. Summary Checklist


## 6. Recommended Approach (Best Practice)

> Beyond quick troubleshooting — how to build a stable environment for the long term.

### 6.1 Ingress + Fixed FQDN + Single TLS Secret

- Expose Harbor via **Ingress** and use a fixed domain (`harbor.lab.local`).
- Avoid nip.io; always use a certificate that includes the relevant FQDN in its SAN.
- Assign a **single TLS secret** (wildcard or bundled SANs) to the Ingress Controller.

### 6.2 Standardize DNS / Name Resolution

- Configure macOS, the Minikube VM, and Jenkins build containers to all resolve the same FQDN.
- For personal environments: pin `<LB_IP> harbor.lab.local` to a fixed entry in `/etc/hosts`.
- For team environments: register in a private DNS server (dnsmasq, internal DNS).

### 6.3 Distribute Private CA Trust

- Install the Root CA on the Minikube VM so that containerd/docker trusts the Harbor certificate.
- Inject the CA into Jenkins build containers as needed (via base image or pipeline injection).

### 6.4 Consolidate ImagePullSecret

- Create a `docker-registry` Secret using a Harbor user/Robot Token.
- Attach it to the default ServiceAccount in each namespace so it applies automatically to all Pods.

### 6.5 Testing and Validation


```bash
# Minikube VM 런타임 관점에서 Pull
minikube ssh -- "ctr -n k8s.io images pull harbor.lab.local/library/alpine:3"

# Pod 관점에서 Pull
kubectl run test --image=harbor.lab.local/library/alpine:3 --rm -it --restart=Never
```


---


### Conclusion


Troubleshooting measures like modifying hosts files or using add-host flags are temporary fixes.


The **proper solution** is to ensure all parties — kubelet, build containers, and local machines — reach Harbor through a consistent path by adopting **Ingress + fixed FQDN + single TLS + centralized DNS/CA management**.