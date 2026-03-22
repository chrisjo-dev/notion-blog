---
title: "도커 이미지 레이어, CoW, OverlayFS/overlay2 정리"
description: "1. 도커 이미지는 레이어의 스택이다 레이어란? Dockerfile의 명령어(instruction) 하나 = 레이어 하나다. 각 레이어는 이전 레이어와의 차이(diff)만 저장한다. Git 커밋과 유사한 개념이다. 레이어의 크기 레이어의 크기에 상한선은 없다. 으로 5..."
date: "2026-03-22T02:29:00.000Z"
notionId: "32bea3deaa2b807f9848e3f4c5cc8a2e"
category: "PaaS"
tags:
  - "PaaS"
hierarchy:
  - "PaaS"
  - "도커 이미지 레이어, CoW, OverlayFS/overlay2 정리"
parent: "2d6ea3deaa2b80428e88d6577a5d76ef"
level: 1
---


## 1. 도커 이미지는 레이어의 스택이다


### 레이어란?


Dockerfile의 **명령어(instruction) 하나 = 레이어 하나**다.
각 레이어는 이전 레이어와의 **차이(diff)**만 저장한다. Git 커밋과 유사한 개념이다.


```docker
FROM ubuntu:22.04             # 레이어 1: 베이스 이미지
RUN apt-get update            # 레이어 2: 패키지 목록 업데이트
RUN apt-get install -y nginx  # 레이어 3: nginx 설치
COPY index.html /var/www/     # 레이어 4: 파일 복사
```


### 레이어의 크기


레이어의 크기에 상한선은 없다. `RUN yum install something`으로 500MB 분량의 패키지가 설치되면, 그 500MB 전체가 하나의 레이어가 된다.


### 핵심 원칙: 모든 이미지 레이어는 읽기 전용(read-only)


한번 만들어진 레이어는 수정할 수 없다. 이것이 이후의 모든 설계 원칙의 근거가 된다.


---


## 2. 레이어 설계가 중요한 이유


### 레이어가 많아지면 안 좋은 점

1. **이미지 크기가 불필요하게 커질 수 있다** — 레이어 수 자체보다, 한 레이어에서 만든 파일을 다른 레이어에서 지워도 실제로 사라지지 않는다는 점이 핵심이다.
2. **빌드 성능 저하** — 레이어마다 중간 이미지를 만들고 저장하는 과정이 있어 빌드가 느려질 수 있다.
3. **레이어 수 제한** — overlay2는 128개까지 지원한다. (예전 AUFS는 42개, 초기 overlay는 2개까지만 지원했다.)

### "지웠는데 안 지워지는" 문제


```docker
# 나쁜 예: 2개의 레이어
RUN yum install -y nginx        # 레이어: nginx + 캐시 파일 저장 완료
RUN yum clean all                # 레이어: "삭제했다"는 기록만 추가, 위 캐시는 그대로

# 좋은 예: 1개의 레이어
RUN yum install -y nginx && yum clean all   # 설치 + 정리가 하나의 레이어
```


레이어는 읽기 전용이므로, 한 레이어에서 생성된 파일은 이후 레이어에서 삭제 명령을 실행해도 이미지에서 사라지지 않는다. "삭제했다"는 변경사항만 새 레이어에 기록될 뿐이다.


### yum install 분리 vs 합치기


```docker
# 버전 A: 3개의 레이어 — yum install이 3번 실행됨
RUN yum install -y nginx
RUN yum install -y python3
RUN yum install -y git

# 버전 B: 1개의 레이어 — yum install이 1번 실행됨
RUN yum install -y nginx python3 git
```


`yum install`은 매번 실행될 때마다 리포지토리 **메타데이터 다운로드 및 캐시 생성**을 수행한다.
버전 A는 캐시가 3번 분량 쌓이고, 각 레이어가 읽기 전용이므로 이전 레이어의 캐시를 지울 수 없다.


메타데이터 캐시 자체는 보통 수십 MB 정도지만, 대용량 패키지(개발 도구 모음, Java JDK 등)를 설치할 경우 다운로드된 `.rpm` 파일까지 캐시에 남아 수백 MB까지 커질 수 있다.


### 실무 베스트 프랙티스


```docker
RUN yum install -y nginx python3 git && \
    yum clean all && \
    rm -rf /var/cache/yum
```


설치 + 캐시 정리를 **한 레이어 안에서** 끝내면 캐시가 최종 레이어에 포함되지 않는다.


---


## 3. Copy-on-Write (CoW)


![image.png](/notion-blog/images/notion/32bea3deaa2b807f9848e3f4c5cc8a2e/image-1.png)


### 컨테이너 실행 시 구조


