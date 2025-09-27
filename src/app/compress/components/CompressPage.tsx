'use client';

import { useState } from 'react';
import { useCompressStore } from '@/app/lib/stores/compressStore';
import { FileUpload } from './FileUpload';
import { CompressionControls } from './CompressionControls';
import { ProcessingStatus } from './ProcessingStatus';
import { ResultsList } from './ResultsList';
import { StatsPanel } from './StatsPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw, Download, Settings, BarChart3, ArrowLeft, ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function CompressPage() {
  const {
    files,
    results,
    isProcessing,
    stats,
    clearFiles,
    clearResults,
    downloadAllResults,
    reset
  } = useCompressStore();

  const [activeTab, setActiveTab] = useState('upload');

  const hasFiles = files.length > 0;
  const hasResults = results.length > 0;
  const completedResults = results.filter(r => r.status === 'completed');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回水印工具
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <ImageIcon className="w-6 h-6" />
            <span className="text-sm text-muted-foreground">图片处理工具集</span>
          </div>
        </div>
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            批量图片压缩工具
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            专业的无损图片压缩工具，支持 JPEG、PNG、WebP 等格式，保持原有格式的同时最大化压缩效果
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">上传文件</TabsTrigger>
          <TabsTrigger value="settings" disabled={!hasFiles}>
            <Settings className="w-4 h-4 mr-2" />
            压缩设置
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!hasResults}>
            结果预览
          </TabsTrigger>
          <TabsTrigger value="stats" disabled={!stats}>
            <BarChart3 className="w-4 h-4 mr-2" />
            统计信息
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <FileUpload />
          
          {hasFiles && (
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={clearFiles}
                disabled={isProcessing}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                清空文件
              </Button>
              <Button
                onClick={() => setActiveTab('settings')}
                disabled={isProcessing}
              >
                下一步：设置压缩参数
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <CompressionControls />
          
          {isProcessing && (
            <ProcessingStatus />
          )}
          
          {hasResults && (
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setActiveTab('results')}
              >
                查看结果
              </Button>
              {stats && (
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('stats')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  查看统计
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <ResultsList />
          
          {completedResults.length > 0 && (
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={clearResults}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                清空结果
              </Button>
              <Button
                onClick={downloadAllResults}
              >
                <Download className="w-4 h-4 mr-2" />
                下载全部 ({completedResults.length})
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {stats && <StatsPanel stats={stats} />}
        </TabsContent>
      </Tabs>

      {/* Global Actions */}
      {(hasFiles || hasResults) && (
        <div className="flex justify-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={reset}
            disabled={isProcessing}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重新开始
          </Button>
        </div>
      )}
    </div>
  );
}