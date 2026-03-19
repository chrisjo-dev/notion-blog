---
title: "Jenv, A Tool for Managing Java Versions"
description: "A manual for managing Java versions using jEnv. 1. Overview — jEnv is a CLI tool that lets you install multiple Java versions on your system and switch between them globally, per-directory (local), or per-shell session. On macOS, it automatically recognizes JDKs installed at the designated path..."
date: "2025-12-27T12:45:00.000Z"
notionId: "2d6ea3deaa2b80c6ad88cd70af8553c3"
koreanSlug: "jenv-java-version들을-관리하기-위한-툴"
category: "끄적끄적"
tags:
  - "끄적끄적"
hierarchy:
  - "끄적끄적"
  - "Jenv, Java version들을 관리하기 위한 툴"
parent: "2d6ea3deaa2b80ec8f44c1b718f382c4"
level: 1
---


# Java Version Management Manual with jEnv


## 1. Overview


`jEnv` is a CLI tool that lets you install multiple Java versions on your system and switch between them by


**global**, **directory (local)**, and **shell session**.


On macOS, it automatically recognizes JDKs installed at the `/Library/Java/JavaVirtualMachines` path.


---


## 2. Installation


### (1) Install via Homebrew


```bash
brew install jenv
```


### (2) Register Environment Variables


After installation, add the following lines to `~/.zshrc` (or `~/.bash_profile`).


```bash
export PATH="$HOME/.jenv/bin:$PATH"
eval "$(jenv init -)"
```


Apply:


```bash
source ~/.zshrc
```


---


## 3. Checking and Registering Java Versions


### (1) Check Installed JDK List on the System


```bash
/usr/libexec/java_home -V
```


Example output:


```plain text
Matching Java Virtual Machines (3):
    17.0.8 (arm64) "Oracle Corporation" - "Java SE 17"
        /Library/Java/JavaVirtualMachines/jdk-17.0.8.jdk/Contents/Home
    11.0.21 (arm64) "Adoptium" - "OpenJDK 11"
        /Library/Java/JavaVirtualMachines/jdk-11.0.21.jdk/Contents/Home
```


### (2) Register a Version with jEnv


```bash
jenv add /Library/Java/JavaVirtualMachines/jdk-17.0.8.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/jdk-11.0.21.jdk/Contents/Home
```


Check the registered list:


```bash
jenv versions
```


Example output:


```plain text
* system (set by /Users/chris/.jenv/version)
  17.0.8
  11.0.21
```


---


## 4. Switching Versions


### (1) Global Switch


The version applied by default across all terminals:


```bash
jenv global 17.0.8
```


Verify:


```bash
java -version
```


---


### (2) Local (Directory) Switch


The version applied only within a specific project directory:


```bash
cd ~/workspace/myapp
jenv local 11.0.21
```


A `.java-version` file will be created in that directory:


```plain text
11.0.21
```


---


### (3) Session Switch


Temporarily switch only for the current terminal session:


```bash
jenv shell 17.0.8
```


---


## 5. Enabling Plugins


Some build tools (Maven, Gradle, etc.) may not recognize the JAVA_HOME set by jEnv.


In that case, you need to activate the plugin with the command below.


```bash
jenv enable-plugin export
```


After activation, restart the terminal or run:


```bash
exec $SHELL -l
```


jEnv will now automatically manage the JAVA_HOME environment variable.


---


## 6. Checking Environment Variables


```bash
echo $JAVA_HOME
```


Expected output:


```plain text
/Users/chris/.jenv/versions/17.0.8
```


---


## 7. jEnv Command Summary


| Command | Description |
| --------------------------- | ------------------- |
| `jenv add <경로>` | Register a new JDK with jEnv |
| `jenv versions` | Check the list of registered versions |
| `jenv global <버전>` | Set the global default version |
| `jenv local <버전>` | Set a version for the current directory only |
| `jenv shell <버전>` | Set a version for the current terminal session only |
| `jenv enable-plugin export` | Enable automatic JAVA_HOME management |
| `jenv which java` | Check the currently active Java path |
| `jenv doctor` | Inspect for configuration issues |


---


## 8. Per-Project Management Example


Assume you have the following project structure:


```plain text
~/projects/
├── backend-java11/
│   └── .java-version → 11.0.21
└── backend-java17/
    └── .java-version → 17.0.8
```


In this case, entering `cd backend-java11` will automatically switch to Java 11,


and entering `cd backend-java17` will automatically switch to Java 17.


---


## 9. Troubleshooting


| Issue | Cause | Solution |
| -------------------------------------- | -------------------- | ------------------------------------ |
| `java -version` shows system version instead of jEnv version | `export` plugin not activated | Run `jenv enable-plugin export` and restart the shell |
| `.java-version` is not being applied | Must enter the directory first | Refresh with `cd .` command or `exec $SHELL -l` |
| `jenv: no such command` | PATH or initialization is missing | Add `eval "$(jenv init -)"` to `.zshrc` |
| jEnv version not reflected in IDE | IDE not referencing `JAVA_HOME` | Specify the JDK path directly in IDE settings |


---


## 10. Recommended Workflow

1. Install multiple JDKs via Homebrew

    ```bash
    brew install openjdk@17
    brew install openjdk@11
    ```

2. Confirm paths with `/usr/libexec/java_home -V`
3. Register each version with jEnv
4. Activate `jenv enable-plugin export`
5. Create a `.java-version` file per project

With this setup,


you can reliably manage projects that require different JDK versions per build environment.


---


## 11. Appendix: JDK Installation Path Examples (macOS)


| Version | Path |
| ---------- | ---------------------------------------------------------------- |
| OpenJDK 17 | `/Library/Java/JavaVirtualMachines/openjdk-17.jdk/Contents/Home` |
| Temurin 11 | `/Library/Java/JavaVirtualMachines/temurin-11.jdk/Contents/Home` |
| Zulu 8 | `/Library/Java/JavaVirtualMachines/zulu-8.jdk/Contents/Home` |
