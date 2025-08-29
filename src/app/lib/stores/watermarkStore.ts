// 水印配置状态管理

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  WatermarkConfig,
  WatermarkType,
  ScaleMode,
  WatermarkPosition,
  TextWatermarkStyle,
  ImageWatermarkStyle,
  FullscreenWatermarkStyle,
  AdaptiveConfig,
  PositionConfig,
  PositionMode,
  ProportionData
} from '../../types';
import {
  calculateProportions,
  convertPixelToProportion,
  createDefaultProportions
} from '../canvas/proportionUtils';

// 默认文字水印样式
const defaultTextStyle: TextWatermarkStyle = {
  content: '水印文字',
  fontFamily: 'Arial',
  fontSize: 24,
  fontWeight: 'normal',
  color: '#000000',
  opacity: 0.5,
  rotation: 0,
  stroke: { color: '#ffffff', width: 2, widthRatio: 0.06 },
};

// 默认图片水印样式
const defaultImageStyle: ImageWatermarkStyle = {
  imageUrl: '',
  width: 100,
  height: 100,
  scale: 1.0, // {{ Shrimp-X: Add - 添加默认缩放比例. Approval: Cunzhi(ID:timestamp). }}
  opacity: 0.8,
  rotation: 0,
  blendMode: 'normal',
  maintainAspectRatio: true,
};

// 默认全屏水印样式
const defaultFullscreenStyle: FullscreenWatermarkStyle = {
  mode: 'text',
  content: '水印',
  fontFamily: 'Arial',
  fontSize: 48,
  color: '#000000',
  imageUrl: '',
  imageScale: 1.0, // 默认原始尺寸
  imageOriginalWidth: 100,
  imageOriginalHeight: 100,
  opacity: 0.1,
  rotation: -45,
  tileSpacing: 200,
  tileDensity: 0.5,
  diagonalMode: true,
};

// 默认自适应配置
const defaultAdaptiveConfig: AdaptiveConfig = {
  enableAutoScale: true,
  minSize: 12,
  maxSize: 200,
  scaleRatio: 0.05,
  marginRatio: 0.03,
  // Shrimp‑X: Modify - 默认基于宽度进行缩放，统一边距比例。Approval: Cunzhi(ID:timestamp).
  baseOn: 'width',
};

// 默认位置配置
// {{ Shrimp-X: Modify - 添加比例模式支持字段. Approval: Cunzhi(ID:timestamp). }}
const defaultPositionConfig: PositionConfig = {
  mode: 'pixel', // 默认使用像素模式，保持向后兼容
  position: 'bottom-right',
  x: 0,
  y: 0,
  marginX: 20,
  marginY: 20,
  marginPercent: 5,
  offsetX: 0,
  offsetY: 0,
  proportions: createDefaultProportions(), // 默认比例数据
};

