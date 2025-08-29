/**
 * 动态sitemap生成
 * 符合Next.js 15 App Router规范
 */

import { MetadataRoute } from 'next';

// 获取基础URL
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

// 生成sitemap
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const currentDate = new Date();

  // 定义网站的主要页面
  const routes: MetadataRoute.Sitemap = [
    // 首页 - 最高优先级
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // 功能页面 - 高优先级
    {
      url: `${baseUrl}/#upload`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/#editor`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/#preview`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // API健康检查页面 - 低优先级
    {
      url: `${baseUrl}/api/health`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  return routes;
}

// 导出sitemap配置（可选，用于自定义）
export const sitemapConfig = {
  // 默认更新频率
  defaultChangeFrequency: 'weekly' as const,
  // 默认优先级
  defaultPriority: 0.5,
  // 最大URL数量
  maxUrls: 50000,
  // 是否包含图片信息
  includeImages: false,
  // 是否包含视频信息
  includeVideos: false,
};
