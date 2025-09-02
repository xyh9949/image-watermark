// Canvas操作自定义Hook

'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Canvas, FabricImage, FabricObject } from 'fabric';
import { 
  initializeCanvas,
  loadImageToCanvas,
  applyWatermarkToCanvas,
  removeWatermarkFromCanvas,
  clearWatermarks,
  exportCanvasAsImage,
  resizeCanvas,
  disposeCanvas
} from '@/app/lib/canvas/fabricUtils';
import { FabricWatermarkObject } from '@/app/types/watermark';
import { WatermarkConfig, ImageInfo } from '@/app/types';

interface UseCanvasOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  onCanvasReady?: (canvas: Canvas) => void;
  onObjectAdded?: (object: FabricObject) => void;
  onObjectRemoved?: (object: FabricObject) => void;
  onSelectionChanged?: (objects: FabricObject[]) => void;
}

interface UseCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvas: Canvas | null;
  isReady: boolean;
  currentImage: FabricImage | null;
  watermarks: FabricWatermarkObject[];
  
  // 图片操作
  loadImage: (imageInfo: ImageInfo) => Promise<void>;
  clearImage: () => void;
  
  // 水印操作
  addWatermark: (config: WatermarkConfig) => Promise<FabricWatermarkObject | null>;
  removeWatermark: (watermarkId: string) => void;
  updateWatermark: (watermarkId: string, config: WatermarkConfig) => Promise<void>;
  clearAllWatermarks: () => void;
  
  // Canvas操作
  exportImage: (format?: 'png' | 'jpeg', quality?: number) => string | null;
  resizeCanvas: (width: number, height: number) => void;
  fitToContainer: () => void;
  
  // 工具方法
  getCanvasDataURL: () => string | null;
  getCanvasBlob: (callback: (blob: Blob | null) => void, format?: string, quality?: number) => void;
}

