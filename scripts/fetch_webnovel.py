#!/usr/bin/env python3
"""웹소설 주간 베스트셀러 수집 — 카카오페이지 · 네이버 시리즈 · 리디"""

import os
import sys
import json
import re
import pathlib
from playwright.sync_api import sync_playwright, Page
from google import genai
from datetime import datetime

DATE = sys.argv[1] if len(sys.argv) > 1 else datetime.today().strftime("%Y-%m-%d")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY 환경변수가 필요합니다.")

GENRES = [
    {"key": "fantasy",    "name": "판타지",       "emoji": "⚔️"},
    {"key": "romance",    "name": "로맨스",       "emoji": "💕"},
    {"key": "martial",    "name": "무협",         "emoji": "🥋"},
    {"key": "modern",     "name": "현대판타지",   "emoji": "🌆"},
    {"key": "romfantasy", "name": "로맨스판타지", "emoji": "🏰"},
    {"key": "bl",         "name": "BL",           "emoji": "💙"},
]

GENRE_KEYWORDS: dict[str, list[str]] = {
    "fantasy":    ["판타지", "이세계", "마법", "용사", "엘프", "드래곤", "fantasy"],
    "romance":    ["로맨스", "연애", "순정", "romance"],
    "martial":    ["무협", "무림", "협객", "강호", "검객"],
    "modern":     ["현대판타지", "현판", "헌터", "능력자", "회귀", "각성", "던전"],
    "romfantasy": ["로맨스판타지", "로판", "황제", "공작", "공녀", "황녀", "귀족"],
    "bl":         ["bl", "boys love", "boys_love"],
}


def classify_genre(text: str) -> str:
    text_lower = text.lower()
    for key, keywords in GENRE_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return key
    return "fantasy"


def _find_list_items(obj, depth=0) -> list:
    if depth > 8:
        return []
    if isinstance(obj, list) and len(obj) >= 3:
        if isinstance(obj[0], dict) and any(k in obj[0] for k in ("title", "name", "id")):
            return obj
    if isinstance(obj, dict):
        for v in obj.values():
            found = _find_list_items(v, depth + 1)
            if found:
                return found
    return []


def _extract_next_data(html: str) -> dict:
    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    return {}


# ── 카카오페이지 ─────────────────────────────────────────────
def fetch_kakaopage(pw_page: Page, limit: int = 20) -> list[dict]:
    urls = [
        "https://page.kakao.com/landing/novel",
        "https://page.kakao.com/menu/10011",
        "https://page.kakao.com/home",
    ]
    for url in urls:
        try:
            print(f"  카카오페이지 URL={url}")
            pw_page.goto(url, wait_until="networkidle", timeout=30000)
            html = pw_page.content()
            data = _extract_next_data(html)
            if not data:
                print("  ⚠️  카카오페이지 __NEXT_DATA__ 없음, 다음 URL 시도")
                continue

            def search_kakao(obj, depth=0):
                if depth > 10:
                    return []
                if isinstance(obj, list) and len(obj) >= 3:
                    if isinstance(obj[0], dict) and any(
                        k in obj[0] for k in ("seriesTitle", "seriesId")  # 소설 고유 키 필수
                    ):
                        return obj
                if isinstance(obj, dict):
                    for key in ("list", "items", "contents", "novels", "works", "seriesList"):
                        if key in obj and isinstance(obj[key], list) and len(obj[key]) >= 3:
                            r = search_kakao(obj[key], depth + 1)
                            if r:
                                return r
                    for v in obj.values():
                        r = search_kakao(v, depth + 1)
                        if r:
                            return r
                return []

            items = search_kakao(data)
            if not items:
                print("  ⚠️  카카오페이지 items 없음, 다음 URL 시도")
                continue

            print(f"  카카오페이지 items={len(items)}개 발견")
            _KAKAO_NAV = {"추천", "웹툰", "웹소설", "책", "소설", "만화", "완결", "manhwa", "novel"}
            results = []
            for i, item in enumerate(items[:limit], start=1):
                title = item.get("seriesTitle") or item.get("title") or item.get("name") or ""
                if isinstance(title, dict):
                    title = title.get("main") or title.get("ko") or ""
                title = str(title).strip()
                if not title or len(title) < 2 or title.lower() in _KAKAO_NAV:
                    continue
                author = item.get("author") or item.get("authorName") or item.get("nickname") or ""
                if isinstance(author, dict):
                    author = author.get("name") or ""
                if isinstance(author, list):
                    author = author[0].get("name", "") if author else ""
                thumbnail = item.get("thumbnail") or item.get("thumbnailImage") or item.get("coverImage") or ""
                if isinstance(thumbnail, dict):
                    thumbnail = thumbnail.get("url") or thumbnail.get("src") or ""
                genre_text = str(item.get("genre") or item.get("category") or item.get("tags") or "")
                series_id = item.get("seriesId") or item.get("id") or ""
                link = f"https://page.kakao.com/content/{series_id}" if series_id else "https://page.kakao.com"
                results.append({
                    "rank": i,
                    "title": str(title).strip(),
                    "author": str(author).strip(),
                    "cover": str(thumbnail).strip(),
                    "link": link,
                    "genre_key": classify_genre(genre_text + " " + str(title)),
                    "source": "카카오페이지",
                })
            return results
        except Exception as e:
            print(f"  ⚠️  카카오페이지 {url} 실패: {e}")

    print("  ⚠️  카카오페이지 모든 URL 실패")
    return []