컨테이너를 실행하면, 읽기 전용 이미지 레이어들 위에 얇은 **쓰기 가능한 레이어(writable layer)**가 하나 추가된다.


```plain text
┌─────────────────────────┐
│  컨테이너 쓰기 레이어     │  ← 읽기/쓰기 가능 (컨테이너별 고유)
├─────────────────────────┤
│  레이어 4: COPY index.html │  ← 읽기 전용
│  레이어 3: nginx 설치      │  ← 읽기 전용
│  레이어 2: apt update      │  ← 읽기 전용
│  레이어 1: ubuntu base     │  ← 읽기 전용
└─────────────────────────┘
```


### CoW의 동작 원리


**읽기(Read):** 위에서 아래로 레이어를 탐색하여 해당 파일을 찾아 반환. 복사 없음.


**쓰기(Write):** Copy-on-Write 발동!

1. 원본 파일을 아래쪽 읽기 전용 레이어에서 찾는다
2. 그 파일을 맨 위 쓰기 레이어로 **복사**한다
3. **복사본**을 수정한다

원본 레이어는 절대 건드리지 않는다. **쓰기가 발생할 때만 해당 파일 하나만 복사**하는 것이지, 이미지 전체를 복사하는 것이 아니다.


### 이미지와 컨테이너는 다른 개념


CoW의 효율을 이해하려면, 먼저 **이미지 빌드**와 **컨테이너 실행**이 별개의 단계라는 것을 명확히 해야 한다.


**1단계: 이미지 빌드 (docker build)** — 컨테이너가 존재하기 전에 일어난다.


```plain text
Dockerfile (레시피)
  → FROM ubuntu        → 레이어 1 완성, 잠금 (읽기 전용)
  → RUN install nginx  → 레이어 2 완성, 잠금 (읽기 전용)

결과: "my-nginx"라는 이미지 완성 (레이어 1 + 레이어 2, 둘 다 읽기 전용)
```


이 시점에서 컨테이너는 아직 없다. 완성된 이미지가 하나 있을 뿐이다.


**2단계: 컨테이너 실행 (docker run)** — 이미 완성된 이미지를 가져다 쓰는 단계.


```plain text
docker run my-nginx  → 컨테이너 A 탄생 (빈 쓰기 레이어 추가)
docker run my-nginx  → 컨테이너 B 탄생 (빈 쓰기 레이어 추가)
```


A도 B도 같은 이미지를 참조한다. 레이어 1(ubuntu)이든 레이어 2(nginx)든 **둘 다 이미지의 일부**이므로 둘 다 공유된다. 분기점은 레이어 2가 아니라 **그 위에 올라가는 쓰기 레이어**다.


### CoW가 효율적인 이유: CoW가 없는 세상과 비교


**만약 CoW가 없다면:**


```plain text
docker run my-nginx  → 이미지 전체 복사 (500MB) → 컨테이너 A
docker run my-nginx  → 이미지 전체 복사 (500MB) → 컨테이너 B
docker run my-nginx  → 이미지 전체 복사 (500MB) → 컨테이너 C
```


이미지가 500MB라면, 컨테이너 3개에 **1.5GB** 필요. 매번 500MB를 복사하니 시간도 오래 걸린다.


**CoW가 있으니까:**


```plain text
docker run my-nginx  → 빈 쓰기 레이어만 추가 (거의 0MB) → 컨테이너 A
docker run my-nginx  → 빈 쓰기 레이어만 추가 (거의 0MB) → 컨테이너 B
docker run my-nginx  → 빈 쓰기 레이어만 추가 (거의 0MB) → 컨테이너 C
```


이미지 500MB는 디스크에 **한 벌만** 존재하고, 컨테이너 3개가 참조만 한다. 디스크 사용량 500MB + 거의 0. 컨테이너 생성도 순식간.


**정리하면 CoW의 효율은 두 가지다:**

1. **디스크 절약** — 이미지를 복사하지 않고 공유하므로, 컨테이너를 아무리 많이 띄워도 이미지 용량은 한 벌만 차지한다.
2. **속도** — 컨테이너 생성 시 이미지 전체를 복사하는 대신 빈 쓰기 레이어 하나만 만들면 끝이므로, 컨테이너가 거의 즉시 뜬다.

### 컨테이너 간 격리


같은 이미지로 컨테이너 A, B를 띄우면:

- 베이스 이미지 레이어는 디스크에 **딱 한 벌**만 존재
- 각 컨테이너는 자기만의 **독립적인** 쓰기 레이어를 가짐
- 컨테이너 A가 파일을 수정해도, 컨테이너 B는 여전히 원본을 읽음
- 서로의 쓰기 레이어를 절대 볼 수 없음 — **완전히 격리**

