'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github, Globe2, ShieldCheck, Stamp } from 'lucide-react';
import { APP_VERSION, GITHUB_URL } from '@/app/lib/site';
import { getCopy, getHtmlLang, getLanguageHref, getLocaleFromPathname } from '@/app/lib/i18n';
import { TopNavigation } from './TopNavigation';

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getCopy(locale).site;
  const workspace = getCopy(locale).workspace;
  const htmlLang = getHtmlLang(locale);
  useEffect(() => { document.documentElement.lang = htmlLang; }, [htmlLang]);
  return (
    <div className="min-h-dvh flex flex-col" lang={htmlLang}>
      <header className="site-header">
        <Link href={locale === 'en' ? '/en' : '/'} className="site-brand">
          <span className="brand-mark"><Stamp className="size-4" aria-hidden="true" /></span>
          <span>{copy.brandName}</span><span className="site-version">v{APP_VERSION}</span>
        </Link>
        <TopNavigation />
        <div className="site-global-actions">
          <span className="local-processing"><ShieldCheck className="size-4" aria-hidden="true" />{workspace.local}</span>
          <Link href={getLanguageHref(pathname)} className="site-language" aria-label={copy.languageAria}>
            <Globe2 className="size-4" aria-hidden="true" /><span>{copy.languageLabel}</span>
          </Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="site-github"
            title={copy.githubTitle} aria-label="GitHub"><Github className="size-5" /></a>
        </div>
      </header>
      <main className="flex-1 min-w-0">{children}</main>
      <footer className="border-t px-5 py-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>{copy.footer}</span>
          <div className="flex items-center gap-5">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">{copy.openSource}</a>
            <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noopener noreferrer">{copy.feedback}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
