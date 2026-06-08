import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { OG_IMAGE_URL, SITE_NAME, SITE_URL } from '../lib/site';

export const metadata: Metadata = {
  title: '图片 EXIF / 元数据查看编辑工具 - 免费在线清除 GPS 和修改元数据',
  description: '免费的浏览器端图片 EXIF 与元数据工具，支持 JPG、PNG、WebP 查看、编辑和清除 EXIF、IPTC、XMP、ICC、GPS 等信息，文件本地处理不上传服务器。',
  alternates: {
    canonical: `${SITE_URL}/metadata`,
    languages: {
      'zh-CN': `${SITE_URL}/metadata`,
      en: `${SITE_URL}/en/metadata`,
    },
  },
  openGraph: {
    title: '图片 EXIF / 元数据查看编辑工具',
    description: '在浏览器本地查看、编辑和清除图片 EXIF、IPTC、XMP、GPS 等元数据。',
    url: `${SITE_URL}/metadata`,
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: '图片 EXIF / 元数据查看编辑工具',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '图片 EXIF / 元数据查看编辑工具',
    description: '浏览器端图片元数据查看、编辑和清除工具，支持 JPG、PNG、WebP。',
    images: [OG_IMAGE_URL],
  },
};

export default function MetadataLayout({ children }: { children: ReactNode }) {
  return children;
}
