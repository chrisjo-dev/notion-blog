---
title: "GitOps를 운영하며 다시 생각해 본 브랜치 전략과 디렉토리 전략"
description: "GitOps를 처음 도입하면 자연스럽게 고민하게 되는 것이 있다. DEV, STG, PRD 환경을 Git 저장소에서 어떻게 관리할 것인가? 그리고 어떤 방식이 우리 조직의 운영 방식에 더 적합할까?  처음에는 환경별 브랜치를 사용하는 구조가 가장 직관적으로 보인다. 실..."
date: "2026-06-05T12:05:00.000Z"
notionId: "376ea3deaa2b8019a47fce7b12bb3b2f"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "GitOps를 운영하며 다시 생각해 본 브랜치 전략과 디렉토리 전략"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---


GitOps를 처음 도입하면 자연스럽게 고민하게 되는 것이 있다. DEV, STG, PRD 환경을 Git 저장소에서 어떻게 관리할 것인가? 그리고 어떤 방식이 우리 조직의 운영 방식에 더 적합할까? 
처음에는 환경별 브랜치를 사용하는 구조가 가장 직관적으로 보인다.


```plain text
dev/main
stg/main
prd/main
```


실제로 많은 조직들이 GitOps를 도입할 때 이러한 구조로 시작한다.


반면 최근 ArgoCD 사례나 플랫폼 엔지니어링 관련 글들을 보면 브랜치 대신 디렉토리로 환경을 분리하는 방식도 자주 볼 수 있다.


```plain text
main
└── environments
    ├── dev
    ├── stg
    └── prd
```


현재 운영 중인 프로젝트에서는 브랜치 기반 전략을 사용하고 있다. 다만 운영하면서 "이 구조가 최선일까?"라는 고민을 하게 되었고, 최근 많이 사용되는 디렉토리 기반 전략과도 비교해 보게 되었다.


이번 글에서는 두 방식을 비교하고, 브랜치 기반 전략을 운영하면서 고려했던 점들과 환경별 설정을 안전하게 관리하기 위해 적용한 방법을 공유해 보려고 한다.


---


# GitOps 저장소는 애플리케이션 저장소가 아니다


먼저 GitOps 저장소의 역할부터 짚고 넘어갈 필요가 있다. GitOps 저장소는 애플리케이션 소스코드를 저장하는 곳이 아니다. GitOps 저장소는 Kubernetes 클러스터가 유지해야 하는 상태(Desired State)를 저장하는 곳이다.


예를 들어 다음과 같은 정보들이 저장된다.


```plain text
Helm Chart
Deployment
Service
Ingress
ConfigMap
Secret 참조 정보
이미지 버전
```


ArgoCD는 Git 저장소를 지속적으로 감시한다.


그리고 Git에 정의된 상태와 실제 클러스터 상태가 달라지면 Git 상태를 기준으로 동기화를 수행한다.


즉 Git 저장소가 Kubernetes 환경의 단일 진실 공급원(Source of Truth)이 되는 구조이다.


이 때문에 GitOps 환경에서는 단순히 배포만 관리하는 것이 아니라, 환경 구성을 어떤 구조로 관리할 것인지도 중요한 설계 요소가 된다.


---


# 브랜치 기반 전략


현재 운영 중인 GitOps 저장소 구조는 아래와 같다.


```plain text
dev/main
stg/main
prd/main
```


각 브랜치는 하나의 환경을 의미한다.


ArgoCD는 환경별로 서로 다른 브랜치를 바라본다.


```plain text
DEV Cluster → dev/main
STG Cluster → stg/main
PRD Cluster → prd/main
```


애플리케이션 변경사항은 먼저 DEV 환경에 반영된다.


```plain text
Application Repository
        ↓
Container Build
        ↓
GitOps Repository Update
        ↓
dev/main
        ↓
ArgoCD Sync
        ↓
DEV Deployment
```


DEV 환경에서 충분한 검증이 끝나면 변경사항을 STG 환경으로 반영한다.


이후 STG 검증이 완료되면 PRD 환경으로 반영한다.


```plain text
dev/main
    ↓ merge
stg/main
    ↓ merge
prd/main
```


이 구조에서는 환경 변경 과정 자체가 Git Merge로 표현된다.


운영 환경에 어떤 변경사항이 반영되었는지 Git History만 확인해도 쉽게 추적할 수 있다.


---


# 브랜치를 독립적으로 운영하면 안 될까?


