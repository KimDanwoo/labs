import os
import sys
import json
import re
import pathlib
import requests
from google import genai
from datetime import datetime

DATE = sys.argv[1] if len(sys.argv) > 1 else datetime.today().strftime("%Y-%m-%d")

ALADIN_TTB_KEY = os.environ.get("ALADIN_TTB_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not ALADIN_TTB_KEY:
    raise ValueError("ALADIN_TTB_KEY 환경변수가 필요합니다.")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY 환경변수가 필요합니다.")

GENRES = [
    {"key": "novel",   "name": "소설",     "emoji": "📖", "aladin_id": 1,     "ridi_keywords": ["소설", "fiction", "novel", "SF", "판타지", "로맨스", "추리", "공포"]},
    {"key": "economy", "name": "경제경영", "emoji": "💼", "aladin_id": 170,   "ridi_keywords": ["경제", "경영", "비즈니스", "투자", "재테크", "마케팅"]},
    {"key": "selfdev", "name": "자기계발", "emoji": "🚀", "aladin_id": 336,   "ridi_keywords": ["자기계발", "성공", "습관", "리더십", "동기"]},
    {"key": "humanit", "name": "인문사회", "emoji": "🌍", "aladin_id": 656,   "ridi_keywords": ["인문", "사회", "철학", "역사", "정치", "교육"]},
    {"key": "science", "name": "과학기술", "emoji": "🔬", "aladin_id": 987,   "ridi_keywords": ["과학", "기술", "IT", "수학", "물리", "생물"]},
    {"key": "essay",   "name": "에세이",   "emoji": "✍️", "aladin_id": 55890, "ridi_keywords": ["에세이", "산문", "여행", "일상"]},
]


# ── 알라딘 API ──────────────────────────────────────────────
def fetch_aladin_genre(genre: dict, limit: int = 10) -> list[dict]:
    url = "http://www.aladin.co.kr/ttb/api/ItemList.aspx"
    params = {
        "ttbkey": ALADIN_TTB_KEY,
        "QueryType": "Bestseller",
        "MaxResults": limit,
        "start": 1,
        "SearchTarget": "Book",
        "output": "js",
        "Version": "20131101",
        "CategoryId": genre["aladin_id"],
    }
    try:
        data = requests.get(url, params=params, timeout=10).json()
        results = []
        for i, item in enumerate(data.get("item", []), start=1):
            results.append({
                "rank": i,
                "title": item["title"].split(" - ")[0].strip(),
                "author": item["author"].split("(지은이)")[0].strip().split(",")[0].strip(),
                "cover": item.get("cover", ""),
                "link": item["link"],
                "publisher": item.get("publisher", ""),
                "genre_key": genre["key"],
                "source": "알라딘",
            })
        return results
    except Exception as e:
        print(f"  ⚠️  알라딘 {genre['name']} 실패: {e}")
        return []


def fetch_aladin_overall(limit: int = 20) -> list[dict]:
    url = "http://www.aladin.co.kr/ttb/api/ItemList.aspx"
    params = {
        "ttbkey": ALADIN_TTB_KEY,
        "QueryType": "Bestseller",
        "MaxResults": limit,
        "start": 1,
        "SearchTarget": "Book",
        "output": "js",
        "Version": "20131101",
        "CategoryId": 0,
    }
    try:
        data = requests.get(url, params=params, timeout=10).json()
        results = []
        for i, item in enumerate(data.get("item", []), start=1):
            cat_name = item.get("categoryName", "")
            genre_key = classify_genre_by_text(cat_name)
            results.append({
                "rank": i,
                "title": item["title"].split(" - ")[0].strip(),
                "author": item["author"].split("(지은이)")[0].strip().split(",")[0].strip(),
                "cover": item.get("cover", ""),
                "link": item["link"],
                "publisher": item.get("publisher", ""),
                "genre_key": genre_key,
                "source": "알라딘",
            })
        return results
    except Exception as e:
        print(f"  ⚠️  알라딘 전체 실패: {e}")
        return []


# ── 리디 크롤링 ─────────────────────────────────────────────
def _find_book_items(obj, depth=0) -> list:
    """JSON 트리에서 book 리스트를 재귀 탐색"""
    if depth > 6:
        return []
    if isinstance(obj, list) and obj and isinstance(obj[0], dict):
        if "book" in obj[0] or ("id" in obj[0] and "title" in obj[0]):
            return obj
    if isinstance(obj, dict):
        for v in obj.values():
            found = _find_book_items(v, depth + 1)
            if found:
                return found
    return []


def fetch_ridi(limit: int = 30) -> list[dict]:
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
    }
    urls = [
        "https://ridibooks.com/bestsellers",
        "https://ridibooks.com/books/bestsellers",
    ]
    for url in urls:
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            print(f"  리디 URL={url} status={resp.status_code}")
            html = resp.text
            match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
            if not match:
                print("  ⚠️  __NEXT_DATA__ 없음, 다음 URL 시도")
                continue
            data = json.loads(match.group(1))
            queries = (data.get("props", {})
                           .get("pageProps", {})
                           .get("dehydratedState", {})
                           .get("queries", []))
            print(f"  리디 queries={len(queries)}개")
            items = []
            for q in queries:
                q_data = q.get("state", {}).get("data", {})
                # 알려진 키 우선 탐색
                for key in ("bestsellers", "chartBooks", "books", "items"):
                    node = q_data.get(key)
                    if isinstance(node, dict) and "items" in node:
                        items = node["items"]
                        break
                    if isinstance(node, list) and node:
                        items = node
                        break
                if not items:
                    items = _find_book_items(q_data)
                if items:
                    print(f"  리디 items={len(items)}개 발견")
                    break
            if not items:
                print("  ⚠️  리디 items 없음, 다음 URL 시도")
                continue
            results = []
            for i, entry in enumerate(items[:limit], start=1):
                book = entry.get("book", entry)  # book 키가 없으면 entry 자체가 book
                title_node = book.get("title", {})
                title = title_node.get("main", "") if isinstance(title_node, dict) else str(title_node)
                authors = book.get("authors", [])
                author = authors[0].get("name", "") if authors and isinstance(authors[0], dict) else ""
                book_id = book.get("id", "")
                thumb = book.get("thumbnail", {})
                cover = thumb.get("large", "") or thumb.get("small", "") if isinstance(thumb, dict) else ""
                cats = book.get("categories", [])
                cat_text = " ".join([c.get("name", "") for c in cats if isinstance(c, dict)])
                genre_key = classify_genre_by_text(cat_text)
                if not title:
                    continue
                results.append({
                    "rank": i,
                    "title": title,
                    "author": author,
                    "cover": cover,
                    "link": f"https://ridibooks.com/books/{book_id}",
                    "publisher": "",
                    "genre_key": genre_key,
                    "source": "리디",
                })
            return results
        except Exception as e:
            print(f"  ⚠️  리디 {url} 실패: {e}")
    print("  ⚠️  리디 모든 URL 실패, 알라딘 단독으로 진행")
    return []


