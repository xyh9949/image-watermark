import { CompressionStrategy, CompressionOptions, OptimizationInfo } from '@/app/types/compress';

export class JPEGOptimizer extends CompressionStrategy {
  format = 'JPEG';
  supportedMimeTypes = ['image/jpeg', 'image/jpg'];

  async compress(file: File, options: CompressionOptions): Promise<File> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建 Canvas 上下文');

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          
          // 绘制图像到 canvas
          ctx.drawImage(img, 0, 0);
          
          // 根据压缩质量设置参数
          let quality = 0.95; // 默认高质量
          switch (options.quality) {
            case 'light':
              quality = 0.98;
              break;
            case 'standard':
              quality = 0.95;
              break;
            case 'deep':
              quality = 0.92;
              break;
          }
          
          // 使用 toBlob 进行无损重编码
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('JPEG 压缩失败'));
                return;
              }
              
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: file.lastModified
              });
              
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = URL.createObjectURL(file);
    });
  }

  async getOptimizationInfo(file: File): Promise<OptimizationInfo> {
    // 分析 JPEG 文件结构
    const buffer = await this.readFileAsArrayBuffer(file);
    const view = new DataView(buffer);
    
    let hasExif = false;
    let hasICC = false;
    let estimatedMetadataSize = 0;
    
    // 简单的 JPEG 段分析
    let offset = 2; // 跳过 SOI (0xFFD8)
    
    while (offset < buffer.byteLength - 1) {
      if (view.getUint8(offset) !== 0xFF) break;
      
      const marker = view.getUint8(offset + 1);
      if (marker === 0xD9) break; // EOI
      
      const segmentLength = view.getUint16(offset + 2, false);
      
      // 检查各种元数据段
      if (marker === 0xE1) { // EXIF
        hasExif = true;
        estimatedMetadataSize += segmentLength;
      } else if (marker === 0xE2) { // ICC Profile
        hasICC = true;
        estimatedMetadataSize += segmentLength;
      } else if (marker >= 0xE0 && marker <= 0xEF) {
        estimatedMetadataSize += segmentLength;
      }
      
      offset += 2 + segmentLength;
    }
    
    const estimatedSaving = Math.min(estimatedMetadataSize + file.size * 0.05, file.size * 0.15);
    
    return {
      canOptimize: true,
      estimatedSaving: estimatedSaving / file.size,
      recommendedSettings: {
        removeMetadata: estimatedMetadataSize > 1024,
        preserveExif: hasExif,
        preserveColorProfile: hasICC
      },
      warnings: []
    };
  }
}