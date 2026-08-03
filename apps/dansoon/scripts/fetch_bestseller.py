#!/usr/bin/env python3
"""도서 주간 베스트셀러 수집 — 알라딘(API) · 교보문고 · YES24 · 리디"""

import os
import sys
import json
import re
import html as htmllib
import pathlib
import requests
from curl_cffi import requests as cffi_requests
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
    {"key": "novel",   "name": "소설",     "emoji": "📖", "aladin_id": 1,     "keywords": [
        "소설", "fiction", "novel", "sf", "판타지", "로맨스", "추리", "공포", "미스터리",
        "스릴러", "시집", "희곡", "단편", "장편", "문학", "이야기", "동화", "동시"
    ]},
    {"key": "economy", "name": "경제경영", "emoji": "💼", "aladin_id": 170,   "keywords": [
        "경제", "경영", "비즈니스", "투자", "재테크", "마케팅", "금융", "주식", "부동산",
        "창업", "스타트업", "회계", "세금", "절세", "부의", "돈의", "돈을", "자산", "펀드"
    ]},
    {"key": "selfdev", "name": "자기계발", "emoji": "🚀", "aladin_id": 336,   "keywords": [
        "자기계발", "성공", "습관", "리더십", "동기", "긍정", "루틴", "목표", "의지",
        "잠재력", "변화", "성장", "생산성", "집중력", "시간관리", "마인드", "행복"
    ]},
    {"key": "humanit", "name": "인문사회", "emoji": "🌍", "aladin_id": 656,   "keywords": [
        "인문", "사회", "철학", "역사", "정치", "교육", "심리", "문화", "종교", "예술",
        "언어", "윤리", "사상", "고전", "지식", "교양", "미학", "법학", "인간"
    ]},
    {"key": "science", "name": "과학기술", "emoji": "🔬", "aladin_id": 987,   "keywords": [
        "과학", "기술", "it", "수학", "물리", "생물", "화학", "의학", "ai", "인공지능",
        "뇌", "우주", "자연", "환경", "생태", "진화", "건강", "의료", "코딩", "개발"
    ]},
    {"key": "essay",   "name": "에세이",   "emoji": "✍️", "aladin_id": 55889, "keywords": [
        "에세이", "산문", "여행", "일상", "기행", "감성", "힐링", "치유", "사색", "독립",
        "청춘", "위로", "기억", "이별", "사랑이야기", "수필"
    ]},
]

_GENRE_KR_TO_KEY = {g["name"]: g["key"] for g in GENRES}
# 알라딘 categoryName 경로 세그먼트("국내도서>소설/시/희곡>한국소설") 및 Gemini 응답 매핑.
# 여기에 없는 대분류(만화/라이트노벨·수험서·유아 등)는 etc로 남아 종합표에서 제외된다.
_GENRE_KR_TO_KEY.update({
    "소설/시/희곡": "novel", "장르소설": "novel", "문학": "novel", "한국소설": "novel",
    "영미소설": "novel", "일본소설": "novel", "시/희곡": "novel",
    "경제/경영": "economy",
    "인문학": "humanit", "인문/사회": "humanit", "사회과학": "humanit", "역사": "humanit",
    "종교/역학": "humanit", "종교/명상/점술": "humanit", "예술/대중문화": "humanit",
    "과학": "science", "자연과학": "science", "기술/공학": "science", "기술공학": "science",
    "컴퓨터/모바일": "science", "의학": "science",
    "여행": "essay",
})

# 6개 장르 중 어디에도 넣지 않는 대분류. 키워드 폴백이 "건강/취미>스포츠"를 science("건강")로,
# "과학>천문학"을 novel("문학")로 오분류하므로 대분류 단계에서 먼저 잘라낸다.
_GENRE_EXCLUDE_SEGMENTS = frozenset({
    "건강/취미", "만화", "만화/라이트노벨", "라이트노벨", "잡지", "달력/기타", "기타 도서",
    "수험서/자격증", "공무원 수험서", "대학교재", "대학교재/전문서적", "외국어", "ELT/어학/사전",
    "유아", "유아/아동", "어린이", "청소년", "좋은부모", "가정/원예/인테리어", "요리/살림",
    "요리", "법률", "전집/중고전집", "해외구매", "굿즈한정할인",
})

# 리디 일반도서 장르별 베스트셀러 카테고리 ID
RIDI_GENRE_CAT: dict[str, int] = {
    "novel":   100,   # 소설
    "economy": 200,   # 경영/경제
    "selfdev": 300,   # 자기계발
    "humanit": 400,   # 인문/사회/역사
    "science": 1100,  # 과학
    "essay":   110,   # 에세이/시
}


