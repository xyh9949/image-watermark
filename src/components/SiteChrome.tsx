'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { APP_VERSION } from '@/app/lib/site';
import { getCopy, getHtmlLang, getLocaleFromPathname } from '@/app/lib/i18n';

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getCopy(locale).site;
  const htmlLang = getHtmlLang(locale);

  useEffect(() => {
    document.documentElement.lang = htmlLang;
  }, [htmlLang]);

  return (
    <div className="min-h-dvh flex flex-col" lang={htmlLang}>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="lg:hidden h-16 px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-xl font-bold truncate">{copy.brandName}</div>
              <span className="text-sm text-muted-foreground shrink-0">v{APP_VERSION}</span>
            </div>
          </div>

          <div className="shrink-0" />
        </div>

        <div className="hidden lg:flex h-16">
          <div className="flex-[3] bg-background px-4 flex items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="text-xl font-bold">{copy.brandName}</div>
                <span className="text-sm text-muted-foreground">v{APP_VERSION}</span>
              </div>
            </div>
          </div>

          <div className="flex-[9]" />
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
