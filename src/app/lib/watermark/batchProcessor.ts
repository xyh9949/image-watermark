// 批量水印处理器

'use client';

import { WatermarkConfig, ImageInfo, ProcessingStatus } from '../../types';
import { createTextWatermark, createImageWatermark, createFullscreenWatermark } from '../canvas/fabricUtils';
import { Canvas, FabricImage } from 'fabric';
import { zip } from 'fflate';
import {
  parseFileNameTemplate,
  getFileNameWithoutExtension,
  DEFAULT_FILENAME_TEMPLATE
} from '../utils/renamingUtils';
import {
  prepareBatchWatermarkConfig,
  adjustWatermarkForImage,
  ScaledWatermarkConfig,
  generateBatchReport,
  optimizeBatchConfiguration
} from './batchScalingUtils';

export interface BatchProcessingOptions {
  watermarkConfig: WatermarkConfig;
  images: ImageInfo[];
  onProgress?: (progress: number, currentImage: string) => void;
  onImageComplete?: (imageId: string, result: string | null) => void;
  onComplete?: (results: BatchProcessingResult[]) => void;
  onError?: (error: Error, imageId?: string) => void;
  quality?: number; // 输出质量 0-1
  format?: 'png' | 'jpeg' | 'jpg' | 'webp';
  fileNameTemplate?: string; // 文件名模板
}

export interface BatchProcessingResult {
  imageId: string;
  imageName: string;
  success: boolean;
  dataUrl?: string;
  error?: string;
  processingTime: number;
}

export class BatchWatermarkProcessor {
  private canvas: Canvas | null = null;
  private isProcessing = false;
  private shouldStop = false;
  private scaledConfig: ScaledWatermarkConfig | null = null;

  constructor() {
    // 创建离屏Canvas用于处理
    this.initializeCanvas();
  }

  private initializeCanvas() {
    try {
      // 创建一个不可见的Canvas元素
      const canvasElement = document.createElement('canvas');
      canvasElement.style.display = 'none';
      document.body.appendChild(canvasElement);

      this.canvas = new Canvas(canvasElement, {
        width: 800,
        height: 600,
        backgroundColor: 'transparent'
      });

      // {{ Shrimp-X: Add - 确保 Fabric.js 创建的 wrapper 容器也被隐藏. Approval: Cunzhi(ID:timestamp). }}
      // Fabric.js 会创建一个 wrapper div，需要将其也隐藏
      const wrapperElement = canvasElement.parentElement;
      if (wrapperElement && wrapperElement.classList.contains('canvas-container')) {
        wrapperElement.style.display = 'none';
        wrapperElement.style.position = 'absolute';
        wrapperElement.style.left = '-9999px';
        wrapperElement.style.top = '-9999px';
      }
    } catch (error) {
      console.error('Failed to initialize batch processing canvas:', error);
    }
  }

  /**
   * 开始批量处理
   * {{ Shrimp-X: Modify - 添加批量缩放一致性支持. Approval: Cunzhi(ID:timestamp). }}
   */
  async processBatch(options: BatchProcessingOptions): Promise<BatchProcessingResult[]> {
    if (this.isProcessing) {
      throw new Error('Batch processing is already in progress');
    }

    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    this.isProcessing = true;
    this.shouldStop = false;

    const results: BatchProcessingResult[] = [];
    const { watermarkConfig, images, onProgress, onImageComplete, onComplete, onError } = options;

    // {{ Shrimp-X: Add - 优化批量处理配置，确保缩放一致性. Approval: Cunzhi(ID:timestamp). }}
    // 优化批量处理配置
    const optimization = optimizeBatchConfiguration(watermarkConfig, images);
    this.scaledConfig = optimization.optimizedConfig;

    // 生成批量处理报告
    const report = generateBatchReport(
      [watermarkConfig],
      images,
      this.scaledConfig.scalingContext!
    );

    console.log('批量处理优化:', {
      strategy: optimization.strategy,
      reason: optimization.reason,
      report: report.summary
    });

    try {
      for (let i = 0; i < images.length; i++) {
        if (this.shouldStop) {
          break;
        }

        const image = images[i];
        const startTime = Date.now();

        try {
          // 更新进度
          const progress = (i / images.length) * 100;
          onProgress?.(progress, image.name);

          // {{ Shrimp-X: Modify - 为每张图片调整水印配置，确保一致性. Approval: Cunzhi(ID:timestamp). }}
          // 为当前图片调整水印配置
          const adjustedConfig = this.scaledConfig ?
            adjustWatermarkForImage(this.scaledConfig, image) :
            watermarkConfig;

          // 处理单张图片
          const dataUrl = await this.processImage(image, adjustedConfig, options);
          const processingTime = Date.now() - startTime;

          const result: BatchProcessingResult = {
            imageId: image.id,
            imageName: image.name,
            success: true,
            dataUrl,
            processingTime
          };

          results.push(result);
          onImageComplete?.(image.id, dataUrl);

        } catch (error) {
          const processingTime = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          const result: BatchProcessingResult = {
            imageId: image.id,
            imageName: image.name,
            success: false,
            error: errorMessage,
            processingTime
          };

          results.push(result);
          onImageComplete?.(image.id, null);
          onError?.(error instanceof Error ? error : new Error(errorMessage), image.id);
        }
      }

      // 完成进度
      onProgress?.(100, '');
      onComplete?.(results);

    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Batch processing failed'));
    } finally {
      this.isProcessing = false;
    }

    return results;
  }

