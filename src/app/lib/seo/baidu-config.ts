/**
 * 百度SEO特殊配置
 * 针对百度搜索引擎的特殊优化
 */

import { BaiduSeoConfig } from './types';

// 百度SEO配置
export const baiduSeoConfig: BaiduSeoConfig = {
  // 百度站长验证
  verification: process.env.NEXT_PUBLIC_BAIDU_VERIFICATION || '',
  // 百度统计ID
  statisticsId: process.env.NEXT_PUBLIC_BAIDU_STATISTICS_ID || '',
  // 百度推送API Token
  pushUrl: process.env.NEXT_PUBLIC_BAIDU_PUSH_TOKEN || '',
  // 移动端适配
  mobileAgent: 'pc,mobile',
};

// 百度特殊的meta标签
export const baiduMetaTags = [
  {
    name: 'baidu-site-verification',
    content: baiduSeoConfig.verification || '',
  },
  {
    name: 'applicable-device',
    content: 'pc,mobile',
  },
  {
    name: 'mobile-agent',
    content: 'format=html5; url=https://m.your-domain.com',
  },
  {
    name: 'baidu-tc-verification',
    content: baiduSeoConfig.verification || '',
  },
].filter(tag => tag.content !== ''); // 过滤掉空内容的标签

// 百度关键词优化
export const baiduKeywords = {
  primary: [
    '图片水印',
    '批量水印',
    '在线水印工具',
    '图片批量处理',
    '水印添加器',
  ],
  secondary: [
    '免费水印工具',
    '图片版权保护',
    '在线图片编辑',
    '批量图片水印',
    '文字水印',
    '图片水印',
    '透明水印',
  ],
  longTail: [
    '如何给图片批量添加水印',
    '免费的在线图片水印工具',
    '怎么给照片加水印',
    '批量图片水印处理软件',
    '在线图片水印制作工具',
  ],
};

// 百度优化的页面描述
export const baiduDescriptions = {
  home: '专业的在线批量图片水印添加工具，支持文字水印、图片水印、透明水印。免费使用，无需下载安装，保护您的图片版权。支持JPG、PNG、WebP等格式，智能批量处理。',
  features: '功能强大的图片水印工具：支持批量处理、自定义位置、透明度调节、多种字体选择。适用于摄影师、设计师、电商卖家等专业用户。',
  help: '图片水印添加教程：详细介绍如何使用在线工具给图片批量添加水印，包括文字水印设置、图片水印上传、位置调整等操作指南。',
};

// 百度结构化数据
export const baiduStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '批量图片水印工具',
  description: baiduDescriptions.home,
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: '网页浏览器',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'CNY',
    availability: 'https://schema.org/InStock',
  },
  featureList: [
    '批量图片水印添加',
    '文字水印自定义',
    '图片水印上传',
    '透明度调节',
    '位置精确控制',
    '多格式支持',
    '免费使用',
    '无需注册',
  ],
  screenshot: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/og-image.png`,
  author: {
    '@type': 'Organization',
    name: '图片水印工具',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

// 百度推送API配置
export const baiduPushConfig = {
  // 主动推送API
  pushApi: 'http://data.zz.baidu.com/urls',
  // 快速收录API
  fastApi: 'http://data.zz.baidu.com/urls?site=your-domain.com&token=your-token',
  // 推送的URL列表
  urls: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sitemap.xml`,
  ],
};

// 百度移动端优化配置
export const baiduMobileConfig = {
  // 移动端适配声明
  mobileAdaptation: {
    'pc-url': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'mobile-url': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'adaptation-type': 'responsive',
  },
  // 移动端优化标签
  mobileTags: [
    {
      name: 'format-detection',
      content: 'telephone=no',
    },
    {
      name: 'x5-orientation',
      content: 'portrait',
    },
    {
      name: 'x5-fullscreen',
      content: 'true',
    },
    {
      name: 'x5-page-mode',
      content: 'app',
    },
  ],
};

export default baiduSeoConfig;
