#!/usr/bin/env python3
"""도서 주간 베스트셀러 수집 — 알라딘(API) · 교보문고 · YES24 · 리디"""

import os
import sys
import json
import re
import pathlib
import requests
from playwright.sync_api import sync_playwright, Page
from google import genai
from google.genai import types as genai_types
from datetime import datetime

DATE = sys.argv[1] if len(sys.argv) > 1 else datetime.today().strftime("%Y-%m-%d")

ALADIN_TTB_KEY = os.environ.get("ALADIN_TTB_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not ALADIN_TTB_KEY:
    raise ValueError("ALADIN_TTB_KEY 환경변수가 필요합니다.")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY 환경변수가 필요합니다.")

GENRES = [
    {"key": "novel",   "name": "소설",     "emoji": "📖", "aladin_id": 1,     "keywords": ["소설", "fiction", "novel", "SF", "판타지", "로맨스", "추리", "공포"]},
    {"key": "economy", "name": "경제경영", "emoji": "💼", "aladin_id": 170,   "keywords": ["경제", "경영", "비즈니스", "투자", "재테크", "마케팅"]},
    {"key": "selfdev", "name": "자기계발", "emoji": "🚀", "aladin_id": 336,   "keywords": ["자기계발", "성공", "습관", "리더십", "동기"]},
    {"key": "humanit", "name": "인문사회", "emoji": "🌍", "aladin_id": 656,   "keywords": ["인문", "사회", "철학", "역사", "정치", "교육"]},
    {"key": "science", "name": "과학기술", "emoji": "🔬", "aladin_id": 987,   "keywords": ["과학", "기술", "IT", "수학", "물리", "생물"]},
    {"key": "essay",   "name": "에세이",   "emoji": "✍️", "aladin_id": 55890, "keywords": ["에세이", "산문", "여행", "일상"]},
]


def classify_genre(text: str) -> str:
    text_lower = text.lower()
    for genre in GENRES:
        if any(kw.lower() in text_lower for kw in genre["keywords"]):
            return genre["key"]
    return "etc"


def _extract_next_data(html: str) -> dict:
    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass
    return {}


def _find_book_items(obj, depth=0) -> list:
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


# ── 알라딘 API ──────────────────────────────────────────────
def fetch_aladin_overall(limit: int = 20) -> list[dict]:
    url = "http://www.aladin.co.kr/ttb/api/ItemList.aspx"
    params = {
        "ttbkey": ALADIN_TTB_KEY, "QueryType": "Bestseller",
        "MaxResults": limit, "start": 1, "SearchTarget": "Book",
        "output": "js", "Version": "20131101", "CategoryId": 0,
    }
    try:
        data = requests.get(url, params=params, timeout=10).json()
        _EXCLUDE_CAT = ("이벤트", "선물", "기획전", "특별")
        results = []
        rank = 0
        for item in data.get("item", []):
            cat_name = item.get("categoryName", "")
            if any(kw in cat_name for kw in _EXCLUDE_CAT):
                continue
            rank += 1
            if rank > limit:
                break
            results.append({
                "rank": rank,
                "title": item["title"].split(" - ")[0].strip(),
                "author": item["author"].split("(지은이)")[0].strip().split(",")[0].strip(),
                "cover": item.get("cover", ""),
                "link": item["link"],
                "publisher": item.get("publisher", ""),
                "genre_key": classify_genre(cat_name),
                "source": "알라딘",
            })
        return results
    except Exception as e:
        print(f"  ⚠️  알라딘 전체 실패: {e}")
        return []


def fetch_aladin_genre(genre: dict, limit: int = 10) -> list[dict]:
    url = "http://www.aladin.co.kr/ttb/api/ItemList.aspx"
    params = {
        "ttbkey": ALADIN_TTB_KEY, "QueryType": "Bestseller",
        "MaxResults": limit, "start": 1, "SearchTarget": "Book",
        "output": "js", "Version": "20131101", "CategoryId": genre["aladin_id"],
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


# ── Gemini 헬퍼 ─────────────────────────────────────────────
def _get_page_text(pw_page: Page, url: str) -> str:
    pw_page.goto(url, wait_until="networkidle", timeout=30000)
    return pw_page.evaluate("""() => {
        const el = document.querySelector(
            'main, [role="main"], #content, #wrap, .container, article'
        );
        return (el || document.body).innerText;
    }""")


def _parse_books_with_gemini(client: genai.Client, text: str, source_name: str, limit: int = 20) -> list[dict]:
    """Gemini AI로 페이지 텍스트에서 도서 순위 추출"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"""다음은 "{source_name}" 베스트셀러 페이지의 텍스트입니다.

<page_text>
{text[:9000]}
</page_text>

실제 책(도서) 순위 목록만 추출하세요.
- 실제 책 제목·저자만 (UI버튼·메뉴·이벤트배너·"새창보기"·프로모션 문구 등은 제외)
- 최대 {limit}개
- JSON 배열로만 응답

[{{"rank": 1, "title": "책 제목", "author": "저자명"}}]""",
        config=genai_types.GenerateContentConfig(response_mime_type="application/json"),
    )
    raw = response.text.strip()
    try:
        items = json.loads(raw)
    except Exception:
        m = re.search(r"\[.*\]", raw, re.DOTALL)
        if not m:
            return []
        items = json.loads(m.group())
    if not isinstance(items, list) or len(items) < 2:
        return []
    results = []
    for item in items:
        title = str(item.get("title", "")).strip()
        if not title or len(title) < 2:
            continue
        results.append({
            "rank": item.get("rank", len(results) + 1),
            "title": title,
            "author": str(item.get("author", "")).strip(),
        })
    return results


# ── 교보문고 ────────────────────────────────────────────────
def fetch_kyobo(pw_page: Page, client: genai.Client, limit: int = 20) -> list[dict]:
    urls = [
        "https://store.kyobobook.co.kr/bestseller/online",
        "https://store.kyobobook.co.kr/bestseller/total",
    ]
    for url in urls:
        try:
            print(f"  교보문고 URL={url}")
            pw_page.goto(url, wait_until="networkidle", timeout=30000)
            html = pw_page.content()

            # __NEXT_DATA__ 시도
            data = _extract_next_data(html)
            if data:
                items = _find_book_items(data)
                if items:
                    results = []
                    rank = 0
                    for item in items[:limit * 2]:  # 이벤트 항목 필터 여유분
                        title = item.get("cmdtName") or item.get("title") or item.get("name") or ""
                        if isinstance(title, dict):
                            title = title.get("main") or ""
                        title = str(title).strip()
                        # ISBN 없는 항목(이벤트/기획전)은 제외
                        isbn = item.get("isbn") or item.get("barcode") or ""
                        if not isbn or not title:
                            continue
                        rank += 1
                        if rank > limit:
                            break
                        author = item.get("authNm") or item.get("author") or item.get("writerName") or ""
                        if isinstance(author, list):
                            author = author[0] if author else ""
                        thumbnail = item.get("imgPath") or item.get("thumbnail") or item.get("coverImg") or ""
                        if isinstance(thumbnail, dict):
                            thumbnail = thumbnail.get("url") or ""
                        link = f"https://product.kyobobook.co.kr/detail/{isbn}"
                        genre_text = str(item.get("categoryName") or item.get("category") or "")
                        results.append({
                            "rank": rank,
                            "title": title,
                            "author": str(author).strip(),
                            "cover": str(thumbnail).strip(),
                            "link": link,
                            "publisher": str(item.get("pbcmName") or item.get("publisher") or "").strip(),
                            "genre_key": classify_genre(genre_text + " " + title),
                            "source": "교보문고",
                        })
                    if results:
                        print(f"  교보문고 items={len(results)}개 발견 (NEXT_DATA)")
                        return results

            # Gemini AI 기반 추출 (fallback)
            print("  📖 교보문고 Gemini AI 추출 시도...")
            page_text = pw_page.inner_text("body")
            gemini_books = _parse_books_with_gemini(client, page_text, "교보문고", limit)
            if gemini_books:
                results = []
                for item in gemini_books:
                    title = item["title"]
                    results.append({
                        "rank": len(results) + 1,
                        "title": title,
                        "author": item["author"],
                        "cover": "",
                        "link": url,
                        "publisher": "",
                        "genre_key": classify_genre(title + " " + item["author"]),
                        "source": "교보문고",
                    })
                    if len(results) >= limit:
                        break
                if results:
                    print(f"  교보문고 items={len(results)}개 발견 (Gemini)")
                    return results

            print("  ⚠️  교보문고 데이터 없음, 다음 URL 시도")
        except Exception as e:
            print(f"  ⚠️  교보문고 {url} 실패: {e}")

    print("  ⚠️  교보문고 모든 URL 실패")
    return []


# ── YES24 ───────────────────────────────────────────────────
def fetch_yes24(pw_page: Page, client: genai.Client, limit: int = 20) -> list[dict]:
    urls = [
        "https://www.yes24.com/Product/Category/BestSeller?categoryNumber=001",
        "https://www.yes24.com/Product/Category/BestSeller",
    ]
    for url in urls:
        try:
            print(f"  YES24 URL={url}")
            pw_page.goto(url, wait_until="networkidle", timeout=30000)
            html = pw_page.content()

            # __NEXT_DATA__ 시도
            data = _extract_next_data(html)
            if data:
                items = _find_book_items(data)
                if items:
                    results = []
                    for i, item in enumerate(items[:limit], start=1):
                        title = item.get("title") or item.get("goodsNm") or ""
                        author = item.get("author") or item.get("writerName") or ""
                        thumbnail = item.get("imgPath") or item.get("thumbnail") or ""
                        goods_no = item.get("goodsNo") or item.get("id") or ""
                        link = f"https://www.yes24.com/Product/Goods/{goods_no}" if goods_no else url
                        genre_text = str(item.get("categoryName") or "")
                        results.append({
                            "rank": i,
                            "title": str(title).strip(),
                            "author": str(author).strip(),
                            "cover": str(thumbnail).strip(),
                            "link": link,
                            "publisher": str(item.get("publisherName") or "").strip(),
                            "genre_key": classify_genre(genre_text + " " + str(title)),
                            "source": "YES24",
                        })
                    if results:
                        print(f"  YES24 items={len(results)}개 발견 (NEXT_DATA)")
                        return results

            # Gemini AI 기반 추출 (fallback)
            print("  📖 YES24 Gemini AI 추출 시도...")
            page_text = pw_page.inner_text("body")
            gemini_books = _parse_books_with_gemini(client, page_text, "YES24", limit)
            if gemini_books:
                results = []
                for item in gemini_books:
                    title = item["title"]
                    results.append({
                        "rank": len(results) + 1,
                        "title": title,
                        "author": item["author"],
                        "cover": "",
                        "link": url,
                        "publisher": "",
                        "genre_key": classify_genre(title + " " + item["author"]),
                        "source": "YES24",
                    })
                    if len(results) >= limit:
                        break
                if results:
                    print(f"  YES24 items={len(results)}개 발견 (Gemini)")
                    return results

            print("  ⚠️  YES24 데이터 없음, 다음 URL 시도")
        except Exception as e:
            print(f"  ⚠️  YES24 {url} 실패: {e}")

    print("  ⚠️  YES24 모든 URL 실패")
    return []


# ── 리디 ────────────────────────────────────────────────────
def fetch_ridi(pw_page: Page, limit: int = 20) -> list[dict]:
    urls = [
        "https://ridibooks.com/bestsellers",
        "https://ridibooks.com/books/bestsellers",
    ]
    for url in urls:
        try:
            print(f"  리디 URL={url}")
            pw_page.goto(url, wait_until="networkidle", timeout=30000)
            html = pw_page.content()
            data = _extract_next_data(html)
            if not data:
                print("  ⚠️  리디 __NEXT_DATA__ 없음, 다음 URL 시도")
                continue
            queries = (data.get("props", {})
                           .get("pageProps", {})
                           .get("dehydratedState", {})
                           .get("queries", []))
            print(f"  리디 queries={len(queries)}개")
            items = []
            for q in queries:
                q_data = q.get("state", {}).get("data", {})
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
                book = entry.get("book", entry)
                title_node = book.get("title", {})
                title = title_node.get("main", "") if isinstance(title_node, dict) else str(title_node)
                if not title:
                    continue
                authors = book.get("authors", [])
                author = authors[0].get("name", "") if authors and isinstance(authors[0], dict) else ""
                book_id = book.get("id", "")
                thumb = book.get("thumbnail", {})
                cover = (thumb.get("large", "") or thumb.get("small", "")) if isinstance(thumb, dict) else ""
                cats = book.get("categories", [])
                cat_text = " ".join([c.get("name", "") for c in cats if isinstance(c, dict)])
                results.append({
                    "rank": i,
                    "title": title.strip(),
                    "author": author.strip(),
                    "cover": cover,
                    "link": f"https://ridibooks.com/books/{book_id}",
                    "publisher": "",
                    "genre_key": classify_genre(cat_text),
                    "source": "리디",
                })
            return results
        except Exception as e:
            print(f"  ⚠️  리디 {url} 실패: {e}")
    print("  ⚠️  리디 모든 URL 실패")
    return []


# ── 종합 순위 합산 ──────────────────────────────────────────
def merge_rankings(all_items: list[dict], top_n: int = 15, MAX_RANK: int = 30) -> list[dict]:
    scores: dict[str, dict] = {}

    def normalize(title: str) -> str:
        return re.sub(r"[\s\W]", "", title).lower()

    for item in all_items:
        if not item.get("title"):
            continue
        key = normalize(item["title"])
        pts = max(0, MAX_RANK + 1 - item["rank"])
        if key not in scores:
            scores[key] = {
                "title": item["title"],
                "author": item["author"],
                "cover": item.get("cover", ""),
                "link": item.get("link", ""),
                "publisher": item.get("publisher", ""),
                "score": 0,
                "sources": {},
                "genre_key": item.get("genre_key", "etc"),
            }
        scores[key]["score"] += pts
        scores[key]["sources"][item["source"]] = item["rank"]
        # 알라딘 커버/링크 우선
        if item["source"] == "알라딘" and item.get("cover"):
            scores[key]["cover"] = item["cover"]
            scores[key]["link"] = item["link"]

    ranked = sorted(scores.values(), key=lambda x: x["score"], reverse=True)
    for i, book in enumerate(ranked[:top_n], start=1):
        book["rank"] = i
    return ranked[:top_n]


def merge_genre_rankings(items: list[dict], top_n: int = 5) -> list[dict]:
    return merge_rankings(items, top_n=top_n)


# ── MD 생성 ──────────────────────────────────────────────────
def build_markdown(overall: list[dict], genre_data: dict[str, list[dict]], date_str: str) -> str:
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    first_weekday = dt.replace(day=1).weekday()
    week = (dt.day + first_weekday - 1) // 7 + 1
    date_kr = f"{dt.year}년 {dt.month}월 {week}째주"

    rows = []
    rank_display = 0
    for b in overall:
        if b.get("genre_key") == "etc":
            continue
        rank_display += 1
        aladin = f"{b['sources'].get('알라딘', '')}위" if b['sources'].get('알라딘') else "-"
        kyobo  = f"{b['sources'].get('교보문고', '')}위" if b['sources'].get('교보문고') else "-"
        yes24  = f"{b['sources'].get('YES24', '')}위" if b['sources'].get('YES24') else "-"
        ridi   = f"{b['sources'].get('리디', '')}위" if b['sources'].get('리디') else "-"
        genre  = next((g["name"] for g in GENRES if g["key"] == b["genre_key"]), "")
        rows.append(f"| **{rank_display}** | [{b['title']}]({b['link']}) | {b['author']} | {genre} | {aladin} | {kyobo} | {yes24} | {ridi} |")

    overall_table = "\n".join([
        "| 순위 | 책 | 저자 | 장르 | 알라딘 | 교보문고 | YES24 | 리디 |",
        "|:----:|-----|------|------|:------:|:-------:|:-----:|:----:|",
        *rows,
    ])

    genre_sections = ""
    for genre in GENRES:
        books = genre_data.get(genre["key"], [])
        if not books:
            continue
        genre_rows = []
        for b in books:
            aladin = f"{b['sources'].get('알라딘', '')}위" if b['sources'].get('알라딘') else "-"
            kyobo  = f"{b['sources'].get('교보문고', '')}위" if b['sources'].get('교보문고') else "-"
            yes24  = f"{b['sources'].get('YES24', '')}위" if b['sources'].get('YES24') else "-"
            ridi   = f"{b['sources'].get('리디', '')}위" if b['sources'].get('리디') else "-"
            genre_rows.append(f"| **{b['rank']}** | [{b['title']}]({b['link']}) | {b['author']} | {aladin} | {kyobo} | {yes24} | {ridi} |")
        genre_table = "\n".join([
            "| 순위 | 책 | 저자 | 알라딘 | 교보문고 | YES24 | 리디 |",
            "|:----:|-----|------|:------:|:-------:|:-----:|:----:|",
            *genre_rows,
        ])
        genre_sections += f"\n### {genre['emoji']} {genre['name']}\n\n{genre_table}\n"

    return f"""---
title: "일반 도서 베스트셀러 ({date_kr})"
date: {date_str}
description: "알라딘·교보문고·YES24·리디 베스트셀러를 종합한 TOP 15와 장르별 베스트셀러입니다."
category: "bestseller"
isHidden: true
---

## 🏅 일반 도서 베스트셀러 TOP 15

{overall_table}

---

## 📚 장르별 베스트셀러
{genre_sections}

---

*데이터 출처: [알라딘](https://www.aladin.co.kr) · [교보문고](https://store.kyobobook.co.kr) · [YES24](https://www.yes24.com) · [리디](https://ridibooks.com)*
*매주 자동으로 수집되는 베스트셀러 리포트입니다.*
"""


# ── main ─────────────────────────────────────────────────────
def main():
    print(f"[{DATE}] 베스트셀러 수집 시작\n")

    client = genai.Client(api_key=GEMINI_API_KEY)

    # 알라딘 — API (requests)
    print("  📚 알라딘 전체 베스트셀러 수집...")
    aladin_overall = fetch_aladin_overall(20)
    print(f"     → {len(aladin_overall)}개")

    aladin_by_genre: dict[str, list[dict]] = {}
    for genre in GENRES:
        print(f"  📚 알라딘 [{genre['name']}] 수집...")
        aladin_by_genre[genre["key"]] = fetch_aladin_genre(genre, limit=10)

    # 교보문고 · YES24 · 리디 — Playwright (브라우저 1개 공유)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(locale="ko-KR")
        pw_page = ctx.new_page()

        print("  🏪 교보문고 수집...")
        kyobo_items = fetch_kyobo(pw_page, client, 20)
        print(f"     → {len(kyobo_items)}개")

        print("  🛒 YES24 수집...")
        yes24_items = fetch_yes24(pw_page, client, 20)
        print(f"     → {len(yes24_items)}개")

        print("  📱 리디 수집...")
        ridi_items = fetch_ridi(pw_page, 20)
        print(f"     → {len(ridi_items)}개")

        browser.close()

    # 종합 순위
    print("\n  🔢 종합 순위 계산...")
    all_items = aladin_overall + kyobo_items + yes24_items + ridi_items
    overall = merge_rankings(all_items, top_n=20)  # 기타 필터 후 15개 확보용 여유
    print(f"     → 종합 {len(overall)}개")

    genre_data: dict[str, list[dict]] = {}
    for genre in GENRES:
        combined = (
            aladin_by_genre.get(genre["key"], []) +
            [b for b in kyobo_items if b["genre_key"] == genre["key"]] +
            [b for b in yes24_items  if b["genre_key"] == genre["key"]] +
            [b for b in ridi_items   if b["genre_key"] == genre["key"]]
        )
        if combined:
            genre_data[genre["key"]] = merge_genre_rankings(combined, top_n=5)
            print(f"     [{genre['name']}] {len(genre_data[genre['key']])}개")

    md = build_markdown(overall, genre_data, DATE)
    slug = f"{DATE}-bestseller"
    out_dir = pathlib.Path("contents/book") / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.md"
    out_path.write_text(md, encoding="utf-8")

    print(f"\n✅ 완료: {out_path}")


if __name__ == "__main__":
    main()
