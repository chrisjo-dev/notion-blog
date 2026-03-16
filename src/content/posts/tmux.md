---
title: "tmux"
description: "--- 1. 설치 맥북(Homebrew 기준): 확인: --- 2. 기본 구조 - 세션(Session) : 독립된 작업 공간 (프로젝트 단위로 만들 수 있음) - 윈도우(Window) : 세션 안의 탭 - 패널(Pane) : 윈도우를 분할한 화면 즉: 세션 > 윈도우..."
date: "2025-12-27T12:34:00.000Z"
notionId: "2d6ea3deaa2b806185cade3c570369a1"
category: "끄적끄적"
tags:
  - "끄적끄적"
hierarchy:
  - "끄적끄적"
  - "tmux"
parent: "2d6ea3deaa2b80ec8f44c1b718f382c4"
level: 1
---


---


# 1. 설치


맥북(Homebrew 기준):


```bash
brew install tmux
```


확인:


```bash
tmux -V
```


---


# 2. 기본 구조

- **세션(Session)** : 독립된 작업 공간 (프로젝트 단위로 만들 수 있음)
- **윈도우(Window)** : 세션 안의 탭
- **패널(Pane)** : 윈도우를 분할한 화면

즉:


세션 > 윈도우 > 패널


---


# 3. 세션 관리

- 새 세션 시작

    ```bash
    tmux
    ```

- 이름 붙여서 시작

    ```bash
    tmux new -s mysession
    ```

- 세션 분리(detach) → 계속 실행되지만 화면에서 숨김

    ```plain text
    Ctrl+b d
    ```

- 세션 목록

    ```bash
    tmux ls
    ```

- 세션 다시 붙이기(attach)

    ```bash
    tmux attach -t mysession
    ```

- 세션 종료 → 세션 안에서 `exit`

---


# 4. 주요 단축키 (prefix = `Ctrl+b`)


tmux는 **모든 명령을 prefix(****`Ctrl+b`****) 후 입력**합니다.


| 동작        | 단축키                     |
| --------- | ----------------------- |
| 새 윈도우(탭)  | `Ctrl+b c`              |
| 윈도우 이동    | `Ctrl+b n` / `Ctrl+b p` |
| 특정 윈도우 이동 | `Ctrl+b <번호>`           |
| 창 분할(세로)  | `Ctrl+b %`              |
| 창 분할(가로)  | `Ctrl+b "`              |
| 패널 이동     | `Ctrl+b` + 화살표키         |
| 패널 크기 조절  | `Ctrl+b` + `Alt`+화살표    |
| 패널 닫기     | `Ctrl+b x`              |
| 윈도우/패널 목록 | `Ctrl+b w`              |
| 세션 이름 변경  | `Ctrl+b $`              |


---


# 5. 실전 예시


### (1) 원격 서버 작업 유지


```bash
ssh user@server
tmux new -s deploy
```

- 서버에서 `tmux` 세션 실행 → `Ctrl+b d` 로 분리 → SSH 끊어도 세션은 유지
- 다시 접속 후:

```bash
tmux attach -t deploy
```


### (2) 서버 로그 + 프로세스 실행 동시에 보기

- `Ctrl+b %` → 좌/우 분할
- 왼쪽에서 서버 실행, 오른쪽에서 `tail -f logs/app.log`

### (3) 여러 프로젝트 관리

- `tmux new -s projectA`
- `tmux new -s projectB`
- 필요할 때 `tmux attach -t projectA` / `tmux attach -t projectB`

---


# 6. 커스터마이즈


설정 파일: `~/.tmux.conf`


예시:


```plain text
# prefix 키를 Ctrl+a로 변경 (screen 스타일)
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# 마우스 지원
set -g mouse on

# 창 번호 1부터 시작
set -g base-index 1
setw -g pane-base-index 1
```


적용:


```bash
tmux source-file ~/.tmux.conf
```


---


# 7. 요약

- **세션**: 프로젝트 단위
- **윈도우**: 탭 개념
- **패널**: 창 분할
- **핵심 단축키**: `Ctrl+b %`, `Ctrl+b "`, `Ctrl+b c`, `Ctrl+b d`

---

