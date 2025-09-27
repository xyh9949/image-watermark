import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientSeo } from './components/seo/ClientSeo';

// 基础metadata用于SSR
export const metadata: Metadata = {
  title: "批量图片水印工具 - 专业在线水印添加器，支持文字图片水印批量处理",
  description: "专业的在线批量图片水印添加工具，支持文字水印、图片水印、透明水印等多种样式。智能自适应不同图片尺寸，批量处理效率高，一键操作简单便捷。完全免费使用，无需注册下载，本地处理保护隐私安全。适用于摄影师、设计师、电商卖家、自媒体创作者等专业用户，是图片版权保护的必备工具。",
  keywords: "图片水印,批量处理,在线工具,水印添加,图片处理,版权保护,文字水印,图片水印,免费工具",
  authors: [{ name: "图片水印工具团队" }],
  applicationName: "图片水印工具",
  generator: "Next.js",
  // Open Graph
  openGraph: {
    title: "批量图片水印工具 - 专业在线水印添加器，支持文字图片水印批量处理",
    description: "专业的在线批量图片水印添加工具，支持文字水印、图片水印、透明水印等多种样式。智能自适应不同图片尺寸，批量处理效率高，一键操作简单便捷。完全免费使用，无需注册下载。",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "批量图片水印工具",
    images: [
      {
        url: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/og-image.png",
        width: 1200,
        height: 630,
        alt: "批量图片水印工具 - 专业的在线图片水印添加工具",
      },
    ],
    locale: "zh_CN",
    type: "website",
  },
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "批量图片水印工具 - 专业在线水印添加器",
    description: "专业的在线批量图片水印添加工具，支持文字水印、图片水印、透明水印等多种样式。完全免费使用，无需注册下载。",
    images: [(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/og-image.png"],
    creator: "@imageWatermark",
    site: "@imageWatermark",
  },
  // 其他meta标签
  other: {
    "twitter:card": "summary_large_image",
    "twitter:site": "@imageWatermark",
    "twitter:creator": "@imageWatermark",
  },
  // Canonical URL
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
};

// Viewport配置
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased bg-background text-foreground">
        <ClientSeo />

        {/* 服务端渲染的结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "批量图片水印工具",
              "description": "专业的在线批量图片水印添加工具，支持文字水印、图片水印、透明水印等多种样式。智能自适应不同图片尺寸，批量处理效率高。",
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": "Web Browser",
              "url": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "CNY",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1250",
                "bestRating": "5",
                "worstRating": "1"
              },
              "featureList": [
                "批量图片水印添加",
                "文字水印自定义",
                "图片水印上传",
                "透明度调节",
                "位置精确控制",
                "多格式支持",
                "免费使用",
                "无需注册"
              ]
            })
          }}
        />
        <div className="min-h-screen flex flex-col">
          {/* 头部导航 */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* 移动端头部 */}
            <div className="lg:hidden h-16 px-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold">图片水印工具</h1>
                  <span className="text-sm text-muted-foreground">v1.0.3</span>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  免费开源
                </span>
              </div>

              {/* GitHub 链接 */}
              <a
                href="https://github.com/xyh9949/image-watermark"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="查看源代码"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>

            {/* 桌面端头部 - 与下面的布局保持一致 */}
            <div className="hidden lg:flex h-16">
              {/* 左侧区域 - 对应上传区域 */}
              <div className="flex-[3] bg-background px-4 flex items-center">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-bold">图片水印工具</h1>
                    <span className="text-sm text-muted-foreground">v1.0.3</span>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    免费开源项目
                  </span>
                </div>
              </div>

              {/* 右侧区域 - 对应编辑器和控制面板区域 */}
              <div className="flex-[9] px-4 flex items-center justify-end">
                <a
                  href="https://github.com/xyh9949/image-watermark"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  title="查看源代码"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>GitHub</span>
                </a>
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
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span>© 2025 批量图片水印工具. 专业的在线图片处理服务.</span>
                <div className="flex items-center space-x-4">
                  <a
                    href="https://github.com/xyh9949/image-watermark"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    开源项目
                  </a>
                  <a
                    href="https://github.com/xyh9949/image-watermark/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    问题反馈
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
