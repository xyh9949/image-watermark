'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/app/components/upload/ImageUpload";
import { WatermarkCanvas } from "@/app/components/editor/WatermarkCanvas";
import { WatermarkControls } from "@/app/components/controls/WatermarkControls";
import { StructuredData } from '@/app/components/seo/StructuredData';
import { TopNavigation } from '@/components/TopNavigation';

export default function Home() {
  return (
    <div className="min-h-dvh flex flex-col overflow-hidden">
      {/* JSON-LD 结构化数据 */}
      <StructuredData />

      {/* Top Navigation */}
      <TopNavigation />

      {/* 移动端：垂直布局 */}
      <div className="lg:hidden flex flex-col h-full">
        {/* 页面标题 */}
        <div className="flex-shrink-0 p-4 bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1">图片批量处理工具</h1>
            <p className="text-sm text-muted-foreground">
              为您的图片添加专业水印，支持文字和图片水印
            </p>
          </div>
        </div>

        {/* 移动端内容区域 */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="upload" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 grid w-full grid-cols-3 m-4">
              <TabsTrigger value="upload">上传</TabsTrigger>
              <TabsTrigger value="edit">编辑</TabsTrigger>
              <TabsTrigger value="controls">控制</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="flex-1 overflow-auto p-4">
              <ImageUpload />
            </TabsContent>

            <TabsContent value="edit" className="flex-1 overflow-auto p-4">
              <WatermarkCanvas />
            </TabsContent>

            <TabsContent value="controls" className="flex-1 overflow-auto p-4">
              <WatermarkControls />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 桌面端：固定编辑器布局 */}
      <div className="hidden lg:flex flex-col h-full">
        {/* 页面标题 */}
        <div className="flex-shrink-0 p-4 bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1">图片批量处理工具</h1>
            <p className="text-sm text-muted-foreground">
              为您的图片添加专业水印，支持文字和图片水印
            </p>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：可滚动的上传区域 - 使用3/12的比例 */}
          <div className="flex-[3] border-r bg-background">
            <div className="h-full overflow-auto">
              <div className="p-4">
                <ImageUpload />
              </div>
            </div>
          </div>

          {/* 右侧：固定的编辑器和控制面板 - 使用9/12的比例 */}
          <div className="flex-[9] flex overflow-hidden">

            {/* 中间：Canvas编辑器 - 使用6/9的比例 */}
            <div className="flex-[6] p-4 overflow-auto">
              <WatermarkCanvas className="h-full" />
            </div>

            {/* 右侧：控制面板 - 使用3/9的比例 */}
            <div className="flex-[3] border-l bg-background">
              <div className="h-full overflow-auto">
                <div className="p-4">
                  <WatermarkControls />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