# ── 네이버 시리즈 ────────────────────────────────────────────
def fetch_naver_series(pw_page: Page, limit: int = 20) -> list[dict]:
    urls = [
        "https://series.naver.com/novel/top100List.series",
        "https://series.naver.com/novel/bestseller.series",
        "https://series.naver.com/novel/categoryList.series?categoryTypeCode=all",
    ]
    for url in urls:
        try:
            print(f"  네이버 시리즈 URL={url}")
            pw_page.goto(url, wait_until="networkidle", timeout=30000)
            html = pw_page.content()

            # __NEXT_DATA__ 시도
            data = _extract_next_data(html)
            if data:
                items = _find_list_items(data)
                if items:
                    results = []
                    for i, item in enumerate(items[:limit], start=1):
                        title = item.get("title") or item.get("name") or ""
                        if isinstance(title, dict):
                            title = title.get("main") or ""
                        author = item.get("author") or item.get("writerName") or ""
                        if isinstance(author, list):
                            author = author[0] if author else ""
                        thumbnail = item.get("thumbnail") or item.get("cover") or ""
                        if isinstance(thumbnail, dict):
                            thumbnail = thumbnail.get("url") or ""
                        genre_text = str(item.get("genre") or item.get("category") or "")
                        link_id = item.get("productId") or item.get("id") or ""
                        link = f"https://series.naver.com/novel/detail.series?productNo={link_id}" if link_id else url
                        results.append({
                            "rank": i,
                            "title": str(title).strip(),
                            "author": str(author).strip(),
                            "cover": str(thumbnail).strip(),
                            "link": link,
                            "genre_key": classify_genre(genre_text + " " + str(title)),
                            "source": "네이버 시리즈",
                        })
                    if results:
                        print(f"  네이버 시리즈 items={len(results)}개 발견 (NEXT_DATA)")
                        return results

            # JS 렌더링 후 DOM에서 직접 추출
            try:
                pw_page.wait_for_selector(
                    "a[href*='productNo'], a[href*='detail.series'], li.item_list a, .pic_area a",
                    timeout=15000,
                )
            except Exception:
                pass  # 타임아웃 시 현재 DOM으로 시도
            links = pw_page.query_selector_all(
                "a[href*='productNo'], a[href*='detail.series?productNo']"
            )
            results = []
            seen = set()
            for el in links:
                href = el.get_attribute("href") or ""
                m = re.search(r'productNo=(\d+)', href)
                if not m:
                    continue
                pid = m.group(1)
                if pid in seen:
                    continue
                seen.add(pid)
                title = el.inner_text().strip()
                _NAVER_PROMO = {"무료", "타임딜", "이벤트", "프로모션", "시리즈에디션", "시리즈 에디션", "매일"}
                if not title or len(title) < 2 or any(kw in title for kw in _NAVER_PROMO):
                    continue
                results.append({
                    "rank": len(results) + 1,
                    "title": title,
                    "author": "",
                    "cover": "",
                    "link": f"https://series.naver.com/novel/detail.series?productNo={pid}",
                    "genre_key": classify_genre(title),
                    "source": "네이버 시리즈",
                })
                if len(results) >= limit:
                    break
            if results:
                print(f"  네이버 시리즈 items={len(results)}개 발견 (DOM)")
                return results

            print("  ⚠️  네이버 시리즈 데이터 없음, 다음 URL 시도")
        except Exception as e:
            print(f"  ⚠️  네이버 시리즈 {url} 실패: {e}")

    print("  ⚠️  네이버 시리즈 모든 URL 실패")
    return []


