import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { OG_IMAGE_URL, SITE_NAME, SITE_URL } from '../lib/site';

export const metadata: Metadata = {
  title: '批量图片压缩工具 - 免费在线压缩 JPEG/PNG/WebP/GIF',
  description: '免费的浏览器端批量图片压缩工具，支持 JPEG、PNG、WebP 和 GIF 图片压缩，可批量处理、移除元数据并打包下载，图片不上传服务器。',
  alternates: {
    canonical: `${SITE_URL}/compress`,
    languages: {
      'zh-CN': `${SITE_URL}/compress`,
      en: `${SITE_URL}/en/compress`,
    },
  },
  openGraph: {
    title: '批量图片压缩工具 - 免费在线压缩 JPEG/PNG/WebP/GIF',
    description: '浏览器端批量图片压缩工具，支持多格式、本地处理和 ZIP 下载。',
    url: `${SITE_URL}/compress`,
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: '批量图片压缩工具 - 浏览器端图片压缩',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '批量图片压缩工具 - 免费在线压缩 JPEG/PNG/WebP/GIF',
    description: '浏览器端批量图片压缩工具，支持多格式、本地处理和 ZIP 下载。',
    images: [OG_IMAGE_URL],
  },
};

interface CompressLayoutProps {
  children: ReactNode;
}

export default function CompressLayout({ children }: CompressLayoutProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
