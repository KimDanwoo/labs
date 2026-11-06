"""웹소설 주간 요약.

플랫폼별 장르 순위를 지난주 덤프(data/webnovel/<날짜>.json)와 비교해 '이번 주 한눈에' 표를 만든다.
웹소설은 같은 작품이 여러 플랫폼 순위에 함께 오르는 일이 드물어, 플랫폼을 합친 통합 순위 대신
플랫폼별 1위와 새로 들어온 작품 수를 보여 준다.
수집·네트워크 의존성이 없어 단독으로 검증할 수 있다: python3 scripts/webnovel_ranking.py
"""

from __future__ import annotations

import html
import json
import pathlib
import re
from datetime import date as Date

GENRES = [
    {"key": "fantasy", "name": "판타지"},
    {"key": "romfantasy", "name": "로맨스판타지"},
    {"key": "romance", "name": "로맨스"},
    {"key": "modern", "name": "현대판타지"},
    {"key": "martial", "name": "무협"},
    {"key": "bl", "name": "BL"},
]

PLATFORMS = ("카카오페이지", "네이버 시리즈", "리디")

# {플랫폼: {장르 키: [{"title", "author", "rank", ...}]}}
PlatformData = dict[str, dict[str, list[dict]]]
# {플랫폼: {장르 키: {작품 키}}}
PreviousTitles = dict[str, dict[str, set[str]]]

# 이보다 오래된 기록과는 '지난주'라고 비교하지 않는다(수집이 몇 주 빠진 구간이 실제로 있다)
MAX_COMPARE_GAP_DAYS = 8


def title_key(title: str) -> str:
    return re.sub(r"[\s\W]", "", title).lower()


def dump_payload(date: str, platform_data: PlatformData) -> dict:
    """다음 주 비교에 쓸 최소 정보만 남긴다."""
    return {
        "date": date,
        "platforms": {
            platform: {
                genre: [{"title": b["title"], "author": b.get("author", ""), "rank": b["rank"]} for b in books]
                for genre, books in genres.items()
            }
            for platform, genres in platform_data.items()
        },
    }


def load_previous_titles(dump_dir: pathlib.Path, before_date: str) -> tuple[str, PreviousTitles] | None:
    """before_date 직전 덤프의 (날짜, 플랫폼·장르별 작품 키). 비교할 만큼 가까운 기록이 없으면 None."""
    dumps = sorted(path for path in dump_dir.glob("*.json") if path.stem < before_date)
    if not dumps:
        return None
    gap = Date.fromisoformat(before_date) - Date.fromisoformat(dumps[-1].stem)
    if gap.days > MAX_COMPARE_GAP_DAYS:
        return None
    try:
        platforms = json.loads(dumps[-1].read_text(encoding="utf-8")).get("platforms", {})
    except (OSError, json.JSONDecodeError):
        return None
    titles = {
        platform: {genre: {title_key(b["title"]) for b in books} for genre, books in genres.items() if books}
        for platform, genres in platforms.items()
    }
    return dumps[-1].stem, titles


def md_text(text: str) -> str:
    """외부에서 수집한 제목을 표 칸에 넣을 수 있게 HTML·마크다운 특수문자와 줄바꿈을 무력화한다."""
    escaped = html.escape(" ".join(text.split()), quote=False)
    return re.sub(r"([\\`*_\[\]|])", r"\\\1", escaped)


def _top_cell(books: list[dict]) -> str:
    return f"**{md_text(books[0]['title'])}**" if books else "-"


def _new_entry_cell(platform_data: PlatformData, genre: str, previous: PreviousTitles) -> str:
    """지난주 기록이 있는 플랫폼만 센다. 지난주 수집이 빠진 플랫폼을 전부 '신규'로 세지 않기 위함이다."""
    comparable = [platform for platform in PLATFORMS if genre in previous.get(platform, {})]
    if not comparable:
        return "-"
    count = sum(
        1
        for platform in comparable
        for book in platform_data.get(platform, {}).get(genre, [])
        if title_key(book["title"]) not in previous[platform][genre]
    )
    return f"{count}편"


def shared_titles(platform_data: PlatformData, genre: str) -> list[tuple[str, list[str]]]:
    """같은 장르에서 두 곳 이상의 플랫폼에 오른 작품과 그 플랫폼 목록."""
    seen: dict[str, tuple[str, list[str]]] = {}
    for platform in PLATFORMS:
        for book in platform_data.get(platform, {}).get(genre, []):
            title, platforms = seen.setdefault(title_key(book["title"]), (book["title"], []))
            if platform not in platforms:
                platforms.append(platform)
    return [entry for entry in seen.values() if len(entry[1]) >= 2]