# ── 리디 웹소설 ──────────────────────────────────────────────
def fetch_ridi_webnovel(pw_page: Page, limit: int = 20) -> list[dict]:
    urls = [
        "https://ridibooks.com/category/bestsellers/1750",   # 판타지 웹소설
        "https://ridibooks.com/category/bestsellers/1650",   # 로맨스 웹소설
        "https://ridibooks.com/category/bestsellers/100",    # 소설 전체
    ]
    for url in urls:
        try:
            print(f"  리디 웹소설 URL={url}")
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
                for key in ("bestsellers", "chartBooks", "books", "items", "contents"):
                    node = q_data.get(key)
                    if isinstance(node, dict) and "items" in node:
                        items = node["items"]
                        break
                    if isinstance(node, list) and node:
                        items = node
                        break
                if not items:
                    items = _find_list_items(q_data)
                if items:
                    break
            if not items:
                # __NEXT_DATA__ 실패 시 DOM에서 직접 추출 시도
                try:
                    pw_page.wait_for_selector("a[href*='/books/']", timeout=10000)
                except Exception:
                    pass
                dom_links = pw_page.query_selector_all("li a[href*='/books/']")
                dom_results = []
                seen_ids: set[str] = set()
                _RIDI_CAT = {"소설", "경영/경제", "인문/사회/역사", "자기계발", "에세이/시",
                             "여행", "종교", "웹툰", "만화", "잡지"}
                for el in dom_links:
                    href = el.get_attribute("href") or ""
                    m = re.search(r'/books/(\d{8,})', href)  # 리디 북 ID는 8자리 이상
                    if not m:
                        continue
                    book_id = m.group(1)
                    if book_id in seen_ids:
                        continue
                    seen_ids.add(book_id)
                    title_el = el.query_selector("strong, span, p")
                    title = (title_el.inner_text().strip() if title_el else el.inner_text().strip())
                    if not title or len(title) < 2 or title in _RIDI_CAT:
                        continue
                    dom_results.append({
                        "rank": len(dom_results) + 1,
                        "title": title,
                        "author": "",
                        "cover": "",
                        "link": f"https://ridibooks.com/books/{book_id}",
                        "genre_key": classify_genre(title),
                        "source": "리디",
                    })
                    if len(dom_results) >= limit:
                        break
                if dom_results:
                    print(f"  리디 웹소설 items={len(dom_results)}개 발견 (DOM)")
                    return dom_results
                print("  ⚠️  리디 items 없음, 다음 URL 시도")
                continue
            print(f"  리디 웹소설 items={len(items)}개 발견")
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
                    "genre_key": classify_genre(cat_text + " " + title),
                    "source": "리디",
                })
            return results
        except Exception as e:
            print(f"  ⚠️  리디 {url} 실패: {e}")

    print("  ⚠️  리디 웹소설 모든 URL 실패")
    return []


