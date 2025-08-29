// 核心类型定义文件

// 水印类型枚举
export type WatermarkType = 'text' | 'image' | 'fullscreen';

// 缩放模式
export type ScaleMode = 'percentage' | 'fixed' | 'adaptive';

// 位置模式
export type PositionMode = 'pixel' | 'proportion';

// 水印位置（九宫格）
export type WatermarkPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'custom';

// 混合模式
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light';

// 文字水印样式
export interface TextWatermarkStyle {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  color: string;
  opacity: number;
  rotation: number;
  stroke?: {
    color: string;
    width: number; // 基线像素宽度（用于推导比例或作为兜底）
    widthRatio?: number; // 相对字号比例（0.0 - 0.2 推荐），优先用于计算描边宽度
  };
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

// 图片水印样式
export interface ImageWatermarkStyle {
  imageUrl: string;
  width: number;
  height: number;
  scale: number; // {{ Shrimp-X: Add - 添加缩放比例字段，用于比例控制. Approval: Cunzhi(ID:timestamp). }}
  opacity: number;
  rotation: number;
  blendMode: BlendMode;
  maintainAspectRatio: boolean;
}

// 全屏水印样式
export interface FullscreenWatermarkStyle {
  // 水印模式：文字或图片
  mode: 'text' | 'image';

  // 文字水印属性
  content: string;
  fontFamily: string;
  fontSize: number;
  color: string;

  // 图片水印属性
  imageUrl?: string;
  imageScale?: number; // 图片缩放比例 (0.01 - 3.0)
  imageOriginalWidth?: number; // 原始图片宽度
  imageOriginalHeight?: number; // 原始图片高度

  // 通用属性
  opacity: number;
  rotation: number;
  tileSpacing: number;
  tileDensity: number;
  diagonalMode: boolean;
}

// 自适应配置
export interface AdaptiveConfig {
  enableAutoScale: boolean;
  minSize: number;
  maxSize: number;
  scaleRatio: number;
  marginRatio: number;
  // 缩放基准：基于宽度、高度或短边，支持智能自动选择
  baseOn?: 'width' | 'height' | 'shorter-edge';
  baseWidth?: number;
  baseHeight?: number;
}

// 比例配置数据
export interface ProportionData {
  scaleXPercent: number;
  scaleYPercent: number;
  offsetXPercent: number;
  offsetYPercent: number;
}

// 位置配置
export interface PositionConfig {
  mode?: PositionMode; // 位置模式，默认为 'pixel'
  position: WatermarkPosition;
  x: number;
  y: number;
  marginX: number;
  marginY: number;
  marginPercent: number;
  offsetX?: number; // 九宫格位置的X轴偏移量
  offsetY?: number; // 九宫格位置的Y轴偏移量
  proportions?: ProportionData; // 比例模式数据
}

// 水印配置主接口
export interface WatermarkConfig {
  id: string;
  type: WatermarkType;
  scaleMode: ScaleMode;
  position: PositionConfig;
  adaptive: AdaptiveConfig;
  textStyle?: TextWatermarkStyle;
  imageStyle?: ImageWatermarkStyle;
  fullscreenStyle?: FullscreenWatermarkStyle;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 图片信息
export interface ImageInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  url: string;
  thumbnailUrl?: string;
  uploadProgress: number;
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error';
  error?: string;
}

// 处理状态
export interface ProcessingStatus {
  imageId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  outputUrl?: string;
}

// 批量处理任务
export interface BatchTask {
  id: string;
  name: string;
  images: ImageInfo[];
  watermarkConfig: WatermarkConfig;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
}

// 预设配置
export interface PresetConfig {
  id: string;
  name: string;
  description?: string;
  category: 'text' | 'image' | 'fullscreen' | 'custom';
  watermarkConfig: WatermarkConfig;
  thumbnail?: string;
  isDefault: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// UI状态
export interface UIState {
  isLoading: boolean;
  error: string | null;
  activeTab: 'upload' | 'edit' | 'preview' | 'download';
  sidebarCollapsed: boolean;
  previewMode: 'single' | 'multiple' | 'comparison';
  selectedImageId: string | null;
}

// API响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 文件上传响应
export interface UploadResponse {
  imageInfo: ImageInfo;
  uploadUrl: string;
}

// 处理响应
export interface ProcessResponse {
  taskId: string;
  status: ProcessingStatus;
}

// 下载响应
export interface DownloadResponse {
  downloadUrl: string;
  filename: string;
  expiresAt: Date;
}

// 预览配置
export interface PreviewConfig {
  sampleSizes: Array<{
    name: string;
    width: number;
    height: number;
  }>;
  previewSize: number;
  showUserImages: boolean;
  maxUserImages: number;
}

// 所有类型已通过 export 关键字导出，无需重复导出
