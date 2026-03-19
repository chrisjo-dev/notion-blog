---
title: "LoadBalancer + HAProxy Ingress Setup"
description: "#minikube #tunneling 1. Install HAProxy Ingress > This chart sets the default IngressClass name to haproxy, so you need to use ingressClassName: haproxy in your Ingress resource for it to match. HAProxy Tech..."
date: "2025-12-27T12:32:00.000Z"
notionId: "2d6ea3deaa2b806482ced087bc181f33"
koreanSlug: "loadbalancer"
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

1. Install HAProxy Ingress

```bash
kubectl create ns haproxy-controller

helm repo add haproxytech https://haproxytech.github.io/helm-charts
helm repo update

helm install haproxy-kubernetes-ingress haproxytech/kubernetes-ingress \
  -n haproxy-controller \
  --set controller.service.type=LoadBalancer
```

> This chart sets the default IngressClass name to `haproxy`, so you need to specify `ingressClassName: haproxy` in your Ingress resource for it to match. HAProxy Technologies

1. Assign External IP to LoadBalancer

    In another terminal:


```bash
minikube tunnel
```

1. Update IngressClass in Gitea Chart (values)

    From the values you provided, just change `className: traefik` to `haproxy`:


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


Apply:


```bash
helm upgrade --install gitea gitea-charts/gitea -n devops -f values-gitea.yaml
```

1. Verify & Access

```bash
kubectl get ingress -A
kubectl get svc -n haproxy-controller haproxy-kubernetes-ingress
curl -H 'Host: gitea.127.0.0.1.nip.io' http://127.0.0.1/
```