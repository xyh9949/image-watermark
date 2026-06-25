'use client';

/* eslint-disable @next/next/no-img-element -- User-selected data URL previews cannot be optimized by next/image. */

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Settings, Eye, EyeOff, Play, Square, AlertCircle, X, FolderOpen, Save } from 'lucide-react';
import { useWatermarkStore, useImageStore } from '@/app/lib/stores';
import { WatermarkPosition } from '@/app/types';
import { BatchWatermarkProcessor, downloadBatchResults, BatchProcessingResult } from '@/app/lib/watermark/batchProcessor';
import { generatePreviewFileName, DEFAULT_FILENAME_TEMPLATE, isValidTemplate } from '@/app/lib/utils/renamingUtils';
import { DEFAULT_LOCALE, getCopy, type Locale } from '@/app/lib/i18n';

type SaveStatus = 'idle' | 'success' | 'error';
type SaveDirectoryHandle = {
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<SaveDirectoryHandle>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<{
    createWritable: () => Promise<{
      write: (data: ArrayBuffer) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};
type WindowWithDirectoryPicker = Window & {
  showDirectoryPicker?: () => Promise<SaveDirectoryHandle>;
};

interface WatermarkControlsProps {
  className?: string;
  locale?: Locale;
}

export function WatermarkControls({ className = '', locale = DEFAULT_LOCALE }: WatermarkControlsProps) {
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

  const { images, hasImages, getImageCount, clearImages } = useImageStore();

  // 批量处理状态
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentProcessingImage, setCurrentProcessingImage] = useState('');
  const [processingResults, setProcessingResults] = useState<BatchProcessingResult[]>([]);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [controlError, setControlError] = useState<string | null>(null);
  const processorRef = useRef<BatchWatermarkProcessor | null>(null);

  // {{ Shrimp-X: Add - 图片水印上传状态管理. Approval: Cunzhi(ID:timestamp). }}
  // 图片水印状态
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
  const [watermarkImageUrl, setWatermarkImageUrl] = useState<string | null>(null);
  const [isUploadingWatermark, setIsUploadingWatermark] = useState(false);

  // 全屏水印图片上传状态
  const [isUploadingFullscreenImage, setIsUploadingFullscreenImage] = useState(false);

  // {{ Shrimp-X: Add - 文件名模板状态. Approval: Cunzhi(ID:timestamp). }}
  // 文件命名设置
  const [fileNameTemplate, setFileNameTemplate] = useState(DEFAULT_FILENAME_TEMPLATE);
  const [folderNameTemplate, setFolderNameTemplate] = useState('{name}');
  const [saveDirectoryHandle, setSaveDirectoryHandle] = useState<SaveDirectoryHandle | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastResults, setLastResults] = useState<BatchProcessingResult[] | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const labels = getCopy(locale).watermarkControls;
  const usesEnglishDefaults = locale === 'en';

  useEffect(() => {
    if (usesEnglishDefaults) {
      if (currentConfig.textStyle?.content === '水印文字') {
        updateTextStyle({ content: 'Watermark text' });
      }
      if (currentConfig.fullscreenStyle?.content === '水印') {
        updateFullscreenStyle({ content: 'Watermark' });
      }
      return;
    }

    if (currentConfig.textStyle?.content === 'Watermark text') {
      updateTextStyle({ content: '水印文字' });
    }
    if (currentConfig.fullscreenStyle?.content === 'Watermark') {
      updateFullscreenStyle({ content: '水印' });
    }
  }, [
    usesEnglishDefaults,
    currentConfig.textStyle?.content,
    currentConfig.fullscreenStyle?.content,
    updateTextStyle,
    updateFullscreenStyle,
  ]);


  const handleChooseSaveFolder = async () => {
    setSaveStatus('idle');
    setSaveMessage(null);

    const directoryPicker = (window as WindowWithDirectoryPicker).showDirectoryPicker;
    if (!directoryPicker) {
      setSaveMessage(labels.folderSaveUnsupported);
      return;
    }

    try {
      const handle = await directoryPicker();
      setSaveDirectoryHandle(handle);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setSaveStatus('error');
      setSaveMessage(labels.saveFailed);
    }
  };

  const handleSaveResults = async (results: BatchProcessingResult[]) => {
    try {
      await downloadBatchResults(results, {
        fileNameTemplate,
        folderNameTemplate,
        directoryHandle: saveDirectoryHandle
      });
      setSaveStatus('success');
      setSaveMessage(labels.saveSuccess);
      setLastResults(null);
      clearImages();
    } catch {
      setSaveStatus('error');
      setSaveMessage(labels.saveFailed);
      setLastResults(results);
      throw new Error(labels.saveFailed);
    }
  };

  const handleRetrySave = async () => {
    if (!lastResults) return;
    try {
      await handleSaveResults(lastResults);
    } catch {
      // 状态已在 handleSaveResults 中更新
    }
  };

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
        onComplete: async (results) => {
          setProcessingResults(results);
          setIsProcessing(false);

          // 自动下载结果
          try {
            await handleSaveResults(results);
          } catch {
            setProcessingError(labels.saveFailed);
          }
        },
        onImageComplete: () => {
          // 处理完成回调
        },
        onError: (error) => {
          setProcessingError(error.message);
        },
        // {{ Shrimp-X: Modify - 移除硬编码格式，保留原始图片格式. Approval: Cunzhi(ID:timestamp). }}
        quality: 0.92 // 提高默认质量，不指定 format 以保留原始格式
      });

    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : labels.processFailed);
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
    setControlError(null);

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setControlError(labels.chooseImageFile);
      return;
    }

    // 验证文件大小 (最大5MB)
    if (file.size > 5 * 1024 * 1024) {
      setControlError(labels.imageTooLarge);
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

        setIsUploadingWatermark(false);
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        setControlError(labels.imageLoadFailed);
        setIsUploadingWatermark(false);
      };

      img.src = imageUrl;
    } catch (error) {
      console.error('上传水印图片失败:', error);
      setControlError(labels.uploadFailed);
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
    'top-left': labels.positions['top-left'],
    'top-center': labels.positions['top-center'],
    'top-right': labels.positions['top-right'],
    'middle-left': labels.positions['middle-left'],
    'middle-center': labels.positions['middle-center'],
    'middle-right': labels.positions['middle-right'],
    'bottom-left': labels.positions['bottom-left'],
    'bottom-center': labels.positions['bottom-center'],
    'bottom-right': labels.positions['bottom-right'],
    'custom': labels.positions.custom
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
    setControlError(null);

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setControlError(labels.chooseImageFile);
      return;
    }

    // 验证文件大小 (最大5MB)
    if (file.size > 5 * 1024 * 1024) {
      setControlError(labels.imageTooLarge);
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
        setControlError(labels.imageReadFailed);
        setIsUploadingFullscreenImage(false);
      };

      // 读取文件为 Data URL
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('图片上传失败:', error);
      setControlError(labels.imageUploadFailed);
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
    <div className={`space-y-4 ${className}`}>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Save className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{labels.saveSettings}</h2>
          </div>

          <div className="space-y-2">
            <Label>{labels.saveLocation}</Label>
            <div className="rounded border bg-muted/30 p-3 text-sm">
              {saveDirectoryHandle ? labels.folderSelected : labels.browserDownload}
            </div>
            {saveMessage && (
              <div className={`text-sm ${saveStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                {saveMessage}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleChooseSaveFolder}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                {labels.chooseSaveFolder}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!saveDirectoryHandle}
                onClick={() => {
                  setSaveDirectoryHandle(null);
                  setSaveStatus('idle');
                  setSaveMessage(null);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                {labels.clearSaveFolder}
              </Button>
            </div>
            {saveStatus === 'error' && lastResults && (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={handleRetrySave}
              >
                {labels.saveRetry}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>{labels.filenameRule}</Label>
            <Input
              type="text"
              placeholder="watermarked-{name}"
              value={fileNameTemplate}
              onChange={(e) => setFileNameTemplate(e.target.value)}
              className={!isValidTemplate(fileNameTemplate) ? 'border-red-500' : ''}
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <div>{labels.preview}: <span className="font-mono bg-gray-100 px-1 rounded">{generatePreviewFileName(fileNameTemplate, 'example')}.jpg</span></div>
              <div>{labels.variables}: <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> {labels.originalName} | <code className="bg-gray-100 px-1 rounded">{'{index}'}</code> {labels.index} | <code className="bg-gray-100 px-1 rounded">{'{index:03}'}</code> {labels.paddedIndex} | <code className="bg-gray-100 px-1 rounded">{'{date}'}</code> {labels.date}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{labels.folderNameRule}</Label>
            <Input
              type="text"
              placeholder="{name}"
              value={folderNameTemplate}
              onChange={(e) => setFolderNameTemplate(e.target.value)}
              className={!isValidTemplate(folderNameTemplate) ? 'border-red-500' : ''}
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <div>{labels.preview}: <span className="font-mono bg-gray-100 px-1 rounded">{generatePreviewFileName(folderNameTemplate, 'folder')}</span></div>
              <div>{labels.variables}: <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> {labels.originalName} | <code className="bg-gray-100 px-1 rounded">{'{index}'}</code> {labels.index}</div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 h-full">
      <div className="space-y-4">
        {/* 标题栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{labels.settings}</h2>
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
                <span>{labels.enabled}</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                <span>{labels.disabled}</span>
              </>
            )}
          </Button>
        </div>

        {controlError && (
          <div className="flex items-center space-x-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
            <AlertCircle className="h-4 w-4" />
            <span className="flex-1">{controlError}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => setControlError(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* 水印类型选择 */}
        <Tabs
          value={currentConfig.type}
          onValueChange={(value) => setWatermarkType(value as 'text' | 'image' | 'fullscreen')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">{labels.text}</TabsTrigger>
            <TabsTrigger value="image">{labels.image}</TabsTrigger>
            <TabsTrigger value="fullscreen">{labels.fullscreen}</TabsTrigger>
          </TabsList>

          {/* 文字水印控制 */}
          <TabsContent value="text" className="space-y-4 mt-4">
            {/* 水印文字 */}
            <div className="space-y-2">
              <Label htmlFor="watermark-text">{labels.watermarkText}</Label>
              <Input
                id="watermark-text"
                type="text"
                placeholder={labels.watermarkTextPlaceholder}
                value={currentConfig.textStyle?.content || ''}
                onChange={(e) => handleTextChange(e.target.value)}
              />
            </div>

            {/* 字体选择 */}
            <div className="space-y-2">
              <Label>{labels.font}</Label>
              <Select
                value={currentConfig.textStyle?.fontFamily || 'Arial'}
                onValueChange={handleFontFamilyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={labels.chooseFont} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="Microsoft YaHei">{labels.microsoftYaHei}</SelectItem>
                  <SelectItem value="SimHei">{labels.simHei}</SelectItem>
                  <SelectItem value="SimSun">{labels.simSun}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 水印模式 */}
            <div className="space-y-2">
              <Label>{labels.mode}</Label>
              <Select
                value={currentConfig.scaleMode}
                onValueChange={(value) => setScaleMode(value as 'percentage' | 'fixed')}
              >
                <SelectTrigger>
                  <SelectValue placeholder={labels.chooseMode} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{labels.percentageMode}</SelectItem>
                  <SelectItem value="fixed">{labels.fixedMode}</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500">
                {currentConfig.scaleMode === 'percentage' && labels.percentageHelp}
                {currentConfig.scaleMode === 'fixed' && labels.fixedHelp}
              </div>
            </div>

            {/* 比例控制 */}
            {currentConfig.scaleMode === 'percentage' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{labels.watermarkRatio}</Label>
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
                  {labels.ratioHelp}
                </div>




              </div>
            )}



            {/* 字体大小 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{labels.fontSize}</Label>
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
                  {labels.percentageFontHelp}
                </div>
              )}
            </div>

            {/* 字重 */}
            <div className="space-y-2">
              <Label>{labels.fontWeight}</Label>
              <Select
                value={currentConfig.textStyle?.fontWeight || 'normal'}
                onValueChange={handleFontWeightChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={labels.chooseWeight} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">{labels.normal}</SelectItem>
                  <SelectItem value="bold">{labels.bold}</SelectItem>
                  <SelectItem value="100">{labels.thin}</SelectItem>
                  <SelectItem value="300">{labels.light}</SelectItem>
                  <SelectItem value="500">{labels.medium}</SelectItem>
                  <SelectItem value="700">{labels.heavy}</SelectItem>
                  <SelectItem value="900">{labels.black}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 颜色选择 */}
            <div className="space-y-2">
              <Label htmlFor="watermark-color">{labels.color}</Label>
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
                <Label>{labels.opacity}</Label>
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
                <Label>{labels.rotation}</Label>
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
                <Label>{labels.strokeWidth}</Label>
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
                <Label htmlFor="stroke-color">{labels.strokeColor}</Label>
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
              <Label>{labels.watermarkImage}</Label>
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
                    {isUploadingWatermark ? labels.uploading : labels.chooseImage}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {labels.supportWatermarkImage}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* 图片预览 */}
                  <div className="relative border rounded-lg p-2 bg-gray-50">
                    <img
                      src={watermarkImageUrl}
                      alt={labels.imagePreviewAlt}
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
                  <Label>{labels.imageScale} ({Math.round(currentConfig.imageStyle.scale * 100)}%)</Label>
                  <Slider
                    value={[currentConfig.imageStyle.scale * 100]}
                    onValueChange={([scale]) => updateImageStyle({ scale: scale / 100 })}
                    min={10}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">
                    {labels.originalSize}: {currentConfig.imageStyle.width} × {currentConfig.imageStyle.height}
                  </div>
                </div>

                {/* 透明度控制 */}
                <div className="space-y-2">
                  <Label>{labels.opacity} ({Math.round(currentConfig.imageStyle.opacity * 100)}%)</Label>
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
                  <Label>{labels.rotation} ({currentConfig.imageStyle.rotation}°)</Label>
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
                  {labels.resetParams}
                </Button>
              </>
            )}
          </TabsContent>

          {/* 全屏水印控制 */}
          <TabsContent value="fullscreen" className="space-y-4 mt-4">
            {/* 水印模式选择 */}
            <div className="space-y-2">
              <Label>{labels.mode}</Label>
              <Select
                value={currentConfig.fullscreenStyle?.mode || 'text'}
                onValueChange={(value: 'text' | 'image') => updateFullscreenStyle({ mode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">{labels.fullscreenModeText}</SelectItem>
                  <SelectItem value="image">{labels.fullscreenModeImage}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 文字模式控制 */}
            {currentConfig.fullscreenStyle?.mode === 'text' && (
              <>
                {/* 水印内容 */}
                <div className="space-y-2">
                  <Label>{labels.watermarkContent}</Label>
                  <Input
                    value={currentConfig.fullscreenStyle?.content || ''}
                    onChange={(e) => updateFullscreenStyle({ content: e.target.value })}
                    placeholder={labels.watermarkTextPlaceholder}
                  />
                </div>

                {/* 字体设置 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{labels.font}</Label>
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
                    <Label>{labels.fontSize}</Label>
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
                  <Label>{labels.color}</Label>
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
                  <Label>{labels.uploadFullscreenImage}</Label>
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
                          preventDefault: () => { },
                          isDefaultPrevented: () => false,
                          stopPropagation: () => { },
                          isPropagationStopped: () => false,
                          persist: () => { },
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
                          ? labels.uploading
                          : currentConfig.fullscreenStyle?.imageUrl
                            ? labels.replaceImage
                            : labels.dragImage
                        }
                      </div>
                      <div className="text-xs text-gray-400">
                        {labels.supportFullscreenImage}
                      </div>
                    </label>
                  </div>

                  {/* 图片预览 */}
                  {currentConfig.fullscreenStyle?.imageUrl && (
                    <div className="mt-2 space-y-2">
                      <img
                        src={currentConfig.fullscreenStyle.imageUrl}
                        alt={labels.imagePreviewAlt}
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
                        {labels.removeImage}
                      </Button>
                    </div>
                  )}
                </div>

                {/* 图片缩放 */}
                <div className="space-y-2">
                  <Label>{labels.imageScale}</Label>
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
                      {labels.originalSize}: {currentConfig.fullscreenStyle.imageOriginalWidth} × {currentConfig.fullscreenStyle.imageOriginalHeight}px
                      <br />
                      {labels.currentSize}: {Math.round((currentConfig.fullscreenStyle.imageOriginalWidth || 100) * (currentConfig.fullscreenStyle.imageScale || 1.0))} × {Math.round((currentConfig.fullscreenStyle.imageOriginalHeight || 100) * (currentConfig.fullscreenStyle.imageScale || 1.0))}px
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 通用控制 - 透明度 */}
            <div className="space-y-2">
              <Label>{labels.opacity}</Label>
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
              <Label>{labels.rotation}</Label>
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
                <Label>{labels.tileSpacing}</Label>
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
                <Label>{labels.tileDensity}</Label>
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
              <Label htmlFor="diagonalMode">{labels.diagonalMode}</Label>
            </div>
          </TabsContent>
        </Tabs>



        {/* 位置控制 - 全屏水印不需要位置选择 */}
        {currentConfig.type !== 'fullscreen' && (
          <div className="space-y-2">
            <Label>{labels.position}</Label>
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
            <Label>{labels.fineTune}</Label>
            <div className="text-xs text-gray-500 mb-2">
              {labels.fineTuneHelp}
            </div>

            {/* X轴偏移 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">{labels.horizontalOffset}</Label>
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
                <Label className="text-sm text-muted-foreground">{labels.verticalOffset}</Label>
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
              {labels.resetOffset}
            </Button>
          </div>
        )}

        {/* 处理按钮 */}
        <div className="space-y-3 pt-4">
          {/* 水印模式信息 */}
          {hasImages() && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <div className="font-medium text-blue-800 mb-1">{labels.batchMode}</div>
              <div className="text-blue-700">
                {currentConfig.scaleMode === 'percentage' && labels.batchPercentage}
                {currentConfig.scaleMode === 'fixed' && labels.batchFixed}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {labels.willProcess(getImageCount(), currentConfig.scaleMode)}
              </div>
            </div>
          )}

          {/* 批量处理状态 */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{labels.progress}</span>
                <span>{Math.round(processingProgress)}%</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
              {currentProcessingImage && (
                <p className="text-xs text-muted-foreground truncate">
                  {labels.processing}: {currentProcessingImage}
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
                <span>{labels.completed}</span>
                <span className="text-green-600">
                  {processingResults.filter(r => r.success).length}/{processingResults.length}
                </span>
              </div>
              {processingResults.some(r => !r.success) && (
                <p className="text-xs text-destructive">
                  {labels.failedCount(processingResults.filter(r => !r.success).length)}
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
                {labels.startProcessing(getImageCount())}
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleStopProcessing}
              >
                <Square className="h-4 w-4 mr-2" />
                {labels.stopProcessing}
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full"
              disabled={isProcessing || !hasImages()}
            >
              <Eye className="h-4 w-4 mr-2" />
              {labels.previewResult}
            </Button>
          </div>
        </div>
      </div>
    </Card>
    </div>
  );
}
