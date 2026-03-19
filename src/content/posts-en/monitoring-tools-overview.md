---
title: "Monitoring Tools Overview"
description: "#Infra #IaaS #Concepts #Monitoring 1. Horizon - Refers to OpenStack Horizon. - The dashboard (Web UI) of OpenStack (open-source cloud platform). - Roles:     - Create/delete VMs     - Network management     - Storage management..."
date: "2025-12-27T10:36:00.000Z"
notionId: "2d6ea3deaa2b81748c96f99fae7c82c8"
koreanSlug: "모니터링-프로그램-정리"
category: "IaaS"
tags:
  - "IaaS"
hierarchy:
  - "IaaS"
  - "모니터링 프로그램 정리"
parent: "2d6ea3deaa2b8058a64ec0d11e24c0ec"
level: 1
---

#Infra #IaaS #Concepts #Monitoring


## 1. **Horizon**

- Refers to **OpenStack Horizon**.
- The **dashboard (Web UI)** of OpenStack (open-source cloud platform).
- Roles:
    - Create/delete VMs
    - Network management
    - Storage management
    - User & permission management
- In short, a **web console for cloud management**.
- Similar to AWS **Management Console**.

---


## 2. **Prometheus**

- Open-source **monitoring & alerting system**.
- Stores metrics in a Time-Series DB.
- Primarily used for **infrastructure/application performance monitoring**.
- Key features:
    - Pull-based (Scraping): The Prometheus server periodically scrapes metrics from targets.
    - PromQL (Prometheus Query Language): Used for querying and analyzing data.
    - Integrates with Alertmanager → sends alerts via Slack, Email, PagerDuty, etc.

---


## 3. **Kibana**

- A **data visualization dashboard** dedicated to Elasticsearch.
- Analyzes log and document-based data, displaying it as charts, graphs, and dashboards.
- Typically used as part of the **Elastic Stack (ELK: Elasticsearch + Logstash + Kibana)**.
- Key features:
    - Log search (e.g., filtering error logs)
    - Security analysis
    - Application log visualization

---


## 4. **Elasticsearch**

- Open-source **search and analytics engine**.
- A **NoSQL database** based on JSON documents.
- Primarily used for storing and searching log/event data.
- Key features:
    - Distributed architecture (horizontally scalable).
    - Supports Full-text Search (natural language search).
    - Combined with Kibana, it becomes a powerful log analysis tool.

---


## 5. **Loki**

- A **log collection and storage system** built by Grafana Labs.
- Serves a similar role to Elasticsearch, but optimized for **storing logs as simply as metrics**.
- Key features:
    - Architecture similar to Prometheus (label-based queries).
    - Does not index full text of logs; only indexes metadata (labels) → **reduces storage costs**.
    - Integrates seamlessly with Grafana.

---


## 6. **Grafana**

- Open-source **visualization platform**.
- Can connect to a variety of data sources: Prometheus, Loki, Elasticsearch, InfluxDB, and more.
- Key features:
    - Metrics dashboards (CPU usage, network traffic, etc.).
    - Log viewer (Loki/Elasticsearch integration).
    - Alert configuration.
- Unlike Prometheus/Kibana, Grafana can **integrate multiple data sources into a single dashboard**.

---


## Comparison Summary


| Tool | Role | Key Features | Similar To |
| ----------------- | -------------------- | ---------------------------------- | -------------- |
| **Horizon** | OpenStack management UI | Cloud resource management (VMs, network, storage) | AWS Console |
| **Prometheus** | Metrics collection/storage | Time-series data, pull-based, Alertmanager integration | InfluxDB |
| **Kibana** | Elasticsearch-dedicated visualization | Log/document-based data analysis and search | Grafana (visualization) |
| **Elasticsearch** | Search/analytics engine | Log storage/search, JSON document-based, distributed | Loki (log storage) |
| **Loki** | Log storage/querying | Metadata-based indexing, cost reduction, optimized for Grafana | Elasticsearch |
| **Grafana** | Unified dashboard | Connects Prometheus/Loki/ES etc., integrates metrics + logs | Kibana (ES-only) |


