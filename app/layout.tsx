import type { Metadata } from "next";
import { Gowun_Dodum } from "next/font/google";
import "./globals.css";

const gowunDodum = Gowun_Dodum({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PLAVE GOTCHI",
  description: "플레이브 캐릭터를 키워보세요! 예코, 아코, 밤코, 은코, 하코와 함께하는 다마고치",
  keywords: ["플레이브", "다마고치", "PLAVE", "육성", "게임"],
  openGraph: {
    title: "PLAVE GOTCHI",
    description: "플레이브 캐릭터를 키워보세요!",
    type: "website",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#F8F4FF",
  appleWebApp: {
    capable: true,
    title: "PLAVE GOTCHI",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full ${gowunDodum.className}`}>
      <body className="min-h-full flex flex-col items-center justify-center">
        <div className="w-full max-w-md md:max-w-lg mx-auto min-h-dvh flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
