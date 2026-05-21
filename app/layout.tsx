import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "플레이브 다마고치",
  description: "플레이브 캐릭터를 키워보세요!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col items-center justify-center">
        <div className="w-full max-w-md md:max-w-lg mx-auto min-h-dvh flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
