'use client';

import { ConfigProvider, type ThemeConfig } from 'antd';
import { useSyncExternalStore } from 'react';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { usePathname } from 'next/navigation';
import { getLocaleFromPathname } from '@/app/lib/i18n';

// 主题与语言集中配置；成功态也使用蓝色，避免旧绿主题在状态提示中残留。
const workspaceTheme: ThemeConfig = {
  token: {
    colorPrimary: '#2563eb', colorInfo: '#2563eb', colorSuccess: '#2563eb',
    colorText: '#202124', colorTextSecondary: '#656970',
    colorBgLayout: '#f5f6f8', colorBorder: '#d9dde3',
    colorBorderSecondary: '#eceef1', borderRadius: 6,
    fontFamily: '"Segoe UI", "Microsoft YaHei", Arial, sans-serif',
    fontSize: 14, controlHeight: 36, controlHeightLG: 44,
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.06)',
  },
  components: {
    Button: { primaryShadow: 'none', defaultShadow: 'none', fontWeight: 500 },
    Menu: { itemColor: '#656970', horizontalItemSelectedColor: '#2563eb', activeBarHeight: 2 },
    Card: { bodyPadding: 0 },
    Collapse: { headerPadding: '14px 0', contentPadding: '0 0 16px' },
    Table: { headerBg: '#fafbfc', cellPaddingBlockSM: 12, cellPaddingInlineSM: 12 },
    Tabs: { horizontalMargin: '0 0 18px 0' },
  },
};

function subscribeMotionPreference(onChange: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function AntdProvider({ children }: { children: React.ReactNode }) {
  const locale = getLocaleFromPathname(usePathname());
  const reducedMotion = useSyncExternalStore(subscribeMotionPreference,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, () => false);
  // 弹层定位依赖动效生命周期；使用库的 motion token，而非全局压缩动画时长。
  const theme = { ...workspaceTheme, token: { ...workspaceTheme.token, motion: !reducedMotion } };
  return <ConfigProvider locale={locale === 'en' ? enUS : zhCN} theme={theme}>{children}</ConfigProvider>;
}
