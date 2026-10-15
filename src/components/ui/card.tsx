'use client';

import type { ComponentProps } from 'react';
import { Card as AntCard } from 'antd';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <AntCard {...props} data-slot="card" className={cn('ui-card', className)} styles={{ body: { display: 'contents' } }} />;
}
export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} data-slot="card-header" className={cn('space-y-1', className)} />;
}
export function CardTitle({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} data-slot="card-title" className={cn('font-semibold', className)} />;
}
export function CardContent(props: ComponentProps<'div'>) { return <div {...props} data-slot="card-content" />; }
