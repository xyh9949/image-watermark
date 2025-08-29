/**
 * SEO配置文件
 * 统一管理应用的SEO设置
 */

import { ExtendedSeoConfig, OGImageConfig } from './types';
import { baiduMetaTags, baiduKeywords } from './baidu-config';

// 获取基础URL
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

// Open Graph图片配置
const ogImages: OGImageConfig[] = [
  {
    url: `${getBaseUrl()}/og-image.png`,
    width: 1200,
    height: 630,
    alt: '批量图片水印工具 - 专业的在线图片水印添加工具',
    type: 'image/png',
  },
  // 备用图片
  {
    url: `${getBaseUrl()}/next.svg`,
    width: 800,
    height: 600,
    alt: '图片水印工具',
    type: 'image/svg+xml',
  },
];

// 默认SEO配置
export const defaultSeoConfig: ExtendedSeoConfig = {
  // 基础信息
  title: '批量图片水印工具 - 专业在线水印添加器，支持文字图片水印批量处理',
  titleTemplate: '%s | 专业在线图片水印处理工具',
  defaultTitle: '批量图片水印工具 - 专业在线水印添加器，支持文字图片水印批量处理',
  description: '专业的在线批量图片水印添加工具，支持文字水印、图片水印、透明水印等多种样式。智能自适应不同图片尺寸，批量处理效率高，一键操作简单便捷。完全免费使用，无需注册下载，本地处理保护隐私安全。适用于摄影师、设计师、电商卖家、自媒体创作者等专业用户，是图片版权保护的必备工具。',
  
  // 扩展的meta标签
  additionalMetaTags: [
    {
      name: 'keywords',
      content: [...baiduKeywords.primary, ...baiduKeywords.secondary].join(','),
    },
    {
      name: 'author',
      content: '图片水印工具团队',
    },
    {
      name: 'application-name',
      content: '图片水印工具',
    },
    {
      name: 'generator',
      content: 'Next.js',
    },
    {
      name: 'robots',
      content: 'index,follow',
    },
    {
      name: 'googlebot',
      content: 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
    },
    {
      name: 'bingbot',
      content: 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
    },
    {
      name: 'format-detection',
      content: 'telephone=no',
    },
    {
      name: 'mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'default',
    },
    {
      name: 'apple-mobile-web-app-title',
      content: '图片水印工具',
    },
    // 百度特殊标签
    ...baiduMetaTags,
    // Twitter Card meta标签
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:site',
      content: '@imageWatermark',
    },
    {
      name: 'twitter:creator',
      content: '@imageWatermark',
    },
    // 其他搜索引擎验证（只在有值时添加）
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? [{
      name: 'google-site-verification',
      content: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    }] : []),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? [{
      name: 'msvalidate.01',
      content: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
    }] : []),
  ],

  // Open Graph配置
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: getBaseUrl(),
    siteName: '批量图片水印工具',
    title: '批量图片水印工具 - 专业在线水印添加器，支持文字图片水印批量处理',
    description: '专业的在线批量图片水印添加工具，支持文字水印、图片水印、透明水印等多种样式。智能自适应不同图片尺寸，批量处理效率高，一键操作简单便捷。完全免费使用，无需注册下载。',
    images: ogImages,
  },

  // Twitter Card配置
  twitter: {
    cardType: 'summary_large_image',
    site: '@imageWatermark',
    handle: '@imageWatermark',
  },

  // 其他配置
  canonical: getBaseUrl(),

  // 确保canonical URL在additionalLinkTags中也存在
  additionalLinkTags: [
    {
      rel: 'canonical',
      href: getBaseUrl(),
    },
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/manifest.json',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'dns-prefetch',
      href: 'https://www.google-analytics.com',
    },
    {
      rel: 'dns-prefetch',
      href: 'https://hm.baidu.com',
    },
  ],

  // 语言和地区
  languageAlternates: [
    {
      hrefLang: 'zh-CN',
      href: getBaseUrl(),
    },
  ],

  // 移动端配置
  mobileAlternate: {
    media: 'only screen and (max-width: 640px)',
    href: getBaseUrl(),
  },
};

// 页面特定的SEO配置
export const pageSeoConfigs = {
  home: {
    title: '首页',
    description: '专业的在线批量图片水印添加工具，支持文字水印、图片水印、全屏水印，智能自适应不同图片尺寸。',
    keywords: '图片水印,批量处理,在线工具,水印添加',
  },
  // 可以根据需要添加更多页面配置
};

// 百度SEO特殊配置
export const baiduSeoConfig = {
  // 百度站长验证（需要在百度站长平台获取）
  verification: process.env.NEXT_PUBLIC_BAIDU_VERIFICATION || '',
  // 百度统计ID（可选）
  statisticsId: process.env.NEXT_PUBLIC_BAIDU_STATISTICS_ID || '',
};

export default defaultSeoConfig;
