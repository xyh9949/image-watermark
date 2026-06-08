'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github, Globe2 } from 'lucide-react';
import { APP_VERSION, GITHUB_URL } from '@/app/lib/site';
import { getCopy, getHtmlLang, getLanguageHref, getLocaleFromPathname } from '@/app/lib/i18n';

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getCopy(locale).site;
  const languageHref = getLanguageHref(pathname);
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
            <span className="hidden sm:inline-flex text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full shrink-0">
              {copy.badge}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={languageHref}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label={copy.languageAria}
            >
              <Globe2 className="w-4 h-4" />
              <span>{copy.languageLabel}</span>
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              title={copy.githubTitle}
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="hidden lg:flex h-16">
          <div className="flex-[3] bg-background px-4 flex items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="text-xl font-bold">{copy.brandName}</div>
                <span className="text-sm text-muted-foreground">v{APP_VERSION}</span>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                {copy.desktopBadge}
              </span>
            </div>
          </div>

          <div className="flex-[9] px-4 flex items-center justify-end gap-5">
            <Link
              href={languageHref}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label={copy.languageAria}
            >
              <Globe2 className="w-4 h-4" />
              <span>{copy.languageLabel}</span>
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              title={copy.githubTitle}
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <span>
              {copy.footer}
            </span>
            <div className="flex items-center space-x-4">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                {copy.openSource}
              </a>
              <a
                href={`${GITHUB_URL}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                {copy.feedback}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
