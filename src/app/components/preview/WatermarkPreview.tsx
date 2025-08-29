'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { useImageStore, useWatermarkStore } from '@/app/lib/stores';
import { calculateAnchorPosition, getOriginFromPosition } from '@/app/lib/canvas/positionUtils';
import { calculateAdaptiveWatermarkSize, ImageDimensions } from '@/app/lib/canvas/adaptiveScaling';

interface WatermarkPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WatermarkPreview({ isOpen, onClose }: WatermarkPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getCurrentImage } = useImageStore();
  const { currentConfig } = useWatermarkStore();
  const [isReady, setIsReady] = useState(false);

  const currentImage = getCurrentImage();

  useEffect(() => {
    if (!isOpen || !currentImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // 设置Canvas尺寸
      const maxWidth = 600;
      const maxHeight = 400;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // 清空Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制图片
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 绘制水印
      if (currentConfig.enabled && currentConfig.type === 'text' && currentConfig.textStyle) {
        const textStyle = currentConfig.textStyle;
        const position = currentConfig.position.position;

        // {{ Shrimp-X: Modify - 使用自适应缩放计算字体大小和边距. Approval: Cunzhi(ID:timestamp). }}
        // 计算自适应尺寸
        const imageDimensions: ImageDimensions = {
          width: canvas.width / scale,
          height: canvas.height / scale
        };

        const scalingResult = calculateAdaptiveWatermarkSize(currentConfig, imageDimensions);
        const adaptiveFontSize = scalingResult.fontSize || textStyle.fontSize;
        const adaptiveMargin = scalingResult.marginX;

        const margin = adaptiveMargin * scale;
        const offsetX = (currentConfig.position.offsetX || 0) * scale;
        const offsetY = (currentConfig.position.offsetY || 0) * scale;

        ctx.save();
        ctx.font = `${textStyle.fontWeight} ${adaptiveFontSize * scale}px ${textStyle.fontFamily}`;
        ctx.fillStyle = textStyle.color;
        ctx.globalAlpha = textStyle.opacity;

        // 计算文字尺寸
        const textMetrics = ctx.measureText(textStyle.content);
        const textWidth = textMetrics.width;
        const textHeight = adaptiveFontSize * scale;

        // 使用九宫格对齐计算
        const anchor = calculateAnchorPosition(canvas.width, canvas.height, position, margin, offsetX, offsetY);
        const origin = getOriginFromPosition(position);

        let textX = anchor.anchorX;
        let textY = anchor.anchorY;

        // 根据originX调整X位置
        switch (origin.originX) {
          case 'center':
            textX -= textWidth / 2;
            break;
          case 'right':
            textX -= textWidth;
            break;
        }

        // 根据originY调整Y位置
        switch (origin.originY) {
          case 'center':
            textY += textHeight / 2;
            break;
          case 'bottom':
            // bottom对齐时，textY保持为锚点位置
            break;
          case 'top':
          default:
            textY += textHeight;
            break;
        }

        // 应用旋转
        if (textStyle.rotation && textStyle.rotation !== 0) {
          const centerX = textX + textWidth / 2;
          const centerY = textY - textHeight / 2;
          
          ctx.translate(centerX, centerY);
          ctx.rotate((textStyle.rotation * Math.PI) / 180);

          // 绘制描边
          if (textStyle.stroke && textStyle.stroke.width > 0) {
            ctx.strokeStyle = textStyle.stroke.color;
            ctx.lineWidth = textStyle.stroke.width * scale;
            ctx.strokeText(textStyle.content, -textWidth / 2, textHeight / 2);
          }

          // 绘制文字
          ctx.fillText(textStyle.content, -textWidth / 2, textHeight / 2);
        } else {
          // 绘制描边
          if (textStyle.stroke && textStyle.stroke.width > 0) {
            ctx.strokeStyle = textStyle.stroke.color;
            ctx.lineWidth = textStyle.stroke.width * scale;
            ctx.strokeText(textStyle.content, textX, textY);
          }

          // 绘制文字
          ctx.fillText(textStyle.content, textX, textY);
        }

        ctx.restore();
      }

      // {{ Shrimp-X: Modify - 添加全屏水印预览支持，支持图片模式. Approval: Cunzhi(ID:timestamp). }}
      // 绘制全屏水印
      if (currentConfig.enabled && currentConfig.type === 'fullscreen' && currentConfig.fullscreenStyle) {
        const fullscreenStyle = currentConfig.fullscreenStyle;

        ctx.save();
        ctx.globalAlpha = fullscreenStyle.opacity;

        // 计算平铺参数（简化版）
        const tileSpacing = fullscreenStyle.tileSpacing * scale;
        const tileDensity = fullscreenStyle.tileDensity || 0.5;

        let tileWidth, tileHeight;

        if (fullscreenStyle.mode === 'image' && fullscreenStyle.imageUrl) {
          // {{ Shrimp-X: Modify - 使用实际图片尺寸进行缩放计算. Approval: Cunzhi(ID:timestamp). }}
          // 图片模式：使用实际图片尺寸 * 缩放比例
          const originalWidth = fullscreenStyle.imageOriginalWidth || 100;
          const originalHeight = fullscreenStyle.imageOriginalHeight || 100;
          const imageScale = fullscreenStyle.imageScale || 1.0;
          const imageWidth = originalWidth * imageScale * scale;
          const imageHeight = originalHeight * imageScale * scale;

          tileWidth = Math.max(imageWidth + tileSpacing, tileSpacing * tileDensity);
          tileHeight = Math.max(imageHeight + tileSpacing * 0.5, tileSpacing * tileDensity * 0.5);
        } else {
          // 文字模式
          ctx.font = `${fullscreenStyle.fontSize * scale}px ${fullscreenStyle.fontFamily}`;
          ctx.fillStyle = fullscreenStyle.color;

          const textMetrics = ctx.measureText(fullscreenStyle.content);
          const textWidth = textMetrics.width;
          const textHeight = fullscreenStyle.fontSize * scale;

          tileWidth = Math.max(textWidth + tileSpacing, tileSpacing * tileDensity);
          tileHeight = Math.max(textHeight + tileSpacing * 0.5, tileSpacing * tileDensity * 0.5);
        }

        // 计算需要的行列数
        const cols = Math.ceil(canvas.width / tileWidth) + 1;
        const rows = Math.ceil(canvas.height / tileHeight) + 1;

        // 绘制平铺水印
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            let x = col * tileWidth + tileWidth / 2;
            const y = row * tileHeight + tileHeight / 2;

            // 对角线模式偏移
            if (fullscreenStyle.diagonalMode) {
              x += (row % 2) * (tileWidth / 2);
            }

            ctx.save();
            ctx.translate(x, y);

            // 应用旋转
            if (fullscreenStyle.rotation) {
              ctx.rotate((fullscreenStyle.rotation * Math.PI) / 180);
            }

            if (fullscreenStyle.mode === 'image' && fullscreenStyle.imageUrl) {
              // {{ Shrimp-X: Modify - 使用实际图片尺寸绘制预览. Approval: Cunzhi(ID:timestamp). }}
              // 绘制实际图片
              const originalWidth = fullscreenStyle.imageOriginalWidth || 100;
              const originalHeight = fullscreenStyle.imageOriginalHeight || 100;
              const imageScale = fullscreenStyle.imageScale || 1.0;
              const imageWidth = originalWidth * imageScale * scale;
              const imageHeight = originalHeight * imageScale * scale;

              // 尝试加载并绘制实际图片
              const img = new Image();
              img.onload = () => {
                ctx.save();
                ctx.translate(x, y);
                if (fullscreenStyle.rotation) {
                  ctx.rotate((fullscreenStyle.rotation * Math.PI) / 180);
                }
                ctx.globalAlpha = fullscreenStyle.opacity;
                ctx.drawImage(img, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
                ctx.restore();
              };
              img.onerror = () => {
                // 如果图片加载失败，绘制占位符
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(-imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = `${Math.min(imageWidth, imageHeight) / 4}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('IMG', 0, 0);
              };
              img.src = fullscreenStyle.imageUrl;

              // 立即绘制占位符，图片加载完成后会覆盖
              ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
              ctx.fillRect(-imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
            } else {
              // 绘制文字（居中）
              const textMetrics = ctx.measureText(fullscreenStyle.content);
              const textWidth = textMetrics.width;
              const textHeight = fullscreenStyle.fontSize * scale;
              ctx.fillText(fullscreenStyle.content, -textWidth / 2, textHeight / 4);
            }

            ctx.restore();
          }
        }

        ctx.restore();
      }

      setIsReady(true);
    };

    img.onerror = () => {
      console.error('Failed to load image for preview');
    };

    img.src = currentImage.url;
  }, [isOpen, currentImage, currentConfig]);

  const handleDownloadPreview = () => {
    if (!canvasRef.current) return;

    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `preview-${currentImage?.name || 'watermark'}.png`;
    link.href = dataUrl;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">水印预览</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPreview}
                disabled={!isReady}
              >
                <Download className="h-4 w-4 mr-2" />
                下载预览
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 预览内容 */}
          <div className="flex flex-col items-center space-y-4">
            {currentImage ? (
              <>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto border border-gray-200 rounded"
                    style={{ maxHeight: '60vh' }}
                  />
                </div>
                
                <div className="text-sm text-muted-foreground text-center">
                  <p>图片: {currentImage.name}</p>
                  <p>尺寸: {currentImage.width} × {currentImage.height}</p>
                  {currentConfig.enabled ? (
                    <p className="text-green-600">水印已启用</p>
                  ) : (
                    <p className="text-orange-600">水印未启用</p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">请先选择一张图片</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
