---
title: "Jenv, Java version들을 관리하기 위한 툴"
description: "jEnv를 이용한 Java 버전 관리 메뉴얼 1. 개요 는 여러 Java 버전을 시스템에 설치해두고, 전역(global), 디렉터리별(local), 셸 세션별(shell)로 버전을 전환할 수 있는 CLI 도구입니다. macOS에서는  경로에 설치된 JDK를 자동 인식합..."
date: "2025-12-27T12:45:00.000Z"
notionId: "2d6ea3deaa2b80c6ad88cd70af8553c3"
category: "끄적끄적"
tags:
  - "끄적끄적"
hierarchy:
  - "끄적끄적"
  - "Jenv, Java version들을 관리하기 위한 툴"
parent: "2d6ea3deaa2b80ec8f44c1b718f382c4"
level: 1
---


# jEnv를 이용한 Java 버전 관리 메뉴얼


## 1. 개요


`jEnv`는 여러 Java 버전을 시스템에 설치해두고,


**전역(global)**, **디렉터리별(local)**, **셸 세션별(shell)**로 버전을 전환할 수 있는 CLI 도구입니다.


macOS에서는 `/Library/Java/JavaVirtualMachines` 경로에 설치된 JDK를 자동 인식합니다.


---


## 2. 설치


### (1) Homebrew로 설치


```bash
brew install jenv
```


### (2) 환경변수 등록


설치 후 `~/.zshrc` (혹은 `~/.bash_profile`)에 다음 라인을 추가합니다.


```bash
export PATH="$HOME/.jenv/bin:$PATH"
eval "$(jenv init -)"
```


적용:


```bash
source ~/.zshrc
```


---


## 3. Java 버전 확인 및 등록


### (1) 시스템에 설치된 JDK 목록 확인


```bash
/usr/libexec/java_home -V
```


출력 예시:


```plain text
Matching Java Virtual Machines (3):
    17.0.8 (arm64) "Oracle Corporation" - "Java SE 17"
        /Library/Java/JavaVirtualMachines/jdk-17.0.8.jdk/Contents/Home
    11.0.21 (arm64) "Adoptium" - "OpenJDK 11"
        /Library/Java/JavaVirtualMachines/jdk-11.0.21.jdk/Contents/Home
```


### (2) jEnv에 버전 등록


```bash
jenv add /Library/Java/JavaVirtualMachines/jdk-17.0.8.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/jdk-11.0.21.jdk/Contents/Home
```


등록된 목록 확인:


```bash
jenv versions
```


출력 예시:


```plain text
* system (set by /Users/chris/.jenv/version)
  17.0.8
  11.0.21
```


---


## 4. 버전 전환


### (1) 전역(Global) 전환


모든 터미널에서 기본적으로 적용할 버전:


```bash
jenv global 17.0.8
```


확인:


```bash
java -version
```


---


### (2) 디렉터리(Local) 전환


특정 프로젝트 디렉터리에서만 적용할 버전:


```bash
cd ~/workspace/myapp
jenv local 11.0.21
```


해당 디렉터리에 `.java-version` 파일이 생성됩니다:


```plain text
11.0.21
```


---


### (3) 세션(Session) 전환


현재 터미널 세션에서만 일시적으로 전환:


```bash
jenv shell 17.0.8
```


---


## 5. 플러그인 활성화


일부 빌드 도구(Maven, Gradle 등)가 jEnv로 설정한 JAVA_HOME을 인식하지 못할 수 있습니다.


이때 아래 명령으로 플러그인을 활성화해야 합니다.


```bash
jenv enable-plugin export
```


활성화 후 터미널 재시작 또는:


```bash
exec $SHELL -l
```


이제 jEnv가 JAVA_HOME 환경변수를 자동으로 관리합니다.


---


## 6. 환경변수 확인


```bash
echo $JAVA_HOME
```


예상 결과:


```plain text
/Users/chris/.jenv/versions/17.0.8
```


---


## 7. jEnv 주요 명령 요약


| 명령                          | 설명                  |
| --------------------------- | ------------------- |
| `jenv add <경로>`             | 새 JDK를 jEnv에 등록     |
| `jenv versions`             | 등록된 버전 목록 확인        |
| `jenv global <버전>`          | 전역 기본 버전 설정         |
| `jenv local <버전>`           | 현재 디렉터리 전용 버전 설정    |
| `jenv shell <버전>`           | 현재 터미널 세션 전용 버전 설정  |
| `jenv enable-plugin export` | JAVA_HOME 자동 관리 활성화 |
| `jenv which java`           | 현재 사용 중인 java 경로 확인 |
| `jenv doctor`               | 설정 이상 여부 점검         |


---


## 8. 프로젝트별 관리 예시


예를 들어 다음과 같은 프로젝트 구조가 있다고 가정합니다:


```plain text
~/projects/
├── backend-java11/
│   └── .java-version → 11.0.21
└── backend-java17/
    └── .java-version → 17.0.8
```


이 경우 `cd backend-java11`로 들어가면 자동으로 Java 11로 전환되고,


`cd backend-java17`로 들어가면 Java 17로 자동 전환됩니다.


---


## 9. 트러블슈팅


| 문제                                     | 원인                   | 해결방법                                 |
| -------------------------------------- | -------------------- | ------------------------------------ |
| `java -version`이 jEnv 버전이 아닌 시스템 버전 표시 | `export` 플러그인 미활성화   | `jenv enable-plugin export` 후 셸 재시작  |
| `.java-version`이 적용되지 않음               | 디렉터리 진입 후 적용 필요      | `cd .` 명령으로 새로고침 또는 `exec $SHELL -l` |
| `jenv: no such command`                | PATH 또는 초기화 누락       | `.zshrc`에 `eval "$(jenv init -)"` 추가 |
| IDE에서 jEnv 버전이 반영되지 않음                 | IDE가 `JAVA_HOME` 미참조 | IDE 설정에서 JDK 경로 직접 지정                |


---


## 10. 권장 워크플로우

1. Homebrew로 여러 JDK 설치

    ```bash
    brew install openjdk@17
    brew install openjdk@11
    ```

2. `/usr/libexec/java_home -V`로 경로 확인
3. jEnv에 각 버전 등록
4. `jenv enable-plugin export` 활성화
5. 프로젝트별 `.java-version` 파일 생성

이 구조로 설정하면


빌드 환경마다 다른 JDK 버전이 필요한 프로젝트에서도 안정적으로 관리할 수 있습니다.


---


## 11. 부록: JDK 설치 경로 예시 (macOS)


| 버전         | 경로                                                               |
| ---------- | ---------------------------------------------------------------- |
| OpenJDK 17 | `/Library/Java/JavaVirtualMachines/openjdk-17.jdk/Contents/Home` |
| Temurin 11 | `/Library/Java/JavaVirtualMachines/temurin-11.jdk/Contents/Home` |
| Zulu 8     | `/Library/Java/JavaVirtualMachines/zulu-8.jdk/Contents/Home`     |

