'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/app/components/upload/ImageUpload";
import { WatermarkCanvas } from "@/app/components/editor/WatermarkCanvas";
import { WatermarkControls } from "@/app/components/controls/WatermarkControls";
import { StructuredData } from '@/app/components/seo/StructuredData';

export default function Home() {
  return (
    <div className="h-screen flex flex-col">
      {/* JSON-LD 结构化数据 */}
      <StructuredData />

      {/* 移动端：垂直布局 */}
      <div className="lg:hidden flex flex-col h-full">
        {/* 顶部工具栏 */}
        <div className="flex-shrink-0 p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">图片水印编辑器</h1>
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
      <div className="hidden lg:flex h-full">
        {/* 左侧：可滚动的上传区域 - 使用3/12的比例 */}
        <div className="flex-[3] border-r bg-background">
          <div className="h-full overflow-auto">
            <div className="p-4">
              <ImageUpload />
            </div>
          </div>
        </div>

        {/* 右侧：固定的编辑器和控制面板 - 使用9/12的比例 */}
        <div className="flex-[9] flex flex-col">
          {/* 顶部工具栏 */}
          <div className="flex-shrink-0 p-4 border-b bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold">图片水印编辑器</h1>
              </div>
            </div>
          </div>

          {/* 编辑器和控制面板区域 */}
          <div className="flex-1 flex overflow-hidden">
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