def classify_genre(text: str) -> str:
    """장르 판정. 카테고리 경로 세그먼트를 우선 신뢰하고, 실패 시 키워드로 폴백.

    키워드 폴백은 novel 키워드("문학"·"이야기"·"고전")가 광범위해 오분류가 잦으므로
    "국내도서>인문학>철학" 같은 경로가 있으면 그 대분류를 먼저 쓴다.
    """
    for segment in (s.strip() for s in text.split(">")):
        if segment in _GENRE_EXCLUDE_SEGMENTS:
            return "etc"
        genre_key = _GENRE_KR_TO_KEY.get(segment)
        if genre_key:
            return genre_key

    text_lower = text.lower()
    for genre in GENRES:
        if any(kw.lower() in text_lower for kw in genre["keywords"]):
            return genre["key"]
    return "etc"


# ── 제목 정규화 (동일 도서 판정) ─────────────────────────────
# 같은 책의 서점별 표기 차이를 흡수한다.
_TITLE_BADGE_RE = re.compile(r"^[^|]{1,12}\|")            # "개정판 | 죽음의 수용소에서"
_TITLE_BRACKET_RE = re.compile(r"[\(\[\{][^\)\]\}]*[\)\]\}]")  # "(100만 부 기념판)", "[ 사인본 ]"
_TITLE_EDITION_RE = re.compile(r"개정판|특별판|기념판|스페셜에디션|에디션|양장본|사인본|초판한정|한정판|리커버")
# 부제까지 붙은 표기("유럽 도시 기행 3 마드리드…편")를 짧은 표기와 묶으려면
# 접두사 일치를 봐야 하는데, 짧은 제목에서 오병합이 나므로 최소 길이를 둔다.
_PREFIX_MATCH_MIN_LEN = 6


def _normalize(text: str) -> str:
    return re.sub(r"[\s\W_]", "", text).lower()


def _title_key(title: str) -> str:
    stripped = _TITLE_BRACKET_RE.sub(" ", _TITLE_BADGE_RE.sub("", title))
    return _TITLE_EDITION_RE.sub("", _normalize(stripped))


def _is_same_work(short_key: str, long_key: str) -> bool:
    """접두사가 겹치는 두 제목이 같은 책인지 판정.

    "유럽도시기행3" ⊂ "유럽도시기행3마드리드…편"은 부제가 붙은 같은 책이지만,
    "달러구트꿈백화점" ⊂ "달러구트꿈백화점2"는 다른 권이다. 접두사 뒤가 숫자로
    시작하면 권수가 갈린 것으로 보고 합치지 않는다(오병합이 미병합보다 해롭다).
    """
    if len(short_key) < _PREFIX_MATCH_MIN_LEN or not long_key.startswith(short_key):
        return False
    remainder = long_key[len(short_key):]
    return bool(remainder) and not remainder[0].isdigit()


def _matches_any(key: str, reference_keys: set[str]) -> bool:
    if key in reference_keys:
        return True
    return any(_is_same_work(ref, key) or _is_same_work(key, ref) for ref in reference_keys)


# 서로 다른 서점의 베스트셀러 상위 20위는 상당 부분 겹친다(2026-07-27 수집 기준
# 알라딘∩교보 6권, 알라딘∩YES24 5권). 겹침이 이 수준에도 못 미치면 순위 목록이
# 아니라 추천 캐러셀·기획전 배열을 잡은 것으로 보고 폐기한다.
_SANITY_MIN_OVERLAP = 3


def _is_plausible_list(items: list[dict], reference_keys: set[str], source_name: str) -> bool:
    if not reference_keys or not items:
        return True
    hits = sum(1 for b in items if _matches_any(_title_key(b["title"]), reference_keys))
    if hits >= _SANITY_MIN_OVERLAP:
        return True
    print(f"  ⚠️  {source_name} 목록이 알라딘 베스트셀러와 {hits}권만 겹칩니다 — 베스트셀러 목록이 아닌 것으로 보고 폐기")
    return False


def _stamp_depth(items: list[dict]) -> list[dict]:
    """정규화 점수의 기준이 될 목록 깊이를 각 항목에 새긴다.

    서점마다 확인 가능한 순위 범위가 달라(알라딘·교보·YES24 20위, 리디 전체 11위,
    장르별 10위) 순위를 그대로 더하면 얕게 수집되는 서점이 과대평가된다.
    """
    depth = len(items)
    for item in items:
        item["depth"] = depth
    return items


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
        return _stamp_depth(results)
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
        return _stamp_depth(results)
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
    """Gemini AI로 페이지 텍스트에서 도서 순위 + 장르 추출"""
    genre_names = "·".join(g["name"] for g in GENRES) + "·기타"
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"""다음은 "{source_name}" 베스트셀러 페이지의 텍스트입니다.

<page_text>
{text[:9000]}
</page_text>

실제 책(도서) 순위 목록만 추출하세요.
- 실제 책 제목·저자만 (UI버튼·메뉴·이벤트배너·"새창보기"·프로모션 문구 등은 제외)
- genre: 책 내용 기준으로 ({genre_names}) 중 하나 선택
- 최대 {limit}개
- JSON 배열로만 응답

[{{"rank": 1, "title": "책 제목", "author": "저자명", "genre": "소설"}}]""",
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
        genre_kr = str(item.get("genre", "")).strip()
        genre_key = _GENRE_KR_TO_KEY.get(genre_kr) or classify_genre(title)
        results.append({
            "rank": item.get("rank", len(results) + 1),
            "title": title,
            "author": str(item.get("author", "")).strip(),
            "genre_key": genre_key,
        })
    return results


