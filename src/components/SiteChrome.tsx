'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github, Globe2 } from 'lucide-react';
import { APP_VERSION, GITHUB_URL } from '@/app/lib/site';

function getLanguageHref(pathname: string) {
  if (pathname.startsWith('/en/compress')) return '/compress';
  if (pathname.startsWith('/en')) return '/';
  if (pathname.startsWith('/compress')) return '/en/compress';
  return '/en';
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEnglish = pathname.startsWith('/en');
  const languageHref = getLanguageHref(pathname);

  useEffect(() => {
    document.documentElement.lang = isEnglish ? 'en' : 'zh-CN';
  }, [isEnglish]);

  const brandName = isEnglish ? 'Image Watermark' : '图片水印工具';
  const badge = isEnglish ? 'Free open source' : '免费开源';
  const desktopBadge = isEnglish ? 'Free open-source project' : '免费开源项目';
  const languageLabel = isEnglish ? '中文' : 'English';

  return (
    <div className="min-h-dvh flex flex-col" lang={isEnglish ? 'en' : 'zh-CN'}>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="lg:hidden h-16 px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-xl font-bold truncate">{brandName}</div>
              <span className="text-sm text-muted-foreground shrink-0">v{APP_VERSION}</span>
            </div>
            <span className="hidden sm:inline-flex text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full shrink-0">
              {badge}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={languageHref}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isEnglish ? 'Switch to Chinese' : '切换到英文'}
            >
              <Globe2 className="w-4 h-4" />
              <span>{languageLabel}</span>
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              title={isEnglish ? 'View source code' : '查看源代码'}
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
                <div className="text-xl font-bold">{brandName}</div>
                <span className="text-sm text-muted-foreground">v{APP_VERSION}</span>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                {desktopBadge}
              </span>
            </div>
          </div>

          <div className="flex-[9] px-4 flex items-center justify-end gap-5">
            <Link
              href={languageHref}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isEnglish ? 'Switch to Chinese' : '切换到英文'}
            >
              <Globe2 className="w-4 h-4" />
              <span>{languageLabel}</span>
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              title={isEnglish ? 'View source code' : '查看源代码'}
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
              {isEnglish
                ? '© 2026 Image Watermark. Browser-based image processing tools.'
                : '© 2026 批量图片水印工具. 专业的在线图片处理服务.'}
            </span>
            <div className="flex items-center space-x-4">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                {isEnglish ? 'Open source' : '开源项目'}
              </a>
              <a
                href={`${GITHUB_URL}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                {isEnglish ? 'Feedback' : '问题反馈'}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
