#!/usr/bin/env python3
"""웹소설 주간 베스트셀러 — 장르별 수집

수집 전략:
  리디  → 장르별 전용 URL에서 각각 수집 (알려진 3개 + 나머지 자동 탐색)
  카카오 → 전체 랭킹 1회 로드 → Gemini가 장르별 분류
  네이버 → 전체 랭킹 1회 로드 → Gemini가 장르별 분류
  → 플랫폼별 장르 데이터를 통합해 장르 내 종합 순위 산출
"""

import os
import sys
import json
import re
import pathlib
from urllib.parse import quote
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
    {"key": "romfantasy", "name": "로맨스판타지", "emoji": "🏰"},
    {"key": "romance",    "name": "로맨스",       "emoji": "💕"},
    {"key": "modern",     "name": "현대판타지",   "emoji": "🌆"},
    {"key": "martial",    "name": "무협",         "emoji": "🥋"},
    {"key": "bl",         "name": "BL",           "emoji": "💙"},
]

GENRE_KR_TO_KEY = {g["name"]: g["key"] for g in GENRES}
GENRE_KEY_TO_NAME = {g["key"]: g["name"] for g in GENRES}

# 네이버 시리즈 장르별 genreCode 파라미터
# rankingType=TOTAL&genreCode=XXX 형식 (BL 확인됨)
NAVER_GENRE_CODES: dict[str, list[str]] = {
    "fantasy":    ["판타지"],
    "romfantasy": ["로판", "로맨스판타지"],
    "romance":    ["로맨스"],
    "modern":     ["현대판타지", "현판"],
    "martial":    ["무협"],
    "bl":         ["BL", "bl"],
}

_NAVER_BASE = "https://series.naver.com/novel/top100List.series"

# 리디 장르별 알려진 URL
RIDI_GENRE_URLS: dict[str, list[str]] = {
    "fantasy":    ["https://ridibooks.com/category/bestsellers/1750"],
    "romfantasy": ["https://ridibooks.com/category/bestsellers/6050",
                   "https://ridibooks.com/category/6050"],
    "romance":    ["https://ridibooks.com/category/bestsellers/1650",
                   "https://ridibooks.com/category/1650"],
    "modern":     ["https://ridibooks.com/category/bestsellers/1753",
                   "https://ridibooks.com/category/1753"],
    "martial":    ["https://ridibooks.com/category/bestsellers/1754",
                   "https://ridibooks.com/category/1754"],
    "bl":         ["https://ridibooks.com/category/bestsellers/4150",
                   "https://ridibooks.com/category/4150"],
}

# 장르 탐색 힌트
GENRE_SEARCH_HINTS: dict[str, str] = {
    "fantasy":    "판타지 웹소설 베스트셀러 (이세계·마법·드래곤 등)",
    "romfantasy": "로맨스판타지 웹소설 베스트셀러 (귀족·황제·공녀 등 역사판타지 로맨스)",
    "romance":    "로맨스 웹소설 베스트셀러 (현대 연애·순정 등)",
    "modern":     "현대판타지 웹소설 베스트셀러 (헌터·각성·던전·회귀물 등)",
    "martial":    "무협 웹소설 베스트셀러 (무림·검객·협객 등)",
    "bl":         "BL 웹소설 베스트셀러 (남자끼리 로맨스)",
}


