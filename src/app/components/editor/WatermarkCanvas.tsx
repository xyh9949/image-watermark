// 水印编辑Canvas组件

'use client';

import React, { useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Eye,
  AlertCircle,
  Maximize
} from 'lucide-react';
import { useCanvas } from '@/app/hooks/useCanvas';
import { useImageStore, useWatermarkStore } from '@/app/lib/stores';
import type { ImageInfo, WatermarkConfig } from '@/app/types';

interface WatermarkCanvasProps {
  className?: string;
  showControls?: boolean;
  onExport?: (dataUrl: string) => void;
}

export function WatermarkCanvas({ 
  className = '',
  showControls = true,
  onExport
}: WatermarkCanvasProps) {
  const currentImage = useImageStore(s => s.images.find(img => img.id === s.currentImageId) || null);
  const { currentConfig } = useWatermarkStore();

  const {
    canvasRef,
    canvas,
    isReady,
    currentImage: canvasImage,
    watermarks,
    loadImage,
    addWatermark,
    updateWatermark,
    clearAllWatermarks,
    exportImage,
    fitToContainer,
    getCanvasDataURL
  } = useCanvas({
    width: 800,
    height: 600,
    backgroundColor: '#f8f9fa',
    onCanvasReady: (canvas) => {
      // Canvas 准备就绪
    },
    onObjectAdded: (object) => {
      // 对象已添加
    },
    onSelectionChanged: (objects) => {
      // 选择已改变
    }
  });

  // 当选中的图片改变时，加载到Canvas，并在完成后刷新水印
  useEffect(() => {
    if (!isReady || !currentImage) return;

    const loadCurrentImage = async () => {
      try {
        await loadImage(currentImage);
        // 图片加载（含适配）完成后，立即按当前配置刷新一次水印
        try {
          clearAllWatermarks();
          if (currentConfig.enabled) {
            await addWatermark(currentConfig);
          }
        } catch (error) {
          console.error('Failed to update watermark after image load:', error);
        }
      } catch (error) {
        console.error('Failed to load image to canvas:', error);
      }
    };

    loadCurrentImage();
  }, [isReady, currentImage, loadImage, clearAllWatermarks, addWatermark, currentConfig]);

  // {{ Shrimp-X: Modify - 修复图片切换后水印不显示问题，移除函数依赖避免无限循环. Approval: Cunzhi(ID:timestamp). }}
  // 当水印配置改变或图片改变时，更新Canvas
  useEffect(() => {
    if (!isReady || !canvasImage) return;

    const updateCanvasWatermark = async () => {
      try {
        // 先清除所有水印
        clearAllWatermarks();

        // 如果水印启用，添加新水印
        if (currentConfig.enabled) {
          await addWatermark(currentConfig);
        }
      } catch (error) {
        console.error('Failed to update watermark:', error);
      }
    };

    updateCanvasWatermark();
  }, [isReady, canvasImage, currentConfig]); // 移除函数依赖避免无限循环

  // 导出图片
  const handleExport = useCallback(() => {
    const dataUrl = exportImage('png', 1.0);
    if (dataUrl) {
      onExport?.(dataUrl);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.download = `watermarked-${currentImage?.name || 'image'}.png`;
      link.href = dataUrl;
      link.click();
    }
  }, [exportImage, onExport, currentImage]);

  // 适应窗口
  const handleFitToWindow = useCallback(() => {
    fitToContainer();
  }, [fitToContainer]);

  // 预览模式
  const handlePreview = useCallback(() => {
    const dataUrl = getCanvasDataURL();
    if (dataUrl) {
      // 在新窗口中打开预览
      const previewWindow = window.open();
      if (previewWindow) {
        previewWindow.document.write(`
          <html>
            <head><title>水印预览</title></head>
            <body style="margin:0;padding:20px;background:#f0f0f0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
              <img src="${dataUrl}" style="max-width:100%;max-height:100%;box-shadow:0 4px 8px rgba(0,0,0,0.1);" />
            </body>
          </html>
        `);
      }
    }
  }, [getCanvasDataURL]);

  // 清除水印
  const handleClearWatermarks = useCallback(() => {
    clearAllWatermarks();
  }, [clearAllWatermarks]);

  // 移除这个条件检查，让Canvas始终渲染

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* 控制栏 */}
        {showControls && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium">水印编辑器</h3>
              {currentImage && (
                <span className="text-xs text-muted-foreground">
                  {currentImage.width} × {currentImage.height}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFitToWindow}
                title="适应窗口"
              >
                <Maximize className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                title="预览"
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearWatermarks}
                title="清除水印"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleExport}
                title="导出图片"
              >
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </div>
          </div>
        )}

        {/* Canvas容器 */}
        <div className="relative border rounded-lg overflow-hidden bg-gray-50">
          <div className="flex items-center justify-center min-h-96">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full"
              style={{
                display: isReady && currentImage ? 'block' : 'none',
                margin: '0 auto'
              }}
            />

            {/* 没有图片时的占位符 */}
            {!currentImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Eye className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">请先选择要编辑的图片</p>
                </div>
              </div>
            )}

            {/* Canvas初始化中 */}
            {currentImage && !isReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">初始化编辑器...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* 水印信息覆盖层 */}
          {isReady && watermarks.length > 0 && (
            <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              水印数量: {watermarks.length}
            </div>
          )}
        </div>

        {/* 状态信息 */}
        {isReady && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Canvas: {canvas?.getWidth()} × {canvas?.getHeight()}</span>
              <span>缩放: 100%</span>
              <span>水印: {watermarks.length}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {currentConfig.enabled ? (
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  水印已启用
                </span>
              ) : (
                <span className="flex items-center text-gray-500">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                  水印已禁用
                </span>
              )}
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {!isReady && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Canvas初始化中，请稍候...
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
}

// 简化版Canvas组件（仅用于预览）
interface SimpleCanvasProps {
  imageInfo: ImageInfo;
  watermarkConfig: WatermarkConfig;
  width?: number;
  height?: number;
  className?: string;
}

export function SimpleCanvas({
  imageInfo,
  watermarkConfig,
  width = 300,
  height = 200,
  className = ''
}: SimpleCanvasProps) {
  const {
    canvasRef,
    isReady,
    loadImage,
    addWatermark
  } = useCanvas({
    width,
    height,
    backgroundColor: '#ffffff'
  });

  useEffect(() => {
    if (!isReady) return;

    const setupCanvas = async () => {
      try {
        await loadImage(imageInfo);
        if (watermarkConfig.enabled) {
          await addWatermark(watermarkConfig);
        }
      } catch (error) {
        console.error('Failed to setup simple canvas:', error);
      }
    };

    setupCanvas();
  }, [isReady, imageInfo, watermarkConfig, loadImage, addWatermark]);

  return (
    <div className={`border rounded overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
        style={{ display: isReady ? 'block' : 'none' }}
      />
      {!isReady && (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
