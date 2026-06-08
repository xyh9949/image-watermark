import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GITHUB_URL, OG_IMAGE_URL, SITE_NAME, SITE_URL } from './lib/site';

// 基础metadata用于SSR
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "批量图片水印工具 - 免费在线添加文字/图片水印",
  description: "免费的浏览器端批量图片水印工具，支持文字水印、图片水印和全屏平铺水印。图片在本地浏览器处理，不上传服务器，适合摄影、电商、自媒体和设计作品版权保护。",
  keywords: "图片水印,批量处理,在线工具,水印添加,图片处理,版权保护,文字水印,图片水印,免费工具",
  authors: [{ name: "图片水印工具团队" }],
  applicationName: SITE_NAME,
  generator: "Next.js",
  // Open Graph
  openGraph: {
    title: "批量图片水印工具 - 免费在线添加文字/图片水印",
    description: "免费的浏览器端批量图片水印工具，支持文字水印、图片水印和全屏平铺水印。本地处理图片，不上传服务器。",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE_URL,
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
    title: "批量图片水印工具 - 免费在线添加文字/图片水印",
    description: "免费的浏览器端批量图片水印工具，支持文字水印、图片水印和全屏平铺水印。本地处理图片，不上传服务器。",
    images: [OG_IMAGE_URL],
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
    canonical: SITE_URL,
    languages: {
      'zh-CN': SITE_URL,
      en: `${SITE_URL}/en`,
    },
  },
};

// Viewport配置
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  themeColor: '#ffffff',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased bg-background text-foreground overflow-x-hidden">
        {/* 服务端渲染的结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": SITE_NAME,
              "description": "免费的浏览器端批量图片水印工具，支持文字水印、图片水印和全屏平铺水印。图片在本地浏览器处理，不上传服务器。",
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": "Web Browser",
              "url": SITE_URL,
              "sameAs": GITHUB_URL,
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "CNY",
                "availability": "https://schema.org/InStock"
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
        {/* 兼容性：为不支持的环境提供 crypto.randomUUID polyfill（优先使用 Web Crypto） */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const g = globalThis;
    if (!g.crypto) g.crypto = {};
    if (typeof g.crypto.randomUUID !== 'function') {
      const uuidv4 = () => {
        try {
          if (g.crypto && typeof g.crypto.getRandomValues === 'function') {
            const bytes = new Uint8Array(16);
            g.crypto.getRandomValues(bytes);
            bytes[6] = (bytes[6] & 0x0f) | 0x40;
            bytes[8] = (bytes[8] & 0x3f) | 0x80;
            const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
            return hex.slice(0,8) + '-' + hex.slice(8,12) + '-' + hex.slice(12,16) + '-' + hex.slice(16,20) + '-' + hex.slice(20);
          }
        } catch {}
        let ts = Date.now();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = (ts + Math.random() * 16) % 16 | 0;
          ts = Math.floor(ts / 16);
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });
      };
      g.crypto.randomUUID = uuidv4;
    }
  } catch {}
})();`
          }}
        />
        <div className="min-h-dvh flex flex-col">
          {/* 头部导航 */}
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* 移动端头部 */}
            <div className="lg:hidden h-16 px-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="text-xl font-bold">图片水印工具</div>
                  <span className="text-sm text-muted-foreground">v1.2.3</span>
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
                    <div className="text-xl font-bold">图片水印工具</div>
                    <span className="text-sm text-muted-foreground">v1.2.3</span>
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