# ── URL 자동 탐색 ────────────────────────────────────────────
def _discover_genre_urls_bulk(
    pw_page: Page,
    client: genai.Client,
    nav_url: str,
    source_name: str,
    genre_keys: list[str],
) -> dict[str, str]:
    """메인 페이지에서 여러 장르의 URL을 한 번의 Gemini 호출로 탐색"""
    try:
        pw_page.goto(nav_url, wait_until="networkidle", timeout=30000)
        links: list[dict] = pw_page.evaluate("""() => {
            const seen = new Set();
            return Array.from(document.querySelectorAll('a[href]'))
                .map(a => ({
                    text: a.innerText.trim().replace(/\\s+/g, ' ').slice(0, 60),
                    href: a.href
                }))
                .filter(l => {
                    if (!l.text || !l.href.startsWith('http') || seen.has(l.href)) return false;
                    seen.add(l.href);
                    return true;
                }).slice(0, 200);
        }""")
        if not links:
            return {}

        genre_kr_to_key = {GENRE_KEY_TO_NAME[k]: k for k in genre_keys}
        links_md = "\n".join(f"- [{l['text']}]({l['href']})" for l in links[:150])
        genre_example = {name: "URL 또는 null" for name in genre_kr_to_key}

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""{source_name} 웹소설 페이지 링크에서 각 장르별 랭킹/베스트셀러 URL을 찾아주세요.

링크 목록:
{links_md}

각 장르에 해당하는 랭킹 페이지 URL을 JSON으로 응답 (없으면 null):
{json.dumps(genre_example, ensure_ascii=False)}""",
            config=genai_types.GenerateContentConfig(response_mime_type="application/json"),
        )
        data = json.loads(response.text)
        result = {}
        for name, key in genre_kr_to_key.items():
            val = data.get(name)
            if val and isinstance(val, str) and val.startswith("http"):
                result[key] = val
                print(f"  🔍 {source_name} [{name}] → {val}")
        return result
    except Exception as e:
        print(f"  ⚠️  {source_name} 장르 URL 탐색 실패: {e}")
        return {}


def _discover_url(
    pw_page: Page,
    client: genai.Client,
    base_url: str,
    source_name: str,
    search_hint: str,
) -> str | None:
    try:
        pw_page.goto(base_url, wait_until="networkidle", timeout=30000)
        links: list[dict] = pw_page.evaluate("""() => {
            const seen = new Set();
            return Array.from(document.querySelectorAll('a[href]'))
                .map(a => ({
                    text: a.innerText.trim().replace(/\\s+/g, ' ').slice(0, 60),
                    href: a.href
                }))
                .filter(l => {
                    if (!l.text || !l.href.startsWith('http') || seen.has(l.href)) return false;
                    seen.add(l.href);
                    return true;
                }).slice(0, 200);
        }""")
        if not links:
            return None

        RANK_KW = ["베스트", "랭킹", "순위", "best", "rank", "top", "인기", "실시간", "100", "웹소설"]
        filtered = [l for l in links if any(kw in (l["text"] + l["href"]).lower() for kw in RANK_KW)]
        candidates = filtered if len(filtered) >= 3 else links[:80]
        links_md = "\n".join(f"- [{l['text']}]({l['href']})" for l in candidates[:80])

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""{source_name}에서 "{search_hint}"에 해당하는 페이지 URL을 찾아주세요.

후보 링크:
{links_md}

가장 적합한 URL 하나만 응답 (http로 시작, 다른 텍스트 없이):""",
        )
        m = re.search(r"https?://\S+", response.text)
        if m:
            url = m.group().rstrip(".,;)\"'")
            print(f"  🔍 {source_name} 탐색된 URL: {url}")
            return url
    except Exception as e:
        print(f"  ⚠️  {source_name} URL 탐색 실패: {e}")
    return None


