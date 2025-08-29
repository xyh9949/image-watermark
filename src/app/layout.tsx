import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "批量图片水印工具",
  description: "专业的在线批量图片水印添加工具，支持文字水印、图片水印、全屏水印，智能自适应不同图片尺寸",
  keywords: "图片水印,批量处理,在线工具,水印添加",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased bg-background text-foreground">
        <div className="min-h-screen flex flex-col">
          {/* 头部导航 */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 h-16 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold">图片水印工具</h1>
                <span className="text-sm text-muted-foreground">v1.0.0</span>
              </div>
            </div>
          </header>

          {/* 主要内容区域 */}
          <main className="flex-1">
            {children}
          </main>

          {/* 底部信息 */}
          <footer className="border-t py-4">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              © 2025 批量图片水印工具. 专业的在线图片处理服务.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
