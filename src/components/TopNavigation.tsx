'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Minimize2, Stamp, Tags } from 'lucide-react';
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
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>
          <Icon className="size-4 shrink-0" aria-hidden="true" />{label}
        </Link>
      ))}
    </nav>
  );
}