// 默认水印配置
const createDefaultWatermarkConfig = (): WatermarkConfig => ({
  id: crypto.randomUUID(),
  type: 'text',
  scaleMode: 'adaptive',
  position: { ...defaultPositionConfig },
  adaptive: { ...defaultAdaptiveConfig },
  textStyle: { ...defaultTextStyle },
  imageStyle: { ...defaultImageStyle },
  fullscreenStyle: { ...defaultFullscreenStyle },
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 水印状态接口
export interface WatermarkState {
  // 当前水印配置
  currentConfig: WatermarkConfig;
  
  // 历史配置（用于撤销/重做）
  history: WatermarkConfig[];
  historyIndex: number;
  
  // UI状态
  isPreviewMode: boolean;
  isDirty: boolean;
  
  // 操作方法
  updateConfig: (updates: Partial<WatermarkConfig>) => void;
  updateTextStyle: (updates: Partial<TextWatermarkStyle>) => void;
  updateImageStyle: (updates: Partial<ImageWatermarkStyle>) => void;
  updateFullscreenStyle: (updates: Partial<FullscreenWatermarkStyle>) => void;
  updatePosition: (updates: Partial<PositionConfig>) => void;
  updateAdaptive: (updates: Partial<AdaptiveConfig>) => void;
  
  setWatermarkType: (type: WatermarkType) => void;
  setScaleMode: (mode: ScaleMode) => void;
  setPosition: (position: WatermarkPosition) => void;
  
  // 历史操作
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // 配置管理
  resetConfig: () => void;
  loadConfig: (config: WatermarkConfig) => void;
  duplicateConfig: () => WatermarkConfig;
  
  // 预览模式
  togglePreview: () => void;
  setPreviewMode: (enabled: boolean) => void;
  
  // 工具方法
  markDirty: () => void;
  markClean: () => void;

  // 比例模式相关方法
  togglePositionMode: () => void;
  setPositionMode: (mode: PositionMode) => void;
  calculateAndSaveProportions: (canvasWidth: number, canvasHeight: number, watermarkWidth: number, watermarkHeight: number) => void;
  updateProportions: (proportions: Partial<ProportionData>) => void;
}

// 创建水印状态管理
export const useWatermarkStore = create<WatermarkState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        currentConfig: createDefaultWatermarkConfig(),
        history: [],
        historyIndex: -1,
        isPreviewMode: false,
        isDirty: false,

        // 更新配置
        updateConfig: (updates) => {
          set((state) => {
            const newConfig = {
              ...state.currentConfig,
              ...updates,
              updatedAt: new Date(),
            };
            
            // 添加到历史记录
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push({ ...state.currentConfig });
            
            return {
              currentConfig: newConfig,
              history: newHistory,
              historyIndex: newHistory.length - 1,
              isDirty: true,
            };
          });
        },

        // 更新文字样式
        updateTextStyle: (updates) => {
          set((state) => ({
            currentConfig: {
              ...state.currentConfig,
              textStyle: {
                ...state.currentConfig.textStyle!,
                ...updates,
              },
              updatedAt: typeof window !== 'undefined' ? new Date() : new Date(0),
            },
            isDirty: true,
          }));
        },

        // 更新图片样式
        updateImageStyle: (updates) => {
          set((state) => ({
            currentConfig: {
              ...state.currentConfig,
              imageStyle: {
                ...state.currentConfig.imageStyle!,
                ...updates,
              },
              updatedAt: typeof window !== 'undefined' ? new Date() : new Date(0),
            },
            isDirty: true,
          }));
        },

        // 更新全屏样式
        updateFullscreenStyle: (updates) => {
          set((state) => ({
            currentConfig: {
              ...state.currentConfig,
              fullscreenStyle: {
                ...state.currentConfig.fullscreenStyle!,
                ...updates,
              },
              updatedAt: typeof window !== 'undefined' ? new Date() : new Date(0),
            },
            isDirty: true,
          }));
        },

        // 更新位置配置
        updatePosition: (updates) => {
          set((state) => ({
            currentConfig: {
              ...state.currentConfig,
              position: {
                ...state.currentConfig.position,
                ...updates,
              },
              updatedAt: typeof window !== 'undefined' ? new Date() : new Date(0),
            },
            isDirty: true,
          }));
        },

        // 更新自适应配置
        updateAdaptive: (updates) => {
          set((state) => ({
            currentConfig: {
              ...state.currentConfig,
              adaptive: {
                ...state.currentConfig.adaptive,
                ...updates,
              },
              updatedAt: typeof window !== 'undefined' ? new Date() : new Date(0),
            },
            isDirty: true,
          }));
        },

        // 设置水印类型
        setWatermarkType: (type) => {
          get().updateConfig({ type });
        },

        // 设置缩放模式
        setScaleMode: (mode) => {
          get().updateConfig({ scaleMode: mode });
        },

        // 设置位置
        setPosition: (position) => {
          get().updatePosition({ position });
        },

        // 撤销
        undo: () => {
          set((state) => {
            if (state.historyIndex > 0) {
              return {
                currentConfig: state.history[state.historyIndex - 1],
                historyIndex: state.historyIndex - 1,
                isDirty: true,
              };
            }
            return state;
          });
        },

        // 重做
        redo: () => {
          set((state) => {
            if (state.historyIndex < state.history.length - 1) {
              return {
                currentConfig: state.history[state.historyIndex + 1],
                historyIndex: state.historyIndex + 1,
                isDirty: true,
              };
            }
            return state;
          });
        },

        // 检查是否可以撤销
        canUndo: () => {
          const state = get();
          return state.historyIndex > 0;
        },

        // 检查是否可以重做
        canRedo: () => {
          const state = get();
          return state.historyIndex < state.history.length - 1;
        },

        // 重置配置
        resetConfig: () => {
          set({
            currentConfig: createDefaultWatermarkConfig(),
            isDirty: true,
          });
        },

        // 加载配置
        loadConfig: (config) => {
          set({
            currentConfig: { ...config },
            isDirty: false,
          });
        },

        // 复制配置
        duplicateConfig: () => {
          const state = get();
          return {
            ...state.currentConfig,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        },

        // 切换预览模式
        togglePreview: () => {
          set((state) => ({
            isPreviewMode: !state.isPreviewMode,
          }));
        },

        // 设置预览模式
        setPreviewMode: (enabled) => {
          set({ isPreviewMode: enabled });
        },

        // 标记为已修改
        markDirty: () => {
          set({ isDirty: true });
        },

        // 标记为未修改
        markClean: () => {
          set({ isDirty: false });
        },

        // {{ Shrimp-X: Add - 比例模式相关方法. Approval: Cunzhi(ID:timestamp). }}
        // 切换位置模式（像素 ↔ 比例）
        togglePositionMode: () => {
          set((state) => {
            const currentMode = state.currentConfig.position.mode || 'pixel';
            const newMode: PositionMode = currentMode === 'pixel' ? 'proportion' : 'pixel';

            return {
              currentConfig: {
                ...state.currentConfig,
                position: {
                  ...state.currentConfig.position,
                  mode: newMode,
                },
                updatedAt: typeof window !== 'undefined' ? new Date() : new Date(0),
              },
              isDirty: true,
            };
          });
        },

        // 设置位置模式
        setPositionMode: (mode: PositionMode) => {
          set((state) => ({
            currentConfig: {
              ...state.currentConfig,
              position: {
                ...state.currentConfig.position,
                mode,
              },
              updatedAt: typeof window !== 'undefined' ? new Date() : new Date(0),
            },
            isDirty: true,
          }));
        },

        // 计算并保存当前配置的比例
        calculateAndSaveProportions: (canvasWidth: number, canvasHeight: number, watermarkWidth: number, watermarkHeight: number) => {
          set((state) => {
            const proportions = calculateProportions(
              state.currentConfig.position,
              canvasWidth,
              canvasHeight,
              watermarkWidth,
              watermarkHeight
            );

            return {
              currentConfig: {
                ...state.currentConfig,
                position: {
                  ...state.currentConfig.position,
                  mode: 'proportion',
                  proportions,
                },
                updatedAt: typeof window !== 'undefined' ? new Date() : new Date(0),
              },
              isDirty: true,
            };
          });
        },

        // 更新比例数据
        updateProportions: (proportions: Partial<ProportionData>) => {
          set((state) => ({
            currentConfig: {
              ...state.currentConfig,
              position: {
                ...state.currentConfig.position,
                proportions: state.currentConfig.position.proportions ? {
                  ...state.currentConfig.position.proportions,
                  ...proportions,
                } : undefined,
              },
              updatedAt: typeof window !== 'undefined' ? new Date() : new Date(0),
            },
            isDirty: true,
          }));
        },
      }),
      {
        name: 'watermark-config',
        partialize: (state) => ({
          currentConfig: state.currentConfig,
          history: state.history.slice(-10), // 只保存最近10个历史记录
        }),
      }
    ),
    {
      name: 'watermark-store',
    }
  )
);