def summary_markdown(platform_data: PlatformData, previous: tuple[str, PreviousTitles] | None) -> str:
    """'이번 주 한눈에' 표. 수집된 장르가 없으면 빈 문자열."""
    rows: list[str] = []
    shared_lines: list[str] = []
    for genre in GENRES:
        key = genre["key"]
        per_platform = [platform_data.get(platform, {}).get(key, []) for platform in PLATFORMS]
        if not any(per_platform):
            continue
        new_cell = "-" if previous is None else _new_entry_cell(platform_data, key, previous[1])
        rows.append(f"| {genre['name']} | " + " | ".join(_top_cell(books) for books in per_platform) + f" | {new_cell} |")
        shared_lines += [
            f"- **{md_text(title)}** ({genre['name']}): {'·'.join(platforms)}"
            for title, platforms in shared_titles(platform_data, key)
        ]
    if not rows:
        return ""

    new_note = (
        f"**새로 들어온 작품**은 {previous[0]} 기록과 비교해 세 플랫폼의 장르별 TOP 10에 새로 오른 작품 수입니다"
        "(그날 기록이 없는 플랫폼은 빼고 셉니다)."
        if previous is not None
        else "비교할 지난주 기록이 없어 **새로 들어온 작품**은 비워 둡니다."
    )
    shared_block = (
        ["", "이번 주 여러 플랫폼 순위에 함께 오른 작품은 이렇습니다.", "", *shared_lines] if shared_lines else []
    )
    return "\n".join([
        "## 이번 주 한눈에",
        "",
        "장르마다 플랫폼별 1위 작품을 모았습니다. " + new_note,
        "",
        "| 장르 | " + " | ".join(f"{platform} 1위" for platform in PLATFORMS) + " | 새로 들어온 작품 |",
        "|------|" + "------|" * len(PLATFORMS) + ":-------------:|",
        *rows,
        *shared_block,
        "",
    ])


if __name__ == "__main__":
    import tempfile

    this_week: PlatformData = {
        "카카오페이지": {"fantasy": [{"title": "A", "rank": 1}, {"title": "B", "rank": 2}]},
        "네이버 시리즈": {"fantasy": [{"title": "C", "rank": 1}]},
        "리디": {"fantasy": [{"title": "A", "rank": 3}]},
    }
    first_week = summary_markdown(this_week, None)
    assert "| 판타지 | **A** | **C** | **A** | - |" in first_week, first_week
    assert "- **A** (판타지): 카카오페이지·리디" in first_week, first_week

    with tempfile.TemporaryDirectory() as tmp:
        dump_dir = pathlib.Path(tmp)
        last_week: PlatformData = {"카카오페이지": {"fantasy": [{"title": "A", "rank": 1}]}}
        (dump_dir / "2026-10-26.json").write_text(json.dumps(dump_payload("2026-10-26", last_week)), encoding="utf-8")
        previous = load_previous_titles(dump_dir, "2026-11-02")
        assert previous == ("2026-10-26", {"카카오페이지": {"fantasy": {"a"}}}), previous
        # 지난주 기록이 있는 카카오만 센다: B 1편. 기록이 없던 네이버·리디는 신규로 세지 않는다
        assert "| 1편 |" in summary_markdown(this_week, previous)
        assert "2026-10-26 기록과 비교해" in summary_markdown(this_week, previous)
        assert load_previous_titles(dump_dir, "2026-10-26") is None
        # 5주 전 기록은 '지난주'로 비교하지 않는다
        assert load_previous_titles(dump_dir, "2026-11-30") is None

    hostile = summary_markdown({"리디": {"bl": [{"title": "<img src=x onerror=alert(1)>*굵게*|칸\n줄", "rank": 1}]}}, None)
    assert "<img" not in hostile and "&lt;img" in hostile, hostile
    assert "\\*굵게\\*\\|칸 줄" in hostile, hostile

    no_shared = summary_markdown({"리디": {"bl": [{"title": "X", "rank": 1}]}}, None)
    assert "함께 오른 작품" not in no_shared
    assert summary_markdown({}, None) == ""
    print("webnovel_ranking: ok")
