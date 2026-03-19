---
title: "Minikube Internet Blocking Manual (Using Calico GlobalNetworkPolicy)"
description: "To simulate an air-gapped (closed network) environment in Minikube, the following setup was configured: 1. Start Minikube (Calico CNI) 2. Install calicoctl (version matching) 3. Set environment variables 4. Create and apply GlobalNetworkPolicy 5. Testing 6. Policy management, and more..."
date: "2025-12-27T12:46:00.000Z"
notionId: "2d6ea3deaa2b801b9399d78a5fcc45a1"
koreanSlug: "미니쿠베-인터넷-차단-매뉴얼-calico-globalnetworkpolicy-사용"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "미니쿠베 인터넷 차단 매뉴얼 (Calico GlobalNetworkPolicy 사용)"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---

To simulate an air-gapped (closed network) environment in Minikube, the following setup was configured.


## 1. Start Minikube (Calico CNI)


```bash
# 기존 미니쿠베 삭제 (있다면)
minikube delete

# Calico CNI와 함께 시작
minikube start --driver=docker --cni=calico

# Calico 파드 확인
kubectl get pods -n kube-system | grep calico
# calico-node와 calico-kube-controllers가 Running 상태여야 함
```


## 2. Install calicoctl (Version Matching)


```bash
# 클러스터 버전 확인
kubectl get pods -n kube-system -l k8s-app=calico-kube-controllers -o yaml | grep image:
# 버전 확인 (예: v3.30.3)

# calicoctl 다운로드 (클러스터 버전과 맞춤)
curl -L https://github.com/projectcalico/calico/releases/download/v3.30.3/calicoctl-darwin-amd64 -o calicoctl
chmod +x calicoctl
sudo mv calicoctl /usr/local/bin/

# 버전 확인
calicoctl version
```


## 3. Set Environment Variables


```bash
# calicoctl이 Kubernetes를 사용하도록 설정
export DATASTORE_TYPE=kubernetes
export KUBECONFIG=~/.kube/config

# 영구 설정 (선택사항)
echo 'export DATASTORE_TYPE=kubernetes' >> ~/.zshrc
echo 'export KUBECONFIG=~/.kube/config' >> ~/.zshrc
source ~/.zshrc
```


## 4. Create and Apply GlobalNetworkPolicy


```bash
# 정책 파일 생성
cat <<EOF > global-deny-egress.yaml
apiVersion: projectcalico.org/v3
kind: GlobalNetworkPolicy
metadata:
  name: deny-all-external-egress
spec:
  order: 100
  selector: all()
  types:
  - Egress
  egress:
  # DNS 허용
  - action: Allow
    protocol: UDP
    destination:
      ports:
      - 53
  # 클러스터 내부 통신 허용
  - action: Allow
    destination:
      nets:
      - 10.0.0.0/8
      - 172.16.0.0/12
      - 192.168.0.0/16
  # Kubernetes API 서버
  - action: Allow
    protocol: TCP
    destination:
      ports:
      - 443
      - 6443
EOF

# 정책 적용
calicoctl apply -f global-deny-egress.yaml

# 확인
calicoctl get globalnetworkpolicy
```


## 5. Testing


```bash
# 테스트 파드 생성
kubectl run test --image=busybox --command -- sleep 3600
kubectl run test2 --image=nginx

# 파드 준비 대기
kubectl wait --for=condition=ready pod test --timeout=60s
kubectl wait --for=condition=ready pod test2 --timeout=60s

# 1. 외부 인터넷 차단 확인 (실패해야 정상)
kubectl exec test -- timeout 10 wget -O- http://google.com

# 2. DNS 작동 확인 (성공해야 함)
kubectl exec test -- nslookup kubernetes.default

# 3. 클러스터 내부 통신 확인 (성공해야 함)
TEST2_IP=$(kubectl get pod test2 -o jsonpath='{.status.podIP}')
kubectl exec test -- timeout 5 wget -O- http://$TEST2_IP
```


## 6. Policy Management


```bash
# 정책 목록 확인
calicoctl get globalnetworkpolicy

# 정책 상세 정보
calicoctl get globalnetworkpolicy deny-all-external-egress -o yaml

# 정책 삭제 (인터넷 다시 허용)
calicoctl delete globalnetworkpolicy deny-all-external-egress

# 정책 수정 후 재적용
calicoctl apply -f global-deny-egress.yaml
```


## Expected Results

- ✅ **External Internet**: `wget: download timed out` - Blocked
- ✅ **DNS Lookup**: IP address returned - Working normally
- ✅ **Internal Communication**: nginx HTML returned - Working normally
- ✅ **kubectl Commands**: All commands working normally

## Troubleshooting


### When Calico Pods Won't Reach Running State


```bash
kubectl get events -n kube-system --sort-by='.lastTimestamp'
```


### When Policy Is Not Being Applied


```bash
# Calico 로그 확인
kubectl logs -n kube-system -l k8s-app=calico-node --tail=50
```


### Version Mismatch Error


```bash
# calicoctl 버전을 클러스터 버전과 맞추거나
# --allow-version-mismatch 플래그 사용
calicoctl get globalnetworkpolicy --allow-version-mismatch
```