# ── 페이지 텍스트 + 링크 추출 ────────────────────────────────
def _get_page_data(
    pw_page: Page,
    url: str,
    link_pattern: str = "",
) -> tuple[str, dict[str, str]]:
    """페이지 텍스트 + (제목→URL) 매핑 반환"""
    pw_page.goto(url, wait_until="networkidle", timeout=30000)
    text = pw_page.evaluate("""() => {
        const el = document.querySelector(
            'main, [role="main"], #content, #wrap, .container, article'
        );
        return (el || document.body).innerText;
    }""")
    title_to_url: dict[str, str] = {}
    if link_pattern:
        pat_json = json.dumps(link_pattern)
        links: list[dict] = pw_page.evaluate(f"""() => {{
            const pat = {pat_json};
            const seen = new Set();
            return Array.from(document.querySelectorAll('a[href]'))
                .filter(a => a.href && a.href.includes(pat))
                .map(a => ({{
                    text: a.innerText.trim().replace(/\\s+/g, ' '),
                    href: a.href
                }}))
                .filter(l => {{
                    if (!l.text || l.text.length < 2 || seen.has(l.href)) return false;
                    seen.add(l.href);
                    return true;
                }});
        }}""")
        for link in links:
            t = link["text"].strip()
            if t:
                title_to_url[t] = link["href"]
    return text, title_to_url


def _get_page_text(pw_page: Page, url: str) -> str:
    text, _ = _get_page_data(pw_page, url)
    return text


def _lookup_link(title: str, title_to_url: dict[str, str]) -> str:
    """제목으로 URL 검색 (정확→정규화→부분 순서로 매칭)"""
    if not title_to_url or not title:
        return ""
    if title in title_to_url:
        return title_to_url[title]
    def norm(t: str) -> str:
        return re.sub(r"[\s\W]", "", t).lower()
    nt = norm(title)
    for t, u in title_to_url.items():
        if norm(t) == nt:
            return u
    for t, u in title_to_url.items():
        if nt and (nt in norm(t) or norm(t) in nt):
            return u
    return ""


# ── 리디: 장르별 전용 URL 수집 ───────────────────────────────
def fetch_ridi_by_genre(
    pw_page: Page,
    client: genai.Client,
    limit: int = 15,
) -> dict[str, list[dict]]:
    """리디: 장르별 URL에서 각각 수집 → dict[genre_key, items]"""
    result: dict[str, list[dict]] = {}
    used_urls: set[str] = set()  # 이미 사용한 URL 재사용 방지

    for genre in GENRES:
        key = genre["key"]
        name = genre["name"]
        known = RIDI_GENRE_URLS.get(key, [])

        items = []
        for url in known:
            if url in used_urls:
                print(f"  ⚠️  리디 [{name}] URL 중복, 건너뜀: {url}")
                continue
            try:
                print(f"  리디 [{name}] URL={url}")
                text, title_to_url = _get_page_data(pw_page, url, link_pattern="/books/")
                if not text or len(text.strip()) < 50:
                    continue
                items = _parse_single_genre(client, text, "리디", name, limit, title_to_url)
                if items:
                    used_urls.add(url)
                    break
            except Exception as e:
                print(f"  ⚠️  리디 [{name}] {url} 실패: {e}")

        if items:
            for item in items:
                item["source"] = "리디"
                item["genre_key"] = key
            result[key] = items
            print(f"  리디 [{name}] {len(items)}개 수집")
        else:
            print(f"  ⚠️  리디 [{name}] 수집 실패")

    return result


# ── 네이버 시리즈: 장르별 genreCode URL로 개별 수집 ──────────
def fetch_naver_by_genre(
    pw_page: Page,
    client: genai.Client,
    limit: int = 10,
) -> dict[str, list[dict]]:
    """네이버 시리즈: rankingType=TOTAL&genreCode=XXX URL로 장르별 수집"""
    result: dict[str, list[dict]] = {}

    for genre in GENRES:
        key = genre["key"]
        name = genre["name"]
        codes = NAVER_GENRE_CODES.get(key, [])

        items = []
        for code in codes:
            url = f"{_NAVER_BASE}?rankingType=TOTAL&genreCode={code}"
            try:
                print(f"  네이버 시리즈 [{name}] URL={url}")
                text, title_to_url = _get_page_data(pw_page, url, link_pattern="productNo")
                if not text or len(text.strip()) < 50:
                    continue
                items = _parse_single_genre(client, text, "네이버 시리즈", name, limit, title_to_url)
                if items:
                    break
            except Exception as e:
                print(f"  ⚠️  네이버 [{name}] {url} 실패: {e}")

        if items:
            for item in items:
                item["source"] = "네이버 시리즈"
                item["genre_key"] = key
                # 링크가 없으면 네이버 시리즈 검색 URL로 폴백
                if not item.get("link"):
                    item["link"] = f"https://series.naver.com/search/search.series?t=novel&q={quote(item['title'])}"
            result[key] = items
            print(f"  네이버 시리즈 [{name}] {len(items)}개 수집")
        else:
            print(f"  ⚠️  네이버 시리즈 [{name}] 수집 실패")

    return result


