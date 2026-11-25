import argparse
import random
import re
import unicodedata
from pathlib import Path

import numpy as np
from kiwipiepy import Kiwi

DIMENSIONS = 300
HANGUL_WORD = re.compile(r"^[가-힣]{1,8}$")
HOMONYM_SUFFIX = re.compile(r"\d+$")
NOUN_TAG = "NNG"
NOUN_PREFIX_TAG = "XPN"
NOUN_SUFFIX_TAG = "XSN"
NOUN_FORMING_SUFFIXES = {"성", "적", "화", "자", "가", "인", "님", "감", "력", "론", "식", "제", "기", "권", "사", "율", "량", "품", "장", "관", "실", "원", "법", "체", "형"}
ANALYSIS_CANDIDATES = 3
COMPOUND_MAX_LENGTH = 5
AMBIGUITY_MAX_SCORE_GAP = 3.0
PARTICLE_CHECK_MIN_LENGTH = 4
TRAILING_PARTICLES = ("에서", "에게", "으로", "의", "에", "을", "를", "은", "는")
NIKL_NON_NOUN_TAGS = {"동", "형", "부", "관", "감", "대", "수", "보"}
ANSWER_GRADES = {"A", "B"}
ANSWER_MIN_LENGTH = 2
ANSWER_EXCLUDED_SUFFIX = "적"
ANSWER_STOPWORDS = {
    "그때", "이때", "그동안", "한동안", "오랫동안", "동안", "즉시", "당장", "적극", "얼마", "이외", "이전", "이후",
    "이상", "이하", "이번", "저번", "지난번", "다음", "나중", "처음", "마지막", "최근", "요즈음", "요새", "요즘",
    "정도", "자체", "대신", "대부분", "사이", "평소", "최대", "최고", "최선", "최초", "순간",
}
SHUFFLE_SEED = 20261125
INT8_SCALE = 127


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--vectors", required=True)
    parser.add_argument("--nikl", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--max-words", type=int, default=50000)
    return parser.parse_args()


def read_nikl_rows(path):
    lines = Path(path).read_text(encoding="utf-8").splitlines()[1:]
    for line in lines:
        cells = line.split("\t")
        if len(cells) < 5:
            continue
        word = unicodedata.normalize("NFC", HOMONYM_SUFFIX.sub("", cells[1]))
        yield word, cells[2], cells[4].strip()


def read_nikl_nouns(path):
    nouns = {}
    for word, tag, grade in read_nikl_rows(path):
        if tag == "명":
            nouns.setdefault(word, grade)
    return nouns


def read_nikl_non_nouns(path, nikl_nouns):
    return {word for word, tag, _grade in read_nikl_rows(path) if tag in NIKL_NON_NOUN_TAGS and word not in nikl_nouns}


def is_noun_token(token):
    is_suffix = token.tag == NOUN_SUFFIX_TAG and token.form in NOUN_FORMING_SUFFIXES
    return token.tag in (NOUN_TAG, NOUN_PREFIX_TAG) or is_suffix


def is_noun_analysis(word, tokens):
    has_noun = any(token.tag == NOUN_TAG for token in tokens)
    covers_word = "".join(token.form for token in tokens) == word
    return has_noun and covers_word and all(is_noun_token(token) for token in tokens)


def is_whole_common_noun(word, tokens):
    return len(tokens) == 1 and tokens[0].tag == NOUN_TAG and tokens[0].form == word


def is_common_noun(kiwi, word):
    (best_tokens, best_score), *alternatives = kiwi.analyze(word, top_n=ANALYSIS_CANDIDATES)
    is_short_compound = len(word) <= COMPOUND_MAX_LENGTH and is_noun_analysis(word, best_tokens)
    if is_whole_common_noun(word, best_tokens) or is_short_compound:
        return True
    is_best_single_word = len(best_tokens) == 1
    return is_best_single_word and any(
        is_whole_common_noun(word, tokens) and best_score - score <= AMBIGUITY_MAX_SCORE_GAP
        for tokens, score in alternatives
    )


def is_noun_with_particle(word, read_words):
    if len(word) < PARTICLE_CHECK_MIN_LENGTH:
        return False
    return any(word.endswith(particle) and word[: -len(particle)] in read_words for particle in TRAILING_PARTICLES)


def read_hangul_entries(path):
    with open(path, encoding="utf-8") as file:
        next(file)
        for line in file:
            word, *values = line.rstrip().split(" ")
            word = unicodedata.normalize("NFC", word)
            is_valid = HANGUL_WORD.match(word) and len(values) == DIMENSIONS
            if is_valid:
                yield word, values


def unit_vector(values):
    vector = np.asarray(values, dtype=np.float32)
    norm = np.linalg.norm(vector)
    return vector / norm if norm > 0 else None


def read_noun_vectors(path, kiwi, nikl_nouns, non_nouns, max_words):
    words, vectors, read_words = [], [], set()
    for word, values in read_hangul_entries(path):
        is_duplicate = word in read_words
        is_particle_form = is_noun_with_particle(word, read_words)
        read_words.add(word)
        if is_duplicate or word in non_nouns:
            continue
        is_noun = word in nikl_nouns or (not is_particle_form and is_common_noun(kiwi, word))
        vector = unit_vector(values) if is_noun else None
        if vector is None:
            continue
        words.append(word)
        vectors.append(vector)
        if len(words) >= max_words:
            break
    return words, np.stack(vectors)


def quantize(vectors):
    return np.clip(np.round(vectors * INT8_SCALE), -INT8_SCALE, INT8_SCALE).astype(np.int8)


def read_nikl_multi_pos_words(path):
    return {word for word, tag, _grade in read_nikl_rows(path) if tag != "명"}


def is_answer_candidate(kiwi, word, grade, vocabulary, multi_pos_words):
    is_excluded = word in ANSWER_STOPWORDS or word in multi_pos_words or word.endswith(ANSWER_EXCLUDED_SUFFIX)
    if is_excluded:
        return False
    best_tokens, _best_score = kiwi.analyze(word, top_n=1)[0]
    is_plain_noun = is_whole_common_noun(word, best_tokens) or is_noun_analysis(word, best_tokens)
    is_common = grade in ANSWER_GRADES and len(word) >= ANSWER_MIN_LENGTH
    return is_plain_noun and is_common and word in vocabulary


def pick_answers(kiwi, nikl_nouns, vocabulary, multi_pos_words):
    candidates = sorted(
        word
        for word, grade in nikl_nouns.items()
        if is_answer_candidate(kiwi, word, grade, vocabulary, multi_pos_words)
    )
    random.Random(SHUFFLE_SEED).shuffle(candidates)
    return candidates


def write_answers_once(path, answers, vocabulary):
    if path.exists():
        frozen = path.read_text(encoding="utf-8").split()
        missing = [word for word in frozen if word not in vocabulary]
        if missing:
            raise SystemExit(f"정답 목록에 어휘에 없는 단어가 있다: {missing[:10]}")
        return frozen
    path.write_text("\n".join(answers) + "\n", encoding="utf-8")
    return answers


def main():
    args = parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    nikl_nouns = read_nikl_nouns(args.nikl)
    non_nouns = read_nikl_non_nouns(args.nikl, nikl_nouns)
    kiwi = Kiwi()
    words, vectors = read_noun_vectors(args.vectors, kiwi, nikl_nouns, non_nouns, args.max_words)
    vocabulary = set(words)
    (out / "words.txt").write_text("\n".join(words) + "\n", encoding="utf-8")
    quantize(vectors).tofile(out / "vectors.bin")
    answers = write_answers_once(out / "answers.txt", pick_answers(kiwi, nikl_nouns, vocabulary, read_nikl_multi_pos_words(args.nikl)), vocabulary)
    print(f"words={len(words)} answers={len(answers)}")


if __name__ == "__main__":
    main()
