import { CompressionStrategy, CompressionOptions, OptimizationInfo } from '@/app/types/compress';

export class PNGOptimizer extends CompressionStrategy {
  format = 'PNG';
  supportedMimeTypes = ['image/png'];

  async compress(file: File, options: CompressionOptions): Promise<File> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建 Canvas 上下文');

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          
          // 绘制图像到 canvas
          ctx.drawImage(img, 0, 0);
          
          // 获取图像数据进行分析
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const optimizedImageData = await this.optimizePNGData(imageData, options);
          
          // 将优化后的数据绘制回 canvas
          ctx.putImageData(optimizedImageData, 0, 0);
          
          // 使用最高质量设置导出 PNG
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('PNG 压缩失败'));
                return;
              }
              
              const compressedFile = new File([blob], file.name, {
                type: 'image/png',
                lastModified: file.lastModified
              });
              
              resolve(compressedFile);
            },
            'image/png'
          );
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = URL.createObjectURL(file);
    });
  }

  private async optimizePNGData(
    imageData: ImageData, 
    options: CompressionOptions
  ): Promise<ImageData> {
    const { data, width, height } = imageData;
    const optimizedData = new Uint8ClampedArray(data);
    
    // PNG 优化策略
    switch (options.quality) {
      case 'light':
        // 轻度优化：仅移除完全透明的像素
        this.removeTransparentPixels(optimizedData);
        break;
        
      case 'standard':
        // 标准优化：透明度优化 + 相似颜色合并
        this.removeTransparentPixels(optimizedData);
        this.mergeSimilarColors(optimizedData, 2);
        break;
        
      case 'deep':
        // 深度优化：全面优化
        this.removeTransparentPixels(optimizedData);
        this.mergeSimilarColors(optimizedData, 5);
        this.optimizePalette(optimizedData);
        break;
    }
    
    return new ImageData(optimizedData, width, height);
  }

  private removeTransparentPixels(data: Uint8ClampedArray): void {
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) {
        // 完全透明的像素，将 RGB 设为 0 以提高压缩率
        data[i - 3] = 0; // R
        data[i - 2] = 0; // G
        data[i - 1] = 0; // B
      }
    }
  }

  private mergeSimilarColors(data: Uint8ClampedArray, threshold: number): void {
    const colorMap = new Map<string, number[]>();
    
    // 第一遍：收集颜色信息
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      if (a === 0) continue; // 跳过透明像素
      
      const key = `${Math.floor(r / threshold) * threshold},${Math.floor(g / threshold) * threshold},${Math.floor(b / threshold) * threshold}`;
      
      if (!colorMap.has(key)) {
        colorMap.set(key, [r, g, b, 1]);
      } else {
        const color = colorMap.get(key)!;
        color[0] = (color[0] * color[3] + r) / (color[3] + 1);
        color[1] = (color[1] * color[3] + g) / (color[3] + 1);
        color[2] = (color[2] * color[3] + b) / (color[3] + 1);
        color[3]++;
      }
    }
    
    // 第二遍：应用优化后的颜色
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      if (a === 0) continue;
      
      const key = `${Math.floor(r / threshold) * threshold},${Math.floor(g / threshold) * threshold},${Math.floor(b / threshold) * threshold}`;
      const optimizedColor = colorMap.get(key);
      
      if (optimizedColor) {
        data[i] = Math.round(optimizedColor[0]);
        data[i + 1] = Math.round(optimizedColor[1]);
        data[i + 2] = Math.round(optimizedColor[2]);
      }
    }
  }

  private optimizePalette(data: Uint8ClampedArray): void {
    // 简单的调色板优化：统计颜色使用频率
    const colorFreq = new Map<string, number>();
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      if (a === 0) continue;
      
      const key = `${r},${g},${b}`;
      colorFreq.set(key, (colorFreq.get(key) || 0) + 1);
    }
    
    // 如果颜色数量少于 256，可以考虑索引色优化
    if (colorFreq.size <= 256) {
      // 这里可以实现更复杂的调色板优化逻辑
      console.log(`PNG 包含 ${colorFreq.size} 种颜色，适合调色板优化`);
    }
  }

  async getOptimizationInfo(file: File): Promise<OptimizationInfo> {
    const buffer = await this.readFileAsArrayBuffer(file);
    const view = new DataView(buffer);
    
    // 检查 PNG 签名
    if (view.getUint32(0, false) !== 0x89504E47) {
      return {
        canOptimize: false,
        estimatedSaving: 0,
        recommendedSettings: {},
        warnings: ['文件不是有效的 PNG 格式']
      };
    }
    
    let hasTransparency = false;
    let colorType = 0;
    let bitDepth = 0;
    let estimatedMetadataSize = 0;
    
    // 解析 PNG 块
    let offset = 8; // 跳过 PNG 签名
    
    while (offset < buffer.byteLength) {
      const chunkLength = view.getUint32(offset, false);
      const chunkType = String.fromCharCode(
        view.getUint8(offset + 4),
        view.getUint8(offset + 5),
        view.getUint8(offset + 6),
        view.getUint8(offset + 7)
      );
      
      if (chunkType === 'IHDR') {
        colorType = view.getUint8(offset + 17);
        bitDepth = view.getUint8(offset + 16);
      } else if (chunkType === 'tRNS') {
        hasTransparency = true;
      } else if (['tEXt', 'zTXt', 'iTXt', 'tIME', 'pHYs'].includes(chunkType)) {
        estimatedMetadataSize += chunkLength + 12; // 包括块头
      }
      
      if (chunkType === 'IEND') break;
      
      offset += chunkLength + 12; // 数据长度 + 类型(4) + CRC(4) + 长度(4)
    }
    
    // 估算压缩潜力
    let estimatedSaving = estimatedMetadataSize / file.size;
    
    // 根据颜色类型和位深度调整估算
    if (colorType === 2 && bitDepth === 8) { // RGB
      estimatedSaving += 0.1; // RGB 图像通常有 10% 的优化空间
    } else if (colorType === 6) { // RGBA
      estimatedSaving += hasTransparency ? 0.15 : 0.2;
    }
    
    return {
      canOptimize: true,
      estimatedSaving: Math.min(estimatedSaving, 0.3),
      recommendedSettings: {
        removeMetadata: estimatedMetadataSize > 512,
        quality: colorType === 3 ? 'deep' : 'standard' // 索引色图像适合深度优化
      },
      warnings: bitDepth > 8 ? ['高位深度图像可能优化效果有限'] : []
    };
  }
}