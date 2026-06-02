import type { Metadata } from "next";
import ReactDOM from "react-dom";
import { Gowun_Dodum } from "next/font/google";
import { ROOM_BACKGROUNDS } from "@widgets/game-room/constants";
import { TermsConsentModal } from "@entities/auth/ui";
import "./globals.css";
import SyncProvider from "./sync-provider";

const gowunDodum = Gowun_Dodum({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gowun-dodum",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PLCO",
  description: "PLCO 캐릭터를 키워보세요!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 방 배경을 서버 렌더 시점에 미리 받아두어 게임 진입 즉시 표시
  Object.values(ROOM_BACKGROUNDS).forEach((src) =>
    ReactDOM.preload(src, { as: "image", fetchPriority: "high" }),
  );

  return (
    <html lang="ko" className={`${gowunDodum.variable} h-full`}>
      <body className="min-h-full flex flex-col items-center justify-center">
        <div className="w-full max-w-md md:max-w-lg mx-auto min-h-dvh flex flex-col">
          <SyncProvider>{children}</SyncProvider>
          <TermsConsentModal />
        </div>
      </body>
    </html>
  );
}