# ── 교보문고 ────────────────────────────────────────────────
# 렌더된 DOM에서 목록을 직접 읽는다. 페이지 텍스트를 LLM에 넘겨 추출하던 방식은
# 개별 도서 링크를 얻지 못해(목록 URL이 그대로 들어갔다) 저자·순위도 흔들렸다.
_KYOBO_DOM_JS = """
() => {
  const lists = [...document.querySelectorAll('ol')]
    .filter((ol) => ol.querySelectorAll('li a[href*="/detail/"]').length >= 5);
  const out = [];
  for (const ol of lists) {
    for (const li of [...ol.children]) {
      const a = li.querySelector('a.prod_link.font-medium')
        || [...li.querySelectorAll('a[href*="/detail/"]')]
             .find((x) => x.textContent.trim() && !/새창보기|미리보기/.test(x.textContent));
      if (!a) continue;
      const title = a.textContent.trim();
      if (!title) continue;
      const href = a.getAttribute('href') || '';
      const lines = li.innerText.split('\\n').map((s) => s.trim()).filter(Boolean);
      const ti = lines.indexOf(title);
      let author = '';
      if (ti >= 0) {
        for (let i = ti + 1; i < lines.length; i++) {
          const l = lines[i];
          if (l && l !== '·' && !/^[\\d,]/.test(l)) { author = l; break; }
        }
      }
      out.push({
        title,
        author,
        link: href.startsWith('http') ? href : 'https://product.kyobobook.co.kr' + href,
      });
    }
  }
  return out;
}
"""

_YES24_DOM_JS = """
() => {
  const root = document.querySelector('#yesBestList');
  if (!root) return [];
  const lis = [...root.querySelectorAll('li')].filter((li) => li.querySelector('a.gd_name'));
  const leaf = lis.filter((li) => !lis.some((o) => o !== li && li.contains(o)));
  return leaf.map((li) => {
    const a = li.querySelector('a.gd_name');
    const href = a.getAttribute('href') || '';
    const lines = li.innerText.split('\\n').map((s) => s.trim()).filter(Boolean);
    let author = (li.querySelector('.info_auth, .authPub') || {}).innerText || '';
    if (!author) author = lines.find((l) => / 저(\\/|$| )/.test(l)) || '';
    author = author.split('/')[0].replace(/\\s*(글그림|편역|엮음|지음|저|편|역|글|그림)\\s*$/, '').trim();
    return {
      title: a.textContent.trim(),
      author,
      link: href.startsWith('http') ? href : 'https://www.yes24.com' + href,
      rankText: (li.querySelector('.saleNum') || {}).textContent || '',
    };
  });
}
"""


def _rows_from_dom(pw_page: Page, script: str, source_name: str, limit: int) -> list[dict]:
    """DOM 추출 결과를 표준 항목으로 변환. 순위는 목록 순서를 쓴다.

    교보는 1위에 순위 배지가 없어 배지 파싱이 어긋난다. 목록 순서가 곧 순위다.
    """
    raw = pw_page.evaluate(script) or []
    results: list[dict] = []
    seen: set[str] = set()
    for entry in raw:
        title = str(entry.get("title", "")).strip()
        key = _title_key(title)
        if not title or not key or key in seen:
            continue
        seen.add(key)
        results.append({
            "rank": len(results) + 1,
            "title": title,
            "author": str(entry.get("author", "")).strip(),
            "cover": "",
            "link": str(entry.get("link", "")).strip(),
            "publisher": "",
            "genre_key": classify_genre(title),
            "source": source_name,
        })
        if len(results) >= limit:
            break
    return results


