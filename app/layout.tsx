import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BgRemover - 一键去除图片背景",
  description: "使用 AI 技术，一键去除图片背景，下载透明 PNG 图片，无需 Photoshop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