# ── 장르 분류 ────────────────────────────────────────────────
def classify_genre_by_text(text: str) -> str:
    text_lower = text.lower()
    for genre in GENRES:
        if any(kw.lower() in text_lower for kw in genre["ridi_keywords"]):
            return genre["key"]
    return "etc"


# ── 종합 순위 합산 ──────────────────────────────────────────
def merge_rankings(all_items: list[dict], top_n: int = 15, MAX_RANK: int = 30) -> list[dict]:
    scores: dict[str, dict] = {}

    def normalize(title: str) -> str:
        return re.sub(r"[\s\W]", "", title).lower()

    for item in all_items:
        key = normalize(item["title"])
        pts = max(0, MAX_RANK + 1 - item["rank"])
        if key not in scores:
            scores[key] = {
                "title": item["title"],
                "author": item["author"],
                "cover": item["cover"],
                "link": item["link"],
                "publisher": item.get("publisher", ""),
                "score": 0,
                "sources": {},
                "genre_key": item.get("genre_key", "etc"),
            }
        scores[key]["score"] += pts
        scores[key]["sources"][item["source"]] = item["rank"]
        if item["source"] == "알라딘" and item.get("cover"):
            scores[key]["cover"] = item["cover"]
            scores[key]["link"] = item["link"]

    ranked = sorted(scores.values(), key=lambda x: x["score"], reverse=True)
    for i, book in enumerate(ranked[:top_n], start=1):
        book["rank"] = i
    return ranked[:top_n]


def merge_genre_rankings(items: list[dict], top_n: int = 5) -> list[dict]:
    return merge_rankings(items, top_n=top_n)


# ── Gemini AI ────────────────────────────────────────────────
def generate_ai_content(overall: list[dict], genre_data: dict[str, list[dict]]) -> str:
    client = genai.Client(api_key=GEMINI_API_KEY)

    overall_list = "\n".join(
        [f"{b['rank']}. {b['title']} - {b['author']} ({', '.join(f'{k} {v}위' for k, v in b['sources'].items())})"
         for b in overall[:10]]
    )

    genre_summary = ""
    for genre in GENRES:
        books = genre_data.get(genre["key"], [])
        if books:
            genre_summary += f"\n[{genre['name']}]\n"
            genre_summary += "\n".join([f"  {b['rank']}. {b['title']} - {b['author']}" for b in books[:3]])

    prompt = f"""아래는 알라딘과 리디 베스트셀러를 종합한 데이터입니다.

## 종합 TOP 10
{overall_list}

## 장르별 TOP 3
{genre_summary}

위 데이터를 바탕으로 다음을 작성해주세요:
1. 이번 주 독서 트렌드 분석 (3-4문장)
2. 주목할 책 TOP 5 각각 한 줄 코멘트
3. 장르별 트렌드 한 줄씩
4. 독자층의 현재 분위기를 한 문장으로

형식 (마크다운):

## 📊 이번 주 독서 트렌드
[트렌드 분석 내용]

## 🏆 이번 주 주목할 책

- **1위 [책제목]** — [한 줄 코멘트]
- **2위 [책제목]** — [한 줄 코멘트]
- **3위 [책제목]** — [한 줄 코멘트]
- **4위 [책제목]** — [한 줄 코멘트]
- **5위 [책제목]** — [한 줄 코멘트]

## 🗂️ 장르별 트렌드

- **📖 소설** — [한 줄]
- **💼 경제경영** — [한 줄]
- **🚀 자기계발** — [한 줄]
- **🌍 인문사회** — [한 줄]
- **🔬 과학기술** — [한 줄]
- **✍️ 에세이** — [한 줄]
"""
    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    return response.text