def fetch_kyobo(
    pw_page: Page, client: genai.Client, reference_keys: set[str], limit: int = 20
) -> list[dict]:
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
                    if results and _is_plausible_list(results, reference_keys, "교보문고(NEXT_DATA)"):
                        print(f"  교보문고 items={len(results)}개 발견 (NEXT_DATA)")
                        return _stamp_depth(results)

            # 렌더된 DOM 직접 파싱
            dom_results = _rows_from_dom(pw_page, _KYOBO_DOM_JS, "교보문고", limit)
            if dom_results and _is_plausible_list(dom_results, reference_keys, "교보문고(DOM)"):
                print(f"  교보문고 items={len(dom_results)}개 발견 (DOM)")
                return _stamp_depth(dom_results)

            # Gemini AI 기반 추출 (마지막 폴백)
            print("  📖 교보문고 Gemini AI 추출 시도...")
            page_text = pw_page.inner_text("body")
            gemini_books = _parse_books_with_gemini(client, page_text, "교보문고", limit)
            if gemini_books:
                results = []
                for item in gemini_books:
                    results.append({
                        "rank": len(results) + 1,
                        "title": item["title"],
                        "author": item["author"],
                        "cover": "",
                        "link": url,
                        "publisher": "",
                        "genre_key": item.get("genre_key", "etc"),
                        "source": "교보문고",
                    })
                    if len(results) >= limit:
                        break
                if results and _is_plausible_list(results, reference_keys, "교보문고(Gemini)"):
                    print(f"  교보문고 items={len(results)}개 발견 (Gemini)")
                    return _stamp_depth(results)

            print("  ⚠️  교보문고 데이터 없음, 다음 URL 시도")
        except Exception as e:
            print(f"  ⚠️  교보문고 {url} 실패: {e}")

    print("  ⚠️  교보문고 모든 URL 실패")
    return []


# ── YES24 ───────────────────────────────────────────────────
def fetch_yes24(
    pw_page: Page, client: genai.Client, reference_keys: set[str], limit: int = 20
) -> list[dict]:
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
                    if results and _is_plausible_list(results, reference_keys, "YES24(NEXT_DATA)"):
                        print(f"  YES24 items={len(results)}개 발견 (NEXT_DATA)")
                        return _stamp_depth(results)

            # 렌더된 DOM 직접 파싱
            dom_results = _rows_from_dom(pw_page, _YES24_DOM_JS, "YES24", limit)
            if dom_results and _is_plausible_list(dom_results, reference_keys, "YES24(DOM)"):
                print(f"  YES24 items={len(dom_results)}개 발견 (DOM)")
                return _stamp_depth(dom_results)

            # Gemini AI 기반 추출 (마지막 폴백)
            print("  📖 YES24 Gemini AI 추출 시도...")
            page_text = pw_page.inner_text("body")
            gemini_books = _parse_books_with_gemini(client, page_text, "YES24", limit)
            if gemini_books:
                results = []
                for item in gemini_books:
                    results.append({
                        "rank": len(results) + 1,
                        "title": item["title"],
                        "author": item["author"],
                        "cover": "",
                        "link": url,
                        "publisher": "",
                        "genre_key": item.get("genre_key", "etc"),
                        "source": "YES24",
                    })
                    if len(results) >= limit:
                        break
                if results and _is_plausible_list(results, reference_keys, "YES24(Gemini)"):
                    print(f"  YES24 items={len(results)}개 발견 (Gemini)")
                    return _stamp_depth(results)

            print("  ⚠️  YES24 데이터 없음, 다음 URL 시도")
        except Exception as e:
            print(f"  ⚠️  YES24 {url} 실패: {e}")

    print("  ⚠️  YES24 모든 URL 실패")
    return []


# ── 리디: SSR HTML 직접 파싱 ─────────────────────────────────
# 리디는 책 목록을 HTML에 서버사이드 렌더링한다(__NEXT_DATA__엔 없음).
# 제목 앵커 <a href="/books/{id}?..._rdt_idx={순위-1}...">제목</a> +
# 직후 작가 링크 <a href="/author/{id}">작가</a>로 파싱한다.
# 클래스명은 매 배포마다 바뀌므로 href 패턴과 텍스트로만 파싱한다.
_RIDI_TITLE_RE = re.compile(
    r'<a href="/books/(\d+)\?[^"]*?_rdt_idx=(\d+)[^"]*?"[^>]*>([^<>][^<]*)</a>'
)
# 작가는 제목 앵커 바로 뒤 첫 링크. 등록 작가는 /author/, 미등록은 /search?q= 로 렌더된다.
_RIDI_AUTHOR_RE = re.compile(r'<a href="/(?:author/\d+|search\?q=[^"]*)"[^>]*>([^<]+)</a>')


def _parse_ridi_html(html: str, genre_key: str, limit: int) -> list[dict]:
    """리디 SSR HTML에서 (순위·제목·작가·링크)를 직접 추출"""
    seen: set[str] = set()
    books: list[dict] = []
    for m in _RIDI_TITLE_RE.finditer(html):
        book_id, idx = m.group(1), int(m.group(2))
        if book_id in seen:
            continue
        seen.add(book_id)
        title = htmllib.unescape(m.group(3)).strip()
        if len(title) < 2:
            continue
        author_match = _RIDI_AUTHOR_RE.search(html, m.end(), m.end() + 500)
        author = htmllib.unescape(author_match.group(1)).strip() if author_match else ""
        books.append({
            "rank": idx + 1,
            "title": title,
            "author": author,
            "cover": "",
            "link": f"https://ridibooks.com/books/{book_id}",
            "publisher": "",
            "genre_key": genre_key,
            "source": "리디",
        })
    books.sort(key=lambda b: b["rank"])
    books = books[:limit]
    for i, b in enumerate(books, start=1):
        b["rank"] = i
    return _stamp_depth(books)


