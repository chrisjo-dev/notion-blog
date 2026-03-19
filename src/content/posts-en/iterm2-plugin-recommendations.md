---
title: "iTerm2 Plugin Recommendations"
description: "#settings  --- 1. Terminal Enhancement Tools - Oh My Zsh     - Zsh configuration framework     - Rich autocomplete, themes, and plugins     - Install:          - Starship Prompt     - Makes your shell prompt clean and modern..."
date: "2025-12-27T12:33:00.000Z"
notionId: "2d6ea3deaa2b80628843e4b051dd1fbd"
koreanSlug: "iterm2-플러그인-추천"
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


## 1. Terminal Enhancement Tools

- **Oh My Zsh**
    - Zsh configuration framework
    - Rich autocomplete, themes, and plugins
    - Install:

        ```bash
        sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
        ```

- **Starship Prompt**
    - Makes your shell prompt clean and modern
    - Fast with great language/environment detection
    - Install:

        ```bash
        brew install starship
        echo 'eval "$(starship init zsh)"' >> ~/.zshrc
        ```

- **fzf** (Fuzzy Finder)
    - Enables fast search/navigation in the terminal (git branches, files, command history, etc.)
    - Install:

        ```bash
        brew install fzf
        
        # 파일 리스트에서 찾기
        ls | fzf
        
        # 현재 디렉토리에 모두 찾기
        find . -type f | fzf
        
        history | fzf
        ```


        To enable useful key bindings and autocomplete after installation:


        ```bash
        $(brew --prefix)/opt/fzf/install
        ```

        - Selecting [y] here activates `Ctrl+R` history search and `Ctrl+T` file navigation.

    ---


## 2. Session & Multiplexing

- **tmux**
    - Terminal multiplexer (session persistence, window splitting, SSH session dropout prevention)
    - Install:

        ```bash
        brew install tmux
        ```

- **tmux plugin manager (TPM)**
    - Easily install and manage tmux plugins
    - Convenient for status bar customization, automatic session saving, and more

---


## 3. Productivity Tools

- **zoxide**
    - Directory jump tool (replacement for `cd`)
    - Remembers frequently visited directories so you can navigate just by typing `z project`
    - Install:

        ```bash
        brew install zoxide
        echo 'eval "$(zoxide init zsh)"' >> ~/.zshrc
        ```

- **bat**
    - Replacement for `cat` (with syntax highlighting and line number support)
    - Install:

        ```bash
        brew install bat
        ```

- **htop**
    - System resource monitoring (more intuitive than the default `top`)
    - Install:

        ```bash
        brew install htop
        ```


---


## 4. Development / DevOps

- **kubectx / kubens**
    - Quickly switch between Kubernetes contexts and namespaces
    - Install:

        ```bash
        brew install kubectx
        ```

- **exa** (ls replacement)
    - A colorful `ls` replacement with Git status display support
    - Install:

        ```bash
        brew install exa
        ```

- **jq**
    - Essential tool for JSON parsing
    - Install:

        ```bash
        brew install jq
        ```


---


## 5. iTerm2 Native Plugins & Features

- **iTerm2 Shell Integration** (iTerm2 menu → Install Shell Integration)
    - Supports command history, directory bookmarks, and clickable paths
- **Hotkey Window**
    - A dropdown terminal you can open and close anytime with a shortcut key
- **Split Panes**
    - Split the window horizontally or vertically to run multiple sessions simultaneously