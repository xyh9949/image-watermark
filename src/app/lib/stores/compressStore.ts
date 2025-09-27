import { create } from 'zustand';
import { CompressedImage, CompressionOptions, CompressionStats } from '@/app/types/compress';
import { CompressionEngine } from '../compress/CompressionEngine';

interface CompressState {
  // 文件和结果
  files: File[];
  results: CompressedImage[];
  
  // 压缩选项
  options: CompressionOptions;
  
  // 处理状态
  isProcessing: boolean;
  progress: number;
  currentFile: string | null;
  
  // 统计信息
  stats: CompressionStats | null;
  
  // 压缩引擎
  engine: CompressionEngine;
  
  // Actions
  setFiles: (files: File[]) => void;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  
  setOptions: (options: Partial<CompressionOptions>) => void;
  
  startCompression: () => Promise<void>;
  startBatchCompression: (parallel?: boolean) => Promise<void>;
  
  clearResults: () => void;
  downloadResult: (result: CompressedImage) => void;
  downloadAllResults: () => Promise<void>;
  
  reset: () => void;
}

const defaultOptions: CompressionOptions = {
  quality: 'standard',
  removeMetadata: true,
  preserveExif: false,
  preserveColorProfile: true
};

export const useCompressStore = create<CompressState>((set, get) => ({
  // Initial state
  files: [],
  results: [],
  options: defaultOptions,
  isProcessing: false,
  progress: 0,
  currentFile: null,
  stats: null,
  engine: new CompressionEngine(),
  
  // File management
  setFiles: (files) => {
    set({ files, results: [], stats: null });
  },
  
  addFiles: (newFiles) => {
    const { files } = get();
    const uniqueFiles = newFiles.filter(
      newFile => !files.some(existingFile => 
        existingFile.name === newFile.name && existingFile.size === newFile.size
      )
    );
    set({ files: [...files, ...uniqueFiles] });
  },
  
  removeFile: (index) => {
    const { files, results } = get();
    const newFiles = files.filter((_, i) => i !== index);
    const newResults = results.filter((_, i) => i !== index);
    set({ files: newFiles, results: newResults });
  },
  
  clearFiles: () => {
    set({ files: [], results: [], stats: null });
  },
  
  // Options management
  setOptions: (newOptions) => {
    const { options } = get();
    set({ options: { ...options, ...newOptions } });
  },
  
  // Compression
  startCompression: async () => {
    const { files, options, engine } = get();
    if (files.length === 0) return;
    
    set({ isProcessing: true, progress: 0, results: [], currentFile: null });
    
    try {
      const results = await engine.compressBatch(
        files,
        options,
        (progress, current) => {
          set({ 
            progress,
            currentFile: current.originalFile.name,
            results: get().results.map(r => 
              r.id === current.id ? current : r
            ).concat(get().results.find(r => r.id === current.id) ? [] : [current])
          });
        }
      );
      
      const stats = engine.calculateStats(results);
      set({ results, stats, isProcessing: false, progress: 100, currentFile: null });
    } catch (error) {
      console.error('批量压缩失败:', error);
      set({ isProcessing: false, progress: 0, currentFile: null });
    }
  },
  
  startBatchCompression: async (parallel = true) => {
    const { files, options, engine } = get();
    if (files.length === 0) return;
    
    set({ isProcessing: true, progress: 0, results: [], currentFile: null });
    
    try {
      const results = parallel 
        ? await engine.compressBatchParallel(
            files,
            options,
            3, // 最大并发数
            (progress, currentResults) => {
              set({ 
                progress,
                results: currentResults,
                currentFile: currentResults[currentResults.length - 1]?.originalFile.name || null
              });
            }
          )
        : await engine.compressBatch(
            files,
            options,
            (progress, current) => {
              set({ 
                progress,
                currentFile: current.originalFile.name,
                results: get().results.map(r => 
                  r.id === current.id ? current : r
                ).concat(get().results.find(r => r.id === current.id) ? [] : [current])
              });
            }
          );
      
      const stats = engine.calculateStats(results);
      set({ results, stats, isProcessing: false, progress: 100, currentFile: null });
    } catch (error) {
      console.error('批量压缩失败:', error);
      set({ isProcessing: false, progress: 0, currentFile: null });
    }
  },
  
  // Results management
  clearResults: () => {
    set({ results: [], stats: null });
  },
  
  downloadResult: (result) => {
    if (!result.compressedFile) return;
    
    const url = URL.createObjectURL(result.compressedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.compressedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  
  downloadAllResults: async () => {
    const { results } = get();
    const completedResults = results.filter(r => r.status === 'completed' && r.compressedFile);
    
    if (completedResults.length === 0) return;
    
    // 如果只有一个文件，直接下载
    if (completedResults.length === 1) {
      get().downloadResult(completedResults[0]);
      return;
    }
    
    // 多个文件打包下载
    try {
      const { deflate } = await import('pako');
      const zip: Record<string, Uint8Array> = {};
      
      for (const result of completedResults) {
        if (result.compressedFile) {
          const buffer = await result.compressedFile.arrayBuffer();
          zip[result.compressedFile.name] = new Uint8Array(buffer);
        }
      }
      
      // 简单的 ZIP 实现（实际项目中建议使用专门的 ZIP 库）
      const zipBuffer = deflate(JSON.stringify(zip));
      const blob = new Blob([zipBuffer], { type: 'application/zip' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compressed_images_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('打包下载失败:', error);
      // 降级方案：逐个下载
      for (const result of completedResults) {
        get().downloadResult(result);
        await new Promise(resolve => setTimeout(resolve, 100)); // 避免浏览器阻止多个下载
      }
    }
  },
  
  reset: () => {
    set({
      files: [],
      results: [],
      options: defaultOptions,
      isProcessing: false,
      progress: 0,
      currentFile: null,
      stats: null
    });
  }
}));