# 리디는 Cloudflare 봇 차단(JS 챌린지)을 걸어 headless 브라우저를 막는다.
# 실제 Chrome TLS 핑거프린트가 필요하므로 curl_cffi(impersonate)로 SSR HTML을 받는다.
def _fetch_ridi_html(url: str) -> str:
    resp = cffi_requests.get(url, impersonate="chrome", timeout=20)
    resp.raise_for_status()
    return resp.text


# 리디 일반도서 전체 베스트셀러. SSR은 페이지당 11위까지만 렌더하고
# page=2는 61위부터 시작하므로, 종합 합산에 쓸 수 있는 범위는 1~11위다.
RIDI_OVERALL_URL = "https://ridibooks.com/bestsellers/general"
RIDI_OVERALL_MAX = 11


def fetch_ridi_overall(limit: int = RIDI_OVERALL_MAX) -> list[dict]:
    """리디 전체 순위. 장르 정보가 없으므로 genre_key는 etc로 두고 합산 단계에서 보정한다."""
    try:
        print(f"  리디 [전체] URL={RIDI_OVERALL_URL}")
        items = _parse_ridi_html(_fetch_ridi_html(RIDI_OVERALL_URL), "etc", limit)
        print(f"  리디 [전체] {len(items)}개 수집")
        return items
    except Exception as e:
        print(f"  ⚠️  리디 [전체] 실패: {e}")
        return []


def fetch_ridi_by_genre(limit: int = 10) -> dict[str, list[dict]]:
    """리디: 일반도서 장르별 베스트셀러 SSR HTML을 직접 파싱.
    Cloudflare 챌린지 탓에 Playwright headless는 차단되므로 curl_cffi로 받는다."""
    result: dict[str, list[dict]] = {}

    for genre in GENRES:
        key = genre["key"]
        cat_id = RIDI_GENRE_CAT.get(key)
        if not cat_id:
            continue

        url = f"https://ridibooks.com/category/bestsellers/{cat_id}"
        try:
            print(f"  리디 [{genre['name']}] URL={url}")
            items = _parse_ridi_html(_fetch_ridi_html(url), key, limit)
            if items:
                result[key] = items
                authors = sum(1 for it in items if it["author"])
                print(f"  리디 [{genre['name']}] {len(items)}개 수집 (작가 {authors}명)")
            else:
                print(f"  ⚠️  리디 [{genre['name']}] 수집 실패")
        except Exception as e:
            print(f"  ⚠️  리디 [{genre['name']}] 실패: {e}")

    return result


# 교보/YES24는 Gemini 폴백 시 개별 책 링크를 못 얻어 목록 URL이 들어온다.
_LIST_URL_MARKERS = ("/bestseller", "bestseller?", "BestSeller", "/category/")


def _is_detail_link(link: str) -> bool:
    return bool(link) and not any(marker in link for marker in _LIST_URL_MARKERS)


# ── 종합 순위 합산 ──────────────────────────────────────────
def _canonical_keys(all_items: list[dict]) -> dict[str, str]:
    """제목 키 → 대표 키 매핑. 같은 저자 + 부제 확장 관계면 하나로 묶는다.

    한 건씩 순회하며 병합하면 어떤 서점을 먼저 읽었는지에 따라 결과가 달라지므로,
    전체 키 집합을 모은 뒤 짧은 키(기본 표기)를 대표로 정해 결정적으로 매핑한다.
    """
    authors: dict[str, set[str]] = {}
    for item in all_items:
        key = _title_key(item.get("title", ""))
        if key:
            authors.setdefault(key, set()).add(_normalize(item.get("author", "")))

    by_length = sorted(authors, key=lambda k: (len(k), k))
    canonical = {key: key for key in authors}
    for long_key in reversed(by_length):
        for short_key in by_length:
            if short_key == long_key:
                break
            shared_author = (authors[long_key] & authors[short_key]) - {""}
            if shared_author and _is_same_work(short_key, long_key):
                canonical[long_key] = short_key
                break
    return canonical


def _source_score(rank: int, depth: int) -> float:
    """한 서점의 기여도를 0~1로 정규화. 1위=1.0, 수집 범위 밖=0.

    서점마다 수집 깊이가 달라(리디 11위 · 나머지 20위) 순위를 그대로 더하면
    얕게 수집되는 서점의 하위권이 과대평가된다.
    """
    if depth <= 0 or rank > depth:
        return 0.0
    return (depth + 1 - rank) / depth


