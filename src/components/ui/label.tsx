import type { ComponentProps } from 'react';

// 独立 label 保留输入关联语义；控件及表单外观由 Ant Design 提供。
export function Label(props: ComponentProps<'label'>) { return <label {...props} />; }