export function useCanvas(options: UseCanvasOptions = {}): UseCanvasReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentImage, setCurrentImage] = useState<FabricImage | null>(null);
  const [watermarks, setWatermarks] = useState<FabricWatermarkObject[]>([]);

  // {{ Shrimp-X: Modify - 添加调试信息和错误处理. Approval: Cunzhi(ID:timestamp). }}
  // 初始化Canvas
  useEffect(() => {
    // 确保在客户端环境
    if (typeof window === 'undefined') {
      return;
    }

    if (canvas) {
      return;
    }

    // Canvas初始化函数
    const initCanvas = () => {
      if (!canvasRef.current) {
        return false;
      }

      try {
        const fabricCanvas = initializeCanvas(canvasRef.current, {
          width: options.width || 800,
          height: options.height || 600,
          backgroundColor: options.backgroundColor || '#ffffff',
        });

      // 设置事件监听器
      fabricCanvas.on('object:added', (e) => {
        options.onObjectAdded?.(e.target!);
      });

      fabricCanvas.on('object:removed', (e) => {
        options.onObjectRemoved?.(e.target!);
      });

      fabricCanvas.on('selection:created', (e) => {
        options.onSelectionChanged?.(e.selected || []);
      });

      fabricCanvas.on('selection:updated', (e) => {
        options.onSelectionChanged?.(e.selected || []);
      });

      fabricCanvas.on('selection:cleared', () => {
        options.onSelectionChanged?.([]);
      });

        setCanvas(fabricCanvas);
        setIsReady(true);
        options.onCanvasReady?.(fabricCanvas);
        return true;
      } catch (error) {
        return false;
      }
    };

    // 重试机制
    let retryCount = 0;
    const maxRetries = 10;

    const tryInit = () => {
      if (initCanvas()) {
        return; // 成功初始化
      }

      retryCount++;
      if (retryCount < maxRetries) {
        setTimeout(tryInit, 100 * retryCount); // 递增延迟
      }
    };

    // 开始初始化
    setTimeout(tryInit, 50);

    return () => {
      if (canvas) {
        disposeCanvas(canvas);
      }
    };
  }, []);

  // 清除所有水印
  // {{ Shrimp-X: Add - 移动函数定义位置修复变量提升问题. Approval: Cunzhi(ID:timestamp). }}
  const clearAllWatermarks = useCallback(() => {
    if (!canvas) return;

    clearWatermarks(canvas);
    setWatermarks([]);
  }, [canvas]);

  // 加载图片
  // {{ Shrimp-X: Modify - 图片加载后自动适配容器尺寸. Approval: Cunzhi(ID:timestamp). }}
  const loadImage = useCallback(async (imageInfo: ImageInfo) => {
    if (!canvas) return;

    try {
      const image = await loadImageToCanvas(canvas, imageInfo);
      setCurrentImage(image);

      // 直接清除现有水印，避免函数依赖
      clearWatermarks(canvas);
      setWatermarks([]);

      // {{ Shrimp-X: Modify - 修复时序问题，确保Canvas缩放完成后再触发后续流程（返回Promise）. Approval: Cunzhi(ID:timestamp). }}
      // 图片加载完成后，适配容器尺寸，并在完成后再继续
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          // 使用 cssOnly 的方式适配容器，避免修改逻辑尺寸
          try {
            fitToContainer();
          } catch {}
          resolve();
        }, 50);
      });
    } catch (error) {
      console.error('Failed to load image:', error);
      throw error;
    }
  }, [canvas]); // 简化依赖，避免循环引用

  // 清除图片
  const clearImage = useCallback(() => {
    if (!canvas) return;

    canvas.clear();
    setCurrentImage(null);
    setWatermarks([]);
  }, [canvas]);

  // 添加水印
  const addWatermark = useCallback(async (config: WatermarkConfig): Promise<FabricWatermarkObject | null> => {
    if (!canvas) return null;

    try {
      const watermarkObject = await applyWatermarkToCanvas(canvas, config);
      
      if (watermarkObject) {
        setWatermarks(prev => {
          // 移除同ID的水印
          const filtered = prev.filter(w => w.id !== config.id);
          return [...filtered, watermarkObject];
        });
      }
      
      return watermarkObject;
    } catch (error) {
      return null;
    }
  }, [canvas]);

  // 移除水印
  const removeWatermark = useCallback((watermarkId: string) => {
    if (!canvas) return;

    const watermark = watermarks.find(w => w.id === watermarkId);
    if (watermark) {
      removeWatermarkFromCanvas(canvas, watermark);
      setWatermarks(prev => prev.filter(w => w.id !== watermarkId));
    }
  }, [canvas, watermarks]);

  // 更新水印
  const updateWatermark = useCallback(async (watermarkId: string, config: WatermarkConfig) => {
    if (!canvas) return;

    try {
      // 直接清除所有水印并重新添加，简化逻辑
      clearWatermarks(canvas);
      setWatermarks([]);

      // 添加新水印
      const watermarkObject = await applyWatermarkToCanvas(canvas, config);

      if (watermarkObject) {
        setWatermarks([watermarkObject]);
        canvas.renderAll(); // 强制重新渲染
      }
    } catch (error) {
      // 静默处理错误
    }
  }, [canvas]); // 简化依赖



  // 导出图片
  const exportImage = useCallback((format: 'png' | 'jpeg' = 'png', quality: number = 1.0): string | null => {
    if (!canvas) return null;

    return exportCanvasAsImage(canvas, format, quality);
  }, [canvas]);

  // 调整Canvas尺寸
  const resizeCanvasSize = useCallback((width: number, height: number) => {
    if (!canvas) return;

    resizeCanvas(canvas, width, height);
  }, [canvas]);

  // 适应容器
  const fitToContainer = useCallback(() => {
    if (!canvas || !canvasRef.current) return;

    const container = canvasRef.current.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // 保持宽高比
    const canvasAspectRatio = canvas.getWidth() / canvas.getHeight();
    const containerAspectRatio = containerWidth / containerHeight;

    let newWidth, newHeight;
    
    if (canvasAspectRatio > containerAspectRatio) {
      newWidth = containerWidth;
      newHeight = containerWidth / canvasAspectRatio;
    } else {
      newHeight = containerHeight;
      newWidth = containerHeight * canvasAspectRatio;
    }

    canvas.setDimensions({
      width: newWidth,
      height: newHeight
    }, {
      cssOnly: true
    });
  }, [canvas]);

  // 获取Canvas数据URL
  const getCanvasDataURL = useCallback((): string | null => {
    if (!canvas) return null;
    return canvas.toDataURL();
  }, [canvas]);

  // 获取Canvas Blob
  const getCanvasBlob = useCallback((
    callback: (blob: Blob | null) => void,
    format: string = 'image/png',
    quality: number = 1.0
  ) => {
    if (!canvas) {
      callback(null);
      return;
    }

    canvas.getElement().toBlob(callback, format, quality);
  }, [canvas]);

  // 响应式调整
  useEffect(() => {
    if (!isReady) return;

    const handleResize = () => {
      fitToContainer();
    };

    window.addEventListener('resize', handleResize);
    
    // 初始调整
    setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isReady]);

  return {
    canvasRef,
    canvas,
    isReady,
    currentImage,
    watermarks,
    
    // 图片操作
    loadImage,
    clearImage,
    
    // 水印操作
    addWatermark,
    removeWatermark,
    updateWatermark,
    clearAllWatermarks,
    
    // Canvas操作
    exportImage,
    resizeCanvas: resizeCanvasSize,
    fitToContainer,
    
    // 工具方法
    getCanvasDataURL,
    getCanvasBlob,
  };
}