def merge_rankings(all_items: list[dict], genre_lookup: dict[str, str] | None = None) -> list[dict]:
    """서점별 목록을 한 권 단위로 합치고 정규화 점수로 정렬한다(자르기는 호출자 몫)."""
    canonical = _canonical_keys(all_items)
    books: dict[str, dict] = {}

    for item in all_items:
        raw_key = _title_key(item.get("title", ""))
        if not raw_key:
            continue
        key = canonical[raw_key]
        book = books.get(key)
        if book is None:
            book = books[key] = {
                "title": item["title"],
                "author": item.get("author", ""),
                "cover": "",
                "link": "",
                "publisher": item.get("publisher", ""),
                "raw_keys": set(),
                "sources": {},
                "genre_key": "etc",
                "score": 0.0,
            }
        book["raw_keys"].add(raw_key)
        # 한 서점에 같은 책의 에디션이 둘 이상 잡히면 더 높은(작은) 순위만 남긴다.
        # 순위를 덮어쓰거나 점수를 이중 가산하지 않기 위함이다.
        prev = book["sources"].get(item["source"])
        if prev is None or item["rank"] < prev["rank"]:
            book["sources"][item["source"]] = {"rank": item["rank"], "depth": item.get("depth", 0)}
        # 에디션·부제가 붙은 표기보다 짧은 표기를 대표 제목으로 쓴다
        if len(item["title"]) < len(book["title"]):
            book["title"] = item["title"]
        # 저자는 알라딘 표기를 우선(리디는 미등록 작가 시 비어 온다)
        if item.get("author") and (not book["author"] or item["source"] == "알라딘"):
            book["author"] = item["author"]
        # 알라딘 커버/링크 우선, 그다음 아무 상세 링크
        if item["source"] == "알라딘" and item.get("cover"):
            book["cover"] = item["cover"]
            if _is_detail_link(item.get("link", "")):
                book["link"] = item["link"]
        elif not book["link"] and _is_detail_link(item.get("link", "")):
            book["link"] = item["link"]
        if book["genre_key"] == "etc":
            book["genre_key"] = item.get("genre_key", "etc")

    for book in books.values():
        book["score"] = sum(_source_score(s["rank"], s["depth"]) for s in book["sources"].values())
        # 장르별 수집에서 확인된 장르가 있으면 그것을 신뢰한다(종합표·장르별표 표기 일치).
        # 병합 전 키 전부를 조회해야 부제 표기만 다른 판본에서도 장르가 붙는다.
        if genre_lookup:
            for raw_key in sorted(book["raw_keys"]):
                if raw_key in genre_lookup:
                    book["genre_key"] = genre_lookup[raw_key]
                    break

    return sorted(
        books.values(),
        key=lambda b: (
            -b["score"],
            -len(b["sources"]),
            min(s["rank"] / max(1, s["depth"]) for s in b["sources"].values()),
        ),
    )


def take_charted(books: list[dict], top_n: int) -> tuple[list[dict], list[dict]]:
    """상위 top_n을 뽑아 1위부터 번호를 매긴다. 장르 미판정(etc) 도서는 제외하고 돌려준다."""
    charted: list[dict] = []
    dropped: list[dict] = []
    for book in books:
        if len(charted) >= top_n:
            break
        (dropped if book["genre_key"] == "etc" else charted).append(book)
    for i, book in enumerate(charted, start=1):
        book["rank"] = i
    return charted, dropped


# ── MD 생성 ──────────────────────────────────────────────────
TOP_N_OVERALL = 15
TOP_N_GENRE = 5
SOURCE_NAMES = ("알라딘", "교보문고", "YES24", "리디")


def _md_cell(text: str) -> str:
    """표 셀 안의 파이프를 이스케이프. "개정판 | 죽음의 수용소에서" 같은 제목이 열을 깨뜨린다."""
    return text.replace("|", "\\|")


def _title_cell(book: dict) -> str:
    title = _md_cell(book["title"])
    return f"[{title}]({book['link']})" if book.get("link") else title


def _source_cells(sources: dict[str, dict]) -> str:
    return " | ".join(f"{sources[name]['rank']}위" if sources.get(name) else "-" for name in SOURCE_NAMES)


def _index_cell(book: dict, source_count: int = len(SOURCE_NAMES)) -> str:
    """정규화 점수를 0~100 지수로 환산. 수집에 성공한 서점 모두 1위면 100.

    항상 4로 나누면 서점 하나가 실패한 주에 지수 상한이 75로 묶여, 설명과 어긋나고
    주 간 비교도 깨진다. 실제로 수집된 서점 수로 나눠 기준을 맞춘다.
    """
    return str(round(book["score"] / max(1, source_count) * 100))