# ── 카카오/네이버: 전체 페이지 로드 → 장르별 분류 ───────────
def fetch_platform_all_genres(
    pw_page: Page,
    client: genai.Client,
    urls: list[str],
    base_url: str,
    source_name: str,
    link_pattern: str = "",
    limit: int = 10,
) -> dict[str, list[dict]]:
    """전체 랭킹 페이지 1회 로드 → Gemini가 장르별 분류"""
    text = ""
    title_to_url: dict[str, str] = {}
    for url in urls:
        try:
            print(f"  {source_name} URL={url}")
            text, title_to_url = _get_page_data(pw_page, url, link_pattern)
            if text and len(text.strip()) > 50:
                break
            text = ""
        except Exception as e:
            print(f"  ⚠️  {source_name} {url} 실패: {e}")

    # 알려진 URL 모두 실패 → 자동 탐색
    if not text:
        print(f"  🔍 {source_name} URL 자동 탐색...")
        disc = _discover_url(pw_page, client, base_url, source_name, "웹소설 베스트셀러 랭킹")
        if disc:
            try:
                text, title_to_url = _get_page_data(pw_page, disc, link_pattern)
            except Exception as e:
                print(f"  ⚠️  {source_name} 탐색 URL 실패: {e}")

    if not text:
        print(f"  ⚠️  {source_name} 수집 실패")
        return {}

    # Gemini: 한 번에 전 장르 분류
    genre_names = [g["name"] for g in GENRES]
    genre_json_example = {g["name"]: [{"rank": 1, "title": "작품명", "author": "작가명"}] for g in GENRES}

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"""다음은 "{source_name}" 웹소설 페이지의 텍스트입니다.

<page_text>
{text[:15000]}
</page_text>

위 텍스트에서 웹소설을 장르별로 분류해서 추출하세요.

장르 분류 기준 (엄격하게 적용):
- 판타지: 이세계·마법·용사·드래곤 등 (현대 배경 제외)
- 로맨스판타지: 귀족·황제·공녀·환생·빙의 등 역사/판타지 배경 이성 로맨스
- 로맨스: 현대 배경 이성 로맨스·순정 (판타지 배경 제외, BL 제외)
- 현대판타지: 현대 배경 헌터·각성·던전·회귀물·능력자 등 (로맨스 중심 제외)
- 무협: 무림·검객·협객 등 중국식 배경
- BL: 남성 캐릭터 간 로맨스 (Boys Love)

규칙:
- 실제 웹소설 작품 제목만 (메뉴·배너·프로모션 문구 제외)
- 각 작품은 반드시 하나의 장르에만 배정 (중복 배정 금지)
- 장르당 최대 {limit}개
- author 필드: 페이지에 작가명이 표시되어 있으면 반드시 포함. 찾을 수 없으면 빈 문자열 "" 사용 (절대 "None", "null", "unknown" 사용 금지)
- JSON으로만 응답

{json.dumps(genre_json_example, ensure_ascii=False)}""",
        config=genai_types.GenerateContentConfig(response_mime_type="application/json"),
    )

    raw = response.text.strip()
    try:
        data = json.loads(raw)
    except Exception:
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if not m:
            print(f"  ⚠️  {source_name} JSON 파싱 실패")
            return {}
        data = json.loads(m.group())

    result: dict[str, list[dict]] = {}
    for genre in GENRES:
        name = genre["name"]
        key = genre["key"]
        raw_items = data.get(name, [])
        if not isinstance(raw_items, list):
            continue
        items = []
        for item in raw_items:
            title = str(item.get("title", "")).strip()
            if not title or len(title) < 2:
                continue
            link = _lookup_link(title, title_to_url)
            if not link and source_name == "카카오페이지":
                link = f"https://page.kakao.com/search/result?keyword={quote(title)}"
            elif not link:
                link = ""
            author = str(item.get("author", "")).strip()
            if author.lower() in ("none", "null", "n/a", "없음", "미상", "unknown"):
                author = ""
            items.append({
                "rank": len(items) + 1,
                "title": title,
                "author": author,
                "cover": "",
                "link": link,
                "genre_key": key,
                "source": source_name,
            })
        if items:
            result[key] = items
            print(f"  {source_name} [{name}] {len(items)}개 분류")

    return result


