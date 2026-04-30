#!/usr/bin/env python3
"""웹소설 주간 베스트셀러 수집 — 카카오페이지 · 네이버 시리즈 · 리디
Playwright로 렌더링 후 Gemini AI가 텍스트를 직접 파싱 → 구조 변경에 자동 적응
"""

import os
import sys
import json
import re
import pathlib
from playwright.sync_api import sync_playwright, Page
from google import genai
from google.genai import types as genai_types
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


# ── AI 기반 범용 수집기 ──────────────────────────────────────
def _fetch_page_with_gemini(
    pw_page: Page,
    client: genai.Client,
    urls: list[str],
    source_name: str,
    limit: int = 20,
) -> list[dict]:
    """Playwright 렌더링 → Gemini AI 파싱. DOM/URL 구조 변경에 자동 적응."""
    for url in urls:
        try:
            print(f"  {source_name} URL={url}")
            pw_page.goto(url, wait_until="networkidle", timeout=30000)

            # 메인 콘텐츠 텍스트 추출 (main 태그 우선, 없으면 body)
            text: str = pw_page.evaluate("""() => {
                const el = document.querySelector(
                    'main, [role="main"], #content, #wrap, .container, article'
                );
                return (el || document.body).innerText;
            }""")

            if not text or len(text.strip()) < 50:
                print(f"  ⚠️  {source_name} 페이지 텍스트 없음")
                continue

            prompt = f"""다음은 "{source_name}" 웹소설 베스트셀러 페이지의 텍스트입니다.

<page_text>
{text[:8000]}
</page_text>

위 텍스트에서 웹소설 베스트셀러 순위를 추출하세요.

규칙:
- 실제 웹소설 작품 제목만 포함
- 메뉴, 배너, 카테고리명, 프로모션 문구("추천", "완결", "무료", "타임딜", "이벤트", "NEW" 등) 제외
- 작가명이 없으면 빈 문자열
- 최대 {limit}개
- 반드시 JSON 배열로만 응답 (다른 텍스트 없이)

[{{"rank": 1, "title": "작품명", "author": "작가명"}}]"""

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    response_mime_type="application/json"
                ),
            )

            # JSON 파싱 (배열 추출 fallback 포함)
            raw = response.text.strip()
            try:
                items = json.loads(raw)
            except Exception:
                m = re.search(r"\[.*\]", raw, re.DOTALL)
                if not m:
                    print(f"  ⚠️  {source_name} JSON 파싱 실패")
                    continue
                items = json.loads(m.group())

            if not isinstance(items, list) or len(items) < 3:
                print(f"  ⚠️  {source_name} 추출 결과 부족 ({len(items) if isinstance(items, list) else 0}개), 다음 URL 시도")
                continue

            results = []
            for item in items:
                title = str(item.get("title", "")).strip()
                if not title or len(title) < 2:
                    continue
                results.append({
                    "rank": len(results) + 1,
                    "title": title,
                    "author": str(item.get("author", "")).strip(),
                    "cover": "",
                    "link": url,
                    "genre_key": classify_genre(title),
                    "source": source_name,
                })

            if results:
                print(f"  {source_name} {len(results)}개 수집 완료 (AI)")
                return results

            print(f"  ⚠️  {source_name} 유효한 작품 없음, 다음 URL 시도")
        except Exception as e:
            print(f"  ⚠️  {source_name} {url} 실패: {e}")

    print(f"  ⚠️  {source_name} 모든 URL 실패")
    return []


# ── 각 플랫폼 수집 ───────────────────────────────────────────
def fetch_kakaopage(pw_page: Page, client: genai.Client, limit: int = 20) -> list[dict]:
    return _fetch_page_with_gemini(pw_page, client, [
        "https://page.kakao.com/menu/10011/screen/94",  # 실시간 랭킹
        "https://page.kakao.com/menu/10011",
    ], "카카오페이지", limit)


def fetch_naver_series(pw_page: Page, client: genai.Client, limit: int = 20) -> list[dict]:
    return _fetch_page_with_gemini(pw_page, client, [
        "https://series.naver.com/novel/top100List.series",
        "https://series.naver.com/novel/bestseller.series",
    ], "네이버 시리즈", limit)


def fetch_ridi_webnovel(pw_page: Page, client: genai.Client, limit: int = 20) -> list[dict]:
    return _fetch_page_with_gemini(pw_page, client, [
        "https://ridibooks.com/category/bestsellers/1750",  # 판타지
        "https://ridibooks.com/category/6050",              # 로맨스판타지
        "https://ridibooks.com/category/1650",              # 로맨스
    ], "리디", limit)


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


# ── Gemini AI 트렌드 분석 ────────────────────────────────────
def generate_ai_content(client: genai.Client, overall: list[dict], genre_data: dict[str, list[dict]]) -> str:
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
        kakao = f"{b['sources'].get('카카오페이지')}위" if b['sources'].get('카카오페이지') else "-"
        naver = f"{b['sources'].get('네이버 시리즈')}위" if b['sources'].get('네이버 시리즈') else "-"
        ridi  = f"{b['sources'].get('리디')}위" if b['sources'].get('리디') else "-"
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
            srcs = b.get("sources", {b.get("source", ""): b.get("rank")})
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

    client = genai.Client(api_key=GEMINI_API_KEY)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            locale="ko-KR",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )
        pw_page = ctx.new_page()

        print("  📱 카카오페이지 수집...")
        kakao_items = fetch_kakaopage(pw_page, client, 20)
        print(f"     → {len(kakao_items)}개")

        print("  📗 네이버 시리즈 수집...")
        naver_items = fetch_naver_series(pw_page, client, 20)
        print(f"     → {len(naver_items)}개")

        print("  📘 리디 웹소설 수집...")
        ridi_items = fetch_ridi_webnovel(pw_page, client, 20)
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
    ai_content = generate_ai_content(client, overall, genre_data)

    md = build_markdown(overall, genre_data, ai_content, DATE)
    slug = f"{DATE}-webnovel"
    out_dir = pathlib.Path("contents/book") / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.md"
    out_path.write_text(md, encoding="utf-8")

    print(f"\n✅ 완료: {out_path}")


if __name__ == "__main__":
    main()
