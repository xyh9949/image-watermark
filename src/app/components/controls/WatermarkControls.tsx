'use client';

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Settings, Eye, EyeOff, Play, Square, AlertCircle } from 'lucide-react';
import { useWatermarkStore, useImageStore } from '@/app/lib/stores';
import { WatermarkPosition } from '@/app/types';
import { BatchWatermarkProcessor, downloadBatchResults, BatchProcessingResult } from '@/app/lib/watermark/batchProcessor';

interface WatermarkControlsProps {
  className?: string;
}

export function WatermarkControls({ className = '' }: WatermarkControlsProps) {
  const {
    currentConfig,
    updateTextStyle,
    updateImageStyle, // {{ Shrimp-X: Add - 添加缺失的updateImageStyle函数导入. Approval: Cunzhi(ID:timestamp). }}
    updateFullscreenStyle, // {{ Shrimp-X: Add - 添加全屏水印样式更新函数. Approval: Cunzhi(ID:timestamp). }}
    updatePosition,
    setWatermarkType,
    setPosition,
    updateConfig,

    setScaleMode,
    updateAdaptive,
  } = useWatermarkStore();

  const { images, hasImages, getImageCount } = useImageStore();

  // 批量处理状态
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentProcessingImage, setCurrentProcessingImage] = useState('');
  const [processingResults, setProcessingResults] = useState<BatchProcessingResult[]>([]);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const processorRef = useRef<BatchWatermarkProcessor | null>(null);

  // {{ Shrimp-X: Add - 图片水印上传状态管理. Approval: Cunzhi(ID:timestamp). }}
  // 图片水印状态
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
  const [watermarkImageUrl, setWatermarkImageUrl] = useState<string | null>(null);
  const [isUploadingWatermark, setIsUploadingWatermark] = useState(false);

  // 全屏水印图片上传状态
  const [isUploadingFullscreenImage, setIsUploadingFullscreenImage] = useState(false);









  // 批量处理函数
  const handleStartProcessing = async () => {
    if (!hasImages() || !currentConfig.enabled) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setCurrentProcessingImage('');
    setProcessingError(null);
    setProcessingResults([]);

    try {
      // 创建处理器
      if (!processorRef.current) {
        processorRef.current = new BatchWatermarkProcessor();
      }

      const processor = processorRef.current;

      // 开始批量处理
      await processor.processBatch({
        watermarkConfig: currentConfig,
        images: images,
        onProgress: (progress, imageName) => {
          setProcessingProgress(progress);
          setCurrentProcessingImage(imageName);
        },
        onImageComplete: (imageId, result) => {
          // 处理完成回调
        },
        onComplete: async (results) => {
          setProcessingResults(results);
          setIsProcessing(false);

          // 自动下载结果
          try {
            await downloadBatchResults(results);
          } catch (error) {
            setProcessingError('下载失败，但处理已完成');
          }
        },
        onError: (error, imageId) => {
          setProcessingError(error.message);
        },
        quality: 0.85, // 降低质量以减小文件大小
        format: 'jpeg' // 使用JPEG格式以减小文件大小
      });

    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : '处理失败');
      setIsProcessing(false);
    }
  };

  const handleStopProcessing = () => {
    if (processorRef.current) {
      processorRef.current.stop();
    }
    setIsProcessing(false);
  };



  // {{ Shrimp-X: Add - 图片水印上传处理函数. Approval: Cunzhi(ID:timestamp). }}
  // 处理水印图片上传
  const handleWatermarkImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小 (最大5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片文件大小不能超过5MB');
      return;
    }

    setIsUploadingWatermark(true);

    try {
      // 创建图片URL
      const imageUrl = URL.createObjectURL(file);

      // 获取图片尺寸
      const img = new Image();
      img.onload = () => {
        setWatermarkImage(file);
        setWatermarkImageUrl(imageUrl);

        // {{ Shrimp-X: Modify - 修复图片水印配置，使用比例缩放. Approval: Cunzhi(ID:timestamp). }}
        // 更新水印配置为图片类型
        setWatermarkType('image');
        updateImageStyle({
          imageUrl: imageUrl,
          width: img.width, // 保存原始尺寸用于计算
          height: img.height, // 保存原始尺寸用于计算
          scale: 1.0, // 默认100%缩放
          opacity: 0.8,
          rotation: 0,
          blendMode: 'normal',
          maintainAspectRatio: true
        });

        console.log('图片水印配置已更新:', {
          imageUrl: imageUrl,
          width: Math.min(img.width, 200),
          height: Math.min(img.height, 200),
          originalSize: { width: img.width, height: img.height }
        });

        setIsUploadingWatermark(false);
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        alert('图片加载失败，请选择其他图片');
        setIsUploadingWatermark(false);
      };

      img.src = imageUrl;
    } catch (error) {
      console.error('上传水印图片失败:', error);
      alert('上传失败，请重试');
      setIsUploadingWatermark(false);
    }
  };

  // 移除水印图片
  const handleRemoveWatermarkImage = () => {
    if (watermarkImageUrl) {
      URL.revokeObjectURL(watermarkImageUrl);
    }
    setWatermarkImage(null);
    setWatermarkImageUrl(null);

    // 切换回文字水印
    setWatermarkType('text');
  };

  // 九宫格位置映射
  const positionGrid: WatermarkPosition[] = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'middle-center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  const positionLabels: Record<WatermarkPosition, string> = {
    'top-left': '左上',
    'top-center': '上中',
    'top-right': '右上',
    'middle-left': '左中',
    'middle-center': '中心',
    'middle-right': '右中',
    'bottom-left': '左下',
    'bottom-center': '下中',
    'bottom-right': '右下',
    'custom': '自定义'
  };

  // 处理文字内容变化
  const handleTextChange = (value: string) => {
    updateTextStyle({ content: value });
  };

  // 处理字体大小变化
  const handleFontSizeChange = (value: number[]) => {
    updateTextStyle({ fontSize: value[0] });
  };

  // 处理颜色变化
  const handleColorChange = (value: string) => {
    updateTextStyle({ color: value });
  };

  // 处理透明度变化
  const handleOpacityChange = (value: number[]) => {
    updateTextStyle({ opacity: value[0] / 100 });
  };

  // 处理字体选择
  const handleFontFamilyChange = (value: string) => {
    updateTextStyle({ fontFamily: value });
  };

  // 处理字重变化
  const handleFontWeightChange = (value: string) => {
    updateTextStyle({ fontWeight: value as 'normal' | 'bold' | '100' | '300' | '500' | '700' | '900' });
  };

  // 处理位置选择
  const handlePositionSelect = (position: WatermarkPosition) => {
    console.log('选择位置:', position);
    setPosition(position);
  };

  // 切换水印启用状态
  const toggleWatermark = () => {
    updateConfig({ enabled: !currentConfig.enabled });
  };

  // {{ Shrimp-X: Add - 全屏水印图片上传处理函数. Approval: Cunzhi(ID:timestamp). }}
  // 处理全屏水印图片上传
  const handleFullscreenImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小 (最大5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片文件大小不能超过5MB');
      return;
    }

    setIsUploadingFullscreenImage(true);

    try {
      // 创建 FileReader 来读取文件
      const reader = new FileReader();

      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        if (imageUrl) {
          // 更新全屏水印样式
          updateFullscreenStyle({ imageUrl });

          // 创建临时图片来获取原始尺寸并设置合适的缩放比例
          const img = new Image();
          img.onload = () => {
            // 保存原始尺寸
            const originalWidth = img.width;
            const originalHeight = img.height;

            // 根据图片尺寸设置合适的默认缩放比例
            // 目标：让最大边长约为100-150px
            const maxDimension = Math.max(originalWidth, originalHeight);
            const targetSize = 120; // 目标尺寸
            let defaultScale = targetSize / maxDimension;

            // 限制缩放范围在 0.01 - 3.0 之间
            defaultScale = Math.max(0.01, Math.min(3.0, defaultScale));

            updateFullscreenStyle({
              imageScale: defaultScale,
              imageOriginalWidth: originalWidth,
              imageOriginalHeight: originalHeight
            });
          };
          img.src = imageUrl;
        }
      };

      reader.onerror = () => {
        alert('图片读取失败，请重试');
        setIsUploadingFullscreenImage(false);
      };

      // 读取文件为 Data URL
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败，请重试');
      setIsUploadingFullscreenImage(false);
    } finally {
      // 重置文件输入
      if (event.target) {
        event.target.value = '';
      }
      setTimeout(() => setIsUploadingFullscreenImage(false), 500);
    }
  };

  return (
    <Card className={`p-6 h-full ${className}`}>
        <div className="space-y-4">
        {/* 标题栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">水印设置</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleWatermark}
            className="flex items-center space-x-1"
          >
            {currentConfig.enabled ? (
              <>
                <Eye className="h-4 w-4" />
                <span>已启用</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                <span>已禁用</span>
              </>
            )}
          </Button>
        </div>
        
        {/* 水印类型选择 */}
        <Tabs
          value={currentConfig.type}
          onValueChange={(value) => setWatermarkType(value as 'text' | 'image' | 'fullscreen')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">文字</TabsTrigger>
            <TabsTrigger value="image">图片</TabsTrigger>
            <TabsTrigger value="fullscreen">全屏</TabsTrigger>
          </TabsList>
          
          {/* 文字水印控制 */}
          <TabsContent value="text" className="space-y-4 mt-4">
            {/* 水印文字 */}
            <div className="space-y-2">
              <Label htmlFor="watermark-text">水印文字</Label>
              <Input
                id="watermark-text"
                type="text"
                placeholder="请输入水印文字"
                value={currentConfig.textStyle?.content || ''}
                onChange={(e) => handleTextChange(e.target.value)}
              />
            </div>

            {/* 字体选择 */}
            <div className="space-y-2">
              <Label>字体</Label>
              <Select
                value={currentConfig.textStyle?.fontFamily || 'Arial'}
                onValueChange={handleFontFamilyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择字体" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="Microsoft YaHei">微软雅黑</SelectItem>
                  <SelectItem value="SimHei">黑体</SelectItem>
                  <SelectItem value="SimSun">宋体</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 水印模式 */}
            <div className="space-y-2">
              <Label>水印模式</Label>
              <Select
                value={currentConfig.scaleMode}
                onValueChange={(value) => setScaleMode(value as 'percentage' | 'fixed')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择水印模式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">📏 比例模式</SelectItem>
                  <SelectItem value="fixed">📌 固定尺寸</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500">
                {currentConfig.scaleMode === 'percentage' && '水印大小为图片尺寸的百分比，支持位置微调'}
                {currentConfig.scaleMode === 'fixed' && '使用固定的像素尺寸，支持位置微调'}
              </div>
            </div>

            {/* 比例控制 */}
            {currentConfig.scaleMode === 'percentage' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>水印比例</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={(currentConfig.adaptive.scaleRatio * 100).toFixed(1)}
                      onChange={(e) => {
                        const value = Math.max(0.1, Math.min(100, parseFloat(e.target.value) || 0.1));
                        updateAdaptive({ scaleRatio: value / 100 });
                      }}
                      className="w-16 px-2 py-1 text-sm border rounded"
                      min="0.1"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
                <Slider
                  value={[currentConfig.adaptive.scaleRatio * 100]}
                  onValueChange={(value) => updateAdaptive({ scaleRatio: value[0] / 100 })}
                  min={0.1}
                  max={100}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-gray-500">
                  控制水印相对于图片的大小比例
                </div>




              </div>
            )}



            {/* 字体大小 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>字体大小</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={currentConfig.textStyle?.fontSize || 24}
                    onChange={(e) => {
                      const value = Math.max(8, Math.min(200, parseInt(e.target.value) || 24));
                      handleFontSizeChange([value]);
                    }}
                    className="w-16 px-2 py-1 text-sm border rounded"
                    min="8"
                    max="200"
                    disabled={currentConfig.scaleMode === 'percentage'}
                  />
                  <span className="text-sm text-gray-500">px</span>
                </div>
              </div>
              <Slider
                value={[currentConfig.textStyle?.fontSize || 24]}
                onValueChange={handleFontSizeChange}
                min={8}
                max={200}
                step={1}
                className="w-full"
                disabled={currentConfig.scaleMode === 'percentage'}
              />
              {currentConfig.scaleMode === 'percentage' && (
                <div className="text-xs text-gray-500">
                  比例模式下，字体大小将根据图片尺寸和设置的比例自动计算
                </div>
              )}
            </div>

            {/* 字重 */}
            <div className="space-y-2">
              <Label>字重</Label>
              <Select
                value={currentConfig.textStyle?.fontWeight || 'normal'}
                onValueChange={handleFontWeightChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择字重" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">正常</SelectItem>
                  <SelectItem value="bold">粗体</SelectItem>
                  <SelectItem value="100">极细</SelectItem>
                  <SelectItem value="300">细</SelectItem>
                  <SelectItem value="500">中等</SelectItem>
                  <SelectItem value="700">粗</SelectItem>
                  <SelectItem value="900">极粗</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 颜色选择 */}
            <div className="space-y-2">
              <Label htmlFor="watermark-color">颜色</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="watermark-color"
                  type="color"
                  value={currentConfig.textStyle?.color || '#000000'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-12 h-8 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={currentConfig.textStyle?.color || '#000000'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* 透明度 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>透明度</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={Math.round((currentConfig.textStyle?.opacity || 0.5) * 100)}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 50));
                      handleOpacityChange([value]);
                    }}
                    className="w-16 px-2 py-1 text-sm border rounded"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <Slider
                value={[Math.round((currentConfig.textStyle?.opacity || 0.5) * 100)]}
                onValueChange={handleOpacityChange}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* 旋转角度 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>旋转角度</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={currentConfig.textStyle?.rotation || 0}
                    onChange={(e) => {
                      const value = Math.max(-180, Math.min(180, parseInt(e.target.value) || 0));
                      updateTextStyle({ rotation: value });
                    }}
                    className="w-16 px-2 py-1 text-sm border rounded"
                    min="-180"
                    max="180"
                  />
                  <span className="text-sm text-gray-500">°</span>
                </div>
              </div>
              <Slider
                value={[currentConfig.textStyle?.rotation || 0]}
                onValueChange={(value) => updateTextStyle({ rotation: value[0] })}
                min={-180}
                max={180}
                step={1}
                className="w-full"
              />
            </div>

            {/* 描边效果 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>描边粗细（相对字号）</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={Math.round(((currentConfig.textStyle?.stroke?.widthRatio || 0) * 100) * 10) / 10}
                    onChange={(e) => {
                      const pct = Math.max(0, Math.min(20, parseFloat(e.target.value) || 0));
                      updateTextStyle({
                        stroke: {
                          ...currentConfig.textStyle?.stroke,
                          color: currentConfig.textStyle?.stroke?.color || '#ffffff',
                          width: currentConfig.textStyle?.stroke?.width || 2,
                          widthRatio: pct / 100
                        }
                      });
                    }}
                    className="w-16 px-2 py-1 text-sm border rounded"
                    min="0"
                    max="20"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <Slider
                value={[Math.round(((currentConfig.textStyle?.stroke?.widthRatio || 0) * 100))]}
                onValueChange={(value) => updateTextStyle({
                  stroke: {
                    ...currentConfig.textStyle?.stroke,
                    color: currentConfig.textStyle?.stroke?.color || '#ffffff',
                    width: currentConfig.textStyle?.stroke?.width || 2,
                    widthRatio: value[0] / 100
                  }
                })}
                min={0}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            {currentConfig.textStyle?.stroke?.width && currentConfig.textStyle.stroke.width > 0 && (
              <div className="space-y-2">
                <Label htmlFor="stroke-color">描边颜色</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="stroke-color"
                    type="color"
                    value={currentConfig.textStyle?.stroke?.color || '#ffffff'}
                    onChange={(e) => updateTextStyle({
                      stroke: {
                        ...currentConfig.textStyle?.stroke,
                        width: currentConfig.textStyle?.stroke?.width || 1,
                        color: e.target.value
                      }
                    })}
                    className="w-12 h-8 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={currentConfig.textStyle?.stroke?.color || '#ffffff'}
                    onChange={(e) => updateTextStyle({
                      stroke: {
                        ...currentConfig.textStyle?.stroke,
                        width: currentConfig.textStyle?.stroke?.width || 1,
                        color: e.target.value
                      }
                    })}
                    className="flex-1"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* {{ Shrimp-X: Add - 完整的图片水印控制界面. Approval: Cunzhi(ID:timestamp). }} */}
          {/* 图片水印控制 */}
          <TabsContent value="image" className="space-y-4 mt-4">
            {/* 图片上传 */}
            <div className="space-y-2">
              <Label>水印图片</Label>
              {!watermarkImageUrl ? (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleWatermarkImageUpload}
                    className="hidden"
                    id="watermark-image-upload"
                    disabled={isUploadingWatermark}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('watermark-image-upload')?.click()}
                    disabled={isUploadingWatermark}
                  >
                    {isUploadingWatermark ? '上传中...' : '选择图片'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    支持 JPG、PNG、GIF 格式，最大 5MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* 图片预览 */}
                  <div className="relative border rounded-lg p-2 bg-gray-50">
                    <img
                      src={watermarkImageUrl}
                      alt="水印图片预览"
                      className="w-full h-20 object-contain rounded"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1"
                      onClick={handleRemoveWatermarkImage}
                    >
                      ×
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {watermarkImage?.name} ({Math.round((watermarkImage?.size || 0) / 1024)}KB)
                  </p>
                </div>
              )}
            </div>

            {/* 图片水印参数控制 */}
            {watermarkImageUrl && currentConfig.imageStyle && (
              <>
                {/* {{ Shrimp-X: Modify - 改为比例缩放控制. Approval: Cunzhi(ID:timestamp). }} */}
                {/* 缩放比例控制 */}
                <div className="space-y-2">
                  <Label>缩放比例 ({Math.round(currentConfig.imageStyle.scale * 100)}%)</Label>
                  <Slider
                    value={[currentConfig.imageStyle.scale * 100]}
                    onValueChange={([scale]) => updateImageStyle({ scale: scale / 100 })}
                    min={10}
                    max={300}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">
                    原始尺寸: {currentConfig.imageStyle.width} × {currentConfig.imageStyle.height}
                  </div>
                </div>

                {/* 透明度控制 */}
                <div className="space-y-2">
                  <Label>透明度 ({Math.round(currentConfig.imageStyle.opacity * 100)}%)</Label>
                  <Slider
                    value={[currentConfig.imageStyle.opacity * 100]}
                    onValueChange={([opacity]) => updateImageStyle({ opacity: opacity / 100 })}
                    min={10}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* 旋转角度控制 */}
                <div className="space-y-2">
                  <Label>旋转角度 ({currentConfig.imageStyle.rotation}°)</Label>
                  <Slider
                    value={[currentConfig.imageStyle.rotation]}
                    onValueChange={([rotation]) => updateImageStyle({ rotation })}
                    min={-180}
                    max={180}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* 重置按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => updateImageStyle({
                    scale: 1.0,
                    opacity: 0.8,
                    rotation: 0
                  })}
                >
                  重置参数
                </Button>
              </>
            )}
          </TabsContent>
          
          {/* 全屏水印控制 */}
          <TabsContent value="fullscreen" className="space-y-4 mt-4">
            {/* 水印模式选择 */}
            <div className="space-y-2">
              <Label>水印模式</Label>
              <Select
                value={currentConfig.fullscreenStyle?.mode || 'text'}
                onValueChange={(value: 'text' | 'image') => updateFullscreenStyle({ mode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">文字水印</SelectItem>
                  <SelectItem value="image">图片水印</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 文字模式控制 */}
            {currentConfig.fullscreenStyle?.mode === 'text' && (
              <>
                {/* 水印内容 */}
                <div className="space-y-2">
                  <Label>水印内容</Label>
                  <Input
                    value={currentConfig.fullscreenStyle?.content || ''}
                    onChange={(e) => updateFullscreenStyle({ content: e.target.value })}
                    placeholder="输入水印文字"
                  />
                </div>

                {/* 字体设置 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>字体</Label>
                    <Select
                      value={currentConfig.fullscreenStyle?.fontFamily || 'Arial'}
                      onValueChange={(value) => updateFullscreenStyle({ fontFamily: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>字体大小</Label>
                    <div className="flex items-center space-x-2">
                      <Slider
                        value={[currentConfig.fullscreenStyle?.fontSize || 48]}
                        onValueChange={([value]) => updateFullscreenStyle({ fontSize: value })}
                        min={12}
                        max={200}
                        step={1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={currentConfig.fullscreenStyle?.fontSize || 48}
                        onChange={(e) => {
                          const value = Math.max(12, Math.min(200, parseInt(e.target.value) || 48));
                          updateFullscreenStyle({ fontSize: value });
                        }}
                        className="w-20"
                        min={12}
                        max={200}
                      />
                      <span className="text-sm text-gray-500">px</span>
                    </div>
                  </div>
                </div>

                {/* 颜色 */}
                <div className="space-y-2">
                  <Label>颜色</Label>
                  <Input
                    type="color"
                    value={currentConfig.fullscreenStyle?.color || '#000000'}
                    onChange={(e) => updateFullscreenStyle({ color: e.target.value })}
                    className="w-full h-10"
                  />
                </div>
              </>
            )}

            {/* 图片模式控制 */}
            {currentConfig.fullscreenStyle?.mode === 'image' && (
              <>
                {/* 图片上传 */}
                <div className="space-y-2">
                  <Label>上传水印图片</Label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        // {{ Shrimp-X: Modify - 修复TypeScript类型错误，创建完整的ChangeEvent对象. Approval: Cunzhi(ID:timestamp). }}
                        // 创建一个符合 React.ChangeEvent<HTMLInputElement> 接口的事件对象
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.files = files;

                        const fakeEvent = {
                          target: input,
                          currentTarget: input,
                          nativeEvent: new Event('change'),
                          bubbles: false,
                          cancelable: false,
                          defaultPrevented: false,
                          eventPhase: 0,
                          isTrusted: false,
                          preventDefault: () => {},
                          isDefaultPrevented: () => false,
                          stopPropagation: () => {},
                          isPropagationStopped: () => false,
                          persist: () => {},
                          timeStamp: Date.now(),
                          type: 'change'
                        } as React.ChangeEvent<HTMLInputElement>;

                        handleFullscreenImageUpload(fakeEvent);
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFullscreenImageUpload}
                      className="hidden"
                      id="fullscreen-image-upload"
                    />
                    <label
                      htmlFor="fullscreen-image-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600">
                        {isUploadingFullscreenImage
                          ? '正在上传...'
                          : currentConfig.fullscreenStyle?.imageUrl
                            ? '点击更换图片'
                            : '点击选择图片或拖拽到此处'
                        }
                      </div>
                      <div className="text-xs text-gray-400">
                        支持 JPG、PNG、GIF 格式，最大5MB
                      </div>
                    </label>
                  </div>

                  {/* 图片预览 */}
                  {currentConfig.fullscreenStyle?.imageUrl && (
                    <div className="mt-2 space-y-2">
                      <img
                        src={currentConfig.fullscreenStyle.imageUrl}
                        alt="水印预览"
                        className="max-w-full h-20 object-contain border rounded"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateFullscreenStyle({
                          imageUrl: '',
                          imageScale: 1.0,
                          imageOriginalWidth: 100,
                          imageOriginalHeight: 100
                        })}
                        className="w-full"
                      >
                        移除图片
                      </Button>
                    </div>
                  )}
                </div>

                {/* 图片缩放 */}
                <div className="space-y-2">
                  <Label>缩放比例</Label>
                  <div className="flex items-center space-x-2">
                    <Slider
                      value={[currentConfig.fullscreenStyle?.imageScale || 1.0]}
                      onValueChange={([value]) => updateFullscreenStyle({ imageScale: value })}
                      min={0.01}
                      max={3.0}
                      step={0.01}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={((currentConfig.fullscreenStyle?.imageScale || 1.0) * 100).toFixed(1)}
                      onChange={(e) => {
                        const percentage = parseFloat(e.target.value) || 100;
                        const scale = Math.max(1, Math.min(300, percentage)) / 100;
                        updateFullscreenStyle({ imageScale: scale });
                      }}
                      className="w-20"
                      min={1}
                      max={300}
                      step={0.1}
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  {/* 显示实际尺寸信息 */}
                  {currentConfig.fullscreenStyle?.imageOriginalWidth && (
                    <div className="text-xs text-gray-400">
                      原始尺寸: {currentConfig.fullscreenStyle.imageOriginalWidth} × {currentConfig.fullscreenStyle.imageOriginalHeight}px
                      <br />
                      当前尺寸: {Math.round((currentConfig.fullscreenStyle.imageOriginalWidth || 100) * (currentConfig.fullscreenStyle.imageScale || 1.0))} × {Math.round((currentConfig.fullscreenStyle.imageOriginalHeight || 100) * (currentConfig.fullscreenStyle.imageScale || 1.0))}px
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 通用控制 - 透明度 */}
            <div className="space-y-2">
              <Label>透明度</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[currentConfig.fullscreenStyle?.opacity || 0.1]}
                  onValueChange={([value]) => updateFullscreenStyle({ opacity: value })}
                  min={0.01}
                  max={1.0}
                  step={0.01}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={Math.round((currentConfig.fullscreenStyle?.opacity || 0.1) * 100)}
                  onChange={(e) => {
                    const percentage = parseInt(e.target.value) || 10;
                    const opacity = Math.max(1, Math.min(100, percentage)) / 100;
                    updateFullscreenStyle({ opacity });
                  }}
                  className="w-20"
                  min={1}
                  max={100}
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>

            {/* 旋转角度 */}
            <div className="space-y-2">
              <Label>旋转角度</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[currentConfig.fullscreenStyle?.rotation || -45]}
                  onValueChange={([value]) => updateFullscreenStyle({ rotation: value })}
                  min={-180}
                  max={180}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={currentConfig.fullscreenStyle?.rotation || -45}
                  onChange={(e) => {
                    const angle = Math.max(-180, Math.min(180, parseInt(e.target.value) || -45));
                    updateFullscreenStyle({ rotation: angle });
                  }}
                  className="w-20"
                  min={-180}
                  max={180}
                />
                <span className="text-sm text-gray-500">°</span>
              </div>
            </div>

            {/* 平铺设置 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>平铺间距</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[currentConfig.fullscreenStyle?.tileSpacing || 200]}
                    onValueChange={([value]) => updateFullscreenStyle({ tileSpacing: value })}
                    min={1}
                    max={500}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={currentConfig.fullscreenStyle?.tileSpacing || 200}
                    onChange={(e) => {
                      const spacing = Math.max(1, Math.min(500, parseInt(e.target.value) || 200));
                      updateFullscreenStyle({ tileSpacing: spacing });
                    }}
                    className="w-20"
                    min={1}
                    max={500}
                  />
                  <span className="text-sm text-gray-500">px</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>平铺密度</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[currentConfig.fullscreenStyle?.tileDensity || 0.5]}
                    onValueChange={([value]) => updateFullscreenStyle({ tileDensity: value })}
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={(currentConfig.fullscreenStyle?.tileDensity || 0.5).toFixed(1)}
                    onChange={(e) => {
                      const density = Math.max(0.1, Math.min(2.0, parseFloat(e.target.value) || 0.5));
                      updateFullscreenStyle({ tileDensity: density });
                    }}
                    className="w-20"
                    min={0.1}
                    max={2.0}
                    step={0.1}
                  />
                </div>
              </div>
            </div>

            {/* 对角线模式 */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="diagonalMode"
                checked={currentConfig.fullscreenStyle?.diagonalMode || false}
                onChange={(e) => updateFullscreenStyle({ diagonalMode: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="diagonalMode">对角线模式</Label>
            </div>
          </TabsContent>
        </Tabs>



        {/* 位置控制 - 全屏水印不需要位置选择 */}
        {currentConfig.type !== 'fullscreen' && (
          <div className="space-y-2">
            <Label>位置</Label>
            <div className="grid grid-cols-3 gap-1">
              {positionGrid.map((position) => (
                <Button
                  key={position}
                  variant={currentConfig.position.position === position ? "default" : "outline"}
                  size="sm"
                  className="aspect-square p-0"
                  onClick={() => handlePositionSelect(position)}
                  title={positionLabels[position]}
                >
                  <div className="w-2 h-2 bg-current rounded-full" />
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 位置微调 - 全屏水印不需要位置微调 */}
        {currentConfig.type !== 'fullscreen' && (
          <div className="space-y-3">
            <Label>位置微调</Label>
          <div className="text-xs text-gray-500 mb-2">
            使用百分比微调水印位置，确保在不同尺寸图片上保持一致的相对位置
          </div>

          {/* X轴偏移 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">水平偏移</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={((currentConfig.position.offsetX || 0) / 10).toFixed(1)}
                  onChange={(e) => {
                    const percentValue = Math.max(-50, Math.min(50, parseFloat(e.target.value) || 0));
                    const pixelValue = percentValue * 10; // 转换为内部像素值存储
                    updatePosition({ offsetX: pixelValue });
                  }}
                  className="w-16 px-2 py-1 text-sm border rounded"
                  min="-50"
                  max="50"
                  step="0.1"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
            <Slider
              value={[(currentConfig.position.offsetX || 0) / 10]}
              onValueChange={(value) => updatePosition({ offsetX: value[0] * 10 })}
              min={-50}
              max={50}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Y轴偏移 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">垂直偏移</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={((currentConfig.position.offsetY || 0) / 10).toFixed(1)}
                  onChange={(e) => {
                    const percentValue = Math.max(-50, Math.min(50, parseFloat(e.target.value) || 0));
                    const pixelValue = percentValue * 10; // 转换为内部像素值存储
                    updatePosition({ offsetY: pixelValue });
                  }}
                  className="w-16 px-2 py-1 text-sm border rounded"
                  min="-50"
                  max="50"
                  step="0.1"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
            <Slider
              value={[(currentConfig.position.offsetY || 0) / 10]}
              onValueChange={(value) => updatePosition({ offsetY: value[0] * 10 })}
              min={-50}
              max={50}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* 重置偏移量按钮 */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => updatePosition({ offsetX: 0, offsetY: 0 })}
          >
            重置偏移量
          </Button>
        </div>
        )}

        {/* 处理按钮 */}
        <div className="space-y-3 pt-4">
          {/* 水印模式信息 */}
          {hasImages() && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <div className="font-medium text-blue-800 mb-1">批量处理模式</div>
              <div className="text-blue-700">
                {currentConfig.scaleMode === 'percentage' && '📏 比例模式 - 保持固定的相对大小比例，支持位置微调'}
                {currentConfig.scaleMode === 'fixed' && '📌 固定尺寸 - 所有图片使用相同像素大小，支持位置微调'}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                将处理 {getImageCount()} 张图片，确保{currentConfig.scaleMode === 'fixed' ? '像素一致性' : '比例一致性'}
              </div>
            </div>
          )}

          {/* 批量处理状态 */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>处理进度</span>
                <span>{Math.round(processingProgress)}%</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
              {currentProcessingImage && (
                <p className="text-xs text-muted-foreground truncate">
                  正在处理: {currentProcessingImage}
                </p>
              )}
            </div>
          )}

          {/* 错误信息 */}
          {processingError && (
            <div className="flex items-center space-x-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
              <AlertCircle className="h-4 w-4" />
              <span className="flex-1">{processingError}</span>
            </div>
          )}

          {/* 处理结果 */}
          {processingResults.length > 0 && !isProcessing && (
            <div className="text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span>处理完成</span>
                <span className="text-green-600">
                  {processingResults.filter(r => r.success).length}/{processingResults.length}
                </span>
              </div>
              {processingResults.some(r => !r.success) && (
                <p className="text-xs text-destructive">
                  {processingResults.filter(r => !r.success).length} 张图片处理失败
                </p>
              )}
            </div>
          )}



          {/* 操作按钮 */}
          <div className="space-y-2">
            {!isProcessing ? (
              <Button
                className="w-full"
                disabled={!currentConfig.enabled || !hasImages()}
                onClick={handleStartProcessing}
              >
                <Play className="h-4 w-4 mr-2" />
                开始处理 ({getImageCount()} 张图片)
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleStopProcessing}
              >
                <Square className="h-4 w-4 mr-2" />
                停止处理
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full"
              disabled={isProcessing || !hasImages()}
            >
              <Eye className="h-4 w-4 mr-2" />
              预览效果
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
