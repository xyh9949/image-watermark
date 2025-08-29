// 状态管理入口文件

import { useWatermarkStore } from './watermarkStore';
import { useImageStore } from './imageStore';

export { useWatermarkStore } from './watermarkStore';
export { useImageStore } from './imageStore';

// 导出类型
export type { WatermarkState } from './watermarkStore';
export type { ImageState } from './imageStore';

// 组合状态 Hook（可选）
export const useAppStores = () => {
  const watermarkStore = useWatermarkStore();
  const imageStore = useImageStore();

  return {
    watermark: watermarkStore,
    image: imageStore,
  };
};

// 重置所有状态的工具函数
export const resetAllStores = () => {
  useWatermarkStore.getState().resetConfig();
  useImageStore.getState().clearImages();
};