# ── MD 생성 ──────────────────────────────────────────────────
def build_markdown(overall: list[dict], genre_data: dict[str, list[dict]], ai_content: str, date_str: str) -> str:
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    first_weekday = dt.replace(day=1).weekday()
    week = (dt.day + first_weekday - 1) // 7 + 1
    date_kr = f"{dt.year}년 {dt.month}월 {week}째주"

    rows = []
    for b in overall:
        aladin = f"{b['sources'].get('알라딘', '-')}위" if b['sources'].get('알라딘') else "-"
        ridi = f"{b['sources'].get('리디', '-')}위" if b['sources'].get('리디') else "-"
        genre = next((g["name"] for g in GENRES if g["key"] == b["genre_key"]), "기타")
        rows.append(f"| **{b['rank']}** | [{b['title']}]({b['link']}) | {b['author']} | {genre} | {aladin} | {ridi} |")

    overall_table = "\n".join([
        "| 순위 | 책 | 저자 | 장르 | 알라딘 | 리디 |",
        "|:----:|-----|------|------|:------:|:----:|",
        *rows,
    ])

    genre_sections = ""
    for genre in GENRES:
        books = genre_data.get(genre["key"], [])
        if not books:
            continue
        genre_rows = []
        for b in books:
            aladin = f"{b['sources'].get('알라딘', '-')}위" if b['sources'].get('알라딘') else "-"
            ridi = f"{b['sources'].get('리디', '-')}위" if b['sources'].get('리디') else "-"
            genre_rows.append(f"| **{b['rank']}** | [{b['title']}]({b['link']}) | {b['author']} | {aladin} | {ridi} |")

        genre_table = "\n".join([
            "| 순위 | 책 | 저자 | 알라딘 | 리디 |",
            "|:----:|-----|------|:------:|:----:|",
            *genre_rows,
        ])
        genre_sections += f"\n### {genre['emoji']} {genre['name']}\n\n{genre_table}\n"

    return f"""---
title: "종합 베스트셀러 ({date_kr})"
date: {date_str}
description: "알라딘, 리디 베스트셀러를 종합한 TOP 15와 장르별 베스트셀러입니다."
category: "bestseller"
isHidden: true
---

## 🏅 종합 베스트셀러 TOP 15

{overall_table}

---

{ai_content}

---

## 📚 장르별 베스트셀러
{genre_sections}

---

*데이터 출처: [알라딘](https://www.aladin.co.kr) · [리디](https://ridibooks.com)*
*Gemini AI가 자동으로 수집·분석한 베스트셀러 리포트입니다.*
"""


# ── main ─────────────────────────────────────────────────────
def main():
    print(f"[{DATE}] 베스트셀러 수집 시작\n")

    print("  📚 알라딘 전체 베스트셀러 수집...")
    aladin_overall = fetch_aladin_overall(20)
    print(f"     → {len(aladin_overall)}개")

    aladin_by_genre: dict[str, list[dict]] = {}
    for genre in GENRES:
        print(f"  📚 알라딘 [{genre['name']}] 수집...")
        aladin_by_genre[genre["key"]] = fetch_aladin_genre(genre, limit=10)

    print("  📱 리디 베스트셀러 수집...")
    ridi_items = fetch_ridi(30)
    print(f"     → {len(ridi_items)}개")

    print("\n  🔢 종합 순위 계산...")
    all_items = aladin_overall + ridi_items
    overall = merge_rankings(all_items, top_n=15)
    print(f"     → 종합 {len(overall)}개")

    genre_data: dict[str, list[dict]] = {}
    for genre in GENRES:
        genre_items = aladin_by_genre.get(genre["key"], [])
        ridi_genre = [b for b in ridi_items if b["genre_key"] == genre["key"]]
        combined = genre_items + ridi_genre
        if combined:
            genre_data[genre["key"]] = merge_genre_rankings(combined, top_n=5)
            print(f"     [{genre['name']}] {len(genre_data[genre['key']])}개")

    print("\n  🤖 Gemini AI 분석 중...")
    ai_content = generate_ai_content(overall, genre_data)

    md = build_markdown(overall, genre_data, ai_content, DATE)
    slug = f"{DATE}-bestseller"
    out_dir = pathlib.Path("contents/book") / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.md"
    out_path.write_text(md, encoding="utf-8")

    print(f"\n✅ 완료: {out_path}")


if __name__ == "__main__":
    main()
