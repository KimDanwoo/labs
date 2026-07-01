import { LeaderboardPage } from "@views/leaderboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "랭킹",
  description:
    "스도쿠 최고 기록 및 누적 포인트 리더보드. "
    + "난이도와 모드별 랭킹을 확인하세요.",
  alternates: { canonical: "/leaderboard" },
};

export default function Leaderboard() {
  return <LeaderboardPage />;
}
