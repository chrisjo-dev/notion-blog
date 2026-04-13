---
title: "MacBook M4에서 Whisper 모델을 로컬로 돌려보자, whisper.cpp 설치부터 한국어 음성 변환까지"
description: "왜 로컬 STT가 필요했나 면접을 준비하면서 STAR 기법으로 답변을 작성하고, 실제로 소리 내어 말하는 연습을 하고 있었다. 문제는 녹음한 내 답변을 텍스트로 확인하고 싶을 때 생겼다. 클로바노트나 다글로 같은 SaaS STT 서비스를 쓸 수도 있었지만, 몇 가지 이..."
date: "2026-04-13T09:43:00.000Z"
notionId: "341ea3deaa2b80f197bef8060e63ed8a"
category: "AI"
tags:
  - "AI"
hierarchy:
  - "AI"
  - "MacBook M4에서 Whisper 모델을 로컬로 돌려보자, whisper.cpp 설치부터 한국어 음성 변환까지"
parent: "329ea3deaa2b8030886decb6dfc7b809"
level: 1
---


## 왜 로컬 STT가 필요했나


면접을 준비하면서 STAR 기법으로 답변을 작성하고, 실제로 소리 내어 말하는 연습을 하고 있었다. 문제는 녹음한 내 답변을 텍스트로 확인하고 싶을 때 생겼다. 클로바노트나 다글로 같은 SaaS STT 서비스를 쓸 수도 있었지만, 몇 가지 이유로 로컬에서 직접 돌려보고 싶었다.


첫째, 면접 녹음에는 회사명, 프로젝트 세부사항 같은 민감한 내용이 포함되어 있었다. 외부 서비스에 올리기가 꺼려졌다. 둘째, 요즘 Qwen-VL을 Ollama로 로컬에서 돌리면서 느낀 건데, 생각보다 많은 AI 모델이 개인 MacBook 위에서 충분히 실용적으로 돌아간다는 것이었다. STT도 마찬가지일까 궁금했다. 셋째, DevOps 엔지니어로서 "이 모델의 런타임 환경은 어떻게 구성되는가"를 직접 만져보고 싶었다.


그래서 OpenAI의 Whisper 모델을 로컬에서 돌리기로 했다. 실행 엔진으로는 whisper.cpp를 선택했다. Whisper의 Python/PyTorch 구현 대신 C++로 재구현한 프로젝트인데, Apple Silicon의 Metal GPU 가속을 직접 활용해서 Mac에서 성능이 좋다. 참고로 이 프로젝트를 만든 Georgi Gerganov는 llama.cpp(Ollama의 내부 엔진)를 만든 개발자이기도 하다.


아래는 설치부터 한국어 음성 변환까지의 전체 과정이다.


---


## 환경

- MacBook Pro (Apple Silicon)
- macOS
- Homebrew 설치 완료 상태

---


## 1. whisper.cpp 설치


whisper.cpp는 AI 모델 자체가 아니라 모델을 실행시키는 엔진(런타임)이다. Ollama가 LLM을 실행하는 엔진인 것과 같은 관계다.


```docker
brew install whisper-cpp
```


## 2. ffmpeg 설치


whisper.cpp는 16kHz WAV 파일만 입력으로 받는다. m4a, mp3 등 다른 포맷의 오디오 파일을 변환하려면 ffmpeg가 필요하다.


```docker
brew install ffmpeg
```


## 3. Whisper 모델 다운로드


whisper.cpp를 설치했다고 끝이 아니다. 엔진과 모델은 별개이므로 모델 가중치를 따로 받아야 한다.


### 모델 크기별 비교


| 모델       | 파일 크기 | 한국어 품질  | 속도    |
| -------- | ----- | ------- | ----- |
| tiny     | 75MB  | 낮음      | 매우 빠름 |
| base     | 142MB | 낮음      | 빠름    |
| small    | 466MB | 보통      | 보통    |
| medium   | 1.5GB | 양호 (권장) | 느림    |
| large-v3 | 3GB   | 최고      | 매우 느림 |


한국어 음성 인식은 **medium 이상**을 권장한다. small 이하에서는 한국어 인식률이 눈에 띄게 떨어진다. MacBook M시리즈라면 medium도 무리 없이 돌아간다.


### Hugging Face에서 직접 다운로드


bash


```docker
# 모델 저장 디렉토리 생성
mkdir -p ~/.whisper

# medium 모델 다운로드 (권장, 약 1.5GB)
curl -L -o ~/.whisper/ggml-medium.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin
```


다른 크기의 모델을 받으려면 URL의 `ggml-medium.bin` 부분만 변경하면 된다.


```docker
# small 모델 (빠른 테스트용, 약 466MB)
curl -L -o ~/.whisper/ggml-small.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin

# large-v3 모델 (최고 품질, 약 3GB)
curl -L -o ~/.whisper/ggml-large-v3.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin`
```


## 4. 오디오 파일 변환 (WAV 16kHz)


whisper.cpp의 입력 요구사항은 **16kHz, mono, WAV** 포맷이다. 녹음 파일이 m4a나 mp3라면 ffmpeg로 변환해야 한다.


```docker
# m4a → wav 변환
ffmpeg -i input.m4a -ar 16000 -ac 1 output.wav