# ── 장르별 플랫폼 데이터 통합 ───────────────────────────────
def merge_genre_data(
    *platform_data: dict[str, list[dict]],
    top_n: int = 10,
    MAX_RANK: int = 15,
) -> dict[str, list[dict]]:
    """여러 플랫폼의 장르별 데이터를 통합해 장르 내 순위 산출"""
    def normalize(t: str) -> str:
        return re.sub(r"[\s\W]", "", t).lower()

    genre_result: dict[str, list[dict]] = {}

    for genre in GENRES:
        key = genre["key"]
        scores: dict[str, dict] = {}

        for pdata in platform_data:
            items = pdata.get(key, [])
            for item in items:
                if not item.get("title"):
                    continue
                nkey = normalize(item["title"])
                pts = max(0, MAX_RANK + 1 - item["rank"])
                if nkey not in scores:
                    scores[nkey] = {
                        "title": item["title"],
                        "author": item.get("author", ""),
                        "cover": item.get("cover", ""),
                        "link": item.get("link", ""),
                        "score": 0,
                        "sources": {},
                        "genre_key": key,
                    }
                scores[nkey]["score"] += pts
                scores[nkey]["sources"][item["source"]] = item["rank"]
                # 링크 없으면 다른 플랫폼 링크로 업데이트
                if not scores[nkey]["link"] and item.get("link"):
                    scores[nkey]["link"] = item["link"]

        if scores:
            ranked = sorted(scores.values(), key=lambda x: x["score"], reverse=True)
            for i, novel in enumerate(ranked[:top_n], start=1):
                novel["rank"] = i
            genre_result[key] = ranked[:top_n]

    return genre_result


# ── Gemini: 단일 장르 추출 (리디용) ────────────────────────
_GENRE_CRITERIA: dict[str, str] = {
    "판타지":       "이세계·마법·용사·드래곤 등 (현대 배경 제외)",
    "로맨스판타지": "귀족·황제·공녀·환생·빙의 등 역사/판타지 배경 이성 로맨스 (남성 주인공 아님)",
    "로맨스":       "현대 배경 이성 로맨스·순정 (BL 제외, 판타지 배경 제외)",
    "현대판타지":   "현대 배경 헌터·각성·던전·회귀물·능력자 등",
    "무협":         "무림·검객·협객·협녀 등 중국식 배경",
    "BL":           "남성 캐릭터 간의 로맨스 (Boys Love)",
}


