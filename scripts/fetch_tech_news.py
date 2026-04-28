import os
import sys
import json
import pathlib
import requests
import google.generativeai as genai

DATE = sys.argv[1] if len(sys.argv) > 1 else ""
if not DATE:
    raise ValueError("날짜 인자가 필요합니다 (예: 2025-04-28)")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")


def fetch_hn_top_stories(limit: int = 5) -> list[dict]:
    """Hacker News Top Stories에서 상위 기사를 가져옵니다."""
    top_ids = requests.get(
        "https://hacker-news.firebaseio.com/v0/topstories.json", timeout=10
    ).json()[:50]

    stories = []
    for story_id in top_ids:
        if len(stories) >= limit:
            break
        item = requests.get(
            f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json", timeout=10
        ).json()
        if (
            item
            and item.get("type") == "story"
            and item.get("url")
            and item.get("score", 0) >= 50
        ):
            stories.append(item)

    return stories


def summarize_with_gemini(stories: list[dict]) -> str:
    """Gemini로 뉴스를 한국어로 요약합니다."""
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")

    stories_info = "\n".join(
        [
            f"{i+1}. 제목: {s['title']}\n   URL: {s.get('url', '')}\n   점수: {s.get('score', 0)}"
            for i, s in enumerate(stories)
        ]
    )

    response = model.generate_content(
        f"""아래 Hacker News 상위 뉴스 {len(stories)}개를 개발자 블로그용으로 한국어로 정리해줘.

{stories_info}

각 뉴스마다 아래 형식으로 작성해줘:

### [뉴스 제목 (한국어 번역)](원문 URL)
> 💡 왜 중요한가: 한 줄 코멘트

**요약**
3~5문장으로 핵심 내용 요약. 개발자 관점에서 왜 주목할만한지 포함.

---

마지막에 이 줄 추가:
*이 포스트는 Hacker News Top Stories를 기반으로 Gemini AI가 자동으로 수집·정리한 뉴스입니다.*
"""
    )

    return response.text


def main():
    print(f"[{DATE}] Hacker News 뉴스 수집 중...")
    stories = fetch_hn_top_stories(limit=5)
    print(f"  → {len(stories)}개 수집 완료")

    print("Gemini로 요약 생성 중...")
    summary = summarize_with_gemini(stories)

    # 날짜 한국어 포맷
    from datetime import datetime
    dt = datetime.strptime(DATE, "%Y-%m-%d")
    date_kr = dt.strftime("%-Y년 %-m월 %-d일")

    slug = f"{DATE}-tech-news"
    output_dir = pathlib.Path("contents/blog") / slug
    output_dir.mkdir(parents=True, exist_ok=True)

    frontmatter = f"""---
title: "오늘의 테크 뉴스 TOP 5 ({date_kr})"
date: {DATE}
description: "오늘 Hacker News에서 가장 주목받은 테크 뉴스 5가지를 AI가 정리했습니다."
category: "news"
isHidden: false
---

## 오늘의 테크 뉴스 TOP 5

"""

    output_path = output_dir / "index.md"
    output_path.write_text(frontmatter + summary, encoding="utf-8")

    print(f"✅ 생성 완료: {output_path}")


if __name__ == "__main__":
    main()
