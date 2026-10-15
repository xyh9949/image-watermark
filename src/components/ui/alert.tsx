'use client';

import { Children, isValidElement, type ComponentProps, type ReactNode } from 'react';
import { Alert as AntAlert } from 'antd';

export function AlertTitle(props: ComponentProps<'div'>) { return <div {...props} />; }
export function AlertDescription(props: ComponentProps<'div'>) { return <div {...props} />; }

export function Alert({ children, variant, className }: {
  children: ReactNode; variant?: 'default' | 'destructive'; className?: string;
}) {
  const nodes = Children.toArray(children);
  const title = nodes.find((node) => isValidElement(node) && node.type === AlertTitle);
  const description = nodes.filter((node) => !(isValidElement(node) && (node.type === AlertTitle || typeof node.type === 'object')));
  return <AntAlert type={variant === 'destructive' ? 'error' : 'info'} showIcon
    title={title} description={<>{description}</>} className={className} />;
}
