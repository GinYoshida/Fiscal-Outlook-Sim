import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "統合政府 30年財政シミュレーター",
  description: "2026〜2055年の日本政府＋日銀の財政推移をシミュレーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
