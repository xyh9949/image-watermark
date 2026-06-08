'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
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
import { generatePreviewFileName, DEFAULT_FILENAME_TEMPLATE, isValidTemplate } from '@/app/lib/utils/renamingUtils';

interface WatermarkControlsProps {
  className?: string;
  isEnglish?: boolean;
}

export function WatermarkControls({ className = '', isEnglish = false }: WatermarkControlsProps) {
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

  // {{ Shrimp-X: Add - 文件名模板状态. Approval: Cunzhi(ID:timestamp). }}
  // 文件命名设置
  const [fileNameTemplate, setFileNameTemplate] = useState(DEFAULT_FILENAME_TEMPLATE);
  const labels = useMemo(() => isEnglish
    ? ({
        settings: 'Watermark settings',
        enabled: 'Enabled',
        disabled: 'Disabled',
        text: 'Text',
        image: 'Image',
        fullscreen: 'Full screen',
        watermarkText: 'Watermark text',
        watermarkTextPlaceholder: 'Enter watermark text',
        font: 'Font',
        chooseFont: 'Choose font',
        mode: 'Watermark mode',
        chooseMode: 'Choose watermark mode',
        percentageMode: 'Percentage mode',
        fixedMode: 'Fixed size',
        percentageHelp: 'Watermark size is a percentage of the image size, with position fine-tuning.',
        fixedHelp: 'Use a fixed pixel size, with position fine-tuning.',
        watermarkRatio: 'Watermark ratio',
        ratioHelp: 'Controls the watermark size relative to the image.',
        fontSize: 'Font size',
        percentageFontHelp: 'In percentage mode, font size is calculated from image dimensions and the selected ratio.',
        fontWeight: 'Font weight',
        chooseWeight: 'Choose weight',
        normal: 'Normal',
        bold: 'Bold',
        thin: 'Thin',
        light: 'Light',
        medium: 'Medium',
        heavy: 'Heavy',
        black: 'Black',
        color: 'Color',
        opacity: 'Opacity',
        rotation: 'Rotation',
        strokeWidth: 'Stroke width (relative to font)',
        strokeColor: 'Stroke color',
        watermarkImage: 'Watermark image',
        uploadWatermarkImage: 'Upload watermark image',
        uploading: 'Uploading...',
        chooseImage: 'Choose image',
        changeImage: 'Change image',
        removeImage: 'Remove image',
        resetParams: 'Reset parameters',
        imagePreviewAlt: 'Watermark image preview',
        supportWatermarkImage: 'Supports JPG, PNG, and WebP. Max 5 MB.',
        imageScale: 'Scale',
        fullscreenModeText: 'Text watermark',
        fullscreenModeImage: 'Image watermark',
        watermarkContent: 'Watermark content',
        uploadFullscreenImage: 'Upload watermark image',
        dragImage: 'Click to choose an image or drag it here',
        replaceImage: 'Click to replace image',
        supportFullscreenImage: 'Supports JPG, PNG, and GIF. Max 5 MB.',
        originalSize: 'Original size',
        currentSize: 'Current size',
        tileSpacing: 'Tile spacing',
        tileDensity: 'Tile density',
        diagonalMode: 'Diagonal mode',
        position: 'Position',
        fineTune: 'Position fine-tuning',
        fineTuneHelp: 'Use percentages to fine-tune the watermark position and keep relative placement consistent across image sizes.',
        horizontalOffset: 'Horizontal offset',
        verticalOffset: 'Vertical offset',
        resetOffset: 'Reset offset',
        filenameRule: 'Export filename rule',
        preview: 'Preview',
        variables: 'Variables',
        originalName: 'original name',
        index: 'index',
        paddedIndex: 'padded index',
        date: 'date',
        batchMode: 'Batch processing mode',
        batchPercentage: 'Percentage mode - keeps a fixed relative size ratio and supports position fine-tuning.',
        batchFixed: 'Fixed size - all images use the same pixel size and support position fine-tuning.',
        willProcess: (count: number, mode: string) => `Will process ${count} ${count === 1 ? 'image' : 'images'} with ${mode === 'fixed' ? 'pixel consistency' : 'ratio consistency'}.`,
        progress: 'Progress',
        processing: 'Processing',
        completed: 'Completed',
        failedCount: (count: number) => `${count} ${count === 1 ? 'image' : 'images'} failed`,
        startProcessing: (count: number) => `Start processing (${count} ${count === 1 ? 'image' : 'images'})`,
        stopProcessing: 'Stop processing',
        previewResult: 'Preview result',
        downloadFailed: 'Download failed, but processing is complete',
        processFailed: 'Processing failed',
        chooseImageFile: 'Please choose an image file',
        imageTooLarge: 'Image file size cannot exceed 5 MB',
        imageLoadFailed: 'Image failed to load. Please choose another image.',
        uploadFailed: 'Upload failed. Please try again.',
        imageReadFailed: 'Image read failed. Please try again.',
        imageUploadFailed: 'Image upload failed. Please try again.',
        positions: {
          'top-left': 'Top left',
          'top-center': 'Top center',
          'top-right': 'Top right',
          'middle-left': 'Middle left',
          'middle-center': 'Center',
          'middle-right': 'Middle right',
          'bottom-left': 'Bottom left',
          'bottom-center': 'Bottom center',
          'bottom-right': 'Bottom right',
          custom: 'Custom',
        } as Record<WatermarkPosition, string>,
      })
    : ({
        settings: '水印设置',
        enabled: '已启用',
        disabled: '已禁用',
        text: '文字',
        image: '图片',
        fullscreen: '全屏',
        watermarkText: '水印文字',
        watermarkTextPlaceholder: '请输入水印文字',
        font: '字体',
        chooseFont: '选择字体',
        mode: '水印模式',
        chooseMode: '选择水印模式',
        percentageMode: '比例模式',
        fixedMode: '固定尺寸',
        percentageHelp: '水印大小为图片尺寸的百分比，支持位置微调',
        fixedHelp: '使用固定的像素尺寸，支持位置微调',
        watermarkRatio: '水印比例',
        ratioHelp: '控制水印相对于图片的大小比例',
        fontSize: '字体大小',
        percentageFontHelp: '比例模式下，字体大小将根据图片尺寸和设置的比例自动计算',
        fontWeight: '字重',
        chooseWeight: '选择字重',
        normal: '正常',
        bold: '粗体',
        thin: '极细',
        light: '细',
        medium: '中等',
        heavy: '粗',
        black: '极粗',
        color: '颜色',
        opacity: '透明度',
        rotation: '旋转角度',
        strokeWidth: '描边粗细（相对字号）',
        strokeColor: '描边颜色',
        watermarkImage: '水印图片',
        uploadWatermarkImage: '上传水印图片',
        uploading: '上传中...',
        chooseImage: '选择图片',
        changeImage: '更换图片',
        removeImage: '移除图片',
        resetParams: '重置参数',
        imagePreviewAlt: '水印图片预览',
        supportWatermarkImage: '支持 JPG、PNG、WebP 格式，最大 5MB',
        imageScale: '缩放比例',
        fullscreenModeText: '文字水印',
        fullscreenModeImage: '图片水印',
        watermarkContent: '水印内容',
        uploadFullscreenImage: '上传水印图片',
        dragImage: '点击选择图片或拖拽到此处',
        replaceImage: '点击更换图片',
        supportFullscreenImage: '支持 JPG、PNG、GIF 格式，最大 5MB',
        originalSize: '原始尺寸',
        currentSize: '当前尺寸',
        tileSpacing: '平铺间距',
        tileDensity: '平铺密度',
        diagonalMode: '对角线模式',
        position: '位置',
        fineTune: '位置微调',
        fineTuneHelp: '使用百分比微调水印位置，确保在不同尺寸图片上保持一致的相对位置',
        horizontalOffset: '水平偏移',
        verticalOffset: '垂直偏移',
        resetOffset: '重置偏移量',
        filenameRule: '导出文件名规则',
        preview: '预览',
        variables: '可用变量',
        originalName: '原名',
        index: '序号',
        paddedIndex: '补零序号',
        date: '日期',
        batchMode: '批量处理模式',
        batchPercentage: '比例模式 - 保持固定的相对大小比例，支持位置微调',
        batchFixed: '固定尺寸 - 所有图片使用相同像素大小，支持位置微调',
        willProcess: (count: number, mode: string) => `将处理 ${count} 张图片，确保${mode === 'fixed' ? '像素一致性' : '比例一致性'}`,
        progress: '处理进度',
        processing: '正在处理',
        completed: '处理完成',
        failedCount: (count: number) => `${count} 张图片处理失败`,
        startProcessing: (count: number) => `开始处理 (${count} 张图片)`,
        stopProcessing: '停止处理',
        previewResult: '预览效果',
        downloadFailed: '下载失败，但处理已完成',
        processFailed: '处理失败',
        chooseImageFile: '请选择图片文件',
        imageTooLarge: '图片文件大小不能超过5MB',
        imageLoadFailed: '图片加载失败，请选择其他图片',
        uploadFailed: '上传失败，请重试',
        imageReadFailed: '图片读取失败，请重试',
        imageUploadFailed: '图片上传失败，请重试',
        positions: {
          'top-left': '左上',
          'top-center': '上中',
          'top-right': '右上',
          'middle-left': '左中',
          'middle-center': '中心',
          'middle-right': '右中',
          'bottom-left': '左下',
          'bottom-center': '下中',
          'bottom-right': '右下',
          custom: '自定义',
        } as Record<WatermarkPosition, string>,
      }), [isEnglish]);

  useEffect(() => {
    if (isEnglish) {
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
    isEnglish,
    currentConfig.textStyle?.content,
    currentConfig.fullscreenStyle?.content,
    updateTextStyle,
    updateFullscreenStyle,
  ]);









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
            // {{ Shrimp-X: Modify - 传递文件名模板参数. Approval: Cunzhi(ID:timestamp). }}
            await downloadBatchResults(results, undefined, fileNameTemplate);
          } catch (error) {
            setProcessingError(labels.downloadFailed);
          }
        },
        onError: (error, imageId) => {
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

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert(labels.chooseImageFile);
      return;
    }

    // 验证文件大小 (最大5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(labels.imageTooLarge);
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
        alert(labels.imageLoadFailed);
        setIsUploadingWatermark(false);
      };

      img.src = imageUrl;
    } catch (error) {
      console.error('上传水印图片失败:', error);
      alert(labels.uploadFailed);
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
      alert(labels.chooseImageFile);
      return;
    }

    // 验证文件大小 (最大5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(labels.imageTooLarge);
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
        alert(labels.imageReadFailed);
        setIsUploadingFullscreenImage(false);
      };

      // 读取文件为 Data URL
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('图片上传失败:', error);
      alert(labels.imageUploadFailed);
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
                  <SelectItem value="Microsoft YaHei">{isEnglish ? 'Microsoft YaHei' : '微软雅黑'}</SelectItem>
                  <SelectItem value="SimHei">{isEnglish ? 'SimHei' : '黑体'}</SelectItem>
                  <SelectItem value="SimSun">{isEnglish ? 'SimSun' : '宋体'}</SelectItem>
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
                    max={300}
                    step={5}
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
          {/* {{ Shrimp-X: Add - 文件命名规则设置. Approval: Cunzhi(ID:timestamp). }} */}
          {/* 文件命名设置 */}
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
  );
}