  /**
   * 处理单张图片
   * {{ Shrimp-X: Modify - 使用与单张导出相同的缩放策略，确保水印一致性. Approval: Cunzhi(ID:timestamp). }}
   */
  private async processImage(
    imageInfo: ImageInfo,
    watermarkConfig: WatermarkConfig,
    options: BatchProcessingOptions
  ): Promise<string> {
    if (!this.canvas) {
      throw new Error('Canvas not available');
    }

    // 清空Canvas
    this.canvas.clear();

    // 加载图片
    const fabricImage = await this.loadImageToCanvas(imageInfo);

    // {{ Shrimp-X: Modify - 使用与单张导出相同的缩放策略，保持水印一致性. Approval: Cunzhi(ID:timestamp). }}
    // 获取图片原始尺寸
    const imageWidth = fabricImage.getOriginalSize().width || imageInfo.width || 800;
    const imageHeight = fabricImage.getOriginalSize().height || imageInfo.height || 600;

    // 使用与单张编辑器相同的最大显示尺寸
    const maxDisplayWidth = 800;
    const maxDisplayHeight = 600;

    // 计算适合显示的尺寸，保持图片宽高比
    const scaleX = maxDisplayWidth / imageWidth;
    const scaleY = maxDisplayHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小

    // 计算Canvas的逻辑尺寸（与单张导出一致）
    const canvasWidth = Math.round(imageWidth * scale);
    const canvasHeight = Math.round(imageHeight * scale);

    // 调整Canvas尺寸为缩放后的尺寸（与单张导出一致）
    this.canvas.setDimensions({
      width: canvasWidth,
      height: canvasHeight
    });

    // 设置图片尺寸以填满Canvas
    fabricImage.set({
      scaleX: scale,
      scaleY: scale,
      left: 0,
      top: 0
    });

    // 添加图片到Canvas
    this.canvas.add(fabricImage);

    // 应用水印（现在传入的是与单张导出相同的缩放后尺寸）
    if (watermarkConfig.enabled) {
      await this.applyWatermark(watermarkConfig);
    }

    // 渲染Canvas
    this.canvas.renderAll();

    // {{ Shrimp-X: Modify - 根据原始图片格式导出，保留原始格式. Approval: Cunzhi(ID:timestamp). }}
    // 导出图片 - 使用 multiplier 恢复原始分辨率
    const quality = options.quality || 0.92;

    // 根据原始图片类型确定导出格式，保留原始格式
    let format: 'png' | 'jpeg' = 'png'; // 默认 PNG
    if (options.format) {
      // 如果用户指定了格式，使用用户指定的格式
      format = options.format === 'jpg' ? 'jpeg' : options.format as 'png' | 'jpeg';
    } else {
      // 根据原始图片的 MIME 类型自动确定格式
      const mimeType = imageInfo.type?.toLowerCase() || '';
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
        format = 'jpeg';
      } else if (mimeType.includes('png')) {
        format = 'png';
      } else if (mimeType.includes('webp')) {
        // WebP 导出为 PNG 以保留透明度
        format = 'png';
      } else {
        // 其他格式默认使用 PNG
        format = 'png';
      }
    }

    // 计算 multiplier 以恢复原始分辨率
    const multiplier = 1 / scale;

