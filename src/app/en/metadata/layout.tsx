import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { OG_IMAGE_URL, SITE_NAME, SITE_URL } from '../../lib/site';

export const metadata: Metadata = {
  title: 'Image EXIF / Metadata Viewer and Editor - Free Online GPS Remover',
  description: 'Free browser-based image EXIF and metadata tool for JPG, PNG, and WebP. View, edit, and remove EXIF, IPTC, XMP, ICC, GPS, and related metadata locally without uploading files.',
  alternates: {
    canonical: `${SITE_URL}/en/metadata`,
    languages: {
      'zh-CN': `${SITE_URL}/metadata`,
      en: `${SITE_URL}/en/metadata`,
    },
  },
  openGraph: {
    title: 'Image EXIF / Metadata Viewer and Editor',
    description: 'View, edit, and remove image EXIF, IPTC, XMP, GPS, and related metadata locally in your browser.',
    url: `${SITE_URL}/en/metadata`,
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'Image EXIF / Metadata Viewer and Editor',
      },
    ],
    locale: 'en_US',
    alternateLocale: ['zh_CN'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Image EXIF / Metadata Viewer and Editor',
    description: 'Browser-based metadata viewer, editor, GPS remover, and cleanup tool for JPG, PNG, and WebP images.',
    images: [OG_IMAGE_URL],
  },
};

export default function EnglishMetadataLayout({ children }: { children: ReactNode }) {
  return children;
}