# mp3 → wav 변환
ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav
```


옵션 설명

- `ar 16000`: 샘플레이트를 16kHz로 변환
- `ac 1`: 모노 채널로 변환

## 5. 음성 → 텍스트 변환 실행


```docker
# 기본 실행 (한국어 지정)
whisper-cpp -m ~/.whisper/ggml-medium.bin -l ko -f output.wav
```


주요 옵션

- `m`: 모델 파일 경로
- `l ko`: 언어 지정 (ko = 한국어). 생략하면 자동 감지하지만, 명시하는 편이 정확도가 높다
- `f`: 입력 WAV 파일 경로

### 결과를 파일로 저장


```docker
# txt 파일로 저장
whisper-cpp -m ~/.whisper/ggml-medium.bin -l ko -f output.wav > result.txt

# 타임스탬프 포함 출력
whisper-cpp -m ~/.whisper/ggml-medium.bin -l ko -f output.wav -otxt
```


## 6. 전체 과정 요약 (한 번에 실행)


```docker
# 1) m4a를 wav로 변환
ffmpeg -i 녹음파일.m4a -ar 16000 -ac 1 temp.wav

# 2) 텍스트 변환
whisper-cpp -m ~/.whisper/ggml-medium.bin -l ko -f temp.wav > result.txt

# 3) 결과 확인
cat result.txt

# 4) 임시 wav 파일 정리
rm temp.wav
```


---


### 한국어 인식률이 낮은 경우

- small → medium → large-v3 순으로 모델 크기를 올려본다
- 녹음 품질(배경 소음, 마이크 거리)이 인식률에 큰 영향을 준다

---


## 소감


설치부터 변환까지 10분이면 끝난다. Ollama로 LLM을 로컬에서 돌려본 경험이 있다면 흐름이 거의 동일해서 익숙할 것이다. 엔진 설치 → 모델 다운로드 → 입력 포맷 맞추기 → 실행. AI 모델을 로컬에서 운용하는 패턴은 결국 다 비슷하다.


한국어 medium 모델의 인식 품질은 생각보다 괜찮았다. 발화가 명확하고 배경 소음이 적으면 실사용에 충분한 수준이다. 다만 고유명사(회사명, 기술 용어 등)는 종종 틀리기 때문에, 변환 결과를 그대로 쓰기보다는 한 번 검수하는 과정이 필요하다.


로컬에서 STT를 돌려보면서 느낀 점은, 결국 AI 서빙의 본질은 동일하다는 것이다. 모델 크기와 하드웨어 제약 사이의 트레이드오프, 입력 전처리의 중요성, 모델 선택이 품질에 미치는 영향. 이런 고민은 LLM을 서빙할 때도, STT를 돌릴 때도 똑같이 반복된다.


---


## 결국 자동화를 참지 못했다


![image.png](/notion-blog/images/notion/341ea3deaa2b80f197bef8060e63ed8a/image-1.png)


문제는 실제로 쓰기 시작하면서 생겼다. 면접 연습을 녹음하고, 터미널을 열고, ffmpeg로 변환하고, whisper-cli를 돌리고, 결과 파일을 열어서 확인하는 과정을 매번 반복해야 했다. 한두 번은 괜찮았다. 하지만 하루에 서너 번씩 녹음하고 변환하다 보니, 같은 명령어를 치는 자신이 점점 거슬렸다.


사람이 반복하는 일은 코드로 바꿔야 한다. 


그래서 간단한 웹 UI를 만들었다. Flask 서버 하나에 ffmpeg 변환과 whisper-cli 호출을 묶었고, 브라우저에서 파일을 드래그앤드롭하면 텍스트가 바로 나오는 구조다. 전체 파이프라인은 다음과 같다.


![image.png](/notion-blog/images/notion/341ea3deaa2b80f197bef8060e63ed8a/image-2.png)

1. 브라우저에서 음성 파일(m4a, mp3 등)을 업로드
2. Flask 서버가 ffmpeg로 16kHz mono WAV로 변환
3. whisper-cli가 WAV를 텍스트로 변환 (result.txt + result.srt 생성)
4. txt, srt 파일을 읽어서 JSON으로 응답
5. 브라우저에서 결과를 표시, 복사, 다운로드

모든 파일 처리는 Python의 tempfile 모듈로 임시 디렉토리에서 수행되고, 요청이 끝나면 자동으로 삭제된다. 로컬에서만 돌아가는 도구라 외부에 데이터가 나갈 일이 없다.


만드는 데 걸린 시간보다, 만들지 않고 버틴 시간이 더 길었다. 터미널에서 세 번째 같은 명령어를 치는 순간 "이건 아닌데"라는 생각이 들었는데, 그때 바로 만들었어야 했다. DevOps 엔지니어로서 늘 하는 말이지만, 사람이 반복하고 있으면 그건 자동화 대상이다.

