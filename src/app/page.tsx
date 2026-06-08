'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/app/components/upload/ImageUpload";
import { WatermarkCanvas } from "@/app/components/editor/WatermarkCanvas";
import { WatermarkControls } from "@/app/components/controls/WatermarkControls";
import { TopNavigation } from '@/components/TopNavigation';
import { getCopy, getLocaleFromPathname, type Locale } from '@/app/lib/i18n';
import { usePathname } from 'next/navigation';

export default function Home() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getCopy(locale).home;

  return (
    <div className="min-h-dvh flex flex-col overflow-x-hidden">
      <h1 className="sr-only">{copy.srTitle}</h1>

      {/* Top Navigation */}
      <TopNavigation />

      {/* 移动端：垂直布局 */}
      <div className="lg:hidden flex flex-col h-full">
        {/* 页面标题 */}
        <div className="flex-shrink-0 p-4 bg-background">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">{copy.title}</h2>
            <p className="text-sm text-muted-foreground">{copy.description}</p>
          </div>
        </div>

        {/* 移动端内容区域 */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="upload" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 grid w-full grid-cols-3 m-4">
              <TabsTrigger value="upload">{copy.tabs.upload}</TabsTrigger>
              <TabsTrigger value="edit">{copy.tabs.edit}</TabsTrigger>
              <TabsTrigger value="controls">{copy.tabs.controls}</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="flex-1 overflow-auto p-4">
              <ImageUpload locale={locale} />
            </TabsContent>

            <TabsContent value="edit" className="flex-1 overflow-auto p-4">
              <WatermarkCanvas locale={locale} />
            </TabsContent>

            <TabsContent value="controls" className="flex-1 overflow-auto p-4">
              <WatermarkControls locale={locale} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 桌面端：固定编辑器布局 */}
      <div className="hidden lg:flex flex-col h-full">
        {/* 页面标题 */}
        <div className="flex-shrink-0 p-4 bg-background">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">{copy.title}</h2>
            <p className="text-sm text-muted-foreground">{copy.description}</p>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：可滚动的上传区域 - 使用3/12的比例 */}
          <div className="flex-[3] border-r bg-background">
            <div className="h-full overflow-auto">
              <div className="p-4">
                <ImageUpload locale={locale} />
              </div>
            </div>
          </div>

          {/* 右侧：固定的编辑器和控制面板 - 使用9/12的比例 */}
          <div className="flex-[9] flex overflow-hidden">
            {/* 中间：Canvas编辑器 - 使用6/9的比例 */}
            <div className="flex-[6] p-4 overflow-auto">
              <WatermarkCanvas className="h-full" locale={locale} />
            </div>

            {/* 右侧：控制面板 - 使用3/9的比例 */}
            <div className="flex-[3] border-l bg-background">
              <div className="h-full overflow-auto">
                <div className="p-4">
                  <WatermarkControls locale={locale} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HomeGeoContent locale={locale} />
    </div>
  );
}

function HomeGeoContent({ locale }: { locale: Locale }) {
  const copy = getCopy(locale).home.geo;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: copy.faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section className="border-t bg-muted/20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">{copy.heading}</h2>
          {copy.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-muted-foreground leading-7">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {copy.features.map((feature) => (
            <div key={feature.title}>
              <h3 className="font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-6">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">{copy.faqHeading}</h2>
          <div className="divide-y rounded border bg-background">
            {copy.faqs.map((item) => (
              <details key={item.question} className="group p-4">
                <summary className="cursor-pointer font-medium">{item.question}</summary>
                <p className="mt-3 text-sm text-muted-foreground leading-6">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
