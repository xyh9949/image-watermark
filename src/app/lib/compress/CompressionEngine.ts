import { CompressionStrategy, CompressionOptions, CompressedImage, OptimizationInfo } from '@/app/types/compress';
import { JPEGOptimizer } from './strategies/JPEGOptimizer';
import { PNGOptimizer } from './strategies/PNGOptimizer';
import { WebPOptimizer } from './strategies/WebPOptimizer';

export class CompressionEngine {
  private strategies: Map<string, CompressionStrategy> = new Map();

  constructor() {
    this.registerStrategy(new JPEGOptimizer());
    this.registerStrategy(new PNGOptimizer());
    this.registerStrategy(new WebPOptimizer());
  }

  private registerStrategy(strategy: CompressionStrategy): void {
    strategy.supportedMimeTypes.forEach(mimeType => {
      this.strategies.set(mimeType, strategy);
    });
  }

  public getSupportedFormats(): string[] {
    return Array.from(this.strategies.keys());
  }

  public isSupported(file: File): boolean {
    return this.strategies.has(file.type);
  }

  public async getOptimizationInfo(file: File): Promise<OptimizationInfo> {
    const strategy = this.strategies.get(file.type);
    if (!strategy) {
      return {
        canOptimize: false,
        estimatedSaving: 0,
        recommendedSettings: {},
        warnings: [`不支持的文件格式: ${file.type}`]
      };
    }

    return strategy.getOptimizationInfo(file);
  }

  public async compressFile(
    file: File, 
    options: CompressionOptions,
    onProgress?: (progress: number) => void
  ): Promise<CompressedImage> {
    const startTime = Date.now();
    const compressedImage: CompressedImage = {
      id: `${file.name}_${Date.now()}`,
      originalFile: file,
      compressedFile: null,
      originalSize: file.size,
      compressedSize: 0,
      compressionRatio: 0,
      format: this.getFileFormat(file),
      status: 'processing'
    };

    try {
      onProgress?.(0);

      const strategy = this.strategies.get(file.type);
      if (!strategy) {
        throw new Error(`不支持的文件格式: ${file.type}`);
      }

      onProgress?.(30);

      const compressedFile = await strategy.compress(file, options);
      
      onProgress?.(80);

      compressedImage.compressedFile = compressedFile;
      compressedImage.compressedSize = compressedFile.size;
      compressedImage.compressionRatio = 1 - (compressedFile.size / file.size);
      compressedImage.status = 'completed';
      compressedImage.processingTime = Date.now() - startTime;

      onProgress?.(100);

      return compressedImage;
    } catch (error) {
      compressedImage.status = 'error';
      compressedImage.error = error instanceof Error ? error.message : '压缩失败';
      compressedImage.processingTime = Date.now() - startTime;
      
      return compressedImage;
    }
  }

  public async compressBatch(
    files: File[],
    options: CompressionOptions,
    onProgress?: (overall: number, current: CompressedImage) => void
  ): Promise<CompressedImage[]> {
    const results: CompressedImage[] = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      const result = await this.compressFile(file, options, (fileProgress) => {
        const overallProgress = ((i + fileProgress / 100) / total) * 100;
        onProgress?.(overallProgress, result);
      });

      results.push(result);
      
      // 更新整体进度
      const overallProgress = ((i + 1) / total) * 100;
      onProgress?.(overallProgress, result);
    }

    return results;
  }

  public async compressBatchParallel(
    files: File[],
    options: CompressionOptions,
    maxConcurrency: number = 3,
    onProgress?: (overall: number, results: CompressedImage[]) => void
  ): Promise<CompressedImage[]> {
    const results: CompressedImage[] = new Array(files.length);
    let completed = 0;

    const processFile = async (file: File, index: number): Promise<void> => {
      const result = await this.compressFile(file, options);
      results[index] = result;
      completed++;
      
      const overallProgress = (completed / files.length) * 100;
      onProgress?.(overallProgress, results.filter(r => r));
    };

    // 分批并行处理
    const batches: Promise<void>[][] = [];
    for (let i = 0; i < files.length; i += maxConcurrency) {
      const batch = files.slice(i, i + maxConcurrency).map((file, batchIndex) => 
        processFile(file, i + batchIndex)
      );
      batches.push(batch);
    }

    // 逐批执行
    for (const batch of batches) {
      await Promise.all(batch);
    }

    return results;
  }

  private getFileFormat(file: File): string {
    const mimeTypeMap: Record<string, string> = {
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPEG',
      'image/png': 'PNG',
      'image/webp': 'WebP',
      'image/gif': 'GIF',
      'image/bmp': 'BMP',
      'image/tiff': 'TIFF'
    };

    return mimeTypeMap[file.type] || file.type.split('/')[1]?.toUpperCase() || 'Unknown';
  }

  public calculateStats(results: CompressedImage[]) {
    const completed = results.filter(r => r.status === 'completed');
    
    const totalOriginalSize = completed.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressedSize = completed.reduce((sum, r) => sum + r.compressedSize, 0);
    const totalSavedSize = totalOriginalSize - totalCompressedSize;
    const averageCompressionRatio = completed.length > 0 
      ? completed.reduce((sum, r) => sum + r.compressionRatio, 0) / completed.length 
      : 0;
    const totalProcessingTime = completed.reduce((sum, r) => sum + (r.processingTime || 0), 0);

    return {
      totalFiles: results.length,
      processedFiles: completed.length,
      totalOriginalSize,
      totalCompressedSize,
      totalSavedSize,
      averageCompressionRatio,
      processingTime: totalProcessingTime
    };
  }
}