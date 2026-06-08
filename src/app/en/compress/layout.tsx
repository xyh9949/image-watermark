import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { OG_IMAGE_URL, SITE_NAME, SITE_URL } from '../../lib/site';

export const metadata: Metadata = {
  title: 'Batch Image Compression Tool - Free Online JPEG PNG WebP GIF Compressor',
  description: 'Free browser-based batch image compression tool for JPEG, PNG, WebP, and GIF images. Compress multiple files locally, keep the original format, and download results as a ZIP archive.',
  alternates: {
    canonical: `${SITE_URL}/en/compress`,
    languages: {
      'zh-CN': `${SITE_URL}/compress`,
      en: `${SITE_URL}/en/compress`,
    },
  },
  openGraph: {
    title: 'Batch Image Compression Tool - Free Online JPEG PNG WebP GIF Compressor',
    description: 'Compress multiple images locally in your browser and download optimized files together.',
    url: `${SITE_URL}/en/compress`,
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'Batch Image Compression Tool',
      },
    ],
    locale: 'en_US',
    alternateLocale: ['zh_CN'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Batch Image Compression Tool - Free Online JPEG PNG WebP GIF Compressor',
    description: 'Free browser-based batch image compression tool with local processing and ZIP downloads.',
    images: [OG_IMAGE_URL],
  },
};

export default function EnglishCompressLayout({ children }: { children: ReactNode }) {
  return children;
}