---


## Easy Summary

- **Horizon** → Management UI for OpenStack (cloud resource management).
- **Prometheus** → Server/app metrics monitoring.
- **Grafana** → Visualization dashboard for monitoring data.
- **Elasticsearch** → Log storage and search engine.
- **Kibana** → Visualization tool for Elasticsearch.
- **Loki** → Lightweight log storage system (optimized for Grafana integration).

# Use Case Combinations


## 1. **Cloud Resource Management (Horizon-centric)**

- **Tools used**: Horizon (OpenStack Dashboard)
- **Use case**:
    - When building an enterprise private cloud (OpenStack),
    - Use Horizon to create VMs, configure networks, and manage storage with just a few clicks.
- **Characteristics**:
    - A tool for controlling infrastructure itself → different in nature from monitoring/log analysis tools.
    - Plays the same role as the AWS Console.

---


## 2. **Metrics Monitoring + Alerts (Prometheus + Grafana)**

- **Tools used**: Prometheus + Grafana
- **Use case**:
    - When operating a Kubernetes cluster →
        - Prometheus collects CPU, memory, and network usage from each Pod/Node/container.
        - Grafana visualizes this data and shares dashboards with the ops and dev teams.
        - Integrated with Alertmanager → Slack/email alerts on incidents.
- **Characteristics**:
    - Optimal for "metrics monitoring."
    - Widely used for infrastructure health and performance monitoring.

---


## 3. **Log Analysis (Elasticsearch + Kibana, i.e., ELK Stack)**

- **Tools used**: Elasticsearch + Logstash + Kibana (ELK)
- **Use case**:
    - **Collecting error logs** from web servers (Nginx, Django, Spring, etc.).
    - Logstash/Beats aggregates server logs and stores them in Elasticsearch.
    - Kibana visualizes "which errors occur most frequently" → root cause analysis.
- **Characteristics**:
    - Optimal for "log search/analysis."
    - Useful for in-depth analysis of security logs (IDS/IPS), server access logs, and application logs.

---


## 4. **Log Monitoring (Loki + Grafana)**

- **Tools used**: Loki + Grafana
- **Use case**:
    - When large volumes of Pod logs pour in from a microservices environment (Kubernetes),
    - Loki collects logs simply, and Grafana displays them via dashboards and a log viewer.
    - It's possible to "show Pod A logs and Pod B logs on the same timeline."
- **Characteristics**:
    - **Much lower storage cost** than Elasticsearch.
    - Log search capabilities are limited, but well-suited for **real-time operational monitoring**.
    - When used alongside Prometheus, **metrics + logs can be viewed together in a single Grafana dashboard**.

---


## 5. **Integrated Operations Environment**

- **Prometheus + Grafana + Loki** combination:
    - Unified view of infrastructure/app metrics + logs in **a single Grafana dashboard**.
    - Ops engineers can quickly pinpoint issues like "CPU spike → immediately check logs at that moment."
- **ELK (Elasticsearch + Kibana)**:
    - Strong for bulk log analysis, security audits (compliance), and long-term log retention.
- **Mixed usage**:
    - Prometheus + Grafana (metrics)
    - Loki (recent logs, low cost)
    - Elasticsearch + Kibana (deep log analysis, long-term retention)

---


# Summary Comparison


| Purpose | Common Stack | Characteristics |
| --------------- | ---------------------------------------- | ----------------------- |
| **Cloud resource management** | Horizon | VM, network, storage management |
| **Metrics monitoring** | Prometheus + Grafana | Server/app performance metrics, alerting |
| **Log analysis** | ELK (Elasticsearch + Kibana) | Large-scale log search/analysis |
| **Log monitoring** | Loki + Grafana | Lightweight log collection, cost-efficient, real-time ops |
| **Integrated operations** | Prometheus + Grafana + Loki (+ ELK as needed) | Unified metrics+logs, improved operational efficiency |