def _parse_single_genre(
    client: genai.Client,
    text: str,
    source_name: str,
    genre_name: str,
    limit: int,
    title_to_url: dict[str, str] | None = None,
) -> list[dict]:
    criteria = _GENRE_CRITERIA.get(genre_name, genre_name)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"""다음은 "{source_name}" "{genre_name}" 웹소설 베스트셀러 페이지의 텍스트입니다.

<page_text>
{text[:8000]}
</page_text>

"{genre_name}" 장르 정의: {criteria}

이 장르에 해당하는 웹소설 베스트셀러 순위를 추출하세요.
- 실제 웹소설 작품 제목만 (메뉴·배너·프로모션 문구 제외)
- 반드시 위 장르 정의에 맞는 작품만 포함 (다른 장르 작품 제외)
- 최대 {limit}개
- author 필드: 페이지에 작가명이 있으면 반드시 포함. 없으면 빈 문자열 "" (절대 "None" 사용 금지)
- JSON 배열로만 응답

[{{"rank": 1, "title": "작품명", "author": "작가명"}}]""",
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
        author = str(item.get("author", "")).strip()
        if author.lower() in ("none", "null", "n/a", "없음", "미상", "unknown"):
            author = ""
        results.append({
            "rank": len(results) + 1,
            "title": title,
            "author": author,
            "cover": "",
            "link": _lookup_link(title, title_to_url or {}),
        })
    return results


# ── Gemini AI 트렌드 분석 ────────────────────────────────────
def generate_ai_content(client: genai.Client, genre_data: dict[str, list[dict]]) -> str:
    genre_summary = ""
    for genre in GENRES:
        books = genre_data.get(genre["key"], [])
        if not books:
            continue
        genre_summary += f"\n[{genre['emoji']} {genre['name']}]\n"
        genre_summary += "\n".join(
            f"  {b['rank']}. {b['title']} - {b['author']} "
            f"({', '.join(f'{k} {v}위' for k, v in b['sources'].items())})"
            for b in books[:5]
        )

    prompt = f"""아래는 카카오페이지·네이버 시리즈·리디 웹소설 베스트셀러 장르별 데이터입니다.

{genre_summary}

위 데이터를 바탕으로 다음을 작성해주세요:
1. 이번 주 전체 웹소설 트렌드 분석 (3-4문장)
2. 장르별 주목할 작품 및 트렌드 한 줄씩
3. 독자층의 현재 분위기를 한 문장으로

형식 (마크다운):

## 📊 이번 주 웹소설 트렌드
[트렌드 분석]

## 🗂️ 장르별 트렌드

- **⚔️ 판타지** — [한 줄]
- **🏰 로맨스판타지** — [한 줄]
- **💕 로맨스** — [한 줄]
- **🌆 현대판타지** — [한 줄]
- **🥋 무협** — [한 줄]
- **💙 BL** — [한 줄]
"""
    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    return response.text


_PLATFORM_TABS = [
    {"key": "카카오페이지", "label": "카카오"},
    {"key": "네이버 시리즈", "label": "네이버"},
    {"key": "리디",         "label": "리디"},
]

_BASE_URLS = {"https://page.kakao.com", "https://series.naver.com", "https://ridibooks.com"}

def _platform_table_html(books: list[dict]) -> str:
    if not books:
        return '<p class="ptab-empty">데이터 없음</p>'

    def _row(b: dict) -> str:
        link = b.get("link", "")
        # 메인 페이지 URL이면 링크 제거 (개별 작품 링크가 아님)
        if link in _BASE_URLS:
            link = ""
        title_html = f'<a href="{link}">{b["title"]}</a>' if link else b["title"]
        author = b.get("author", "")
        return f'<tr><td><strong>{b["rank"]}</strong></td><td>{title_html}</td><td>{author}</td></tr>'

    rows = "".join(_row(b) for b in books)
    return (
        '<table class="ptab-table">'
        '<thead><tr><th>순위</th><th>작품</th><th>작가</th></tr></thead>'
        f'<tbody>{rows}</tbody></table>'
    )


