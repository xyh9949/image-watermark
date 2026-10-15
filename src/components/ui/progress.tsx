'use client';

import { Progress as AntProgress } from 'antd';

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  return <AntProgress percent={value} showInfo={false} className={className} size="small" />;
}
