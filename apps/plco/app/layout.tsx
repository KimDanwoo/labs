import type { Metadata, Viewport } from "next";
import ReactDOM from "react-dom";
import { Gowun_Dodum } from "next/font/google";
import { ROOM_BACKGROUNDS } from "@widgets/game-room/constants";
import { TermsConsentModal } from "@entities/auth/ui";
import "./globals.css";
import QueryProvider from "./query-provider";
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

// 모바일에서 input 포커스 시 자동 확대/핀치 줌 방지
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <QueryProvider>
            <SyncProvider>{children}</SyncProvider>
            <TermsConsentModal />
          </QueryProvider>
        </div>
      </body>
    </html>
  );
}