# ── 마크다운 생성 ─────────────────────────────────────────────
def build_markdown(
    platform_data: dict[str, dict[str, list[dict]]],
    ai_content: str,
    date_str: str,
) -> str:
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    first_weekday = dt.replace(day=1).weekday()
    week = (dt.day + first_weekday - 1) // 7 + 1
    date_kr = f"{dt.year}년 {dt.month}월 {week}째주"

    genre_sections = ""
    for genre in GENRES:
        key = genre["key"]
        # 하나라도 데이터 있는 플랫폼이 있어야 섹션 생성
        plat_books = {
            p["key"]: platform_data.get(p["key"], {}).get(key, [])
            for p in _PLATFORM_TABS
        }
        if not any(plat_books.values()):
            continue

        # 탭 버튼 + 패널 생성
        first_active = next((p["key"] for p in _PLATFORM_TABS if plat_books[p["key"]]), None)
        btns_html = ""
        panels_html = ""
        for plat in _PLATFORM_TABS:
            pk = plat["key"]
            tab_id = f"t-{key}-{pk.replace(' ','')}"
            is_active = (pk == first_active)
            active_cls = " is-active" if is_active else ""
            hidden_attr = "" if is_active else ' style="display:none"'
            btns_html += f'<button class="ptab-btn{active_cls}" data-target="{tab_id}">{plat["label"]}</button>'
            panels_html += f'<div id="{tab_id}" class="ptab-panel"{hidden_attr}>{_platform_table_html(plat_books[pk])}</div>'

        tabs_html = (
            f'<div class="ptab-wrap">'
            f'<div class="ptab-nav">{btns_html}</div>'
            f'{panels_html}'
            f'</div>'
        )
        genre_sections += f"\n## {genre['emoji']} {genre['name']}\n\n{tabs_html}\n"

    tab_script = """
<script>
(function(){
  function init(){
    document.querySelectorAll('.ptab-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        var wrap=btn.closest('.ptab-wrap');
        wrap.querySelectorAll('.ptab-btn').forEach(function(b){b.classList.remove('is-active');});
        wrap.querySelectorAll('.ptab-panel').forEach(function(p){p.style.display='none';});
        btn.classList.add('is-active');
        document.getElementById(btn.dataset.target).style.display='';
      });
    });
  }
  init();
  document.addEventListener('astro:after-swap',init);
})();
</script>
<style>
.ptab-wrap{margin:0.5rem 0 1.5rem;}
.ptab-nav{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;}
.ptab-btn{padding:4px 14px;border-radius:20px;border:1px solid var(--border);background:transparent;cursor:pointer;font-size:0.82rem;color:var(--text-secondary);transition:all .15s;}
.ptab-btn.is-active{background:var(--green);color:#fff;border-color:var(--green);}
.ptab-table{width:100%;border-collapse:collapse;font-size:0.875rem;}
.ptab-table th{background:var(--bg-subtle);padding:6px 10px;border:1px solid var(--border);font-weight:600;white-space:nowrap;}
.ptab-table td{padding:5px 10px;border:1px solid var(--border);}
.ptab-table tr:nth-child(even) td{background:var(--bg-subtle);}
.ptab-table a{color:var(--green);text-decoration:none;}
.ptab-table a:hover{text-decoration:underline;}
.ptab-empty{color:var(--text-muted);font-size:0.9rem;padding:8px 0;}
@media(max-width:640px){.ptab-table th,.ptab-table td{padding:4px 6px;font-size:0.78rem;}}
</style>
"""

    return f"""---
title: "웹소설 베스트셀러 ({date_kr})"
date: {date_str}
description: "카카오페이지·네이버 시리즈·리디 웹소설 장르별 베스트셀러입니다."
category: "webnovel"
isHidden: true
---

{ai_content}

---

{genre_sections}

---

*데이터 출처: [카카오페이지](https://page.kakao.com) · [네이버 시리즈](https://series.naver.com) · [리디](https://ridibooks.com)*
*매주 자동으로 수집되는 웹소설 베스트셀러 리포트입니다.*

{tab_script}
"""


