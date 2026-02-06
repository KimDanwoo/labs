import { AuthProvider } from "@apps/providers/AuthProvider";
import { ThemeProvider } from "@apps/providers/ThemeProvider";
import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "스도쿠 게임",
  description: "스도쿠 게임",
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
