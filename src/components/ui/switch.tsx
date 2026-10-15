'use client';

import { Switch as AntSwitch, type SwitchProps } from 'antd';

export function Switch({ onCheckedChange, ...props }: SwitchProps & { onCheckedChange?: (checked: boolean) => void }) {
  return <AntSwitch {...props} onChange={onCheckedChange} />;
}
