import type { Metadata } from "next";
import { Rubik, Space_Mono } from "next/font/google";
import "./globals.css";

// 숫자용 특별 폰트로 Rubik 사용 (둥글고 가독성 높은 숫자)
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// 등너비(monospace) 폰트는 Space Mono 사용
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "스도쿠 게임",
  description: "스도쿠 게임",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${rubik.variable} ${spaceMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
