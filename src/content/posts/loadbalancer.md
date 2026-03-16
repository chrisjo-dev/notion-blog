---
title: "LoadBalancer + "
description: "#minikube #tunneling 1. HAProxy Ingress 설치 > 이 차트는 기본 IngressClass 이름이 haproxy로 설정되어 있어서, Ingress 리소스에 ingressClassName: haproxy를 써야 매칭돼. HAProxy Tech..."
date: "2025-12-27T12:32:00.000Z"
notionId: "2d6ea3deaa2b806482ced087bc181f33"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "LoadBalancer + "
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---


#minikube #tunneling

1. HAProxy Ingress 설치

```bash
kubectl create ns haproxy-controller

helm repo add haproxytech https://haproxytech.github.io/helm-charts
helm repo update

helm install haproxy-kubernetes-ingress haproxytech/kubernetes-ingress \
  -n haproxy-controller \
  --set controller.service.type=LoadBalancer
```

> 이 차트는 기본 IngressClass 이름이 haproxy로 설정되어 있어서, Ingress 리소스에 ingressClassName: haproxy를 써야 매칭돼. HAProxy Technologies
1. LoadBalancer 외부 IP 할당

    다른 터미널에서:


```bash
minikube tunnel
```

1. Gitea 차트(values)에 IngressClass 맞추기

    네가 준 values에 `className: traefik`만 `haproxy`로 바꾸면 됨:


```yaml
ingress:
  enabled: true
  className: haproxy
  annotations:
    # (필수 아님) HTTP만 쓸 거면 생략 가능
  hosts:
    - host: gitea.127.0.0.1.nip.io
      paths:
        - path: /
          pathType: Prefix
```


적용:


```bash
helm upgrade --install gitea gitea-charts/gitea -n devops -f values-gitea.yaml
```

1. 확인 & 접속

```bash
kubectl get ingress -A
kubectl get svc -n haproxy-controller haproxy-kubernetes-ingress
curl -H 'Host: gitea.127.0.0.1.nip.io' http://127.0.0.1/
```

