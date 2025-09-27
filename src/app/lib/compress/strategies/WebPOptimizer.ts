import { CompressionStrategy, CompressionOptions, OptimizationInfo } from '@/app/types/compress';

export class WebPOptimizer extends CompressionStrategy {
  format = 'WebP';
  supportedMimeTypes = ['image/webp'];

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
          
          // WebP 无损压缩质量设置
          let quality = 1.0; // WebP 无损模式
          
          // 根据压缩级别调整参数
          switch (options.quality) {
            case 'light':
              quality = 1.0; // 完全无损
              break;
            case 'standard':
              quality = 0.98; // 近无损
              break;
            case 'deep':
              quality = 0.95; // 高质量有损（但视觉无损）
              break;
          }
          
          // 使用 toBlob 进行 WebP 重编码
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('WebP 压缩失败'));
                return;
              }
              
              const compressedFile = new File([blob], file.name, {
                type: 'image/webp',
                lastModified: file.lastModified
              });
              
              resolve(compressedFile);
            },
            'image/webp',
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
    const buffer = await this.readFileAsArrayBuffer(file);
    const view = new DataView(buffer);
    
    // 检查 WebP 签名
    if (view.getUint32(0, false) !== 0x52494646 || // "RIFF"
        view.getUint32(8, false) !== 0x57454250) {  // "WEBP"
      return {
        canOptimize: false,
        estimatedSaving: 0,
        recommendedSettings: {},
        warnings: ['文件不是有效的 WebP 格式']
      };
    }
    
    let isLossless = false;
    let hasAlpha = false;
    let hasMetadata = false;
    
    // 解析 WebP 块结构
    let offset = 12; // 跳过 RIFF 头
    
    while (offset < buffer.byteLength) {
      if (offset + 8 > buffer.byteLength) break;
      
      const chunkId = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );
      
      const chunkSize = view.getUint32(offset + 4, true);
      
      if (chunkId === 'VP8L') {
        isLossless = true;
      } else if (chunkId === 'VP8 ') {
        isLossless = false;
      } else if (chunkId === 'ALPH') {
        hasAlpha = true;
      } else if (['EXIF', 'XMP ', 'ICCP'].includes(chunkId)) {
        hasMetadata = true;
      }
      
      offset += 8 + chunkSize + (chunkSize % 2); // 对齐到偶数字节
    }
    
    // 估算优化潜力
    let estimatedSaving = 0.05; // WebP 基础优化空间
    
    if (hasMetadata) {
      estimatedSaving += 0.02; // 元数据移除
    }
    
    if (!isLossless) {
      estimatedSaving += 0.1; // 有损转无损的潜在优化
    }
    
    return {
      canOptimize: true,
      estimatedSaving: Math.min(estimatedSaving, 0.2),
      recommendedSettings: {
        removeMetadata: hasMetadata,
        quality: isLossless ? 'light' : 'standard'
      },
      warnings: isLossless ? [] : ['当前为有损 WebP，重编码可能略微降低质量']
    };
  }
}