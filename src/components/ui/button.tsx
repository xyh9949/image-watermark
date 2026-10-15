'use client';

import { Button as AntButton, Tooltip, type ButtonProps } from 'antd';
import { cn } from '@/lib/utils';

type Props = Omit<ButtonProps, 'type' | 'size' | 'variant'> & {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  type?: 'button' | 'submit' | 'reset';
};

// 保留页面现有的命令接口，只映射 Ant Design 按钮，图片处理事件不变。
export function Button({ variant = 'default', size = 'default', type = 'button', title, className, children, icon, ...props }: Props) {
  const button = <AntButton {...props} data-slot="button" htmlType={type}
    type={variant === 'ghost' ? 'text' : variant === 'link' ? 'link' : ['default', 'destructive'].includes(variant) ? 'primary' : 'default'}
    danger={variant === 'destructive'} size={size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'middle'}
    icon={size === 'icon' ? children : icon}
    className={cn('ui-button', size === 'icon' && 'ui-icon-button', className)}>{size === 'icon' ? null : children}</AntButton>;
  return title ? <Tooltip title={title}>{button}</Tooltip> : button;
}
