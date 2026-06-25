'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/app/components/upload/ImageUpload";
import { WatermarkCanvas } from "@/app/components/editor/WatermarkCanvas";
import { WatermarkControls } from "@/app/components/controls/WatermarkControls";
import { TopNavigation } from '@/components/TopNavigation';
import { getCopy, getLocaleFromPathname } from '@/app/lib/i18n';
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
    </div>
  );
}