### 컨테이너 삭제 시


컨테이너를 삭제하면 **쓰기 레이어도 같이 사라진다**. 변경사항이 전부 날아간다.

> "컨테이너는 일회용(ephemeral)이다"

영구적으로 보존해야 하는 데이터(데이터베이스 파일, 로그 등)는 **볼륨(volume)**을 사용하여 컨테이너 외부에 저장해야 한다. 볼륨은 컨테이너 라이프사이클과 독립적이다.


---


## 4. OverlayFS와 overlay2


### OverlayFS란?


**리눅스 커널에 내장된 파일시스템**이다. 도커가 만든 것이 아니라 도커보다 먼저 존재했던 기술이다.


이름 풀이: **Overlay(겹치다) + FS(File System)** — 여러 디렉토리를 겹쳐서 하나의 디렉토리처럼 보여주는 파일시스템이다.


비유: 포토샵 레이어를 여러 개 쌓으면 최종적으로 모든 레이어가 합쳐진 하나의 이미지가 보이지만, 실제로 각 레이어는 독립적으로 존재하는 것과 같다.


### OverlayFS vs overlay2


|    | OverlayFS                | overlay2                                 |
| -- | ------------------------ | ---------------------------------------- |
| 정체 | 리눅스 커널의 파일시스템 기능 (범용 기술) | 도커가 OverlayFS를 사용하는 스토리지 드라이버 (도커 전용 구현) |


도커가 예전에 사용했던 다른 스토리지 드라이버들(AUFS, devicemapper, btrfs 등)도 있었지만, overlay2가 성능과 안정성이 가장 좋아서 현재 기본값(default)이다.


### overlay2의 세 가지 핵심 디렉토리


| 디렉토리         | 역할                           | 비유                           |
| ------------ | ---------------------------- | ---------------------------- |
| **lowerdir** | 읽기 전용 이미지 레이어들 (여러 개 가능)     | 도서관 서가 (원본 책들)               |
| **upperdir** | 컨테이너의 쓰기 레이어                 | 개인 책상 (복사본, 메모)              |
| **merged**   | lowerdir + upperdir를 합친 통합 뷰 | 서가 + 책상이 하나의 완전한 도서관처럼 보이는 것 |


![image.png](/notion-blog/images/notion/32bea3deaa2b807f9848e3f4c5cc8a2e/image-2.png)


컨테이너 안에서 `ls /`를 치면 보이는 것이 바로 merged 디렉토리다.


### 실제 디렉토리 구조


```plain text
/var/lib/docker/overlay2/
├── abc123/           ← 레이어 1 (ubuntu base)
│   └── diff/         ← 이 레이어의 실제 파일들
│       ├── bin/
│       ├── etc/
│       └── usr/
├── def456/           ← 레이어 2 (nginx 설치)
│   ├── diff/         ← 이 레이어에서 추가/변경된 파일들만
│   ├── lower         ← "내 아래 레이어는 abc123이야"
│   ├── work/         ← OverlayFS 내부 작업용
│   └── merged/       ← (컨테이너 실행 시에만 생김)
└── ghi789/           ← 컨테이너 쓰기 레이어
    ├── diff/         ← CoW로 복사된 수정 파일들
    ├── lower         ← "내 아래 레이어는 def456, abc123이야"
    ├── work/
    └── merged/       ← 컨테이너가 보는 최종 통합 뷰
```


핵심은 **diff 디렉토리**다. 각 레이어의 diff에는 그 레이어에서 변경된 것만 들어있다. `lower` 파일이 체인처럼 아래 레이어들을 가리키고 있어서 overlay2가 이를 따라가며 합칠 수 있다.


### 파일 탐색 과정


컨테이너 안에서 `/etc/hosts`를 읽으면:

1. **ghi789/diff** (쓰기 레이어)에서 찾아봄 → 없음
2. **def456/diff** (nginx 레이어)에서 찾아봄 → 없음
3. **abc123/diff** (base 레이어)에서 찾아봄 → **있다!** → 반환

**위에서 아래로 탐색**하는 구조다. 만약 쓰기 레이어(ghi789/diff)에 수정된 버전이 있으면 거기서 바로 반환하고 아래로 내려가지 않는다. CoW로 복사한 수정본이 원본을 **가려버리는(overlay)** 것이다.


### 실제 확인 명령어


```bash
docker inspect <컨테이너ID> --format '{{.GraphDriver.Data}}'
```


이 명령어로 실제 `LowerDir`, `UpperDir`, `MergedDir` 경로를 확인할 수 있다.


---


## 5. Whiteout — 파일 삭제 처리


### 문제


