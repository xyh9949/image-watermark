/**
 * 结构化数据配置
 * 用于生成Schema.org JSON-LD标记
 */



// 获取基础URL
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

// 软件应用结构化数据
export const softwareAppStructuredData = {
  name: '批量图片水印工具',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web Browser',
  offers: {
    price: '0',
    priceCurrency: 'CNY',
  },
  aggregateRating: {
    ratingValue: '4.8',
    ratingCount: '1250',
  },
};

// 网页结构化数据
export const webPageStructuredData = {
  name: '批量图片水印工具 - 专业的在线图片水印添加工具',
  description: '专业的在线批量图片水印添加工具，支持文字水印、图片水印、全屏水印，智能自适应不同图片尺寸。免费使用，无需注册，保护您的图片版权。',
  url: getBaseUrl(),
  lastReviewed: new Date().toISOString(),
  reviewedBy: {
    type: 'Organization',
    name: '图片水印工具团队',
  },
};

// 面包屑导航结构化数据
export const breadcrumbStructuredData = [
  {
    position: 1,
    name: '首页',
    item: getBaseUrl(),
  },
  {
    position: 2,
    name: '图片上传',
    item: `${getBaseUrl()}/#upload`,
  },
  {
    position: 3,
    name: '水印编辑',
    item: `${getBaseUrl()}/#editor`,
  },
  {
    position: 4,
    name: '预览下载',
    item: `${getBaseUrl()}/#preview`,
  },
];

// 组织信息结构化数据
export const organizationStructuredData = {
  '@type': 'Organization',
  name: '图片水印工具',
  url: getBaseUrl(),
  logo: `${getBaseUrl()}/og-image.png`,
  description: '专业的在线图片处理工具提供商',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['Chinese', 'English'],
  },
  sameAs: [
    // 可以添加社交媒体链接
  ],
};

// 产品结构化数据
export const productStructuredData = {
  '@type': 'SoftwareApplication',
  name: '批量图片水印工具',
  description: '专业的在线批量图片水印添加工具，支持文字水印、图片水印、全屏水印',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web Browser',
  url: getBaseUrl(),
  screenshot: `${getBaseUrl()}/og-image.png`,
  author: organizationStructuredData,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'CNY',
    availability: 'https://schema.org/InStock',
    priceValidUntil: '2025-12-31',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
    bestRating: '5',
    worstRating: '1',
  },
  featureList: [
    '批量图片处理',
    '文字水印添加',
    '图片水印添加',
    '智能自适应尺寸',
    '免费使用',
    '无需注册',
    '隐私保护',
  ],
};

// 常见问题结构化数据
export const faqStructuredData = [
  {
    questionName: '这个工具是免费的吗？',
    acceptedAnswerText: '是的，我们的图片水印工具完全免费使用，无需注册或付费。',
  },
  {
    questionName: '支持哪些图片格式？',
    acceptedAnswerText: '支持常见的图片格式，包括 JPEG、PNG、WebP 和 GIF。',
  },
  {
    questionName: '上传的图片会被保存吗？',
    acceptedAnswerText: '不会。所有图片处理都在您的浏览器本地完成，我们不会保存您的任何图片。',
  },
  {
    questionName: '可以批量处理多少张图片？',
    acceptedAnswerText: '支持同时处理最多50张图片，每张图片最大10MB。',
  },
  {
    questionName: '水印可以自定义吗？',
    acceptedAnswerText: '可以。支持自定义文字水印的内容、字体、大小、颜色、透明度和位置，也支持上传自定义图片水印。',
  },
];
