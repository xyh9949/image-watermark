/**
 * 客户端结构化数据组件
 * 解决JSON-LD组件在SSR时的兼容性问题
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  WebPageJsonLd, 
  SoftwareAppJsonLd, 
  BreadcrumbJsonLd, 
  FAQPageJsonLd 
} from 'next-seo';
import { 
  webPageStructuredData, 
  softwareAppStructuredData, 
  breadcrumbStructuredData, 
  faqStructuredData 
} from '@/app/lib/seo/structured-data';

export function StructuredData() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 在服务端渲染时不渲染JSON-LD组件，避免hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      <WebPageJsonLd
        description={webPageStructuredData.description}
        id={webPageStructuredData.url}
        lastReviewed={webPageStructuredData.lastReviewed}
        reviewedBy={webPageStructuredData.reviewedBy}
      />
      
      <SoftwareAppJsonLd
        name={softwareAppStructuredData.name}
        price={softwareAppStructuredData.offers?.price || '0'}
        priceCurrency={softwareAppStructuredData.offers?.priceCurrency || 'CNY'}
        aggregateRating={softwareAppStructuredData.aggregateRating}
        operatingSystem={softwareAppStructuredData.operatingSystem}
        applicationCategory={softwareAppStructuredData.applicationCategory}
        keywords="图片水印,批量处理,在线工具,水印添加"
      />
      
      <BreadcrumbJsonLd
        itemListElements={breadcrumbStructuredData}
      />
      
      <FAQPageJsonLd
        mainEntity={faqStructuredData}
      />
    </>
  );
}
