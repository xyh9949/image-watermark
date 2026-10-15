'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Minimize2, Stamp, Tags } from 'lucide-react';
import { Menu } from 'antd';
import { getCopy, getLocaleFromPathname } from '@/app/lib/i18n';

export function TopNavigation() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getCopy(locale).nav;
  const prefix = locale === 'en' ? '/en' : '';
  const items = [
    { href: prefix || '/', label: copy.watermark, icon: Stamp },
    { href: `${prefix}/compress`, label: copy.compress, icon: Minimize2 },
    { href: `${prefix}/metadata`, label: copy.metadata, icon: Tags },
  ];
  return (
    <nav className="tool-navigation" aria-label={getCopy(locale).workspace.navigation}>
      <Menu mode="horizontal" selectedKeys={[pathname]} disabledOverflow items={items.map(({ href, label, icon: Icon }) => ({
        key: href, icon: <Icon aria-hidden="true" />,
        label: <Link href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>,
      }))} />
    </nav>
  );
}