# ── main ─────────────────────────────────────────────────────
def main():
    print(f"[{DATE}] 웹소설 베스트셀러 장르별 수집 시작\n")

    client = genai.Client(api_key=GEMINI_API_KEY)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            locale="ko-KR",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )
        pw_page = ctx.new_page()

        # 리디: 장르별 전용 URL
        print("  📘 리디 장르별 수집...")
        ridi_data = fetch_ridi_by_genre(pw_page, client, limit=15)
        print(f"     → {sum(len(v) for v in ridi_data.values())}개 ({len(ridi_data)}장르)\n")

        # 카카오페이지: 전체 페이지 → Gemini 장르 분류
        print("  📱 카카오페이지 장르별 수집...")
        kakao_data = fetch_platform_all_genres(
            pw_page, client,
            urls=["https://page.kakao.com/menu/10011/screen/94", "https://page.kakao.com/menu/10011"],
            base_url="https://page.kakao.com",
            source_name="카카오페이지",
            link_pattern="/content/",
            limit=10,
        )
        print(f"     → {sum(len(v) for v in kakao_data.values())}개 ({len(kakao_data)}장르)\n")

        # 카카오페이지: 누락 장르 보충 (장르 탭 URL 자동 탐색)
        kakao_missing = [g["key"] for g in GENRES if not kakao_data.get(g["key"])]
        if kakao_missing:
            print(f"  🔍 카카오페이지 누락 장르 보충: {[GENRE_KEY_TO_NAME[k] for k in kakao_missing]}")
            kakao_genre_urls = _discover_genre_urls_bulk(
                pw_page, client,
                nav_url="https://page.kakao.com/menu/10011/screen/94",
                source_name="카카오페이지",
                genre_keys=kakao_missing,
            )
            for key, url in kakao_genre_urls.items():
                try:
                    text, t2u = _get_page_data(pw_page, url, "/content/")
                    name = GENRE_KEY_TO_NAME[key]
                    items = _parse_single_genre(client, text, "카카오페이지", name, 10, t2u)
                    if items:
                        for item in items:
                            item["source"] = "카카오페이지"
                            item["genre_key"] = key
                        kakao_data[key] = items
                        print(f"  카카오페이지 [{name}] 보충 {len(items)}개")
                except Exception as e:
                    print(f"  ⚠️  카카오페이지 [{GENRE_KEY_TO_NAME[key]}] 보충 실패: {e}")

        # 네이버 시리즈: 장르별 genreCode URL로 개별 수집
        print("  📗 네이버 시리즈 장르별 수집...")
        naver_data = fetch_naver_by_genre(pw_page, client, limit=10)
        print(f"     → {sum(len(v) for v in naver_data.values())}개 ({len(naver_data)}장르)\n")

        browser.close()

    # 장르별 통합 순위
    print("  🔢 장르별 통합 순위 계산...")
    genre_data = merge_genre_data(ridi_data, kakao_data, naver_data, top_n=10)
    for genre in GENRES:
        cnt = len(genre_data.get(genre["key"], []))
        if cnt:
            print(f"     {genre['emoji']} {genre['name']}: {cnt}개")

    if not any(genre_data.values()):
        print("\n❌ 수집된 데이터 없음. 종료합니다.")
        sys.exit(1)

    print("\n  🤖 Gemini AI 트렌드 분석 중...")
    ai_content = generate_ai_content(client, genre_data)

    platform_data = {
        "카카오페이지": kakao_data,
        "네이버 시리즈": naver_data,
        "리디":         ridi_data,
    }
    md = build_markdown(platform_data, ai_content, DATE)
    slug = f"{DATE}-webnovel"
    out_dir = pathlib.Path("contents/book") / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.md"
    out_path.write_text(md, encoding="utf-8")

    print(f"\n✅ 완료: {out_path}")


if __name__ == "__main__":
    main()