    return this.canvas.toDataURL({
      format: format,
      quality: format === 'jpeg' ? quality : 1.0,
      multiplier: multiplier // 使用 multiplier 恢复原始分辨率
    });
  }


  /**
   * 加载图片到Canvas
   */
  private async loadImageToCanvas(imageInfo: ImageInfo): Promise<FabricImage> {
    return new Promise((resolve, reject) => {
      FabricImage.fromURL(imageInfo.url, {
        crossOrigin: 'anonymous'
      }).then((fabricImage) => {
        // 设置图片位置为Canvas中心
        fabricImage.set({
          left: 0,
          top: 0,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false
        });

        resolve(fabricImage);
      }).catch(reject);
    });
  }

  /**
   * 应用水印到Canvas
   * {{ Shrimp-X: Modify - 支持比例模式，确保跨分辨率一致性. Approval: Cunzhi(ID:timestamp). }}
   */
  private async applyWatermark(config: WatermarkConfig): Promise<void> {
    if (!this.canvas) return;

    const canvasWidth = this.canvas.getWidth();
    const canvasHeight = this.canvas.getHeight();

    let watermarkObject = null;

    // 比例模式下，createTextWatermark 会自动处理比例计算
    // 确保传递正确的画布尺寸以支持比例模式
    switch (config.type) {
      case 'text':
        // 传递画布尺寸，支持比例模式和像素模式
        watermarkObject = createTextWatermark(config, canvasWidth, canvasHeight);
        break;
      case 'image':
        // {{ Shrimp-X: Modify - 图片水印支持自适应缩放，传递画布尺寸. Approval: Cunzhi(ID:timestamp). }}
        watermarkObject = await createImageWatermark(config, canvasWidth, canvasHeight);
        break;
      case 'fullscreen':
        // {{ Shrimp-X: Modify - 使用新的createFullscreenWatermark函数支持真正的全屏平铺水印，支持图片模式. Approval: Cunzhi(ID:timestamp). }}
        watermarkObject = await createFullscreenWatermark(config, canvasWidth, canvasHeight);
        break;
    }

    if (watermarkObject) {
      this.canvas.add(watermarkObject);

      // 在比例模式下，记录调试信息
      if (config.position.mode === 'proportion') {
        console.log(`比例模式水印应用: ${canvasWidth}x${canvasHeight}`, {
          position: config.position.position,
          proportions: config.position.proportions,
          watermarkSize: {
            width: watermarkObject.width,
            height: watermarkObject.height
          }
        });
      }
    }
  }

  /**
   * 停止批量处理
   */
  stop(): void {
    this.shouldStop = true;
  }

  /**
   * 检查是否正在处理
   */
  isRunning(): boolean {
    return this.isProcessing;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
    this.isProcessing = false;
    this.shouldStop = false;
  }
}

/**
 * 下载批量处理结果
 * {{ Shrimp-X: Modify - 支持自定义文件名模板. Approval: Cunzhi(ID:timestamp). }}
 */
export async function downloadBatchResults(
  results: BatchProcessingResult[],
  zipName?: string,
  fileNameTemplate?: string
): Promise<void> {
  const successResults = results.filter(r => r.success && r.dataUrl);

  if (successResults.length === 0) {
    throw new Error('No successful results to download');
  }

  // 使用默认模板或自定义模板
  const template = fileNameTemplate || DEFAULT_FILENAME_TEMPLATE;

  if (successResults.length === 1) {
    // 单张图片直接下载
    const result = successResults[0];
    const link = document.createElement('a');

    // 使用模板生成文件名
    const nameWithoutExt = getFileNameWithoutExtension(result.imageName);
    const generatedName = parseFileNameTemplate(template, nameWithoutExt, 1);

    // 根据dataURL的格式确定扩展名
    const isJpeg = result.dataUrl!.startsWith('data:image/jpeg');
    const extension = isJpeg ? '.jpg' : '.png';

    link.download = `${generatedName}${extension}`;
    link.href = result.dataUrl!;
    link.click();
  } else {
    // 多张图片打包成ZIP下载
    await downloadAsZip(successResults, zipName, template);
  }
}

/**
 * 将多张图片打包成ZIP并下载
 * {{ Shrimp-X: Modify - 支持自定义文件名模板. Approval: Cunzhi(ID:timestamp). }}
 */
async function downloadAsZip(
  results: BatchProcessingResult[],
  zipName?: string,
  fileNameTemplate?: string
): Promise<void> {
  const files: Record<string, Uint8Array> = {};

  // 使用默认模板或自定义模板
  const template = fileNameTemplate || DEFAULT_FILENAME_TEMPLATE;

  // 添加每张图片到ZIP
  let index = 1;
  for (const result of results) {
    if (result.dataUrl) {
      // 将dataURL转换为Uint8Array
      const response = await fetch(result.dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // 使用模板生成文件名
      const nameWithoutExt = getFileNameWithoutExtension(result.imageName);
      const generatedName = parseFileNameTemplate(template, nameWithoutExt, index);

      // 根据dataURL的格式确定扩展名
      const isJpeg = result.dataUrl.startsWith('data:image/jpeg');
      const extension = isJpeg ? '.jpg' : '.png';

      const fileName = `${generatedName}${extension}`;
      files[fileName] = uint8Array;
      index++;
    }
  }

  // 使用fflate创建ZIP
  return new Promise<void>((resolve, reject) => {
    zip(files, (err, data) => {
      if (err) {
        console.error('ZIP creation failed:', err);
        reject(new Error('Failed to create ZIP file'));
        return;
      }

      // 创建下载链接
      const blob = new Blob([new Uint8Array(data)], { type: 'application/zip' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      const finalZipName = zipName || `watermarked-images-${new Date().toISOString().slice(0, 10)}.zip`;
      link.download = finalZipName;
      link.href = url;
      link.click();

      // 清理URL对象
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve();
      }, 1000);
    });
  });
}

/**
 * 创建批量处理器实例
 */
export function createBatchProcessor(): BatchWatermarkProcessor {
  return new BatchWatermarkProcessor();
}
