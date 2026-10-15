'use client';

import { Input as AntInput, type InputProps } from 'antd';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputProps) {
  return <AntInput {...props} data-slot="input" className={cn('ui-input', className)} />;
}
