import { ProfilePage } from "@views/profile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프로필",
  description: "내 게임 기록, 통계, 난이도별 성적을 확인하세요.",
  alternates: { canonical: "/profile" },
};

export default function Profile() {
  return <ProfilePage />;
}
