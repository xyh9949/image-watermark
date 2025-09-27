export interface CompressedImage {
  id: string;
  originalFile: File;
  compressedFile: File | null;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  processingTime?: number;
}

export interface CompressionOptions {
  quality: 'light' | 'standard' | 'deep';
  removeMetadata: boolean;
  preserveExif: boolean;
  preserveColorProfile: boolean;
}

export interface CompressionStats {
  totalFiles: number;
  processedFiles: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSavedSize: number;
  averageCompressionRatio: number;
  processingTime: number;
}

export interface OptimizationInfo {
  canOptimize: boolean;
  estimatedSaving: number;
  recommendedSettings: Partial<CompressionOptions>;
  warnings: string[];
}

export abstract class CompressionStrategy {
  abstract format: string;
  abstract supportedMimeTypes: string[];
  
  abstract compress(
    file: File, 
    options: CompressionOptions
  ): Promise<File>;
  
  abstract getOptimizationInfo(file: File): Promise<OptimizationInfo>;
  
  protected async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
  
  protected createOptimizedFile(
    buffer: ArrayBuffer, 
    originalFile: File, 
    suffix: string = '_compressed'
  ): File {
    const name = originalFile.name.replace(/(\.[^.]+)$/, `${suffix}$1`);
    return new File([buffer], name, { type: originalFile.type });
  }
}