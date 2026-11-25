# 맞춰봐 데이터 만들기

`data/guess-word/`의 세 파일을 만든다.

- `words.txt`: 추측할 수 있는 명사 5만 개. fastText 빈도 순서다.
- `vectors.bin`: 단어마다 300차원 int8 벡터. L2 정규화 후 127을 곱했다.
- `answers.txt`: 날짜별 정답 순서. **한 번 만든 뒤에는 고정이다.** 다시 실행해도 덮어쓰지 않고, 모든 정답이 어휘에 있는지만 검사한다.

## 준비물

- 파이썬 패키지 `kiwipiepy`, `numpy`
- fastText 한국어 벡터의 앞부분. 빈도순으로 정렬돼 있어서 앞 40만 줄이면 충분하다. 1.2GB 전체를 받을 필요는 없다.

  ```bash
  curl -sL https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.ko.300.vec.gz | gunzip -c | head -n 400001 > head400k.vec
  ```

- 국립국어원 「한국어 학습용 어휘 목록」 텍스트 파일. CP949로 되어 있으니 UTF-8로 바꿔서 쓴다(`iconv -f cp949 -t utf-8`). 출처: https://www.korean.go.kr/front_eng/down/down_02V.do?etc_seq=70

## 실행

```bash
python3 scripts/guess-word/build_data.py --vectors head400k.vec --nikl nikl.utf8.txt --out data/guess-word --max-words 50000
```

## 명사 판정 기준

- 국립국어원 목록의 명사는 무조건 인정한다.
- Kiwi 1순위 분석이 일반명사 하나이거나, 5자 이하 단어가 명사(+명사 접두·접미사)로만 이루어지면 인정한다.
- 2·3순위 분석은 1순위가 한 덩어리 단어이고 점수 차가 3 이하일 때만 인정한다. 예: 경기(NNP/NNG).
- 4자 이상 단어가 조사로 끝나고 조사를 뗀 앞부분이 이미 나온 단어면 제외한다. 예: 브라질의.

## 라이선스

- fastText 벡터: CC BY-SA 3.0
- 국립국어원 목록: 공공누리 제1유형

두 출처는 게임 화면 하단에도 표기한다.
