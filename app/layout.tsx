import { AuthProvider } from "@apps/providers/AuthProvider";
import { ThemeProvider } from "@apps/providers/ThemeProvider";
import type { Metadata, Viewport } from "next";
import { Rubik, Space_Mono } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1c1e" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "어썸 스도쿠 — 온라인 퍼즐 게임",
    template: "%s | 어썸 스도쿠",
  },
  description:
    "클래식 및 킬러 모드를 지원하는 온라인 스도쿠 퍼즐 게임. "
    + "4단계 난이도, 메모 기능, 포인트 시스템으로 두뇌를 깨우세요.",
  openGraph: {
    title: "어썸 스도쿠 — 온라인 퍼즐 게임",
    description:
      "클래식 및 킬러 모드를 지원하는 온라인 스도쿠 퍼즐 게임.",
    type: "website",
    locale: "ko_KR",
    siteName: "어썸 스도쿠",
  },
  twitter: {
    card: "summary",
    title: "어썸 스도쿠 — 온라인 퍼즐 게임",
    description:
      "클래식 및 킬러 모드를 지원하는 온라인 스도쿠 퍼즐 게임.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{" +
              "var s=JSON.parse(localStorage.getItem('awesome-sudoku-theme')||'{}');" +
              "var t=(s.state&&s.state.theme)||'system';" +
              "var d=t==='dark'||(t==='system'&&window.matchMedia(" +
              "'(prefers-color-scheme: dark)').matches);" +
              "if(d)document.documentElement.classList.add('dark')" +
              "}catch(e){}})();",
          }}
        />
      </head>
      <body className={`${rubik.variable} ${spaceMono.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
