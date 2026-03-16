---
title: "iTerm2 플러그인 추천"
description: "#settings  --- 1. 터미널 경험 향상 도구 - Oh My Zsh     - Zsh 설정 프레임워크     - 자동완성, 테마, 플러그인 풍부     - 설치:          - Starship Prompt     - 쉘 프롬프트를 깔끔하고 모던하게 꾸며줌..."
date: "2025-12-27T12:33:00.000Z"
notionId: "2d6ea3deaa2b80628843e4b051dd1fbd"
category: "끄적끄적"
tags:
  - "끄적끄적"
hierarchy:
  - "끄적끄적"
  - "iTerm2 플러그인 추천"
parent: "2d6ea3deaa2b80ec8f44c1b718f382c4"
level: 1
---


#settings 


---


## 1. 터미널 경험 향상 도구

- **Oh My Zsh**
    - Zsh 설정 프레임워크
    - 자동완성, 테마, 플러그인 풍부
    - 설치:

        ```bash
        sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
        ```

- **Starship Prompt**
    - 쉘 프롬프트를 깔끔하고 모던하게 꾸며줌
    - 빠르고 언어/환경 감지 기능 좋음
    - 설치:

        ```bash
        brew install starship
        echo 'eval "$(starship init zsh)"' >> ~/.zshrc
        ```

- **fzf** (Fuzzy Finder)
    - 터미널에서 빠른 검색/탐색 지원 (git 브랜치, 파일, 명령어 히스토리 등)
    - 설치:

        ```bash
        brew install fzf
        
        # 파일 리스트에서 찾기
        ls | fzf
        
        # 현재 디렉토리에 모두 찾기
        find . -type f | fzf
        
        history | fzf
        ```


        설치 후 유용한 키 바인딩과 자동 완성을 활성화하려면:


        ```bash
        $(brew --prefix)/opt/fzf/install
        ```

        - 여기서 [y]를 선택하면, `Ctrl+R` 히스토리 검색, `Ctrl+T` 파일 탐색이 활성화됩니다.

    ---


## 2. 세션 및 멀티플렉싱

- **tmux**
    - 터미널 멀티플렉서 (세션 유지, 창 분할, SSH 세션 끊김 방지)
    - 설치:

        ```bash
        brew install tmux
        ```

- **tmux plugin manager (TPM)**
    - tmux 플러그인 쉽게 설치/관리
    - 상태바 꾸미기, 세션 자동저장 등 편리

---


## 3. 생산성 도구

- **zoxide**
    - 디렉토리 점프 툴 (`cd` 대체제)
    - 자주 가는 디렉토리를 기억해서 `z project`만 입력해도 바로 이동 가능
    - 설치:

        ```bash
        brew install zoxide
        echo 'eval "$(zoxide init zsh)"' >> ~/.zshrc
        ```

- **bat**
    - `cat` 대체제 (구문 강조, 라인 넘버 지원)
    - 설치:

        ```bash
        brew install bat
        ```

- **htop**
    - 시스템 리소스 모니터링 (기본 `top`보다 직관적)
    - 설치:

        ```bash
        brew install htop
        ```


---


## 4. 개발/DevOps 관련

- **kubectx / kubens**
    - Kubernetes 컨텍스트와 네임스페이스 빠르게 전환
    - 설치:

        ```bash
        brew install kubectx
        ```

- **exa** (ls 대체제)
    - 컬러풀하고 Git 상태 표시도 지원하는 `ls` 대체제
    - 설치:

        ```bash
        brew install exa
        ```

- **jq**
    - JSON 파싱 필수 도구
    - 설치:

        ```bash
        brew install jq
        ```


---


## 5. iTerm2 자체 플러그인·기능

- **iTerm2 Shell Integration** (iTerm2 메뉴 → Install Shell Integration)
    - 명령어 기록, 디렉토리 북마크, 클릭 가능한 경로 지원
- **Hotkey Window**
    - 단축키로 언제든 열고 닫는 드롭다운 터미널
- **Split Panes**
    - 창을 가로/세로 분할해서 여러 세션 동시 실행

---