여기서 한 가지 의문이 생긴다. 굳이 브랜치 간 Merge를 해야 할까?
환경별 브랜치를 완전히 독립적으로 운영할 수도 있다.


```plain text
dev/main
stg/main
prd/main
```


각 환경이 서로 영향을 주지 않도록 관리하는 방식이다.
사실 DEV, STG, PRD 환경은 원래부터 서로 다르다.


예를 들어 아래와 같은 값들은 환경마다 달라지는 것이 정상이다.


```yaml
replicaCount
resource limits
database endpoint
ingress host
secret
```


DEV는 비용 절감을 위해 최소 리소스로 운영할 수 있고, PRD는 실제 트래픽을 처리하기 위해 더 많은 리소스를 사용할 수 있다. 따라서 환경별 설정 차이 자체는 문제가 아니다.


오히려 환경이 다르기 때문에 설정이 다른 것이 자연스럽다.
하지만 운영조직에서 효율적인 관리를 위해 공통 구조를 고민 안할 수가 없다. 


예를 들어 DEV 환경에서 Helm Chart 구조를 수정했다고 가정해 보자.


```plain text
charts/
templates/
config/
```


새로운 Chart를 추가하거나 Template 구조를 변경했다면 STG와 PRD에도 동일한 변경이 필요하다.
브랜치를 완전히 독립적으로 운영하면 동일한 구조 변경을 여러 브랜치에 반복 적용해야 한다.


```plain text
dev/main 수정
      ↓
stg/main 동일 수정
      ↓
prd/main 동일 수정
```


운영 기간이 길어질수록 공통 구조 변경사항 반영이 누락될 가능성이 생긴다.
예를 들어 시간이 지나면서 아래와 같은 상태가 될 수 있다.


```plain text
DEV
 └ Chart v3

STG
 └ Chart v2

PRD
 └ Chart v1
```


환경별 설정은 의도적으로 다르지만, Chart 구조나 Template 구조까지 달라지기 시작하면 운영 복잡도가 급격히 증가한다. 특정 환경에서만 발생하는 문제를 분석하기 어려워지고, 신규 기능이나 공통 설정을 반영할 때도 더 많은 검증이 필요하게 된다.


결국 운영 관점에서는 환경별 설정은 유지하되, Chart·Template·Config와 같은 공통 구조는 최대한 동일하게 유지하는 것이 유리하다.

또한 깃에 대해서 운영자의 높은 숙련도를 요구하는것도 단점이라면 단점이라고 볼 수 있다. 특히 운영 담당자가 자주 바뀌는 조직일수록 이런 구조로 가져가게 된다는 것에 충분히 고민을 해봐야한다. 


그래서 현재 운영 환경에서는 브랜치 Merge를 통해 공통 변경사항을 전달하고, **환경별 설정 파일만 보호하는 전략을 사용하고 있다.**


---


# 디렉토리 기반 전략


최근 GitOps 프로젝트에서는 단일 브랜치 구조를 더 자주 볼 수 있다. 브랜치는 하나만 사용한다.


```plain text
main
```


대신 환경을 디렉토리로 분리한다.


```plain text
environments/
├── dev
├── stg
└── prd
```


ArgoCD는 브랜치가 아니라 디렉토리를 바라본다.


```plain text
DEV Cluster → environments/dev
STG Cluster → environments/stg
PRD Cluster → environments/prd
```


모든 환경은 동일한 Git History를 공유한다. 브랜치 Merge 자체가 존재하지 않는다.
따라서 브랜치 간 구조 차이나 관리 비용이 상대적으로 적다.


---


# 디렉토리 기반 전략은 어떻게 환경을 반영할까?


대부분 버전 정보만 변경한다. 예를 들어 현재 상태가 아래와 같다고 가정해 보자.


```yaml
# environments/dev/values.yaml
imageTag: 1.2.3

# environments/stg/values.yaml
imageTag: 1.2.2
```


DEV 검증이 완료되면 STG 버전만 수정한다.


```yaml
# environments/stg/values.yaml
imageTag: 1.2.3
```


이후 Pull Request를 Merge하면 ArgoCD가 자동으로 STG 환경을 동기화한다. 즉 브랜치 전략에서는 Git Merge가 환경 반영의 기준이 되고, 디렉토리 전략에서는 버전 변경 PR이 환경 반영의 기준이 된다.


---


# 두 방식 비교


