// 预设相关类型定义

import { WatermarkConfig } from './index';

// 预设分类
export type PresetCategory = 'text' | 'image' | 'fullscreen' | 'custom' | 'recent' | 'favorite';

// 预设排序方式
export type PresetSortBy = 'name' | 'created' | 'updated' | 'usage' | 'category';

// 预设过滤条件
export interface PresetFilter {
  category?: PresetCategory;
  search?: string;
  tags?: string[];
  isDefault?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// 预设统计信息
export interface PresetStats {
  totalCount: number;
  categoryCount: Record<PresetCategory, number>;
  mostUsed: string[];
  recentlyCreated: string[];
  recentlyUsed: string[];
}

// 预设导入导出格式
export interface PresetExportData {
  version: string;
  exportDate: Date;
  presets: PresetConfig[];
  metadata: {
    totalCount: number;
    categories: PresetCategory[];
    source: string;
  };
}

// 预设导入结果
export interface PresetImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: Array<{
    preset: string;
    error: string;
  }>;
  duplicates: string[];
}

// 预设验证结果
export interface PresetValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 预设配置扩展
export interface PresetConfig {
  id: string;
  name: string;
  description?: string;
  category: PresetCategory;
  watermarkConfig: WatermarkConfig;
  thumbnail?: string;
  isDefault: boolean;
  isFavorite: boolean;
  usageCount: number;
  tags: string[];
  metadata: {
    author?: string;
    version?: string;
    compatibility?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

// 预设操作类型
export type PresetAction = 
  | 'create'
  | 'update' 
  | 'delete'
  | 'duplicate'
  | 'favorite'
  | 'unfavorite'
  | 'export'
  | 'import'
  | 'apply';

// 预设操作历史
export interface PresetActionHistory {
  id: string;
  action: PresetAction;
  presetId: string;
  presetName: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

// 预设管理器配置
export interface PresetManagerConfig {
  maxPresets: number;
  autoBackup: boolean;
  backupInterval: number; // 分钟
  enableHistory: boolean;
  maxHistoryEntries: number;
  defaultCategory: PresetCategory;
  allowDuplicateNames: boolean;
}

// 预设搜索结果
export interface PresetSearchResult {
  presets: PresetConfig[];
  totalCount: number;
  hasMore: boolean;
  searchTime: number;
  suggestions?: string[];
}

// 预设缩略图配置
export interface PresetThumbnailConfig {
  width: number;
  height: number;
  quality: number;
  format: 'png' | 'jpeg' | 'webp';
  background: string;
}


