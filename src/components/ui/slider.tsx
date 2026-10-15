'use client';

import { Slider as AntSlider } from 'antd';

// 现有水印配置使用单值数组，边界转换后交给 Ant Design 处理键盘和拖动。
export function Slider({ value, defaultValue, onValueChange, 'aria-label': ariaLabel, ...props }: {
  value?: number[]; defaultValue?: number[]; onValueChange?: (value: number[]) => void;
  min?: number; max?: number; step?: number; disabled?: boolean; className?: string;
  'aria-label'?: string;
}) {
  return <AntSlider {...props} value={value?.[0]} defaultValue={defaultValue?.[0]}
    ariaLabelForHandle={ariaLabel}
    onChange={(next) => onValueChange?.([next])} />;
}
