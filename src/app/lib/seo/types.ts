/**
 * SEO相关的TypeScript类型定义
 * 用于确保SEO配置的类型安全
 */

import { DefaultSeoProps } from 'next-seo';

// 扩展的SEO配置接口
export interface ExtendedSeoConfig extends DefaultSeoProps {
  // 百度特殊配置
  baiduVerification?: string;
  // 自定义meta标签
  customMeta?: Array<{
    name?: string;
    property?: string;
    content: string;
    httpEquiv?: string;
  }>;
  // 多语言支持
  locale?: 'zh-CN' | 'en-US';
}

// Open Graph图片配置
export interface OGImageConfig {
  url: string;
  width: number;
  height: number;
  alt: string;
  type?: string;
}

// 结构化数据配置
export interface StructuredDataConfig {
  // 软件应用信息
  softwareApp?: {
    name: string;
    applicationCategory: string;
    operatingSystem: string;
    offers?: {
      price: string;
      priceCurrency: string;
    };
    aggregateRating?: {
      ratingValue: string;
      ratingCount: string;
    };
  };
  // 网页信息
  webPage?: {
    name: string;
    description: string;
    url: string;
    lastReviewed?: string;
    reviewedBy?: {
      type: string;
      name: string;
    };
  };
  // 面包屑导航
  breadcrumb?: Array<{
    position: number;
    name: string;
    item: string;
  }>;
}

// SEO页面配置
export interface PageSeoConfig {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  openGraph?: {
    title?: string;
    description?: string;
    images?: OGImageConfig[];
    type?: string;
  };
  twitter?: {
    cardType?: string;
    site?: string;
    handle?: string;
  };
}

// 站点地图配置
export interface SitemapConfig {
  baseUrl: string;
  pages: Array<{
    url: string;
    lastModified?: Date;
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
  }>;
}

// 百度SEO特殊配置
export interface BaiduSeoConfig {
  verification?: string;
  mobileAgent?: string;
  statisticsId?: string;
  pushUrl?: string;
}
