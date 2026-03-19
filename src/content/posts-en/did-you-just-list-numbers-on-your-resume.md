---
title: "Did You Just List Numbers on Your Resume?"
description: "A resume should always be something you're continuously preparing. If you try to write it all at once later, it's hard to remember what you did, and if you don't organize the details by keyword, it becomes difficult for both the writer and the reader to understand what was actually accomplished. That's why I think a resume should be managed not as a 'final product' but as a 'running record'..."
date: "2025-12-28T10:57:00.000Z"
notionId: "2d7ea3deaa2b80708f2addab99c0921f"
koreanSlug: "이력서에-수치만-나열-하셨나요"
category: "커리어"
tags:
  - "커리어"
hierarchy:
  - "커리어"
  - "이력서에 수치만 나열 하셨나요?"
parent: "2d7ea3deaa2b80778353e3ba423c5c8e"
level: 1
---

![image.png](/notion-blog/images/notion/2d7ea3deaa2b80708f2addab99c0921f/image-1.png)

A resume should always be something you're continuously preparing. If you try to write it all at once later, it's hard to remember what you did — and if you don't organize the details by keyword, it becomes difficult for both the writer and the reader to understand what was actually accomplished.

That's why I believe a resume should be managed not as a **"final product"** but as a **"running record."**

Not a document you rush to put together when job season rolls around, but something closer to a log you build up in real time as you do the work.

Especially in technical roles, if these four things are missing:

- What you built
- Why you solved that problem
- What constraints you were working under
- What results that decision produced

...then no matter how impressive the tech stack you list, your experience has no substance.

So rather than after a project ends, I try to capture — *while* the project is ongoing:

- Key decision points
- Reasons I automated repetitive tasks
- Places where things failed or had to be redesigned
- Changes I can explain with numbers

...in keyword form. As this accumulates, writing a resume stops being an act of **"authoring"** and becomes one of **"editing."**

Another important point: a resume is also a document that persuades *yourself*.

If you can't answer the question *"Why did I approach this problem this way?"* on your own, persuading someone else in an interview becomes even harder.

So in this post, rather than simply listing what I did, I want to focus on **why this work needed to be done**, **what context informed the decision**, and **what changed as a result**.

Preparing your resume in advance is, ultimately, the work of defining yourself as someone who solves problems.

## So You Added Numbers — Now What?

A common mistake is including only the outcome. For example: *"Improved operational efficiency by 30%"* or *"Reduced deployment time."* Listing results alone is, I think, the biggest mistake you can make. What's missing is the **why** behind the improvement.

Let me use my own resume as an example.

```json
멀티 클러스터 Kubernetes 환경에서 CI/CD 자동화 체계를 구축하여, Git 저장소 생성, Jenkins 잡 프로비저닝, SonarQube·Nexus·Harbor 연동을 스크립트로 표준화했고, 전체 초기 설정 시간을 기존 3시간 이상에서 1시간 이내로 단축했습니다.
```

It says I cut the time from 3 hours to 1 hour — but the problem here is that there's no explanation of *why* that needed to happen or *what decision-making process* led to it. The reader's reaction ends at: *"Oh, okay... cool."* And from a job-seeker's perspective, I believe it's also our job to make the reader *curious*.

## How Can We Improve It?

```json
프라이빗 클라우드 기반 신규 플랫폼 구축 프로젝트에서 향후 40여 개 서비스 온보딩을 전제로 한 KPI가 설정되어 있었으며, 초기 서비스별 CI/CD 환경을 수작업으로 구성할 경우 일정과 품질을 동시에 확보하기 어렵다고 판단했다. 이에 멀티 클러스터 Kubernetes 환경에서 CI/CD 초기 설정 과정을 자동화하여 Git 저장소 생성, Jenkins 잡 프로비저닝, SonarQube·Nexus·Harbor·Argo CD 연동을 스크립트로 표준화했고, 서비스별 초기 CI/CD 구축 시간을 기존 3시간 이상에서 1시간 이내로 단축했다.
```

Even if it gets a bit longer, it's better to write it out case-by-case — explaining the background and how you approached it. The context is much better preserved now, and it's far easier to read. By doing this, there are now many natural question points to ask about:

- What was your basis for deciding that CI/CD initial setup *needed* to be automated?
- How did you design the multi-cluster Kubernetes architecture, and how did you separate roles between clusters?
- Can you walk me through the integration structure of Jenkins, SonarQube, Nexus, and Harbor?
- At what point does ArgoCD come into play, and how did you draw the boundary between CI and CD?
- What was the key factor in reducing initial CI/CD setup time from 3 hours to under 1 hour?
- How did you account for reusability and maintainability of the automation scripts?

## But There's Still Room for Improvement…

One more thing to consider: the interviewer reading your resume doesn't have a lot of time. The key is that it needs to *catch the eye* and be delivered in a digestible, well-structured way. From that perspective, there's still room to improve.

The structure is as follows:

> **Problem** → **Decision** → **Solution**

```json
40여 개 서비스 온보딩을 전제로 한 프라이빗 클라우드 신규 플랫폼 구축 프로젝트에서, 서비스별 CI/CD 환경을 수작업으로 구성할 경우 일정 지연과 품질 편차가 반복될 것으로 판단했다. 이에 멀티 클러스터 Kubernetes 환경에서 CI/CD 초기 설정 전 과정을 자동화하고, Git,Jenkins,SonarQube,Nexus,Harbor,ArgoCD 연동을 표준화하여 서비스별 초기 구축 시간을 3시간 이상에서 1시간 이내로 단축했다.
```