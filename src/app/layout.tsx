import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GITHUB_URL, OG_IMAGE_URL, SITE_NAME, SITE_URL } from './lib/site';
import { SiteChrome } from '@/components/SiteChrome';

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
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
