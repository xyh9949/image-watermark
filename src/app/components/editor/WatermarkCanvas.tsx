// 水印编辑Canvas组件

'use client';

import React, { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  RotateCcw,
  Download,
  Eye,
  ImageIcon,
  Loader2,
  Maximize
} from 'lucide-react';
import { useCanvas } from '@/app/hooks/useCanvas';
import { useImageStore, useWatermarkStore } from '@/app/lib/stores';
import type { ImageInfo, WatermarkConfig } from '@/app/types';
import { DEFAULT_LOCALE, getCopy, type Locale } from '@/app/lib/i18n';

interface WatermarkCanvasProps {
  className?: string;
  showControls?: boolean;
  locale?: Locale;
  onExport?: (dataUrl: string) => void;
}

export function WatermarkCanvas({
  className = '',
  showControls = true,
  locale = DEFAULT_LOCALE,
  onExport
}: WatermarkCanvasProps) {
  const currentImage = useImageStore(s => s.images.find(img => img.id === s.currentImageId) || null);
  const { currentConfig } = useWatermarkStore();

  const {
    canvasRef,
    isReady,
    currentImage: canvasImage,
    watermarks,
    loadImage,
    addWatermark,
    clearAllWatermarks,
    exportImage,
    fitToContainer,
    getCanvasDataURL
  } = useCanvas({
    width: 800,
    height: 600,
    backgroundColor: '#f8f9fa',
    onCanvasReady: () => {
      // Canvas 准备就绪
    },
    onObjectAdded: () => {
      // 对象已添加
    },
    onSelectionChanged: () => {
      // 选择已改变
    }
  });
  const labels = getCopy(locale).watermarkCanvas;

  // 当选中的图片改变时，加载到Canvas，并在完成后刷新水印
  useEffect(() => {
    if (!isReady || !currentImage) return;

    const loadCurrentImage = async () => {
      try {
        await loadImage(currentImage);
        // 图片解码会重设画布尺寸；重新适配新的工作区，避免保留上张图片的显示尺寸。
        fitToContainer();
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
  }, [isReady, currentImage, loadImage, clearAllWatermarks, addWatermark, currentConfig, fitToContainer]);

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
  }, [isReady, canvasImage, currentConfig, clearAllWatermarks, addWatermark]);

  // {{ Shrimp-X: Modify - 根据原始图片格式导出，保留原始格式. Approval: Cunzhi(ID:timestamp). }}
  // 导出图片
  const handleExport = useCallback(() => {
    // 根据原始图片的 MIME 类型确定导出格式
    const mimeType = currentImage?.type?.toLowerCase() || '';
    let format: 'png' | 'jpeg' = 'png'; // 默认 PNG
    let extension = '.png';

    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      format = 'jpeg';
      extension = '.jpg';
    } else if (mimeType.includes('png')) {
      format = 'png';
      extension = '.png';
    } else if (mimeType.includes('webp')) {
      // WebP 导出为 PNG 以保留透明度
      format = 'png';
      extension = '.png';
    }

    const quality = format === 'jpeg' ? 0.92 : 1.0;
    const dataUrl = exportImage(format, quality);
    if (dataUrl) {
      onExport?.(dataUrl);

      // 创建下载链接
      const link = document.createElement('a');
      const fileName = currentImage?.name || 'image';
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      link.download = `watermarked-${nameWithoutExt}${extension}`;
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
            <head><title>${labels.previewTitle}</title></head>
            <body style="margin:0;padding:20px;background:#f0f0f0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
              <img src="${dataUrl}" style="max-width:100%;max-height:100%;box-shadow:0 4px 8px rgba(0,0,0,0.1);" />
            </body>
          </html>
        `);
      }
    }
  }, [getCanvasDataURL, labels.previewTitle]);

  // 清除水印
  const handleClearWatermarks = useCallback(() => {
    clearAllWatermarks();
  }, [clearAllWatermarks]);

  // 移除这个条件检查，让Canvas始终渲染

  return (
    <section className={`tool-preview-shell ${className}`}>
        {/* 控制栏 */}
        {showControls && (
          <div className="tool-preview-toolbar">
            <div className="flex min-w-0 items-center gap-2 text-xs">
              <ImageIcon className="size-4 shrink-0" />
              <span className="truncate" title={currentImage?.name}>{currentImage?.name || labels.editor}</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFitToWindow}
                title={labels.fit}
                aria-label={labels.fit}
              >
                <Maximize className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handlePreview}
                title={labels.preview}
                aria-label={labels.preview}
              >
                <Eye className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearWatermarks}
                title={labels.clear}
                aria-label={labels.clear}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleExport}
                title={labels.exportTitle}
                aria-label={labels.exportTitle}
                disabled={!isReady}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Canvas容器 */}
        <div className="tool-preview-stage">
          <div data-canvas-container>
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full touch-none"
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
                  <p className="text-muted-foreground">{labels.selectImage}</p>
                </div>
              </div>
            )}

            {/* Canvas初始化中 */}
            {currentImage && !isReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{labels.initializing}</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* 状态信息 */}
        {isReady && (
          <div className="tool-preview-status">
            <div className="flex flex-wrap items-center gap-2">
              <span>{currentImage?.width} × {currentImage?.height} px</span>
              <span>{labels.watermark}: {watermarks.length}</span>
            </div>

            <div className="flex items-center space-x-2">
              {currentConfig.enabled ? (
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  {labels.enabled}
                </span>
              ) : (
                <span className="flex items-center text-gray-500">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                  {labels.disabled}
                </span>
              )}
            </div>
          </div>
        )}

    </section>
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
