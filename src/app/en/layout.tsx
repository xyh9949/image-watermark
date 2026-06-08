import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { OG_IMAGE_URL, SITE_NAME, SITE_URL } from '../lib/site';

export const metadata: Metadata = {
  title: 'Batch Image Watermark Tool - Free Online Text and Logo Watermarks',
  description: 'Free browser-based batch image watermark tool for adding text watermarks, logo watermarks, and tiled watermarks to JPG, PNG, and WebP images. Images are processed locally and are not uploaded to a server.',
  alternates: {
    canonical: `${SITE_URL}/en`,
    languages: {
      'zh-CN': SITE_URL,
      en: `${SITE_URL}/en`,
    },
  },
  openGraph: {
    title: 'Batch Image Watermark Tool - Free Online Text and Logo Watermarks',
    description: 'Add text, logo, and tiled watermarks to multiple images in your browser with local processing.',
    url: `${SITE_URL}/en`,
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'Batch Image Watermark Tool',
      },
    ],
    locale: 'en_US',
    alternateLocale: ['zh_CN'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Batch Image Watermark Tool - Free Online Text and Logo Watermarks',
    description: 'Free browser-based batch image watermark tool with local processing.',
    images: [OG_IMAGE_URL],
  },
};

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return children;
}
