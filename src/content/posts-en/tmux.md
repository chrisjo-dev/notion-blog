---
title: "tmux"
description: "--- 1. Installation MacBook (Homebrew): Check: --- 2. Basic Structure - Session: An independent workspace (can be created per project) - Window: A tab within a session - Pane: A split screen within a window In other words: Session > Window..."
date: "2025-12-27T12:34:00.000Z"
notionId: "2d6ea3deaa2b806185cade3c570369a1"
koreanSlug: "tmux"
category: "끄적끄적"
tags:
  - "끄적끄적"
hierarchy:
  - "끄적끄적"
  - "tmux"
parent: "2d6ea3deaa2b80ec8f44c1b718f382c4"
level: 1
---




# 1. Installation


MacBook (Homebrew):


```bash
brew install tmux
```


Check:


```bash
tmux -V
```


---


# 2. Basic Structure

- **Session** : An independent workspace (can be created per project)
- **Window** : A tab within a session
- **Pane** : A split screen within a window

In other words:


Session > Window > Pane


---


# 3. Session Management

- Start a new session

    ```bash
    tmux
    ```

- Start with a name

    ```bash
    tmux new -s mysession
    ```

- Detach a session → keeps running but hidden from view

    ```plain text
    Ctrl+b d
    ```

- List sessions

    ```bash
    tmux ls
    ```

- Reattach a session (attach)

    ```bash
    tmux attach -t mysession
    ```

- End a session → inside the session, `exit`


---


# 4. Key Shortcuts (prefix = `Ctrl+b`)


tmux uses **all commands entered after a prefix (****`Ctrl+b`****)** .


| Action | Shortcut |
| --------- | ----------------------- |
| New window (tab) | `Ctrl+b c` |
| Switch windows | `Ctrl+b n` / `Ctrl+b p` |
| Go to a specific window | `Ctrl+b <번호>` |
| Split pane (vertical) | `Ctrl+b %` |
| Split pane (horizontal) | `Ctrl+b "` |
| Move between panes | `Ctrl+b` + arrow keys |
| Resize pane | `Ctrl+b` + `Alt` + arrow |
| Close pane | `Ctrl+b x` |
| List windows/panes | `Ctrl+b w` |
| Rename session | `Ctrl+b 


# 1. Installation


MacBook (Homebrew):


```bash
brew install tmux
```


Check:


```bash
tmux -V
```


---


# 2. Basic Structure

- **Session** : An independent workspace (can be created per project)
- **Window** : A tab within a session
- **Pane** : A split screen within a window

In other words:


Session > Window > Pane


---


# 3. Session Management

- Start a new session

    ```bash
    tmux
    ```

- Start with a name

    ```bash
    tmux new -s mysession
    ```

- Detach a session → keeps running but hidden from view

    ```plain text
    Ctrl+b d
    ```

- List sessions

    ```bash
    tmux ls
    ```

- Reattach a session (attach)

    ```bash
    tmux attach -t mysession
    ```

- End a session → inside the session, `exit`


---


# 4. Key Shortcuts (prefix = `Ctrl+b`)


tmux uses **all commands entered after a prefix (****`Ctrl+b`****)** .


| Action | Shortcut |
| --------- | ----------------------- |
| New window (tab) | `Ctrl+b c` |
| Switch windows | `Ctrl+b n` / `Ctrl+b p` |
| Go to a specific window | `Ctrl+b <번호>` |
| Split pane (vertical) | `Ctrl+b %` |
| Split pane (horizontal) | `Ctrl+b "` |
| Move between panes | `Ctrl+b` + arrow keys |
| Resize pane | `Ctrl+b` + `Alt` + arrow |
| Close pane | `Ctrl+b x` |
| List windows/panes | `Ctrl+b w` |
| Rename session |  |


---


# 5. Practical Examples


### (1) Keeping Remote Server Work Alive


```bash
ssh user@server
tmux new -s deploy
```

- Run the `tmux` session on the server → detach with `Ctrl+b d` → session persists even after SSH disconnects
- After reconnecting:

```bash
tmux attach -t deploy
```


### (2) Viewing Server Logs + Running Processes at the Same Time

- `Ctrl+b %` → split left/right
- Run the server on the left, `tail -f logs/app.log` on the right

### (3) Managing Multiple Projects

- `tmux new -s projectA`
- `tmux new -s projectB`
- Switch as needed with `tmux attach -t projectA` / `tmux attach -t projectB`


---


# 6. Customization


Config file: `~/.tmux.conf`


Example:


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


Apply:


```bash
tmux source-file ~/.tmux.conf
```


---


# 7. Summary

- **Session**: Per-project unit
- **Window**: Tab concept
- **Pane**: Split screen
- **Key shortcuts**: `Ctrl+b %`, `Ctrl+b "`, `Ctrl+b c`, `Ctrl+b d`


---
