// 水印相关类型定义

import { WatermarkConfig, ImageInfo } from './index';
import { FabricObject } from 'fabric';

// Fabric.js 相关类型扩展
export interface FabricWatermarkObject {
  id: string;
  type: 'text' | 'image' | 'fullscreen';
  fabricObject: FabricObject;
  config: WatermarkConfig;
}

// Canvas 配置
export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
  selection: boolean;
  preserveObjectStacking: boolean;
}

// 水印渲染选项
export interface WatermarkRenderOptions {
  canvas: fabric.Canvas;
  image: ImageInfo;
  config: WatermarkConfig;
  preview?: boolean;
  quality?: number;
}

// 自适应计算结果
export interface AdaptiveCalculationResult {
  fontSize?: number;
  width?: number;
  height?: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
}

// 平铺计算结果
export interface TileCalculationResult {
  rows: number;
  cols: number;
  spacingX: number;
  spacingY: number;
  offsetX: number;
  offsetY: number;
  totalTiles: number;
}

// 水印处理管道
export interface WatermarkPipeline {
  validate: (config: WatermarkConfig) => boolean;
  calculate: (image: ImageInfo, config: WatermarkConfig) => AdaptiveCalculationResult;
  render: (options: WatermarkRenderOptions) => Promise<string>;
  export: (canvas: fabric.Canvas, format: 'png' | 'jpeg', quality?: number) => string;
}

// 字体配置
export interface FontConfig {
  family: string;
  variants: string[];
  category: 'serif' | 'sans-serif' | 'monospace' | 'cursive' | 'fantasy';
  webFont?: {
    url: string;
    loaded: boolean;
  };
}

// 预设模板
export interface WatermarkTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  config: Partial<WatermarkConfig>;
  tags: string[];
}

// 水印历史记录
export interface WatermarkHistory {
  id: string;
  action: 'create' | 'update' | 'delete' | 'apply';
  config: WatermarkConfig;
  timestamp: Date;
  description: string;
}

// 所有类型已通过 export 关键字导出，无需重复导出
