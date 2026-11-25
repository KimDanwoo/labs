# 맞춰봐 데이터 만들기

`data/guess-word/`의 세 파일을 만든다.

- `words.txt`: 추측할 수 있는 명사 5만 개. fastText 빈도 순서다.
- `vectors.bin`: 단어마다 556차원 int8 벡터. 앞 300차원은 fastText(문맥), 뒤 256차원은 BGE-M3(의미)를 SVD로 줄인 값이다. 두 부분을 각각 L2 정규화한 뒤 √0.6, √0.4를 곱해 이어 붙여, 코사인 유사도가 fastText 60%·BGE-M3 40% 가중 평균이 되게 했다. 행마다 최댓값이 127이 되게 양자화했다.
- `answers.txt`: 날짜별 정답 순서. **한 번 만든 뒤에는 고정이다.** 다시 실행해도 덮어쓰지 않고, 모든 정답이 어휘에 있는지만 검사한다.

## 준비물

- 파이썬 패키지 `kiwipiepy`, `numpy`, `sentence-transformers` (BGE-M3 모델 약 2.3GB를 처음 실행할 때 받는다)
- fastText 한국어 벡터의 앞부분. 빈도순으로 정렬돼 있어서 앞 40만 줄이면 충분하다. 1.2GB 전체를 받을 필요는 없다.

  ```bash
  curl -sL https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.ko.300.vec.gz | gunzip -c | head -n 400001 > head400k.vec
  ```

- 국립국어원 「한국어 학습용 어휘 목록」 텍스트 파일. CP949로 되어 있으니 UTF-8로 바꿔서 쓴다(`iconv -f cp949 -t utf-8`). 출처: https://www.korean.go.kr/front_eng/down/down_02V.do?etc_seq=70

## 실행

```bash
python3 scripts/guess-word/build_data.py --vectors head400k.vec --nikl nikl.utf8.txt --out data/guess-word --max-words 50000 --device mps
```

`--device`는 Apple Silicon이면 `mps`, 그 밖에는 `cpu`나 `cuda`다.

## 두 모델을 섞는 이유

- fastText만 쓰면 웹에서 함께 쓰인 단어가 가까워 잡음이 많다(그림자 → 조작단, 심연).
- BGE-M3만 쓰면 글자가 겹치는 합성어가 상위를 채운다(사랑 → 사랑니, 사랑방).
- 섞으면 서로의 약점을 덮는다(그림자 → 빛, 그늘, 어둠, 눈동자, 잔상). 비중은 정답 200개의 상위 20개 중 정답 글자가 든 합성어 비율로 골랐다. fastText 단독 5%, 반반 21%, 60:40에서 16%이다. 차원 축소는 평균을 뺀 SVD로 축을 구하되, 투영은 평균을 빼지 않은 벡터로 한다. 평균을 빼면 글자 겹침 비율이 더 높았다.

## 명사 판정 기준

- 국립국어원 목록의 명사는 무조건 인정한다.
- Kiwi 1순위 분석이 일반명사 하나이거나, 5자 이하 단어가 명사(+명사 접두·접미사)로만 이루어지면 인정한다.
- 2·3순위 분석은 1순위가 한 덩어리 단어이고 점수 차가 3 이하일 때만 인정한다. 예: 경기(NNP/NNG).
- 4자 이상 단어가 조사로 끝나고 조사를 뗀 앞부분이 이미 나온 단어면 제외한다. 예: 브라질의.

## 라이선스

- fastText 벡터: CC BY-SA 3.0
- BGE-M3: MIT
- 국립국어원 목록: 공공누리 제1유형

세 출처는 게임 화면 하단에도 표기한다.