| 항목             | 브랜치 기반 전략 | 디렉토리 기반 전략 |
| -------------- | --------- | ---------- |
| 환경 분리 방식       | 브랜치       | 디렉토리       |
| 환경 반영 방식       | Merge     | PR         |
| Git History 분리 | O         | X          |
| 환경 추적          | 쉬움        | 보통         |
| 공통 변경사항 전파     | Merge 필요  | 동일 브랜치     |
| 브랜치 관리         | 필요        | 불필요        |
| 운영 복잡도         | 높음        | 낮음         |
| 승인 중심 조직       | 적합        | 보통         |
| SaaS / 플랫폼 조직  | 보통        | 적합         |


최근 GitOps 커뮤니티에서는 디렉토리 기반 전략을 더 많이 사용하는 분위기다. ArgoCD 공식 예제나 다양한 플랫폼 엔지니어링 사례도 대부분 단일 브랜치 구조를 사용한다.


반면 승인 절차가 중요하거나 환경 간 변경 흐름을 명확하게 관리해야 하는 조직에서는 브랜치 기반 전략도 여전히 많이 사용된다.


---


# 브랜치 기반 전략에서 환경별 설정 보호하기


브랜치 전략을 사용하면 또 다른 고민이 생긴다. 환경별 설정 파일이 Merge 과정에서 덮어써질 수 있다는 점이다.
예를 들어 DEV 환경은 아래와 같이 운영할 수 있다.


```yaml
replicaCount: 1

resources:
  limits:
    cpu: 500m
    memory: 512Mi
```


반면 PRD 환경은 더 큰 리소스를 사용할 수 있다.


```yaml
replicaCount: 10

resources:
  limits:
    cpu: 2000m
    memory: 4Gi
```


만약 단순 Merge를 수행한다면 운영 환경 설정이 개발 환경 설정으로 변경될 위험이 있다. 이를 해결하기 위해 특정 파일은 Merge 대상에서 제외했다. 현재 보호 대상 파일은 아래 두 개다.


```plain text
values.yaml
VERSIONS.md
```


`.gitattributes`


```plain text
/values.yaml merge=ours
/VERSIONS.md merge=ours
```


Custom Merge Driver를 별도로 정의한다.


`.gitconfig`


```plain text
[merge "ours"]
    name = Keep ours merge
    driver = true
```


Git Merge 시 동작 흐름은 아래와 같다.


```plain text
git merge 실행
        ↓
.gitattributes 확인
        ↓
values.yaml 발견
        ↓
merge=ours 적용
        ↓
현재 브랜치 내용 유지
        ↓
기타 파일 일반 Merge
```


예를 들어 STG 브랜치에서 DEV 브랜치를 Merge하면:


```plain text
values.yaml
    → STG 내용 유지

VERSIONS.md
    → STG 내용 유지

기타 파일
    → 일반 Merge
```


즉 공통 Chart, Template, Config 변경사항은 가져오고 환경별 설정은 유지할 수 있다.


---


# 마무리


GitOps 환경을 구성할 때 브랜치 기반 전략과 디렉토리 기반 전략 중 정해진 정답은 없다. 하지만, 운영 조직에서 적합한 환경을 충분히 고민하고 잡고 들어가야 한다고 보는 관점이다. 


브랜치 기반 전략은 환경 변경 흐름을 Git Merge로 명확하게 표현할 수 있다는 장점이 있다.
반면 디렉토리 기반 전략은 구조가 단순하고 공통 변경사항 관리가 쉽다. 중요한 것은 어떤 전략을 선택하느냐보다 왜 그 전략을 선택했는가에 있다. 


다만 최근에는 또 다른 생각도 하게 된다.


지금까지의 Git, Branch, Commit, Pull Request와 같은 개념들은 결국 사람 간 협업을 전제로 만들어진 방식이다. 하지만 AI Agent가 개발 과정에 깊게 들어오기 시작하면서 과연 이러한 방식이 앞으로도 최적의 협업 모델일지는 잘 모르겠다.


AI는 파일보다 기능 단위로 작업하고, 하나의 변경사항이 아니라 수십 개의 작업을 동시에 수행할 수 있다. 그런 관점에서 보면 브랜치 전략이나 Merge 전략에 대한 고민 역시 결국 Git이라는 추상화 위에서의 고민일 수 있다.


아직은 Git이 사실상의 표준이지만, 몇 년 뒤에도 우리가 지금과 같은 방식으로 코드를 관리하고 배포할지는 모르겠다.


어쩌면 미래의 GitOps는 Git을 중심으로 설명되지 않을 수도 있다는 생각이 든다.

