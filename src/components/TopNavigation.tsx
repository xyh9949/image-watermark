'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileArchive, Globe2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TopNavigation() {
  const pathname = usePathname();
  const isEnglish = pathname.startsWith('/en');
  const watermarkHref = isEnglish ? '/en' : '/';
  const compressHref = isEnglish ? '/en/compress' : '/compress';
  const languageHref = isEnglish
    ? (pathname === '/en/compress' ? '/compress' : '/')
    : (pathname === '/compress' ? '/en/compress' : '/en');

  const navItems = [
    {
      href: watermarkHref,
      label: isEnglish ? 'Watermark' : '水印工具',
      icon: ImageIcon,
      active: pathname === watermarkHref
    },
    {
      href: compressHref,
      label: isEnglish ? 'Compress' : '压缩工具',
      icon: FileArchive,
      active: pathname === compressHref
    }
  ];

  return (
    <nav className="border-b bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-center">
          <div className="flex items-center bg-muted rounded-lg p-1 max-w-full overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      item.active 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
            <Link href={languageHref}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors">
                <Globe2 className="w-4 h-4" />
                {isEnglish ? '中文' : 'English'}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
