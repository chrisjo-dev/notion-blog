---
title: "Recommended Jenkins Plugins"
description: "1. Pipeline Utility Steps - Concept: Provides commonly used utility functions in Jenkins Pipeline - Key Features:     - ,  → Read/write JSON files     - ,  → Read/write YAML files     - , ,  and other compression-related features..."
date: "2025-12-27T12:41:00.000Z"
notionId: "2d6ea3deaa2b80f5879afca80c82ff1a"
koreanSlug: "jenkins-plugins-추천"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "Jenkins plugins 추천"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---

## 1. **Pipeline Utility Steps**

- **Concept**: Provides commonly used utility functions in Jenkins Pipeline
- **Key Features**:
    - `readJSON`, `writeJSON` → Read/write JSON files
    - `readYaml`, `writeYaml` → Read/write YAML files
    - `zip`, `unzip`, `untar` and other compression-related features
- **Example**

```groovy
def data = readJSON file: 'config.json'
echo "버전: ${data.version}"
```


**Use Case**: Read files like `config.json`/`values.yaml` in a pipeline to adjust build options depending on the environment.


---


## 2. **Pipeline: Stage Step**

- **Concept**: A plugin that enables the use of `stage()` in Declarative/Scripted Pipelines
- **Role**: Visually displays stages in the pipeline UI
- **Example**

```groovy
stage('Build') {
    sh 'mvn clean package'
}
```


**Use Case**: Divide build, test, and deploy stages to gain visibility in the Jenkins UI/Blue Ocean.


---


## 3. **Blue Ocean**

- **Concept**: A modern UI plugin dedicated to Jenkins Pipeline
- **Features**:
    - Intuitive pipeline visualization
    - Per-branch view for multi-branch pipelines
    - Build logs displayed broken down by stage
- **Example**:

    Instead of the classic UI, it presents **pipelines in a "timeline format"** in a clean, visual way.


    **Use Case**: Get an at-a-glance overview of complex pipeline execution.


---


## 4. **Swarm Plugin**

- **Concept**: A plugin that **automatically registers Jenkins Agents** with the Controller
- **Features**:
    - Run the Swarm Client on an agent server → automatically connects to the Controller
    - Dynamically expand the agent pool
- **Example**

```bash
java -jar swarm-client.jar -master http://jenkins:8080 -username user -password pass
```


**Use Case**: Easily manage a large number of build agents (especially in VM-based environments).


---


## 5. **Node and Label Parameter Plugin**

- **Concept**: Allows you to choose **which node or label** to run a build on at execution time
- **Features**:
    - Specify the build node as a parameter
    - Run only on specific labels (e.g., `docker`, `windows`)
- **Example**

```groovy
parameters {
    label(name: 'NODE_LABEL', defaultValue: 'docker', description: '빌드 실행 노드')
}
node(params.NODE_LABEL) {
    stage('Build') {
        sh 'make build'
    }
}
```


**Use Case**: Windows-only or Linux-only builds, running on specific GPU nodes.


---


## 6. **Monitoring Plugin**

- **Concept**: Provides **system performance monitoring** for the Jenkins Controller and Nodes
- **Available Metrics**: JVM memory, CPU, thread count, system load, GC
- **Example**: Access the `/monitoring` page in the Jenkins UI → real-time monitoring

    **Use Case**: Check Jenkins server health, performance tuning, and incident response.


---


## 7. **Prometheus Metrics Plugin**

- **Concept**: A plugin that exposes Jenkins metrics to Prometheus
- **Features**:
    - Build success/failure counts
    - Queue length, executor utilization
    - Node status, job execution time
- **Example**: `http://jenkins:8080/prometheus` → Register as a Prometheus scrape target

    **Use Case**: Visualize Jenkins build status and node resource usage on a Grafana dashboard.


---


## 8. **Configuration as Code (JCasC)**

- **Concept**: Manages the entire Jenkins configuration (security, nodes, plugins, credentials, etc.) **as YAML files**
- **Features**:
    - Store in Git to ensure reproducibility
    - Apply once when setting up a new server to restore an identical environment
- **Example (****`jenkins.yaml`****)**

```yaml
jenkins:
  systemMessage: "Managed by JCasC"
  numExecutors: 0
credentials:
  system:
    domainCredentials:
      - credentials:
          - string:
              id: "slack-token"
              secret: "${SLACK_TOKEN}"
```


**Use Case**: Automatically restore configuration when reinstalling, migrating, or upgrading a Jenkins server.


---


## 9. **Workspace Cleanup Plugin**

- **Concept**: A plugin that **automatically cleans up the workspace** after a job runs
- **Features**:
    - Guarantees a clean state on every build
    - Saves disk space on nodes
- **Example**

```groovy
post {
    always {
        cleanWs()
    }
}
```


**Use Case**: Prevents build artifacts or cache files from accumulating and filling up the disk.


---


## 10. **Throttle Concurrent Builds Plugin**

- **Concept**: **Limits the number of concurrent executions** for a specific job or group of jobs
- **Features**:
    - Can be limited per node or across all of Jenkins
    - Group jobs by category for control
- **Example**

```groovy
pipeline {
  agent any
  options {
    throttleConcurrentBuilds(
      maxConcurrentPerNode: 1,
      maxConcurrentTotal: 2,
      categories: ['heavy-tests']
    )
  }
}
```


**Use Case**: Prevent heavy integration tests or external API load tests from running multiple instances simultaneously.


---


# Summary


| Plugin                         | Role                                              |
| ------------------------------ | ------------------------------------------------- |
| Pipeline Utility Steps         | File read/write utilities for JSON/YAML, etc.     |
| Pipeline: Stage Step           | Provides Stage UI (pipeline step separation)      |
| Blue Ocean                     | Pipeline visualization UI                         |
| Swarm Plugin                   | Automatic agent registration / pool management    |
| Node and Label Parameter       | Select execution on a specific node/label         |
| Monitoring Plugin              | Jenkins server/node performance monitoring        |
| Prometheus Metrics             | Expose Jenkins metrics to Prometheus/Grafana      |
| Configuration as Code          | Manage Jenkins configuration as YAML code         |
| Workspace Cleanup              | Workspace cleanup and disk space savings          |
| Throttle Concurrent Builds     | Limit the number of concurrent job executions     |