'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileArchive, ImageIcon, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCopy, getLocaleFromPathname } from '@/app/lib/i18n';

export function TopNavigation() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getCopy(locale).nav;
  const watermarkHref = locale === 'en' ? '/en' : '/';
  const compressHref = locale === 'en' ? '/en/compress' : '/compress';
  const metadataHref = locale === 'en' ? '/en/metadata' : '/metadata';

  const navItems = [
    {
      href: watermarkHref,
      label: copy.watermark,
      icon: ImageIcon,
      active: pathname === watermarkHref
    },
    {
      href: compressHref,
      label: copy.compress,
      icon: FileArchive,
      active: pathname === compressHref
    },
    {
      href: metadataHref,
      label: copy.metadata,
      icon: Tags,
      active: pathname === metadataHref
    }
  ];

  return (
    <nav className="border-b bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-center">
          <div className="grid grid-cols-3 items-center bg-muted rounded-lg p-1 w-full sm:w-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} aria-current={item.active ? 'page' : undefined} className="min-w-0">
                  <div
                    className={cn(
                      "flex items-center justify-center gap-2 px-1.5 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      item.active 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                  >
                    <Icon className="hidden sm:block w-4 h-4 shrink-0" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