lowerdir에 있는 원본 파일은 읽기 전용이라 실제 삭제가 불가능하다.
그러나 컨테이너 입장에서는 "이 파일이 없어졌다"고 보여야 한다.


### 해결: whiteout 파일


컨테이너에서 `/etc/someconfig`를 삭제하면, overlay2는 upperdir(쓰기 레이어)에 특수 파일을 생성한다


```plain text
ghi789/diff/etc/.wh.someconfig
```


`.wh.` 접두어가 붙은 빈 파일이다. ("wh" = whiteout)


이 파일이 존재하면 overlay2가 merged 뷰를 만들 때 **아래 레이어에 원본이 있어도 보여주지 않는다**.


### 비유


포토샵에서 아래 레이어에 글씨가 있는데, 위 레이어에서 **수정 테이프**로 덮어버리면 최종 결과물에서 안 보이는 것과 같다. 수정 테이프를 떼면 원본 글씨는 그대로 있다.


Git으로 비유하면 `.gitignore`(처음부터 추적하지 않음)보다는 `git rm`(이미 추적되던 파일의 삭제 기록을 남김)에 더 가깝다.


### 정리

- 원본 파일 → lowerdir에 **그대로 존재**
- whiteout 파일 → upperdir에 **생성**
- 컨테이너가 보는 merged → 해당 파일이 **안 보임**

---


## 6. 전체 요약


```plain text
도커 이미지 레이어 (read-only diff들)
        ↓
OverlayFS/overlay2가 합쳐서 하나의 파일시스템으로 보여줌 (merged)
        ↓
컨테이너가 쓰기하면 CoW로 쓰기 레이어(upperdir)에만 기록
        ↓
파일 삭제 시 whiteout 파일로 원본을 가림
```


| 개념            | 핵심 한 줄                              |
| ------------- | ----------------------------------- |
| **이미지 레이어**   | Dockerfile 명령어마다 생기는 읽기 전용 diff     |
| **CoW**       | 쓰기 발생 시 해당 파일만 쓰기 레이어로 복사 후 수정      |
| **OverlayFS** | 리눅스 커널의 파일시스템, 여러 디렉토리를 겹쳐서 하나로 보여줌 |
| **overlay2**  | 도커가 OverlayFS를 사용하는 스토리지 드라이버       |
| **whiteout**  | 삭제를 표현하는 특수 파일(.wh.)로 원본을 가림        |


---


## 이해도 확인


**문제 1.** 컨테이너 안에서 `/etc/hosts` 파일을 `cat`으로 읽으려고 한다. 이 파일은 upperdir에 없고, layer 2에도 없고, layer 1(ubuntu base)에만 존재한다. 이때 overlay2는 어떤 순서로 파일을 찾고, 복사가 발생하는지 설명하시오?


**문제 2.** 같은 이미지로 컨테이너 A, B를 띄웠다. 컨테이너 A에서 `/etc/nginx/nginx.conf`를 삭제했다. 이때 아래 세 가지 각각에서 어떤 일이 일어나는지 설명하시오:

- 컨테이너 A의 upperdir에는 뭐가 생길까?
- lowerdir의 원본 nginx.conf는 어떻게 될까?
- 컨테이너 B에서 nginx.conf를 읽으면 어떤 결과가 나올까?

**문제 3.** 아래 Dockerfile로 이미지를 빌드하고, 이 이미지로 컨테이너를 실행한 뒤 컨테이너 안에서 `/app/data.txt`를 수정했다. 이때 이미지 크기와 컨테이너의 디스크 사용량 관점에서 설명하시오.


```docker
FROM ubuntu:22.04
RUN echo "hello" > /app/data.txt
RUN echo "world" >> /app/data.txt
```


## 파일이 여러 레이어에 중복되는 함정


```docker
FROM ubuntu:22.04
RUN echo "hello" > /app/data.txt
RUN echo "world" >> /app/data.txt
```


레이어 2에서 data.txt가 만들어지고, 레이어 3에서 수정이 일어나면 레이어 2는 이미 읽기 전용이니까 data.txt 전체가 레이어 3에 새로 저장돼. 결과적으로 같은 파일이 두 벌 존재해서 이미지 크기가 불필요하게 커진다.


여기서 컨테이너를 실행한 뒤 data.txt를 수정하면, CoW가 발동해서 upperdir에 복사본이 또 생기며, 이 시점에서 data.txt는 총 3개가 된다.

- 레이어 2: "hello" → 읽기 전용, 가려져 있지만 디스크에 남아있음
- 레이어 3: "hello\nworld" → 읽기 전용, 이것도 가려짐
- upperdir: 수정된 버전 → 이것만 보임

해결법


```docker
RUN echo "hello" > /app/data.txt && echo "world" >> /app/data.txt
```