# ── 종합 순위 합산 ──────────────────────────────────────────
def merge_rankings(all_items: list[dict], top_n: int = 15, MAX_RANK: int = 20) -> list[dict]:
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
                "score": 0,
                "sources": {},
                "genre_key": item.get("genre_key", "fantasy"),
            }
        scores[key]["score"] += pts
        scores[key]["sources"][item["source"]] = item["rank"]

    ranked = sorted(scores.values(), key=lambda x: x["score"], reverse=True)
    for i, novel in enumerate(ranked[:top_n], start=1):
        novel["rank"] = i
    return ranked[:top_n]


def group_by_genre(all_items: list[dict], top_n: int = 5) -> dict[str, list[dict]]:
    genre_map: dict[str, list[dict]] = {}
    for item in all_items:
        genre_map.setdefault(item.get("genre_key", "fantasy"), []).append(item)
    result = {}
    for genre in GENRES:
        items = sorted(genre_map.get(genre["key"], []), key=lambda x: x["rank"])[:top_n]
        for i, item in enumerate(items, start=1):
            item["genre_rank"] = i
        result[genre["key"]] = items
    return result


# ── Gemini AI 분석 ───────────────────────────────────────────
def generate_ai_content(overall: list[dict], genre_data: dict[str, list[dict]]) -> str:
    client = genai.Client(api_key=GEMINI_API_KEY)

    overall_list = "\n".join(
        f"{b['rank']}. {b['title']} - {b['author']} "
        f"({', '.join(f'{k} {v}위' for k, v in b['sources'].items())})"
        for b in overall[:10]
    )
    genre_summary = ""
    for genre in GENRES:
        books = genre_data.get(genre["key"], [])
        if books:
            genre_summary += f"\n[{genre['name']}]\n"
            genre_summary += "\n".join(
                f"  {b.get('genre_rank', b['rank'])}. {b['title']} - {b['author']}"
                for b in books[:3]
            )

    prompt = f"""아래는 카카오페이지·네이버 시리즈·리디 웹소설 베스트셀러를 종합한 데이터입니다.

## 종합 TOP 10
{overall_list}

## 장르별 TOP 3
{genre_summary}

위 데이터를 바탕으로 다음을 작성해주세요:
1. 이번 주 웹소설 트렌드 분석 (3-4문장)
2. 주목할 웹소설 TOP 5 각각 한 줄 코멘트
3. 장르별 트렌드 한 줄씩
4. 독자층의 현재 분위기를 한 문장으로

형식 (마크다운):

## 📊 이번 주 웹소설 트렌드
[트렌드 분석 내용]

## 🏆 이번 주 주목할 웹소설

- **1위 [작품명]** — [한 줄 코멘트]
- **2위 [작품명]** — [한 줄 코멘트]
- **3위 [작품명]** — [한 줄 코멘트]
- **4위 [작품명]** — [한 줄 코멘트]
- **5위 [작품명]** — [한 줄 코멘트]

## 🗂️ 장르별 트렌드

- **⚔️ 판타지** — [한 줄]
- **💕 로맨스** — [한 줄]
- **🥋 무협** — [한 줄]
- **🌆 현대판타지** — [한 줄]
- **🏰 로맨스판타지** — [한 줄]
- **💙 BL** — [한 줄]
"""
    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    return response.text


