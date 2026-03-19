---
title: "Kubernetes Simulation"
description: "#IaaS #Onboarding #Concepts 1. HPA (Horizontal Pod Autoscaler) Issue Colleague: \"Why doesn't our service automatically scale up Pods even when CPU is maxed out?\" Chris: \"HPA relies on the Metrics Server to pull CPU/memory usage. If the Metrics Server isn't installed or lacks RBAC permissions, the values come back as 0 and HPA won't trigger. Also, if there are no Resource Requests set on the Deployment, HPA can't calculate a baseline threshold. So you need to verify the Metrics Server is working properly and check that Requests are configured.\""
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b8138b713d54585f055b3"
koreanSlug: "kubernetes-시뮬레이션"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "kubernetes 시뮬레이션"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

#IaaS #Onboarding #Concepts


## 1. HPA (Horizontal Pod Autoscaler) Issue


**Colleague:**


"Why doesn't our service automatically scale up Pods even when CPU is maxed out?"


**Chris:**


"HPA relies on the Metrics Server to pull CPU/memory usage. If the Metrics Server isn't installed or lacks RBAC permissions, the values come back as 0 and HPA won't trigger. Also, if there are no Resource Requests set on the Deployment, HPA can't calculate a baseline threshold. So you need to verify the Metrics Server is working properly and check that Requests are configured."


---


## 2. Ingress Configuration Conflict


**Interviewer:**


"If you're using multiple Ingress resources under a single Ingress Controller and a conflict occurs, how would you resolve it?"


**Chris:**

- First, check with `kubectl describe ingress` to see which rules are being applied with priority.
- Ingress Controllers (like NGINX) follow path-based/host-based routing rules, and priority conflicts can arise.
- The solutions are **clearly separating rules by Host**, **setting priority via Annotations**, and if necessary, isolating controllers using IngressClass.

---


## 3. RBAC Issue


**Colleague:**


"Deployments are failing in the CI/CD pipeline, and the error log says `Forbidden: user does not have access`."


**Chris:**


"That's a ServiceAccount permissions issue. It happens when the SA running the pipeline doesn't have permission to modify Deployments. Check the permissions with `kubectl get clusterrolebinding`, and if needed, create a Role/ClusterRole and bind it to the SA using `kubectl create rolebinding`."


---


## 4. PersistentVolume Conflict


**Interviewer:**


"A PVC is stuck in Pending state and won't bind. How would you go about identifying the cause?"


**Chris:**

- First, verify that the StorageClass requested by the PVC matches the StorageClass of the PV.
- If the requested capacity is larger than the PV's available capacity, they won't match.
- A mismatch in AccessMode (RWO/ROX/RWX) can also cause issues.
- In an actual cloud environment, check the CSI driver logs to verify that provisioning completed successfully.

---


## 5. Node Resource Shortage


**Colleague:**


"A Pod is stuck in Pending and won't schedule. The event shows `Insufficient CPU`."


**Chris:**


"That means the cluster needs an Autoscaler or additional nodes. First, check the scheduling failure reason with `kubectl describe pod`, then review the node resource status with `kubectl top nodes`. If the requested resources are large, consider adjusting the Pod spec, and also check whether Taints/Tolerations are restricting placement to specific nodes."


---


## 6. Service Discovery Failure


**Interviewer:**


"A Pod tried to call another Service by DNS name but the connection failed. How would you troubleshoot this?"


**Chris:**

1. Check whether the CoreDNS Pod is running properly (`kubectl get pods -n kube-system`).
2. Verify that the nameserver inside `/etc/resolv.conf` is pointing to the CoreDNS ClusterIP.
3. Check whether a NetworkPolicy is blocking the communication.
4. Finally, note that DNS records differ depending on whether the Service is Headless or a regular ClusterIP — make sure they match accordingly.