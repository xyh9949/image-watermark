'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Tag, Tooltip } from 'antd';
import { Github, Globe2, ShieldCheck, Stamp } from 'lucide-react';
import { APP_VERSION, GITHUB_URL } from '@/app/lib/site';
import { getCopy, getHtmlLang, getLanguageHref, getLocaleFromPathname } from '@/app/lib/i18n';
import { TopNavigation } from './TopNavigation';

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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
          <span>{copy.brandName}</span><Tag className="site-version">v{APP_VERSION}</Tag>
        </Link>
        <TopNavigation />
        <div className="site-global-actions">
          <span className="local-processing"><ShieldCheck className="size-4" aria-hidden="true" />{workspace.local}</span>
          <Button type="text" href={getLanguageHref(pathname)} className="site-language" aria-label={copy.languageAria}
            onClick={(event) => {
              // 普通点击保留本地编辑状态，修饰键点击仍使用浏览器的新标签页行为。
              if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              router.push(getLanguageHref(pathname));
            }}>
            <Globe2 className="size-4" aria-hidden="true" /><span>{copy.languageLabel}</span>
          </Button>
          <Tooltip title={copy.githubTitle}><Button type="text" href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="site-github"
            aria-label="GitHub" icon={<Github className="size-5" />} /></Tooltip>
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
