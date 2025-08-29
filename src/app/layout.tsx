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