def build_markdown(
    charted: list[dict],
    genre_data: dict[str, list[dict]],
    date_str: str,
    collected_sources: tuple[str, ...] = SOURCE_NAMES,
) -> str:
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    first_weekday = dt.replace(day=1).weekday()
    week = (dt.day + first_weekday - 1) // 7 + 1
    date_kr = f"{dt.year}년 {dt.month}월 {week}째주"
    source_count = len(collected_sources)
    missing = [name for name in SOURCE_NAMES if name not in collected_sources]
    # 서점이 빠진 주는 순위가 그만큼 부분적이다. 숨기지 않고 표에 명시한다.
    missing_note = (
        f"\n> ⚠️ 이번 주는 **{'·'.join(missing)}** 수집에 실패해 "
        f"{'·'.join(collected_sources)} {source_count}개 서점만으로 집계했습니다. "
        "해당 서점에만 오르는 책은 순위에 반영되지 않습니다.\n"
        if missing
        else ""
    )

    rows = [
        f"| **{b['rank']}** | {_title_cell(b)} | {_md_cell(b['author'])} "
        f"| {next((g['name'] for g in GENRES if g['key'] == b['genre_key']), '')} "
        f"| {_index_cell(b, source_count)} | {_source_cells(b['sources'])} |"
        for b in charted
    ]

    overall_table = "\n".join([
        "| 순위 | 책 | 저자 | 장르 | 지수 | 알라딘 | 교보문고 | YES24 | 리디 |",
        "|:----:|-----|------|------|:----:|:------:|:-------:|:-----:|:----:|",
        *rows,
    ])

    genre_sections = ""
    for genre in GENRES:
        books = genre_data.get(genre["key"], [])
        if not books:
            continue
        genre_rows = [
            f"| **{b['rank']}** | {_title_cell(b)} | {_md_cell(b['author'])} "
            f"| {_index_cell(b, source_count)} | {_source_cells(b['sources'])} |"
            for b in books
        ]
        genre_table = "\n".join([
            "| 순위 | 책 | 저자 | 지수 | 알라딘 | 교보문고 | YES24 | 리디 |",
            "|:----:|-----|------|:----:|:------:|:-------:|:-----:|:----:|",
            *genre_rows,
        ])
        genre_sections += f"\n### {genre['emoji']} {genre['name']}\n\n{genre_table}\n"

    return f"""---
title: "일반 도서 베스트셀러 ({date_kr})"
date: {date_str}
description: "알라딘·교보문고·YES24·리디 베스트셀러를 종합한 TOP {len(charted)}와 장르별 베스트셀러입니다."
category: "bestseller"
isHidden: true
---

## 🏅 일반 도서 베스트셀러 TOP {len(charted)}

각 서점의 **전체 베스트셀러 순위**입니다. 리디는 제공 범위상 {RIDI_OVERALL_MAX}위까지만 집계됩니다.
{missing_note}
**지수**는 서점별 순위를 그 서점의 수집 범위 기준으로 0~100 환산해 평균한 값입니다.
집계에 쓰인 {source_count}개 서점에서 모두 1위면 100이고, 순위에 없는 서점은 0점으로
계산합니다. 서점마다 확인 가능한 순위 깊이가 달라(알라딘·교보문고·YES24 20위,
리디 {RIDI_OVERALL_MAX}위) 순위를 그대로 더하지 않습니다.

{overall_table}

---

## 📚 장르별 베스트셀러

알라딘·리디는 **해당 장르 베스트셀러 순위**, 교보문고·YES24는 장르별 목록을 제공하지 않아
**전체 순위**를 그대로 씁니다(그래서 두 서점은 상위 20위에 든 책만 표시됩니다).
{genre_sections}

---

*데이터 출처: [알라딘](https://www.aladin.co.kr) · [교보문고](https://store.kyobobook.co.kr) · [YES24](https://www.yes24.com) · [리디](https://ridibooks.com)*
*매주 자동으로 수집되는 베스트셀러 리포트입니다.*
"""


# ── 수집 원본 보관 ───────────────────────────────────────────
DEBUG_DUMP_DIR = pathlib.Path("data/bestseller")


