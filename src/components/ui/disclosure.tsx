'use client';

import { Collapse } from 'antd';
import type { ReactNode } from 'react';

export function Disclosure({ title, children, className = '' }: { title: ReactNode; children: ReactNode; className?: string }) {
  // 折叠只隐藏字段，不卸载草稿和上传控件；FAQ 内容也保留在服务端 HTML 中。
  return <Collapse ghost expandIconPlacement="end" className={className}
    items={[{ key: 'content', label: title, children, forceRender: true }]} />;
}