# ── 마크다운 생성 ─────────────────────────────────────────────
def build_markdown(overall: list[dict], genre_data: dict[str, list[dict]], ai_content: str, date_str: str) -> str:
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    first_weekday = dt.replace(day=1).weekday()
    week = (dt.day + first_weekday - 1) // 7 + 1
    date_kr = f"{dt.year}년 {dt.month}월 {week}째주"

    rows = []
    for b in overall:
        kakao = f"{b['sources'].get('카카오페이지', '-')}위" if b['sources'].get('카카오페이지') else "-"
        naver = f"{b['sources'].get('네이버 시리즈', '-')}위" if b['sources'].get('네이버 시리즈') else "-"
        ridi  = f"{b['sources'].get('리디', '-')}위" if b['sources'].get('리디') else "-"
        genre = next((g["name"] for g in GENRES if g["key"] == b["genre_key"]), "기타")
        rows.append(f"| **{b['rank']}** | [{b['title']}]({b['link']}) | {b['author']} | {genre} | {kakao} | {naver} | {ridi} |")

    overall_table = "\n".join([
        "| 순위 | 작품 | 작가 | 장르 | 카카오페이지 | 네이버 시리즈 | 리디 |",
        "|:----:|------|------|------|:----------:|:-----------:|:----:|",
        *rows,
    ])

    genre_sections = ""
    for genre in GENRES:
        books = genre_data.get(genre["key"], [])
        if not books:
            continue
        genre_rows = []
        for b in books:
            srcs = b.get('sources', {b.get('source', ''): b.get('rank')})
            kakao = f"{srcs.get('카카오페이지')}위" if srcs.get('카카오페이지') else "-"
            naver = f"{srcs.get('네이버 시리즈')}위" if srcs.get('네이버 시리즈') else "-"
            ridi  = f"{srcs.get('리디')}위" if srcs.get('리디') else "-"
            genre_rows.append(
                f"| **{b.get('genre_rank', b['rank'])}** | [{b['title']}]({b['link']}) | {b['author']} | {kakao} | {naver} | {ridi} |"
            )
        genre_table = "\n".join([
            "| 순위 | 작품 | 작가 | 카카오페이지 | 네이버 시리즈 | 리디 |",
            "|:----:|------|------|:----------:|:-----------:|:----:|",
            *genre_rows,
        ])
        genre_sections += f"\n### {genre['emoji']} {genre['name']}\n\n{genre_table}\n"

    sources_available = set()
    for b in overall:
        sources_available.update(b["sources"].keys())
    sources_str = " · ".join(
        f"[{s}]({'https://page.kakao.com' if s == '카카오페이지' else 'https://series.naver.com' if s == '네이버 시리즈' else 'https://ridibooks.com'})"
        for s in ["카카오페이지", "네이버 시리즈", "리디"] if s in sources_available
    )

    return f"""---
title: "웹소설 베스트셀러 ({date_kr})"
date: {date_str}
description: "카카오페이지·네이버 시리즈·리디 웹소설 베스트셀러를 종합한 주간 TOP 15입니다."
category: "webnovel"
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

*데이터 출처: {sources_str}*
*Gemini AI가 자동으로 수집·분석한 웹소설 베스트셀러 리포트입니다.*
"""


# ── main ─────────────────────────────────────────────────────
def main():
    print(f"[{DATE}] 웹소설 베스트셀러 수집 시작\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(locale="ko-KR")
        pw_page = ctx.new_page()

        print("  📱 카카오페이지 수집...")
        kakao_items = fetch_kakaopage(pw_page, 20)
        print(f"     → {len(kakao_items)}개")

        print("  📗 네이버 시리즈 수집...")
        naver_items = fetch_naver_series(pw_page, 20)
        print(f"     → {len(naver_items)}개")

        print("  📘 리디 웹소설 수집...")
        ridi_items = fetch_ridi_webnovel(pw_page, 20)
        print(f"     → {len(ridi_items)}개")

        browser.close()

    all_items = kakao_items + naver_items + ridi_items
    if not all_items:
        print("\n❌ 수집된 데이터 없음. 종료합니다.")
        sys.exit(1)

    print("\n  🔢 종합 순위 계산...")
    overall = merge_rankings(all_items, top_n=15)
    print(f"     → 종합 {len(overall)}개")

    genre_data = group_by_genre(all_items, top_n=5)
    for genre in GENRES:
        cnt = len(genre_data.get(genre["key"], []))
        if cnt:
            print(f"     [{genre['name']}] {cnt}개")

    print("\n  🤖 Gemini AI 분석 중...")
    ai_content = generate_ai_content(overall, genre_data)

    md = build_markdown(overall, genre_data, ai_content, DATE)
    slug = f"{DATE}-webnovel"
    out_dir = pathlib.Path("contents/book") / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.md"
    out_path.write_text(md, encoding="utf-8")

    print(f"\n✅ 완료: {out_path}")


if __name__ == "__main__":
    main()