def write_debug_dump(raw_sources: dict, merged: list[dict]) -> pathlib.Path:
    """수집 원본과 점수 내역을 남긴다. 결과 MD만으로는 "왜 이 순위인지"를 사후에 알 수 없다."""
    DEBUG_DUMP_DIR.mkdir(parents=True, exist_ok=True)
    path = DEBUG_DUMP_DIR / f"{DATE}.json"
    payload = {
        "date": DATE,
        "sources": raw_sources,
        "merged": [
            {k: v for k, v in book.items() if k not in ("raw_keys", "cover")}
            | {"index": round(book["score"] / len(SOURCE_NAMES) * 100)}
            for book in merged
        ],
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


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

        # 알라딘은 공식 API라 가장 믿을 만하다. 스크레이핑 결과가 이것과 전혀
        # 겹치지 않으면 순위 목록이 아닌 배열을 잡은 것으로 보고 버린다.
        reference_keys = {_title_key(b["title"]) for b in aladin_overall}

        print("  🏪 교보문고 수집...")
        kyobo_items = fetch_kyobo(pw_page, client, reference_keys, 20)
        print(f"     → {len(kyobo_items)}개")

        print("  🛒 YES24 수집...")
        yes24_items = fetch_yes24(pw_page, client, reference_keys, 20)
        print(f"     → {len(yes24_items)}개")

        print("  📱 리디 전체 수집...")
        ridi_overall = fetch_ridi_overall()

        print("  📱 리디 장르별 수집...")
        ridi_by_genre = fetch_ridi_by_genre(limit=10)
        print(f"     → 장르별 {sum(len(v) for v in ridi_by_genre.values())}개 ({len(ridi_by_genre)}장르)")

        browser.close()

    # 장르별 수집에서 확인된 장르(알라딘 CID·리디 카테고리 기준)를 장르 판정의 기준으로 삼는다.
    # 교보·YES24는 카테고리 문자열 키워드 추측이라 여기서 확인되면 덮어쓴다.
    genre_lookup: dict[str, str] = {}
    for items in list(aladin_by_genre.values()) + list(ridi_by_genre.values()):
        for b in items:
            genre_lookup.setdefault(_title_key(b["title"]), b["genre_key"])
    for b in kyobo_items + yes24_items:
        resolved = genre_lookup.get(_title_key(b["title"]))
        if resolved:
            b["genre_key"] = resolved

    # 종합 순위 — 리디는 전체 순위만 넣는다.
    # 장르별 순위(장르마다 1위 존재)를 섞으면 만점이 중복 발생해 종합 순위가 왜곡된다.
    print("\n  🔢 종합 순위 계산...")
    all_items = aladin_overall + kyobo_items + yes24_items + ridi_overall
    overall = merge_rankings(all_items, genre_lookup=genre_lookup)
    charted, dropped = take_charted(overall, TOP_N_OVERALL)
    # 지수 기준을 실제 수집된 서점 수에 맞춘다. 실패한 서점을 분모에 넣으면
    # 지수 상한이 100에 못 미쳐 설명과 어긋나고 주 간 비교도 깨진다.
    collected_sources = tuple(
        name for name, items in (
            ("알라딘", aladin_overall), ("교보문고", kyobo_items),
            ("YES24", yes24_items), ("리디", ridi_overall),
        ) if items
    )
    print(f"     → 병합 {len(overall)}권 중 상위 {len(charted)}권 게시")
    print(f"     → 집계 서점 {len(collected_sources)}개: {'·'.join(collected_sources)}")
    if len(collected_sources) < len(SOURCE_NAMES):
        missing = [n for n in SOURCE_NAMES if n not in collected_sources]
        print(f"     ⚠️  수집 실패: {'·'.join(missing)} — 순위가 부분 집계임을 리포트에 명시합니다")
    for b in dropped:
        print(f"     ⏭️  장르 미판정으로 제외: {b['title']} (지수 {_index_cell(b, len(collected_sources))})")

    genre_data: dict[str, list[dict]] = {}
    for genre in GENRES:
        key = genre["key"]
        combined = (
            aladin_by_genre.get(key, []) +
            [b for b in kyobo_items if b["genre_key"] == key] +
            [b for b in yes24_items if b["genre_key"] == key] +
            ridi_by_genre.get(key, [])
        )
        if combined:
            genre_data[key], _ = take_charted(merge_rankings(combined), TOP_N_GENRE)
            print(f"     [{genre['name']}] {len(genre_data[key])}개")

    md = build_markdown(charted, genre_data, DATE, collected_sources)
    slug = f"{DATE}-bestseller"
    out_dir = pathlib.Path("contents/book") / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.md"
    out_path.write_text(md, encoding="utf-8")
    print(f"\n✅ 완료: {out_path}")

    # 덤프는 사후 추적용 부가 산출물이다. 여기서 예외가 나면 스크립트가 비정상 종료해
    # 워크플로의 커밋 단계가 실행되지 않고, 이미 만든 리포트까지 발행되지 못한다.
    try:
        dump_path = write_debug_dump(
            {
                "aladin_overall": aladin_overall,
                "aladin_by_genre": aladin_by_genre,
                "kyobo": kyobo_items,
                "yes24": yes24_items,
                "ridi_overall": ridi_overall,
                "ridi_by_genre": ridi_by_genre,
            },
            overall,
        )
        print(f"   수집 원본·점수 내역: {dump_path}")
    except Exception as e:
        print(f"   ⚠️  수집 원본 보관 실패(리포트 발행은 계속): {type(e).__name__}: {e}")


if __name__ == "__main__":
    main()
