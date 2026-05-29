import type { Metadata } from "next";
import { Gowun_Dodum } from "next/font/google";
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
  return (
    <html lang="ko" className={`${gowunDodum.variable} h-full`}>
      <body className="min-h-full flex flex-col items-center justify-center">
        <div className="w-full max-w-md md:max-w-lg mx-auto min-h-dvh flex flex-col">
          <SyncProvider>{children}</SyncProvider>
        </div>
      </body>
    </html>
  );
}
