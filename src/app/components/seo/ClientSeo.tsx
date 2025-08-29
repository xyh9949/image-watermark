/**
 * 客户端SEO组件
 * 提供额外的SEO增强功能
 */

'use client';

import { DefaultSeo } from 'next-seo';
import { defaultSeoConfig } from '@/app/lib/seo/config';
import { useEffect, useState } from 'react';

export function ClientSeo() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 在服务端渲染时不渲染SEO组件，避免hydration mismatch
  if (!mounted) {
    return null;
  }

  return <DefaultSeo {...defaultSeoConfig} />;
}
