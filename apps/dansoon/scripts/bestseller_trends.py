"""주간 베스트셀러 순위 변동 계산.

매주 남기는 덤프(data/bestseller/<날짜>.json)의 종합 순위와 비교해
전주 대비 변동·신규 진입·연속 순위권 주 수를 붙인다.
수집·네트워크 의존성이 없어 단독으로 검증할 수 있다: python3 scripts/bestseller_trends.py
"""

from __future__ import annotations

import json
import pathlib
from collections.abc import Callable

# 연속 순위권 주 수를 셀 때 거슬러 올라가는 최대 주 수
LOOKBACK_WEEKS = 12

KeyOf = Callable[[str], str]


def load_previous_rankings(dump_dir: pathlib.Path, before_date: str, key_of: KeyOf) -> list[dict[str, int]]:
    """before_date 이전 덤프의 종합 순위를 최신 주부터 돌려준다. [{제목키: 순위}, ...]"""
    dumps = sorted(path for path in dump_dir.glob("*.json") if path.stem < before_date)[-LOOKBACK_WEEKS:]
    rankings: list[dict[str, int]] = []
    for path in reversed(dumps):
        try:
            merged = json.loads(path.read_text(encoding="utf-8")).get("merged", [])
        except (OSError, json.JSONDecodeError):
            continue
        rankings.append({key_of(book["title"]): book["rank"] for book in merged if book.get("rank")})
    return rankings


def annotate_trends(books: list[dict], previous: list[dict[str, int]], key_of: KeyOf) -> None:
    """books에 change(None=비교 불가, 'new', 정수: +면 상승)와 streak(연속 순위권 주 수)를 채운다."""
    last_week = previous[0] if previous else None
    for book in books:
        key = key_of(book["title"])
        if last_week is None:
            book["change"] = None
        elif key not in last_week:
            book["change"] = "new"
        else:
            book["change"] = last_week[key] - book["rank"]
        streak = 1
        for week in previous:
            if key not in week:
                break
            streak += 1
        book["streak"] = streak


def change_label(change: int | str | None) -> str:
    if change is None or change == 0:
        return "-"
    if change == "new":
        return "NEW"
    return f"▲{change}" if change > 0 else f"▼{-change}"


def summary_markdown(books: list[dict]) -> str:
    """'이번 주 한눈에' 요약. 비교할 지난주 기록이 없으면 빈 문자열."""
    if not books or all(book.get("change") is None for book in books):
        return ""
    lines: list[str] = []
    new_entries = [book for book in books if book.get("change") == "new"]
    if new_entries:
        titles = ", ".join(f"**{book['title']}**" for book in new_entries[:3])
        more = f" 외 {len(new_entries) - 3}권" if len(new_entries) > 3 else ""
        lines.append(f"- 🆕 새로 들어온 책 {len(new_entries)}권: {titles}{more}")
    risers = [book for book in books if isinstance(book.get("change"), int) and book["change"] > 0]
    if risers:
        top = max(risers, key=lambda book: book["change"])
        lines.append(f"- 📈 가장 많이 오른 책: **{top['title']}** ({top['rank']}위, {change_label(top['change'])})")
    longest = max(books, key=lambda book: book.get("streak", 1))
    if longest.get("streak", 1) > 1:
        lines.append(f"- 🏆 가장 오래 순위권: **{longest['title']}** ({longest['streak']}주 연속)")
    return "### 이번 주 한눈에\n\n" + "\n".join(lines) + "\n" if lines else ""


if __name__ == "__main__":
    import tempfile

    key = str.lower
    with tempfile.TemporaryDirectory() as tmp:
        dump_dir = pathlib.Path(tmp)
        weeks = {
            "2026-10-19": [("A", 1), ("B", 2)],
            "2026-10-26": [("A", 2), ("B", 1), ("C", 3)],
        }
        for date, ranked in weeks.items():
            merged = [{"title": title, "rank": rank} for title, rank in ranked]
            (dump_dir / f"{date}.json").write_text(json.dumps({"merged": merged}), encoding="utf-8")
        previous = load_previous_rankings(dump_dir, "2026-11-02", key)
        assert previous == [{"a": 2, "b": 1, "c": 3}, {"a": 1, "b": 2}], previous

        books = [{"title": "A", "rank": 1}, {"title": "C", "rank": 2}, {"title": "D", "rank": 3}]
        annotate_trends(books, previous, key)
        assert [book["change"] for book in books] == [1, 1, "new"]
        assert [book["streak"] for book in books] == [3, 2, 1]
        assert [change_label(book["change"]) for book in books] == ["▲1", "▲1", "NEW"]
        assert "새로 들어온 책 1권" in summary_markdown(books)
        assert "3주 연속" in summary_markdown(books)

        first_week = [{"title": "A", "rank": 1}]
        annotate_trends(first_week, [], key)
        assert first_week[0]["change"] is None and summary_markdown(first_week) == ""
    print("bestseller_trends: ok")
