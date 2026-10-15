'use client';

import { Tag, type TagProps } from 'antd';
import { cn } from '@/lib/utils';

export function Badge({ variant = 'default', className, ...props }: Omit<TagProps, 'variant'> & {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}) {
  return <Tag {...props} data-slot="badge" color={variant === 'destructive' ? 'error' : variant === 'default' ? 'processing' : undefined}
    className={cn('ui-tag', className)} />;
}
